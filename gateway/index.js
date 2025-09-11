import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(
  "/inventarios",
  createProxyMiddleware({ target: "http://inventarios:4001", changeOrigin: true })
);

app.use(
  "/ordenes",
  createProxyMiddleware({ target: "http://ordenes:4002", changeOrigin: true })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Gateway corriendo en puerto ${PORT}`);
});
