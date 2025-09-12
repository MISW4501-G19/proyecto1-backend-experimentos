import express from "express";
import sequelize from "./database.js";
import { Producto, Bodega, Inventario } from "./models/index.js";

const app = express();
app.use(express.json());

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

    const producto = await Producto.findByPk(productoId);
    const bodega = await Bodega.findByPk(bodegaId);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    if (!bodega) return res.status(404).json({ error: "Bodega no encontrada" });

    const inventario = await Inventario.create({
      ProductoId: productoId,
      BodegaId: bodegaId,
      lote,
      cantidadDisponible,
      fechaVencimiento
    });

    res.status(201).json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/inventarios", async (req, res) => {
  try {
    const inventarios = await Inventario.findAll({ include: [{ model: Producto }, { model: Bodega }] });
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: list inventarios by ProductoId
app.get("/inventarios/producto/:productoId", async (req, res) => {
  try {
    const { productoId } = req.params;
    const inventarios = await Inventario.findAll({
      where: { ProductoId: productoId },
      include: [{ model: Producto }, { model: Bodega }]
    });
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: update inventario quantity
app.patch("/inventarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidadDisponible } = req.body;

    if (cantidadDisponible == null || isNaN(Number(cantidadDisponible)) || Number(cantidadDisponible) < 0) {
      return res.status(400).json({ error: "cantidadDisponible debe ser un entero >= 0" });
    }

    const inventario = await Inventario.findByPk(id);
    if (!inventario) return res.status(404).json({ error: "Inventario no encontrado" });

    inventario.cantidadDisponible = Number(cantidadDisponible);
    await inventario.save();

    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: delete inventario
app.delete("/inventarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const inventario = await Inventario.findByPk(id);
    if (!inventario) return res.status(404).json({ error: "Inventario no encontrado" });

    await inventario.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4001;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Inventarios corriendo en puerto ${PORT}`));
});
