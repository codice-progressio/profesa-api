var CONST = require("../../utils/constantes")
var permisos = require("../../config/permisos.config")

module.exports = function (permisos) {
  var menusSeleccionables = generarMenus()
  if (!permisos.includes("SUPER_ADMIN")) {
    //En caso de que no sea el SUPER_ADMIN debemos eliminar los
    // menus que no coinciden contra los permisos que estan
    // en el arreglo del usuario.
    menusSeleccionables = generarMenuSegunPermisos(
      permisos,
      menusSeleccionables
    )
  }

  //Obtenemos solo los valores
  var menu = Object.values(menusSeleccionables)
  menu.sort((a, b) => (a.titulo > b.titulo ? 1 : -1))
  //Agregmos el dashboar
  menu.unshift(principal())
  menu.forEach(m => m.submenu.sort((a, b) => (a.titulo > b.titulo ? 1 : -1)))
  return menu
}

function generarMenuSegunPermisos(permisos, OBJETO_MENUS) {
  return (
    Object.keys(OBJETO_MENUS)
      //Dejamos solo los menus generales de los que tenemos permiso
      .filter(key => {
        return permisos.includes(OBJETO_MENUS[key].permiso)
      })
      .map(key => {
        //Filtramos los submenus
        const menu = OBJETO_MENUS[key]
        menu.submenu = menu.submenu.filter(sm => permisos.includes(sm.permiso))
        return menu
      })
  )
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
    RH: rh(),
    parametros: parametros(),
  }
}

function principal() {
  const menu = {
    // TODO MUNDO DEBE DE TENER ESTO.
    permiso: permisos.$("login", false),
    titulo: "Avisos",
    icono: "fas fa-comments",
    submenu: [
      {
        titulo: "Dashboard",
        url: "/dashboard",
        permiso: permisos.$("login", false),
      },
    ],
  }
  return menu
}

function reportes() {
  const menu = {
    permiso: permisos.$("menu:reportes", false),
    titulo: "Reportes",
    icono: "fas fa-chart-pie",
    submenu: [
      {
        titulo: "Faltante producto terminado",
        url: "/reportes/productoTerminado/faltantes",
        permiso: permisos.$("menu:reportes:productoTerminado:faltantes", false),
      },
      {
        titulo: "Faltantes almacen de produccion",
        url: "/reportes/almacenDeProduccion/faltantes",
        permiso: permisos.$(
          "menu:reportes:almacenDeProduccion:faltantes",
          false
        ),
      },
      {
        titulo: "Personalizados",
        url: "/reportes/almacenDeProduccion/personalizado",
        permiso: permisos.$(
          "menu:reportes:almacenDeProduccion:personalizado",
          false
        ),
      },
      {
        titulo: "Transformacion",
        url: "/reportes/transformacion",
        permiso: permisos.$("menu:reportes:transformacion", false),
      },
    ],
  }

  return menu
}

function almacenes() {
  const menu = {
    permiso: permisos.$("menu:almacen", false),
    titulo: " Almacen",
    icono: "fas fa-warehouse",
    submenu: [
      {
        titulo: "Producto terminado",
        url: "/almacen/productoTerminado",
        permiso: permisos.$("menu:almacen:productoTerminado", false),
      },
      {
        titulo: "Produccion",
        url: "/almacen/produccion",
        permiso: permisos.$("menu:almacen:produccion", false),
      },
      {
        titulo: "Produccion - ES",
        url: "/almacen/produccion/entradasYSalidas",
        permiso: permisos.$("menu:almacen:produccion:entradasYSalidas", false),
      },
      {
        titulo: "Requisiciones",
        url: "/almacen/requisiciones",
        permiso: permisos.$("menu:almacen:requisiciones", false),
      },
      {
        titulo: "Reportes personalizados",
        url: "/almacen/reportesPersonalizados",
        permiso: permisos.$("menu:almacen:reportesPersonalizados", false),
      },
    ],
  }
  return menu
}

function controlDeProduccion() {
  const menu = {
    permiso: permisos.$("menu:controlDeProduccion", false),
    titulo: "Control de Producción",
    icono: "fas fa-project-diagram",
    submenu: [
      // { titulo: 'Registro de folios', url: '/folios', permiso: [] },
      // { titulo: 'Seguimiento', url: '/produccion', permiso: [] },
      {
        titulo: "Revision de folios",
        url: "/folios/revision",
        permiso: permisos.$("menu:controlDeProduccion:folios:revision", false),
      },
      {
        titulo: "Seguimientos",
        url: "/folios/seguimiento",
        permiso: permisos.$(
          "menu:controlDeProduccion:folios:seguimiento",
          false
        ),
      },
      {
        titulo: "Asignar ordenes",
        url: "/folios/asignarOrdenes",
        permiso: permisos.$(
          "menu:controlDeProduccion:folios:asignarOrdenes",
          false
        ),
      },
    ],
  }

  return menu
}

