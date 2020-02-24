//importar rutas.
let usuarioRoutes = require("../routes/usuario")
let loginRoutes = require("../routes/login/login")
let busquedaRoutes = require("../routes/busqueda")
let uploadRoutes = require("../routes/upload")
let imagenesRoutes = require("../routes/imagenes")

// ============================================
// IMPORTAR RUTAS PARA SISTEMA CARRDUCI
// ============================================

let folioRoutes = require("../routes/folio")
let folioLineaRoutes = require("../routes/folioLinea")
let modeloCompletoRoutes = require("../routes/gestionModelos/modeloCompleto")
let clienteRoutes = require("../routes/cliente")
let departamentoRoutes = require("../routes/departamento")
let procesoRoutes = require("../routes/proceso")
let familiaDeProcesosRoutes = require("../routes/familiaDeProcesos")
let ordenRoutes = require("../routes/orden")
let trayectoriaRoutes = require("../routes/trayectoria")
let maquinaRoutes = require("../routes/maquina")
let gastoRoutes = require("../routes/gasto")

let modeloRoutes = require("../routes/gestionModelos/modelo")
let tamanoRoutes = require("../routes/gestionModelos/tamano")
let colorRoutes = require("../routes/gestionModelos/color")
let terminadoRoutes = require("../routes/gestionModelos/terminado")
let hitRoutes = require("../routes/ingenieria/hit")
let defaultsRoute = require("../routes/configCruds/defaults.crud")

let reportesRoute = require("../routes/reportes/reportes")
let almacenDeProductoTerminadoRoute = require("../routes/almacenDeProductoTerminado/almacenDeProductoTerminado")
let loteRoute = require("../routes/almacenDeProductoTerminado/lote")
let devolucionRoute = require("../routes/almacenDeProductoTerminado/devolucion")
let salidaRoute = require("../routes/almacenDeProductoTerminado/salida")

let folioNewRoutes = require("../routes/folio.route")

var almacenDescripcionRoute = require("../routes/almacenDeMateriaPrimaYRefacciones/almacenDescripcion.route")
var articuloRoute = require("../routes/almacenDeMateriaPrimaYRefacciones/articulo.route")

var proveedorRoute = require("../routes/proveedores/proveedor.route")
var DivisaRoute = require("../routes/divisa/divisa.route")
var RequisicionRoute = require("../routes/requisiciones/requisisicion.route")

const CursoRoute = require("../routes/recursosHumanos/cursos/curso.route")
const AreaRoute = require("../routes/recursosHumanos/areas/area.route")
const PuestoRoute = require("../routes/recursosHumanos/puestos/puesto.route")
const EmpleadoRoute = require("../routes/recursosHumanos/empleado/empleado.route")

var ReportePersonalizadoAlmacenProduccion = require("../routes/almacenDeMateriaPrimaYRefacciones/reportePersonalizadoAlmacenProduccion.route")

var ProgramacionTransformacion = require("../routes/ingenieria/programacionTransformacion.route")

module.exports.ROUTES = function(app) {
  app.use("/programacionTransformacion", ProgramacionTransformacion)
  app.use(
    "/reportePersonalizadoAlmacenProduccion",
    ReportePersonalizadoAlmacenProduccion
  )
  app.use("/empleado", EmpleadoRoute)
  app.use("/puesto", PuestoRoute)
  app.use("/area", AreaRoute)
  app.use("/curso", CursoRoute)
  app.use("/requisicion", RequisicionRoute)
  app.use("/divisa", DivisaRoute)
  app.use("/proveedor", proveedorRoute)
  app.use("/articulo", articuloRoute)
  app.use("/almacenDescripcion", almacenDescripcionRoute)
  app.use("/almacenDeProductoTerminado", almacenDeProductoTerminadoRoute)
  app.use("/almacenDeProductoTerminado/lote", loteRoute)
  app.use("/almacenDeProductoTerminado/salida", salidaRoute)
  app.use("/almacenDeProductoTerminado/devolucion", devolucionRoute)
  app.use("/reportes", reportesRoute)
  app.use("/defaults", defaultsRoute)
  app.use("/login", loginRoutes)
  app.use("/folios", folioNewRoutes)
  app.use("/usuario", usuarioRoutes)
  app.use("/busqueda", busquedaRoutes)
  app.use("/upload", uploadRoutes)
  app.use("/img", imagenesRoutes)
  app.use("/folioLinea", folioLineaRoutes)
  app.use("/modeloCompleto", modeloCompletoRoutes)
  app.use("/cliente", clienteRoutes)
  app.use("/departamento", departamentoRoutes)
  app.use("/proceso", procesoRoutes)
  app.use("/familiaDeProcesos", familiaDeProcesosRoutes)
  app.use("/orden", ordenRoutes)
  app.use("/trayectoria", trayectoriaRoutes)
  app.use("/maquina", maquinaRoutes)
  app.use("/gasto", gastoRoutes)
  app.use("/modelo", modeloRoutes)
  app.use("/tamano", tamanoRoutes)
  app.use("/color", colorRoutes)
  app.use("/terminado", terminadoRoutes)
  app.use("/hit", hitRoutes)
}
