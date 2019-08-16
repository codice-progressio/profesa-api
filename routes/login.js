var express = require("express")
var app = express()

var bcrypt = require("bcryptjs")
var Usuario = require("../models/usuario")
var jwt = require("jsonwebtoken")
var SEED = require("../config/config").SEED
var CONST = require("../utils/constantes")
var RESP = require("../utils/respStatus")

// Google
var CLIENT_ID = require("../config/config").CLIENTE_ID
const { OAuth2Client } = require("google-auth-library")
const client = new OAuth2Client(CLIENT_ID)

var mdAutenticacion = require("../middlewares/autenticacion")
var pjson = require('../package.json');

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  })

  const payload = ticket.getPayload()
  // const userid = payload['sub'];
  // If request specified a G Suite domain:
  //const domain = payload['hd'];

  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    google: true
    // payload: payload
  }
}

// ============================================
// Autenticación de google.
// ============================================

app.get("/renuevatoken", mdAutenticacion.verificarToken, (req, res) => {
  var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 })

  return res.status(200).send({
    ok: true,
    token: token
  })
})

// ============================================
// Autenticación de google.
// ============================================

app.post("/google", async (req, res) => {
  var token = req.body.token || "NO TOKEN"

  var googleUser
  try {
    googleUser = await verify(token)
  } catch (error) {
    return res.status(403).send({
      ok: false,
      mensaje: "Token no válida",
      error: error.message
    })
  }

  Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
    if (err) {
      return res.status(500).send({
        ok: false,
        mensaje: "Error al buscar usuario",
        error: err
      })
    }

    if (usuarioDB) {
      if (usuarioDB === false) {
        return res.status(400).send({
          ok: false,
          mensaje: "Debe de usar su autenticación normal"
          // error: error.message
        })
      } else {
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 })

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB.id,
          menu: obtenerMenu(usuarioDB.role)
        })
      }
    } else {
      // El usuario no existe. Hay que crearlo.
      var usuario = new Usuario()
      usuario.nombre = googleUser.nombre
      usuario.email = googleUser.email
      usuario.img = googleUser.img
      usuario.google = true
      usuario.password = ":D"

      usuario.save((err, usuarioDB) => {
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 })

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB.id,
          menu: obtenerMenu(usuarioDB.role),
          roles: CONST.ROLES
        })
      })
    }
  })

  // return res.status(200).send({
  //     ok: true,
  //     mensaje: 'todo Ok!!',
  //     googleUser: googleUser
  // });
})

// ============================================
// Login propietario de la app.
// ============================================

app.post("/", (req, res) => {
  var body = req.body
  Usuario.findOne({ email: body.email })
    .exec()
    .then((usuarioDB) => {
      if (!usuarioDB) {
        return RESP._400(res, {
          msj: "Credencianles incorrectas",
          err: "No se pudo loguear."
        })
      }

      if (!body.password) {
        return RESP._400(res, {
          msj: "El password no debe estar vacio.",
          err: "Parece que olvidaste escribir el password."
        })
      }

      if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
        return RESP._400(res, {
          msj: "Credencianles incorrectas",
          err: "No se pudo loguear."
        })
      }

      // crear un token!
      usuarioDB.password = ":D"
      var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 })

      // res.status(200).json({
      //     ok: true,
      //     usuario: usuarioDB,
      //     token: token,
      //     id: usuarioDB.id,
      //     menu: obtenerMenu(usuarioDB.role),
      //     // roles: CONST.ROLES
      // });

      return RESP._200(res, `Bienvenido ${usuarioDB.nombre}`, [
        { tipo: "usuario", datos: usuarioDB },
        { tipo: "token", datos: token },
        { tipo: "id", datos: usuarioDB.id },
        { tipo: "menu", datos: obtenerMenu(usuarioDB.role) },
        { tipo: "apiVersion", datos: pjson.version }
      ])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error en el login.",
        err: err
      })
    })
})

// Retorna todos los roles que hay en la api.
app.get("/roles", (req, res) => {
  let roles = CONST.ROLES

  RESP._200(res, null, [{ tipo: "roles", datos: roles }])
})

