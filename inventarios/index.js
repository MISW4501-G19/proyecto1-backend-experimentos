import express from "express";
import sequelize from "./database.js";
import Producto from "./models/producto.js";
import Bodega from "./models/bodega.js";
import Inventario from "./models/inventario.js";

const app = express();
app.use(express.json());

app.post("/productos", async (req, res) => {
  const producto = await Producto.create(req.body);
  res.json(producto);
});

app.get("/productos", async (req, res) => {
  const productos = await Producto.findAll();
  res.json(productos);
});

app.post("/bodegas", async (req, res) => {
  const bodega = await Bodega.create(req.body);
  res.json(bodega);
});

app.get("/bodegas", async (req, res) => {
  const bodegas = await Bodega.findAll();
  res.json(bodegas);
});

app.post("/inventarios", async (req, res) => {
  const inventario = await Inventario.create(req.body);
  res.json(inventario);
});

app.get("/inventarios", async (req, res) => {
  const inventarios = await Inventario.findAll({ include: [Producto, Bodega] });
  res.json(inventarios);
});

const PORT = process.env.PORT || 4001;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Inventarios corriendo en puerto ${PORT}`));
});
