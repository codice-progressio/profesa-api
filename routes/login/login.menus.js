var CONST = require("../../utils/constantes")
var permisos = require("../../config/permisos.config")

module.exports = function (permissions) {
  var menuSeleccionado = generarMenus()

  if (!permissions.includes("SUPER_ADMIN")) {
    menuSeleccionado = generarMenuSegunRoles(permissions, menuSeleccionado)
  }

  //Obtenemos solo los valores
  var menu = Object.values(menuSeleccionado)
  menu.sort((a, b) => (a.titulo > b.titulo ? 1 : -1))
  //Agregmos el dashboar
  menu.unshift(principal())
  menu.forEach(m => m.submenu.sort((a, b) => (a.titulo > b.titulo ? 1 : -1)))
  return menu
}

function generarMenuSegunRoles(permissions, OBJETO_MENUS) {
  //ES NECESARIO QUE LOS PERMISOS INCLUYAN EL TEXTO MENU!!!
  const menusSeleccionados = {}

  permissions
    .filter(permiso => permiso.includes("MENU"))
    .forEach(permiso => {
      for (const key in OBJETO_MENUS) {
        const menuCompleto = OBJETO_MENUS[key]
        if (menuCompleto.permissions.includes(permiso))
          menusSeleccionados[key] = menuCompleto
      }
    })

  for (const key in menusSeleccionados) {
    const menu = menusSeleccionados[key]
    menu.submenu = menu.submenu.filter(submenu => {
      return submenu.permissions.every(rolActual =>
        permissions.includes(rolActual)
      )
    })
  }

  return menusSeleccionados
}

function generarMenus() {
  return {
    REPORTES: reportes(),
    ALMACENES: almacenes(),
    CONTROL_DE_PRODUCCION: controlDeProduccion(),
    INGENIERIA: ingenieria(),
    VENTAS: ventas(),
    COMPRAS: compras(),
    ADMINISTRADOR: administrador(),
    PRODUCCION: produccion(),
    RH: rh(),
  }
}

function principal() {
  const menu = {
    // TODO MUNDO DEBE DE TENER ESTO.
    permiso: [],
    titulo: "Avisos",
    icono: "fas fa-comments",
    submenu: [
      {
        titulo: "Dashboard",
        url: "/dashboard",
        permiso: [],
      },
    ],
  }
  return menu
}

function reportes() {
  const menu = {
    permiso: permisos.$("menu:reportes"),
    titulo: "Reportes",
    icono: "fas fa-chart-pie",
    submenu: [
      {
        titulo: "Faltante producto terminado",
        url: "/reportes/productoTerminado/faltantes",
        permiso: permisos.$("menu:reportes:productoTerminado:faltantes"),
      },
      {
        titulo: "Faltantes almacen de produccion",
        url: "/reportes/almacenDeProduccion/faltantes",
        permiso: permisos.$("menu:reportes:almacenDeProduccion:faltantes"),
      },
      {
        titulo: "Personalizados",
        url: "/reportes/almacenDeProduccion/personalizado",
        permiso: permisos.$("menu:reportes:almacenDeProduccion:personalizado"),
      },
      {
        titulo: "Transformacion",
        url: "/reportes/transformacion",
        permiso: permisos.$("menu:reportes:transformacion"),
      },
    ],
  }

  return menu
}

function almacenes() {
  const menu = {
    permiso: permisos.$("menu:almacen"),
    titulo: " Almacen",
    icono: "fas fa-warehouse",
    submenu: [
      {
        titulo: "Producto terminado",
        url: "/almacen/productoTerminado",
        permiso: permisos.$("menu:almacen:productoTerminado"),
      },
      {
        titulo: "Produccion",
        url: "/almacen/produccion",
        permiso: permisos.$("menu:almacen:produccion"),
      },
      {
        titulo: "Produccion - ES",
        url: "/almacen/produccion/entradasYSalidas",
        permiso: permisos.$("menu:almacen:produccion:entradasYSalidas"),
      },
      {
        titulo: "Requisiciones",
        url: "/almacen/requisiciones",
        permiso: permisos.$("menu:almacen:requisiciones"),
      },
      {
        titulo: "Reportes personalizados",
        url: "/almacen/reportesPersonalizados",
        permiso: permisos.$("menu:almacen:reportesPersonalizados"),
      },
    ],
  }
  return menu
}

function controlDeProduccion() {
  const menu = {
    permiso: permisos.$("menu:controlDeProduccion"),
    titulo: "Control de Producción",
    icono: "fas fa-project-diagram",
    submenu: [
      // { titulo: 'Registro de folios', url: '/folios', permiso: [] },
      // { titulo: 'Seguimiento', url: '/produccion', permiso: [] },
      {
        titulo: "Revision de folios",
        url: "/folios/revision",
        permiso: permisos.$("menu:controlDeProduccion:folios:revision"),
      },
      {
        titulo: "Seguimientos",
        url: "/folios/seguimiento",
        permiso: permisos.$("menu:controlDeProduccion:folios:seguimiento"),
      },
      {
        titulo: "Asignar ordenes",
        url: "/folios/asignarOrdenes",
        permiso: permisos.$("menu:controlDeProduccion:folios:asignarOrdenes"),
      },
    ],
  }

  return menu
}

