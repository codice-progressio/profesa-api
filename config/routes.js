//importar rutas.
let usuarioRoutes = require("../routes/usuario.route")
let loginRoutes = require("../routes/login/login")
let uploadRoutes = require("../routes/upload")
let imagenesRoutes = require("../routes/imagenes")

// ============================================
// IMPORTAR RUTAS PARA SISTEMA CARRDUCI
// ============================================

let modeloCompletoRoutes = require("../routes/gestionModelos/modeloCompleto")
let clienteRoutes = require("../routes/cliente")
let departamentoRoutes = require("../routes/departamento")
let procesoRoutes = require("../routes/proceso")
let familiaDeProcesosRoutes = require("../routes/familiaDeProcesos")
let ordenRoutes = require("../routes/orden")
let maquinaRoutes = require("../routes/maquina")

let modeloRoutes = require("../routes/gestionModelos/modelo")
let tamanoRoutes = require("../routes/gestionModelos/tamano")
let colorRoutes = require("../routes/gestionModelos/color")
let terminadoRoutes = require("../routes/gestionModelos/terminado")
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
var RequisicionRoute = require("../routes/requisiciones/requisicion.route")

const CursoRoute = require("../routes/recursosHumanos/cursos/curso.route")
const AreaRoute = require("../routes/recursosHumanos/areas/area.route")
const PuestoRoute = require("../routes/recursosHumanos/puestos/puesto.route")
const EmpleadoRoute = require("../routes/recursosHumanos/empleado/empleado.route")

const Parametros = require("../routes/parametros/parametros.route")

var ReportePersonalizadoAlmacenProduccion = require("../routes/almacenDeMateriaPrimaYRefacciones/reportePersonalizadoAlmacenProduccion.route")

var ProgramacionTransformacion = require("../routes/ingenieria/programacionTransformacion.route")

var guard = require("express-jwt-permissions")()
var jwt = require("express-jwt")
var seed = require("../config/config").SEED
var permisos = require("../config/permisos.config")

module.exports.ROUTES = function (app) {
  //Aseguramos todo menos el login y paremetros. Internamente paraemtros
  // se asegura. Tambien crea el req.user
  app.use("/img", imagenesRoutes)

  app.get("/fix2Departamentos", (req, res, next) => {
    let folios = Array.from(Array(154 + 1 - 141), (_, i) => i + 141)
    require("../models/folios/folio")
      .find({ numeroDeFolio: { $in: folios } })
      .exec()
      .then(fols => {
        let promesas = fols.map(folio => {
          folio.folioLineas.forEach(pedido => {
            pedido.ordenes.forEach(orden => {
              let empaque = orden.ruta.pop()
              let productoTerm = orden.ruta.pop()
              orden.ruta.push(empaque)
              orden.ruta.push(productoTerm)

              empaque.ubicacionActual =
                productoTerm.ubicacionActual || empaque.ubicacionActual

              if (empaque.ubicacionActual) {
                productoTerm.recibida = false
                empaque.recibida = false
                empaque.entrada = new Date()
                productoTerm.recibida = false
                productoTerm.ubicacionActual = false
                productoTerm.entrada = new Date()
              }

              if (productoTerm.ubicacionActual) {
                empaque.recibida = false
                empaque.ubicacionActual = true
                productoTerm.recibida = false
                productoTerm.ubicacionActual = false
                productoTerm.entrada = new Date()
              }

              contador = 0

              orden.ruta.forEach(r => {
                r.consecutivo = contador
                contador++
              })

              console.log(orden.ruta)
            })
          })

          return folio.save()
        })

        return Promise.all(promesas)
      })
      .then(folios => {
        return res.json({ ok: "todo bien" })
      })
      .catch(_ => next(_))
  })

  app.use(
    jwt({ secret: seed, algorithms: ["HS256"] }).unless({
      path: [
        "/parametros",
        "/parametros/super-admin/crear",
        "/login",
        "/img/usuarios/xxx",
      ],
    })
  )

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

  //Para usar esta parte debe tener permisos de login
  app.use(permisos.$("login"))

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

  //Gestion de folios
  app.use("/folios", folioNewRoutes)
  app.use("/orden", ordenRoutes)
  //----------------------------
  app.use("/usuario", usuarioRoutes)
  app.use("/upload", uploadRoutes)

  app.use("/modeloCompleto", modeloCompletoRoutes)
  app.use("/cliente", clienteRoutes)
  app.use("/departamento", departamentoRoutes)
  app.use("/proceso", procesoRoutes)
  app.use("/familiaDeProcesos", familiaDeProcesosRoutes)
  app.use("/maquina", maquinaRoutes)
  app.use("/modelo", modeloRoutes)
  app.use("/tamano", tamanoRoutes)
  app.use("/color", colorRoutes)
  app.use("/terminado", terminadoRoutes)
}
