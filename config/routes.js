const app = require("express")()

//importar rutas.
const loginRoutes = require("../routes/login/login.route")
const uploadRoutes = require("../routes/upload")

// ============================================
// IMPORTAR RUTAS PARA SISTEMA
// ============================================

const skuRoutes = require("../routes/gestionModelos/sku.route")
const proveedorRoute = require("../routes/proveedores/proveedor.route")
const Parametros = require("../routes/parametros/parametros.route")
const Changelogs = require("../routes/changelogs.route")

const estadisticasRoute = require("../routes/estadisticas/estadisticas.route")
const rutaDeEntregaRoute = require("../routes/rutasDeEntrega/rutaDeEntrega.route")

const ficherosRoute = require("../routes/ficheros.route")
const contabilidadRoute = require("../routes/contabilidad/contabilidad.route")

const listaDePrecios = require("../routes/listaDePrecios.route")

// app.use("/img", imagenesRoutes)
//Este va primero por que se usan permisos especiales internamente
app.use("/parametros", Parametros)

//Cargamos todos los parametros en cada peticion para tener disponible
//la informacion en req.parametros
const ParametrosModel = require("../models/defautls/parametros.model")
app.use((req, res, next) => {
  ParametrosModel.findOne()
    .exec()
    .then(parametros => {
      if (!parametros)
        throw "No has definido el documento que contiene los parametros. Es necesario que los definas para poder continuar."

      req["parametros"] = parametros
      next()
    })
    .catch(err => next(err))
})
app.use("/login", loginRoutes)

// Para usar esta parte debe tener permisos de login

app.use("/changelogs", Changelogs)

// app.use("/empleado", EmpleadoRoute)
// app.use("/puesto", PuestoRoute)
// app.use("/area", AreaRoute)
// app.use("/curso", CursoRoute)
// app.use("/requisicion", RequisicionRoute)
// app.use("/divisa", DivisaRoute)
app.use("/proveedor", proveedorRoute)
// app.use("/articulo", articuloRoute)
// app.use("/almacenDescripcion", almacenDescripcionRoute)
// app.use("/almacenDeProductoTerminado", almacenDeProductoTerminadoRoute)

// //Gestion de folios
// app.use("/folios", folioNewRoutes)
// app.use("/orden", ordenRoutes)
// //----------------------------
app.use("/upload", uploadRoutes)

app.use("/sku", skuRoutes)
// app.use("/cliente", clienteRoutes)
// app.use("/departamento", departamentoRoutes)
app.use("/estadisticas", estadisticasRoute)
app.use("/ruta-de-entrega", rutaDeEntregaRoute)
app.use("/ficheros", ficherosRoute)
app.use("/contabilidad", contabilidadRoute)

app.use("/lista-de-precios", listaDePrecios)

module.exports = app
//