function ingenieria() {
  const menu = {
    permiso: permisos.$("menu:ingenieria:"),
    titulo: "Ingenieria",
    icono: "fas fa-cogs",
    submenu: [
      {
        titulo: "Procesos",
        url: "/procesos",
        permiso: permisos.$("menu:ingenieria:procesos"),
      },
      {
        titulo: "Procesos - Familias",
        url: "/familiaDeProcesos",
        permiso: permisos.$("menu:ingenieria:familiaDeProcesos"),
      },
      {
        titulo: "Modelos",
        url: "/modelos",
        permiso: permisos.$("menu:ingenieria:modelos"),
      },
      {
        titulo: "Tamanos",
        url: "/tamanos",
        permiso: permisos.$("menu:ingenieria:tamanos"),
      },
      {
        titulo: "Colores",
        url: "/colores",
        permiso: permisos.$("menu:ingenieria:colores"),
      },
      {
        titulo: "Terminados",
        url: "/terminados",
        permiso: permisos.$("menu:ingenieria:terminados"),
      },
      {
        titulo: "SKU - Produccion",
        url: "/sku",
        permiso: permisos.$("menu:ingenieria:sku"),
      },
      {
        titulo: "Maquinas",
        url: "/maquinas",
        permiso: permisos.$("menu:ingenieria:maquinas"),
      },

      // { titulo: 'Costos de proceso', url: '/procesos/costos', permiso: [] },
      // { titulo: 'Hit', url: '/hits', permiso: [] },
    ],
  }
  return menu
}

function ventas() {
  const menu = {
    permiso: permisos.$("menu:ventas"),
    titulo: "Ventas",
    icono: "fas fa-file-contract",
    submenu: [
      {
        titulo: "Mis folios",
        url: "/ventas/misFolios",
        permiso: permisos.$("menu:ventas:misFolios"),
      },
      {
        titulo: "Stock",
        url: "/ventas/stock",
        permiso: permisos.$("menu:ventas:stock"),
      },
    ],
  }

  return menu
}

function compras() {
  const menu = {
    permiso: permisos.$("menu:"),
    titulo: "Compras",
    icono: "fas fa-shopping-bag",
    submenu: [
      {
        titulo: "Proveedores",
        url: "/proveedores",
        permiso: permisos.$("menu:proveedores"),
      },
      {
        titulo: "Divisas",
        url: "/divisas",
        permiso: permisos.$("menu:divisas"),
      },
    ],
  }
  return menu
}

function administrador() {
  const menu = {
    permiso: permisos.$("menu:administrador"),
    titulo: "Administrador",
    icono: "fas fa-user-cog",
    submenu: [
      {
        titulo: "Usuarios",
        url: "/usuarios",
        permiso: permisos.$("menu:administrador:usuarios"),
      },
      {
        titulo: "Departametos",
        url: "/departamentos",
        permiso: permisos.$("menu:administrador:departamentos"),
      },
      {
        titulo: "Areas",
        url: "/areas",
        permiso: permisos.$("menu:administrador:areas"),
      },
      {
        titulo: "Clientes",
        url: "/clientes",
        permiso: permisos.$("menu:administrador:clientes"),
      },
      {
        titulo: "Almacen descripcion",
        url: "/almacenDescripcion",
        permiso: permisos.$("menu:administrador:almacenDescripcion"),
      },
    ],
  }
  return menu
}
function produccion() {
  const menu = {
    permiso: permisos.$("menu:produccion"),
    titulo: "Registros",
    icono: "fas fa-file-alt",
    submenu: [
      {
        titulo: "Almacen de boton",
        url: "/produccion/almacenDeBoton",
        permiso: permisos.$("menu:produccion:almacenDeBoton"),
      },
      {
        titulo: "Barnizado",
        url: "/produccion/barnizado",
        permiso: permisos.$("menu:produccion:barnizado"),
      },
      {
        titulo: "Burato",
        url: "/produccion/burato",
        permiso: permisos.$("menu:produccion:burato"),
      },
      {
        titulo: "Control de produccion",
        url: "/produccion/controlDeProduccion",
        permiso: permisos.$("menu:produccion:controlDeProduccion"),
      },
      {
        titulo: "Empaque",
        url: "/produccion/empaque",
        permiso: permisos.$("menu:produccion:empaque"),
      },
      {
        titulo: "Materiales",
        url: "/produccion/materiales",
        permiso: permisos.$("menu:produccion:materiales"),
      },
      {
        titulo: "Pastilla",
        url: "/produccion/pastilla",
        permiso: permisos.$("menu:produccion:pastilla"),
      },
      {
        titulo: "Laser",
        url: "/produccion/laser",
        permiso: permisos.$("menu:produccion:laser"),
      },
      {
        titulo: "Metalizado",
        url: "/produccion/metalizado",
        permiso: permisos.$("menu:produccion:metalizado"),
      },
      {
        titulo: "Seleccion",
        url: "/produccion/seleccion",
        permiso: permisos.$("menu:produccion:seleccion"),
      },
      {
        titulo: "Transformacion",
        url: "/produccion/transformacion",
        permiso: permisos.$("menu:produccion:transformacion"),
      },
      {
        titulo: "Pulido",
        url: "/produccion/pulido",
        permiso: permisos.$("menu:produccion:pulido"),
      },
      {
        titulo: "Producto terminado",
        url: "/produccion/productoTerminado",
        permiso: permisos.$("menu:produccion:productoTerminado"),
      },
      {
        titulo: "Teñido",
        url: "/produccion/tenido",
        permiso: permisos.$("menu:produccion:tenido"),
      },
    ],
  }

  return menu
}

function rh() {
  const menu = {
    permiso: permisos.$("menu:rh"),
    titulo: "RH",
    icono: "fas fa-user-plus",
    submenu: [
      {
        titulo: "Empleados",
        url: "/empleados",
        permiso: permisos.$("menu:rh:empleados"),
      },
      {
        titulo: "Cursos",
        url: "/cursos",
        permiso: permisos.$("menu:rh:cursos"),
      },
      {
        titulo: "Puestos",
        url: "/puestos",
        permiso: permisos.$("menu:rh:puestos"),
      },
    ],
  }
  return menu
}
