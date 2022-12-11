const app = require("express")();
const $ = require("@codice-progressio/easy-permissions").$;
const EstadisticasService = require("../../services/estadisticas.service");

app.get(
  "/total-skus",
  $("estadisticas:total-skus", "Muestra el total de elementos en el dashboard"),
  EstadisticasService.getTotalSkus
);

app.get(
  "/total-costo-existencias",
  $(
    "estadisticas:total-costo-existencias",
    "Muestra el costo total de las existencias"
  ),
  EstadisticasService.getTotalCostoExistencias
);

app.get(
  "/total-contactos",
  $("estadisticas:total-contactos", "Muestra el total de los contactos"),
  EstadisticasService.getTotalContactos
);

app.get("/ventas-trimestre", EstadisticasService.getVentasTrimestre);
app.get("/diez-mas-vendidos", EstadisticasService.getDiezMasVendidos);
app.get("/mejor-cliente", EstadisticasService.getMejorCliente);
app.get("/hoy", EstadisticasService.getHoy);
app.get("/ventas-por-vendedor", EstadisticasService.getVentasPorVendedor);

module.exports = app;
