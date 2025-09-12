import express from "express";
import sequelize from "./database.js";
import { Orden } from "./models/index.js";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/ordenes", async (req, res) => {
  try {
    const { cantidadTotal, productoId } = req.body;

    if (!cantidadTotal || cantidadTotal <= 0) {
      return res.status(400).json({ error: "Cantidad total debe ser mayor a 0" });
    }
    if (!productoId) {
      return res.status(400).json({ error: "productoId es requerido" });
    }

    // Consultar lotes disponibles para el producto
    const invResp = await fetch(`http://inventarios:4001/inventarios/producto/${productoId}`);
    if (!invResp.ok) {
      const text = await invResp.text();
      return res.status(502).json({ error: "Error consultando inventarios", detail: text });
    }
    const lotes = await invResp.json();

    // Validar que la cantidad total solicitada sea menor o igual a la cantidad total disponible
    const disponibleTotal = lotes.reduce((acc, l) => acc + (l.cantidadDisponible || 0), 0);
    if (disponibleTotal < cantidadTotal) {
      return res.status(400).json({ error: "Stock insuficiente", solicitado: cantidadTotal, disponible: disponibleTotal });
    }

    // Crear orden pendiente
    const ordenId = uuidv4();
    let orden = await Orden.create({
      id: ordenId,
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
        const deleteResp = await fetch(`http://inventarios:4001/inventarios/${lote.id}`, {
          method: "DELETE"
        });
        if (!deleteResp.ok) {
          const text = await deleteResp.text();

          for (const c of consumidos) {
            try {
              if (c.deleted) {
                await fetch(`http://inventarios:4001/inventarios`, {
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
                await fetch(`http://inventarios:4001/inventarios/${c.inventarioId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
                });
              }
            } catch (_) {
            }
          }
          try {
            orden.estado = "fallida";
            await orden.save();
          } catch (_) {}
          return res.status(502).json({ error: "Error eliminando inventario", loteId: lote.id, detail: text });
        }
        consumidos.push({ 
          inventarioId: lote.id, 
          lote: lote.lote, 
          cantidadAsignada: consumir, 
          fechaVencimiento: lote.fechaVencimiento, 
          cantidadInicialDisponible: originalDisponible,
          deleted: true,
          productoId: lote.ProductoId,
          bodegaId: lote.BodegaId
        });
      } else {
        // Actualizar cantidad disponible
        const patchResp = await fetch(`http://inventarios:4001/inventarios/${lote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidadDisponible: nuevoDisponible })
        });
        if (!patchResp.ok) {
          const text = await patchResp.text();

          for (const c of consumidos) {
            try {
              if (c.deleted) {
                await fetch(`http://inventarios:4001/inventarios`, {
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
                await fetch(`http://inventarios:4001/inventarios/${c.inventarioId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
                });
              }
            } catch (_) {
            }
          }
          try {
            orden.estado = "fallida";
            await orden.save();
          } catch (_) {}
          return res.status(502).json({ error: "Error actualizando inventario", loteId: lote.id, detail: text });
        }
        consumidos.push({ 
          inventarioId: lote.id, 
          lote: lote.lote, 
          cantidadAsignada: consumir, 
          fechaVencimiento: lote.fechaVencimiento, 
          cantidadInicialDisponible: originalDisponible,
          deleted: false
        });
      }
      restante -= consumir;
    }

    // Asegurar que se haya asignado toda la cantidad
    if (restante > 0) {
      for (const c of consumidos) {
        try {
          if (c.deleted) {
            await fetch(`http://inventarios:4001/inventarios`, {
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
            await fetch(`http://inventarios:4001/inventarios/${c.inventarioId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
            });
          }
        } catch (_) {}
      }
      try { orden.estado = "fallida"; await orden.save(); } catch (_) {}
      return res.status(500).json({ error: "Fallo de asignación parcial" });
    }

    // Marcar orden como creada
    orden.estado = "creada";
    await orden.save();

    res.status(201).json({ orden, asignacion: consumidos });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

const PORT = process.env.PORT || 4002;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Órdenes corriendo en puerto ${PORT}`));
});
