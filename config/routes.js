const app = require("express")()

//importar rutas.
const usuarioRoutes = require("../routes/usuario.route")
const loginRoutes = require("../routes/login/login.route")
const uploadRoutes = require("../routes/upload")
const imagenesRoutes = require("../routes/imagenes")

// ============================================
// IMPORTAR RUTAS PARA SISTEMA
// ============================================

const skuRoutes = require("../routes/gestionModelos/sku.route")
const clienteRoutes = require("../routes/cliente")
const departamentoRoutes = require("../routes/departamento")
const procesoRoutes = require("../routes/proceso")
const familiaDeProcesosRoutes = require("../routes/familiaDeProcesos")
const ordenRoutes = require("../routes/orden")
const maquinaRoutes = require("../routes/maquina")

const reportesRoute = require("../routes/reportes/reportes")
const almacenDeProductoTerminadoRoute = require("../routes/almacenDeProductoTerminado/almacenDeProductoTerminado")

const folioNewRoutes = require("../routes/folio.route")

const almacenDescripcionRoute = require("../routes/almacenDeMateriaPrimaYRefacciones/almacenDescripcion.route")
const articuloRoute = require("../routes/almacenDeMateriaPrimaYRefacciones/articulo.route")

const proveedorRoute = require("../routes/proveedores/proveedor.route")
const DivisaRoute = require("../routes/divisa/divisa.route")
const RequisicionRoute = require("../routes/requisiciones/requisicion.route")

const CursoRoute = require("../routes/recursosHumanos/cursos/curso.route")
const AreaRoute = require("../routes/recursosHumanos/areas/area.route")
const PuestoRoute = require("../routes/recursosHumanos/puestos/puesto.route")
const EmpleadoRoute = require("../routes/recursosHumanos/empleado/empleado.route")

const Parametros = require("../routes/parametros/parametros.route")
const Changelogs = require("../routes/changelogs.route")

const ReportePersonalizadoAlmacenProduccion = require("../routes/almacenDeMateriaPrimaYRefacciones/reportePersonalizadoAlmacenProduccion.route")

const ProgramacionTransformacion = require("../routes/ingenieria/programacionTransformacion.route")

const pedidoRoute = require("../routes/pedidos/pedido.route")
const estadisticasRoute = require("../routes/estadisticas/estadisticas.route")
const rutaDeEntregaRoute = require("../routes/rutasDeEntrega/rutaDeEntrega.route")

const jwt = require("express-jwt")
const guard = require("express-jwt-permissions")()
const $ = require("@codice-progressio/easy-permissions").$

//Aseguramos todo menos el login y paremetros. Internamente paraemtros
// se asegura. Tambien crea el req.user
const rutasAExcluir = [
  "/parametros",
  "/parametros/super-admin/crear",
  "/login",
  "/img/usuarios/xxx",
]
app.use(
  jwt({ secret: process.env.SEED, algorithms: ["HS256"] }).unless({
    path: rutasAExcluir,
  })
)

//Excluimos rutas
app.use(
  guard.check("login").unless({
    path: rutasAExcluir,
  })
)

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

Para usar esta parte debe tener permisos de login

app.use("/changelogs", Changelogs)

app.use("/programacionTransformacion", ProgramacionTransformacion)
app.use(
  "/reportePersonalizadoAlmacenProduccion",
  ReportePersonalizadoAlmacenProduccion
)

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
// app.use("/reportes", reportesRoute)

// //Gestion de folios
// app.use("/folios", folioNewRoutes)
// app.use("/orden", ordenRoutes)
// //----------------------------
app.use("/usuario", usuarioRoutes)
app.use("/upload", uploadRoutes)

app.use("/sku", skuRoutes)
// app.use("/cliente", clienteRoutes)
// app.use("/departamento", departamentoRoutes)
// app.use("/proceso", procesoRoutes)
// app.use("/familiaDeProcesos", familiaDeProcesosRoutes)
// app.use("/maquina", maquinaRoutes)
app.use("/pedido", pedidoRoute)
app.use("/estadisticas", estadisticasRoute)
app.use("/ruta-de-entrega", rutaDeEntregaRoute)
module.exports = app
//
