import express from "express";
import sequelize from "./database.js";
import { Producto, Bodega, Inventario } from "./models/index.js";

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    res.status(200).json({ 
      status: "healthy", 
      service: "inventarios",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: "unhealthy", 
      service: "inventarios",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post("/productos", async (req, res) => {
  try {
    const { sku, nombre, descripcion, categoria, unidadMedida, valorUnitario, condicionesAlmacenamiento } = req.body;
    const existente = await Producto.findOne({ where: { sku } });
    if (existente) return res.status(400).json({ error: "El SKU ya existe" });
    const producto = await Producto.create({ sku, nombre, descripcion, categoria, unidadMedida, valorUnitario, condicionesAlmacenamiento });
    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/productos", async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: get single producto by id
app.get("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/bodegas", async (req, res) => {
  try {
    const { nombre, pais, ciudad, direccion } = req.body;
    const bodega = await Bodega.create({ nombre, pais, ciudad, direccion });
    res.status(201).json(bodega);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/bodegas", async (req, res) => {
  try {
    const bodegas = await Bodega.findAll();
    res.json(bodegas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/inventarios", async (req, res) => {
  try {
    const { productoId, bodegaId, lote, cantidadDisponible, fechaVencimiento } = req.body;
    
    // Verificar que el producto existe
    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    // Verificar que la bodega existe
    const bodega = await Bodega.findByPk(bodegaId);
    if (!bodega) {
      return res.status(404).json({ error: "Bodega no encontrada" });
    }
    
    const inventario = await Inventario.create({
      lote,
      cantidadDisponible,
      fechaVencimiento,
      // Map to correct field names
      ProductoId: productoId,
      BodegaId: bodegaId
    });
    
    res.status(201).json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/inventarios", async (req, res) => {
  try {
    const inventarios = await Inventario.findAll({
      include: [Producto, Bodega]
    });
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/inventarios/producto/:productoId", async (req, res) => {
  try {
    const { productoId } = req.params;
    const inventarios = await Inventario.findAll({
      where: { ProductoId: productoId },
      include: [Producto, Bodega]
    });
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/inventarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidadDisponible } = req.body;
    
    const inventario = await Inventario.findByPk(id);
    if (!inventario) {
      return res.status(404).json({ error: "Inventario no encontrado" });
    }
    
    await inventario.update({ cantidadDisponible });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/inventarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventario = await Inventario.findByPk(id);
    if (!inventario) {
      return res.status(404).json({ error: "Inventario no encontrado" });
    }
    
    await inventario.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4001;

// Database connection with retry logic
async function startServer() {
  try {
    console.log("Attempting to connect to database...");
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    
    // Only run migrations/seeding if explicitly requested (for development)
    if (process.env.RUN_MIGRATIONS === 'true' && process.env.NODE_ENV !== 'production') {
      console.log("Running database migrations (development mode)...");
      const { runMigrations } = await import('./migrate.js');
      await runMigrations();
    }
    
    if (process.env.RUN_SEEDERS === 'true' && process.env.NODE_ENV !== 'production') {
      console.log("Running database seeders (development mode)...");
      const { runSeeders } = await import('./migrate.js');
      await runSeeders();
    }
    
    // For production/staging, just verify database connection
    console.log("Database connection verified - no migrations/seeding in production");
    console.log("Database setup completed successfully.");
    
    app.listen(PORT, () => {
      console.log(`Inventarios corriendo en puerto ${PORT}`);
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
