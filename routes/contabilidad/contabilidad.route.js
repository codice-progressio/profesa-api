const remisionRoute = require("./remision.route")
const facturacionRoute = require("./facturacion.route")
const app = require("express")()

app.use("/remision", remisionRoute)
app.use("/facturacion", facturacionRoute)

module.exports = app
