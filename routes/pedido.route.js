const app = require("express")();

const PedidoService = require("../serivces/pedidos/pedido.service");

app.get("/", PedidoService.Obtener);
app.get("/:id", PedidoService.Obtener);
app.post("/", PedidoService.Guardar);
app.delete("/:id", PedidoService.Eliminar);
app.put("/", PedidoService.Modificar);

module.exports = app;
