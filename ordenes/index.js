import express from "express";
import sequelize from "./database.js";
import Orden from "./models/orden.js";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/ordenes", async (req, res) => {
  const { productoId, cantidad } = req.body;

  const response = await fetch("http://localhost:4001/inventarios");
  const inventarios = await response.json();

  const inventario = inventarios.find(inv => inv.productoId === productoId);

  if (!inventario || inventario.cantidad < cantidad) {
    return res.status(400).json({ error: "Stock insuficiente" });
  }

  const orden = await Orden.create({ productoId, cantidad, estado: "creada" });
  res.json(orden);
});

app.get("/ordenes", async (req, res) => {
  const ordenes = await Orden.findAll();
  res.json(ordenes);
});

const PORT = process.env.PORT || 4002;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Órdenes corriendo en puerto ${PORT}`));
});