function obtenerMenu(rolesDelUsuario) {
  const MENUS = {
    PRINCIPAL: {
      // TODO MUNDO DEBE DE TENER ESTO.
      roles: CONST.ROLES.ARRAY,
      titulo: "Principal",
      icono: "fas fa-comments",
      submenu: [
        {
          titulo: "Dashboard",
          url: "/dashboard",
          roles: CONST.ROLES.ARRAY
        }
      ]
    },

    REPORTES: {
      roles: [CONST.ROLES.REPORTES_MENUS],
      titulo: "Reportes",
      icono: "fas fa-chart-pie",
      submenu: [
        // { titulo: 'Historial de folios', url: '/folios/historial', roles: [] },
        {
          titulo: "Historial de folios",
          url: "/folios/historial",
          roles: [CONST.ROLES.REPORTES_HISTORIAL_DE_FOLIOS]
        },
        {
          titulo: "Laser",
          url: "/reportes/laser",
          roles: [CONST.ROLES.REPORTES_LASER]
        },
        {
          titulo: "Tranformacion",
          url: "/reportes/transformacion",
          roles: [CONST.ROLES.REPORTES_TRANSFORMACION]
        },
        {
          titulo: "Quimica",
          url: "/reportes/quimica",
          roles: [CONST.ROLES.REPORTES_QUIMICA]
        }
      ]
    },

    ALMACENES: {
      roles: [CONST.ROLES.ALMACEN_MENU],
      titulo: " Almacen",
      icono: "fas fa-warehouse",
      submenu: [
        {
          titulo: "Producto terminado",
          url: "/almacen/productoTerminado",
          roles: [CONST.ROLES.ALMACEN_PRODUCTO_TERMINADO]
        },
        {
          titulo: "Produccion",
          url: "/almacen/produccion",
          roles: [CONST.ROLES.ALMACEN_MATERIA_PRIMA]
        },
   
        
      ]
    },
    CONTROL_DE_PRODUCCION: {
      roles: [CONST.ROLES.CONTROL_DE_PRODUCCION_MENUS],
      titulo: "Control de Producción",
      icono: "fas fa-project-diagram",
      submenu: [
        // { titulo: 'Registro de folios', url: '/folios', roles: [] },
        // { titulo: 'Seguimiento', url: '/produccion', roles: [] },
        {
          titulo: "Revision de folios",
          url: "/folios/revision",
          roles: [CONST.ROLES.CONTROL_DE_PRODUCCION_REVISION_DE_FOLIOS]
        },
        {
          titulo: "Seguimientos",
          url: "/folios/seguimiento",
          roles: [CONST.ROLES.CONTROL_DE_PRODUCCION_SEGUIMIENTOS]
        }
      ]
    },
    INGENIERIA: {
      roles: [CONST.ROLES.INGENIERIA_MENU],
      titulo: "Ingenieria",
      icono: "fas fa-cogs",
      submenu: [
        {
          titulo: "Procesos",
          url: "/procesos",
          roles: [CONST.ROLES.INGENIERIA_PROCESOS]
        },
        {
          titulo: "Procesos - Familias",
          url: "/familiaDeProcesos",
          roles: [CONST.ROLES.INGENIERIA_FAMILIA_DE_PROCESOS]
        },
        {
          titulo: "Modelos",
          url: "/modelos",
          roles: [CONST.ROLES.INGENIERIA_MODELOS]
        },
        {
          titulo: "Tamanos",
          url: "/tamanos",
          roles: [CONST.ROLES.INGENIERIA_TAMANOS]
        },
        {
          titulo: "Colores",
          url: "/colores",
          roles: [CONST.ROLES.INGENIERIA_COLORES]
        },
        {
          titulo: "Terminados",
          url: "/terminados",
          roles: [CONST.ROLES.INGENIERIA_TERMINADOS]
        },
        {
          titulo: "Modelos completos",
          url: "/modelosCompletos",
          roles: [CONST.ROLES.INGENIERIA_MODELOS_COMPLETOS]
        },
        {
          titulo: "Maquinas",
          url: "/maquinas",
          roles: [CONST.ROLES.INGENIERIA_MAQUINAS]
        }

        // { titulo: 'Costos de proceso', url: '/procesos/costos', roles: [] },
        // { titulo: 'Hit', url: '/hits', roles: [] },
      ]
    },

    VENTAS: {
      roles: [CONST.ROLES.VENTAS_MENU],
      titulo: "Ventas",
      icono: "fas fa-file-contract",
      submenu: [
        {
          titulo: "Mis folios",
          url: "/ventas/misFolios",
          roles: [CONST.ROLES.VENTAS_MIS_FOLIOS]
        },
        {
          titulo: "Stock",
          url: "/ventas/stock",
          roles: [CONST.ROLES.VENTAS_STOCK]
        }
      ]
    },
    ADMINISTRADOR: {
      roles: [CONST.ROLES.ADMINISTRADOR_MENU],
      titulo: "Administrador",
      icono: "fas fa-toolbox",
      submenu: [
        {
          titulo: "Usuarios",
          url: "/usuarios",
          roles: [CONST.ROLES.ADMINISTRADOR_USUARIOS]
        },
        // { titulo: 'Departametos', url: '/departamentos', roles: [] },
        {
          titulo: "Clientes",
          url: "/clientes",
          roles: [CONST.ROLES.ADMINISTRADOR_CLIENTES]
        },
        {
          titulo: "Almacen descripcion",
          url: "/almacenDescripcion",
          roles: [CONST.ROLES.ADMINISTRADOR_ALMACEN_DESCRIPCION]
        }
      ]
    },

    PRODUCCION: {
      roles: [CONST.ROLES.PRODUCCION_MENU],
      titulo: "Registros",
      icono: "fas fa-file-alt",
      submenu: [
        {
          titulo: "Almacen de boton",
          url: "/produccion/almacenDeBoton",
          roles: [CONST.ROLES.PRODUCCION_ALMACEN_DE_BOTON]
        },
        {
          titulo: "Barnizado",
          url: "/produccion/barnizado",
          roles: [CONST.ROLES.PRODUCCION_BARNIZADO]
        },
        {
          titulo: "Burato",
          url: "/produccion/burato",
          roles: [CONST.ROLES.PRODUCCION_BURATO]
        },
        {
          titulo: "Control de produccion",
          url: "/produccion/controlDeProduccion",
          roles: [CONST.ROLES.PRODUCCION_CONTROL_DE_PRODUCCION]
        },
        {
          titulo: "Empaque",
          url: "/produccion/empaque",
          roles: [CONST.ROLES.PRODUCCION_EMPAQUE]
        },
        {
          titulo: "Materiales",
          url: "/produccion/materiales",
          roles: [CONST.ROLES.PRODUCCION_MATERIALES]
        },
        {
          titulo: "Pastilla",
          url: "/produccion/pastilla",
          roles: [CONST.ROLES.PRODUCCION_PASTILLA]
        },
        {
          titulo: "Laser",
          url: "/produccion/laser",
          roles: [CONST.ROLES.PRODUCCION_LASER]
        },
        {
          titulo: "Metalizado",
          url: "/produccion/metalizado",
          roles: [CONST.ROLES.PRODUCCION_METALIZADO]
        },
        {
          titulo: "Seleccion",
          url: "/produccion/seleccion",
          roles: [CONST.ROLES.PRODUCCION_SELECCION]
        },
        {
          titulo: "Transformacion",
          url: "/produccion/transformacion",
          roles: [CONST.ROLES.PRODUCCION_TRANSFORMACION]
        },
        {
          titulo: "Pulido",
          url: "/produccion/pulido",
          roles: [CONST.ROLES.PRODUCCION_PULIDO]
        },
        {
          titulo: "Producto terminado",
          url: "/produccion/productoTerminado",
          roles: [CONST.ROLES.PRODUCCION_PRODUCTO_TERMINADO]
        },
        {
          titulo: "Teñido",
          url: "/produccion/tenido",
          roles: [CONST.ROLES.PRODUCCION_TENIDO]
        }
      ]
    },
    SUPER_ADMIN: {
      roles: [CONST.ROLES.SUPER_ADMIN],
      titulo: "SUPER-ADMIN",
      icono: "fas fa-user tada inifinite animated",
      submenu: [
        { titulo: "Hospitales", url: "/hospitales", roles: [] },
        { titulo: "Médicos", url: "/medicos", roles: [] },
        { titulo: "ProgressBar", url: "/progress", roles: [] },
        { titulo: "Gráficas", url: "/graficas1", roles: [] },
        { titulo: "Promesas", url: "/promesas", roles: [] },
        { titulo: "rxjs", url: "/rxjs", roles: [] }
      ]
    }
  }

  // Agregamos los administradordes.

  for (const menu in MENUS) {
    if (MENUS.hasOwnProperty(menu)) {
      const element = MENUS[menu]
      if (menu !== "SUPER_ADMIN" && menu !== "PRINCIPAL") {
        element.roles.push(CONST.ROLES.ADMIN_ROLE)
        element.roles.push(CONST.ROLES.SUPER_ADMIN)

        element.submenu.forEach((submenu) => {
          submenu.roles.push(CONST.ROLES.ADMIN_ROLE)
          submenu.roles.push(CONST.ROLES.SUPER_ADMIN)
        })
      }

      // Ordenamos alfabeticamente los menus.
      element.submenu.sort(function compare(a, b) {
        if (a.titulo < b.titulo) return -1
        if (a.titulo > b.titulo) return 1
        return 0
      })
    }
  }

  const menuSeleccionado = {}

  // Recorremos los roles.
  for (let i = 0; i < rolesDelUsuario.length; i++) {
    // Obtenemos el nombre del rol.
    const rol = rolesDelUsuario[i]
    // Recorremos el menu.
    for (const menu in MENUS) {
      if (MENUS.hasOwnProperty(menu)) {
        const objetoMenu = MENUS[menu]
        // el objetoMenu contiene el rol
        // que estamos enlistando lo agreegamos
        // a menu seleccionamos y lo borramos de Menus
        // para no repetir los menus.
        if (objetoMenu.roles.includes(rol)) {
          menuSeleccionado[menu] = objetoMenu
          // Comprobamos que el menuSeleccionado[menu]
          // contenga tambien los permisos necesarios, si no
          // lo eliminamos.

          menuSeleccionado[menu].submenu = menuSeleccionado[
            menu
          ].submenu.filter((submenu) => {
            for (let i = 0; i < submenu.roles.length; i++) {
              const rolSubmenu = submenu.roles[i].toString()
              if (rolesDelUsuario.includes(rolSubmenu)) {
                return true
              }
            }

            return false
          })

          // Lo borramos para que el menú no se repita.
          delete MENUS[menu]
        }
      }
    }
  }

  var menu = Object.values(menuSeleccionado)
  return menu
}

module.exports = app
