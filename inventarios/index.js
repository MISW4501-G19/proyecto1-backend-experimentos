import express from "express";
import sequelize from "./database.js";
import Producto from "./models/producto.js";
import Bodega from "./models/bodega.js";
import Inventario from "./models/inventario.js";

const app = express();
app.use(express.json());

app.post("/productos", async (req, res) => {
  try {
    const { sku, nombre, tipo, unidadMedida } = req.body;
    const existente = await Producto.findOne({ where: { sku } });
    if (existente) return res.status(400).json({ error: "El SKU ya existe" });
    const producto = await Producto.create({ sku, nombre, tipo, unidadMedida });
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

app.post("/bodegas", async (req, res) => {
  try {
    const { nombre, pais, capacidad } = req.body;
    const bodega = await Bodega.create({ nombre, pais, capacidad });
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
    const { productoId, bodegaId, cantidadDisponible, fechaVencimientoLote, condicionesAlmacenamiento } = req.body;

    const producto = await Producto.findByPk(productoId);
    const bodega = await Bodega.findByPk(bodegaId);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    if (!bodega) return res.status(404).json({ error: "Bodega no encontrada" });

    const inventario = await Inventario.create({
      productoId,
      bodegaId,
      cantidadDisponible,
      fechaVencimientoLote,
      condicionesAlmacenamiento
    });

    res.status(201).json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/inventarios", async (req, res) => {
  try {
    const inventarios = await Inventario.findAll({ include: [Producto, Bodega] });
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4001;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Inventarios corriendo en puerto ${PORT}`));
});
