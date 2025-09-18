import express from "express";
import sequelize from "./database.js";
import { Orden } from "./models/index.js";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    res.status(200).json({ 
      status: "healthy", 
      service: "ordenes",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: "unhealthy", 
      service: "ordenes",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post("/ordenes", async (req, res) => {
  try {
    const { cantidadTotal, productoId } = req.body;
    if (!cantidadTotal || cantidadTotal <= 0) {
      return res.status(400).json({ error: "Cantidad total debe ser mayor a 0" });
    }
    if (!productoId) {
      return res.status(400).json({ error: "productoId es requerido" });
    }

    // Get inventarios URL from environment
    const inventariosUrl = process.env.INVENTARIOS_URL || 'http://inventarios:4001';

    // Consultar lotes disponibles para el producto
    const invResp = await fetch(`${inventariosUrl}/inventarios/producto/${productoId}`);
    if (!invResp.ok) {
      const text = await invResp.text();
      return res.status(400).json({ error: `Error consultando inventarios: ${text}` });
    }
    const lotes = await invResp.json();

    // Validar que la cantidad total solicitada sea menor o igual a la cantidad total disponible
    const disponibleTotal = lotes.reduce((acc, l) => acc + (l.cantidadDisponible || 0), 0);
    if (disponibleTotal < cantidadTotal) {
      return res.status(400).json({ error: `Stock insuficiente. Solicitado: ${cantidadTotal}, Disponible: ${disponibleTotal}` });
    }

    // Crear orden pendiente
    const orden = await Orden.create({
      fecha: new Date(),
      estado: "pendiente",
      cantidadTotal,
      productoId
    });

    // Ordenar lotes por fecha de vencimiento
    lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

    let restante = cantidadTotal;
    const consumidos = [];

    for (const lote of lotes) {
      if (restante <= 0) break;
      const originalDisponible = Number(lote.cantidadDisponible || 0);
      const consumir = Math.min(restante, originalDisponible);
      if (consumir <= 0) continue;
      const nuevoDisponible = originalDisponible - consumir;

      // Actualizar inventario
      if (nuevoDisponible === 0) {
        const deleteResp = await fetch(`${inventariosUrl}/inventarios/${lote.id}`, {
          method: "DELETE"
        });
        if (!deleteResp.ok) {
          const text = await deleteResp.text();

          // Rollback consumed inventory
          for (const c of consumidos) {
            try {
              if (c.deleted) {
                await fetch(`${inventariosUrl}/inventarios`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    productoId: c.productoId,
                    bodegaId: c.bodegaId,
                    lote: c.lote,
                    cantidadDisponible: c.consumido,
                    fechaVencimiento: c.fechaVencimiento
                  })
                });
              } else {
                await fetch(`${inventariosUrl}/inventarios/${c.inventarioId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
                });
              }
            } catch (_) {
            }
          }
          
          orden.estado = "fallida";
          await orden.save();
          return res.status(500).json({ error: `Error eliminando inventario: ${text}` });
        }
        consumidos.push({ 
          inventarioId: lote.id, 
          lote: lote.lote, 
          cantidadAsignada: consumir, 
          fechaVencimiento: lote.fechaVencimiento, 
          cantidadInicialDisponible: originalDisponible,
          deleted: true,
          productoId: lote.ProductoId,
          bodegaId: lote.BodegaId,
          consumido: consumir,
          restoreCantidad: originalDisponible
        });
      } else {
        // Actualizar cantidad disponible
        const patchResp = await fetch(`${inventariosUrl}/inventarios/${lote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidadDisponible: nuevoDisponible })
        });
        if (!patchResp.ok) {
          const text = await patchResp.text();

          // Rollback consumed inventory
          for (const c of consumidos) {
            try {
              if (c.deleted) {
                await fetch(`${inventariosUrl}/inventarios`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    productoId: c.productoId,
                    bodegaId: c.bodegaId,
                    lote: c.lote,
                    cantidadDisponible: c.consumido,
                    fechaVencimiento: c.fechaVencimiento
                  })
                });
              } else {
                await fetch(`${inventariosUrl}/inventarios/${c.inventarioId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
                });
              }
            } catch (_) {
            }
          }
          
          orden.estado = "fallida";
          await orden.save();
          return res.status(500).json({ error: `Error actualizando inventario: ${text}` });
        }
        consumidos.push({ 
          inventarioId: lote.id, 
          lote: lote.lote, 
          cantidadAsignada: consumir, 
          fechaVencimiento: lote.fechaVencimiento, 
          cantidadInicialDisponible: originalDisponible,
          deleted: false,
          restoreCantidad: originalDisponible
        });
      }
      restante -= consumir;
    }

    // Asegurar que se haya asignado toda la cantidad
    if (restante > 0) {
      // Rollback all consumed inventory
      for (const c of consumidos) {
        try {
          if (c.deleted) {
            await fetch(`${inventariosUrl}/inventarios`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productoId: c.productoId,
                bodegaId: c.bodegaId,
                lote: c.lote,
                cantidadDisponible: c.consumido,
                fechaVencimiento: c.fechaVencimiento
              })
            });
          } else {
            await fetch(`${inventariosUrl}/inventarios/${c.inventarioId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
            });
          }
        } catch (_) {
        }
      }
      
      orden.estado = "fallida";
      await orden.save();
      return res.status(500).json({ error: "Fallo de asignación parcial" });
    }

    // Marcar orden como creada
    orden.estado = "creada";
    await orden.save();

    res.status(201).json({ orden, asignacion: consumidos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/ordenes", async (req, res) => {
  try {
    const ordenes = await Orden.findAll();
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/ordenes/:id/status", async (req, res) => {
  try {
    const orden = await Orden.findByPk(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4002;

// Database connection with retry logic
async function startServer() {
  try {
    console.log("Attempting to connect to database...");
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    
    // Use migrations instead of sync for production safety
    if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
      console.log("Running database migrations...");
      const { runMigrations, runSeeders } = await import('./migrate.js');
      await runMigrations();
      
      if (process.env.RUN_SEEDERS === 'true') {
        console.log("Running database seeders...");
        await runSeeders();
      }
    } else {
      // Fallback to sync for local development only
      console.log("Synchronizing database schema (development mode)...");
      await sequelize.sync({ force: false });
    }
    console.log("Database setup completed successfully.");
    
    app.listen(PORT, () => {
      console.log(`Órdenes corriendo en puerto ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${process.env.DB_TYPE || 'sqlite'}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    console.error("Database connection failed. Please check:");
    console.error("1. RDS security group allows your IP address");
    console.error("2. Database credentials are correct");
    console.error("3. Database exists and is accessible");
    console.error("4. SSL configuration is correct");
    
    // Exit with error code
    process.exit(1);
  }
}

startServer();
