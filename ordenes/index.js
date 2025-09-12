import express from "express";
import sequelize from "./database.js";
import { Orden } from "./models/index.js";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

app.post("/ordenes", async (req, res) => {
  try {
    const { cantidadTotal } = req.body;

    if (!cantidadTotal || cantidadTotal <= 0) {
      return res.status(400).json({ error: "Cantidad total debe ser mayor a 0" });
    }

    const orden = await Orden.create({
      id: uuidv4(),
      fecha: new Date(),
      estado: "pendiente",
      cantidadTotal
    });

    res.status(201).json(orden);
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

const PORT = process.env.PORT || 4002;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Órdenes corriendo en puerto ${PORT}`));
});