function ingenieria() {
  const menu = {
    permiso: permisos.$("menu:ingenieria:", false),
    titulo: "Ingenieria",
    icono: "fas fa-cogs",
    submenu: [
      {
        titulo: "Procesos",
        url: "/procesos",
        permiso: permisos.$("menu:ingenieria:procesos", false),
      },
      {
        titulo: "Procesos - Familias",
        url: "/familiaDeProcesos",
        permiso: permisos.$("menu:ingenieria:familiaDeProcesos", false),
      },
      {
        titulo: "Modelos",
        url: "/modelos",
        permiso: permisos.$("menu:ingenieria:modelos", false),
      },
      {
        titulo: "Tamanos",
        url: "/tamanos",
        permiso: permisos.$("menu:ingenieria:tamanos", false),
      },
      {
        titulo: "Colores",
        url: "/colores",
        permiso: permisos.$("menu:ingenieria:colores", false),
      },
      {
        titulo: "Terminados",
        url: "/terminados",
        permiso: permisos.$("menu:ingenieria:terminados", false),
      },
      {
        titulo: "SKU - Produccion",
        url: "/sku",
        permiso: permisos.$("menu:ingenieria:sku", false),
      },
      {
        titulo: "Maquinas",
        url: "/maquinas",
        permiso: permisos.$("menu:ingenieria:maquinas", false),
      },

      // { titulo: 'Costos de proceso', url: '/procesos/costos', permiso: [] },
      // { titulo: 'Hit', url: '/hits', permiso: [] },
    ],
  }
  return menu
}

function ventas() {
  const menu = {
    permiso: permisos.$("menu:ventas", false),
    titulo: "Ventas",
    icono: "fas fa-file-contract",
    submenu: [
      {
        titulo: "Mis folios",
        url: "/ventas/misFolios",
        permiso: permisos.$("menu:ventas:misFolios", false),
      },
      {
        titulo: "Stock",
        url: "/ventas/stock",
        permiso: permisos.$("menu:ventas:stock", false),
      },
    ],
  }

  return menu
}

function parametros() {
  const menu = {
    permiso: permisos.$("menu:parametros", false),
    titulo: "Parametros",
    icono: "fas fa-microchip",
    submenu: [
      {
        titulo: "Localizacion de ordenes",
        url: "/parametros/localizacionDeOrdenes",
        permiso: permisos.$("menu:parametros:localizacionDeOrdenes", false),
      },
      {
        titulo: "Procesos Especiales",
        url: "/parametros/procesosEspeciales",
        permiso: permisos.$("menu:parametros:procesosEspeciales", false),
      },
      {
        titulo: "Restablecer o cambiar administrador",
        url: "/parametros/administrador",
        permiso: permisos.$("SUPER_ADMIN", false),
      },
      {
        titulo: "Crear estaciones de escaneo",
        url: "/parametros/scanners",
        permiso: permisos.$("SUPER_ADMIN", false),
      },
    ],
  }
  return menu
}
function compras() {
  const menu = {
    permiso: permisos.$("menu:compras", false),
    titulo: "Compras",
    icono: "fas fa-shopping-bag",
    submenu: [
      {
        titulo: "Proveedores",
        url: "/proveedores",
        permiso: permisos.$("menu:compras:proveedores", false),
      },
      {
        titulo: "Divisas",
        url: "/divisas",
        permiso: permisos.$("menu:compras:divisas", false),
      },
    ],
  }
  return menu
}

function administrador() {
  const menu = {
    permiso: permisos.$("menu:administrador", false),
    titulo: "Administrador",
    icono: "fas fa-user-cog",
    submenu: [
      {
        titulo: "Usuarios",
        url: "/usuarios",
        permiso: permisos.$("menu:administrador:usuarios", false),
      },
      {
        titulo: "Departametos",
        url: "/departamentos",
        permiso: permisos.$("menu:administrador:departamentos", false),
      },
      {
        titulo: "Areas",
        url: "/areas",
        permiso: permisos.$("menu:administrador:areas", false),
      },
      {
        titulo: "Clientes",
        url: "/clientes",
        permiso: permisos.$("menu:administrador:clientes", false),
      },
      {
        titulo: "Almacen descripcion",
        url: "/almacenDescripcion",
        permiso: permisos.$("menu:administrador:almacenDescripcion", false),
      },
    ],
  }
  return menu
}

function rh()
{
  const menu = {
    permiso: permisos.$("menu:rh", false),
    titulo: "RH",
    icono: "fas fa-user-plus",
    submenu: [
      {
        titulo: "Empleados",
        url: "/empleados",
        permiso: permisos.$("menu:rh:empleados", false),
      },
      {
        titulo: "Cursos",
        url: "/cursos",
        permiso: permisos.$("menu:rh:cursos", false),
      },
      {
        titulo: "Puestos",
        url: "/puestos",
        permiso: permisos.$("menu:rh:puestos", false),
      },
    ],
  }
  return menu
}
