const codice_security = require("@codice-progressio/express-authentication")
const $ = codice_security.configuraciones.easy_permissions.$
const p = codice_security.configuraciones.permisos

module.exports = function (permisos) {
  var menusSeleccionables = generarMenus()
  if (!permisos.includes(p.administrador.permiso)) {
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
    // REPORTES: reportes(),
    ALMACENES: almacenes(),
    // CONTROL_DE_PRODUCCION: controlDeProduccion(),
    // INGENIERIA: ingenieria(),
    VENTAS: ventas(),
    // COMPRAS: compras(),
    ADMINISTRADOR: administrador(),
    // PUNTO_DE_VEMTA: puntoDeVenta(),
    // CONTABILIDAD: contabilidad(),
    // RH: rh(),
    // parametros: parametros(),
  }
}

function principal() {
  const menu = {
    // TODO MUNDO DEBE DE TENER ESTO.
    permiso: $("login", "", { esMiddleware: false }),
    titulo: "Avisos",
    icono: "fas fa-comments",
    submenu: [
      {
        titulo: "Dashboard",
        url: "/dashboard",
        permiso: $("login", "", { esMiddleware: false }),
      },
    ],
  }
  return menu
}
function puntoDeVenta() {
  const menu = {
    // TODO MUNDO DEBE DE TENER ESTO.
    permiso: $("menu:venta-al-publico", "Menu de venta al publico"),
    titulo: "Venta al público",
    icono: "fas fa-shopping-cart",
    submenu: [
      {
        titulo: "Punto de venta",
        url: "/punto-de-venta",
        permiso: $(
          "menu:venta-al-publico:punto-de-venta",
          "Permite a este usuario utilizar el punto de venta "
        ),
      },
    ],
  }
  return menu
}
function contabilidad() {
  const menu = {
    permiso: $("menu:contabilidad", "Menu de contabilidad"),
    titulo: "Contabilidad",
    icono: "fas fa-file-invoice-dollar",
    submenu: [
      {
        titulo: "A - Tablero contable",
        url: "/contabilidad",
        permiso: $(
          "menu:contabilidad:tablero-contable",
          "Permite a este usuario entrar al tablero contable"
        ),
      },
      {
        titulo: "B - Remisiones",
        url: "/contabilidad/remisiones",
        permiso: $(
          "menu:contabilidad:remisiones",
          "Permite a este usuario entrar a la gestión de remisiones"
        ),
      },
      {
        titulo: "C - Facturas",
        url: "/contabilidad/facturas",
        permiso: $(
          "menu:contabilidad:facturas",
          "Permite a este usuario entrar a la gestión de facturas"
        ),
      },
    ],
  }
  return menu
}

function almacenes() {
  const menu = {
    permiso: $("menu:almacen", "Mostrar el menu de almacen", {
      esMiddleware: false,
    }),
    titulo: " Almacen",
    icono: "fas fa-warehouse",
    submenu: [
      {
        titulo: "Almacen",
        url: "/almacen",
        permiso: $("menu:almacen:sku", "Menu de gestion general del almacen", {
          esMiddleware: false,
        }),
      },
    ],
  }
  return menu
}

function controlDeProduccion() {
  const menu = {
    permiso: $("menu:controlDeProduccion", "", { esMiddleware: false }),
    titulo: "Control de Producción",
    icono: "fas fa-project-diagram",
    submenu: [
      {
        titulo: "Revision de folios",
        url: "/folios/revision",
        permiso: $("menu:controlDeProduccion:folios:revision", "", {
          esMiddleware: false,
        }),
      },
      {
        titulo: "Seguimientos",
        url: "/folios/seguimiento",
        permiso: $("menu:controlDeProduccion:folios:seguimiento", "", {
          esMiddleware: false,
        }),
      },
      {
        titulo: "Asignar ordenes",
        url: "/folios/asignarOrdenes",
        permiso: $("menu:controlDeProduccion:folios:asignarOrdenes", false),
      },
    ],
  }

  return menu
}

function ventas() {
  const menu = {
    permiso: $("menu:ventas", "Ver el menu de ventas"),
    titulo: "Ventas",
    icono: "fas fa-file-contract",
    submenu: [
      {
        titulo: "Mis Pedidos",
        url: "/ventas/mis-pedidos",
        permiso: $("menu:ventas:mis-pedidos", "", { esMiddleware: false }),
      },
      {
        titulo: "Listas de precios",
        url: "/ventas/listas-de-precios",
        permiso: $("menu:ventas:listas-de-precios", "", {
          esMiddleware: false,
        }),
      },
    ],
  }

  return menu
}

function compras() {
  const menu = {
    permiso: $("menu:compras", "", { esMiddleware: false }),
    titulo: "Compras",
    icono: "fas fa-shopping-bag",
    submenu: [
      {
        titulo: "Compras",
        url: "/compras",
        permiso: $("menu:compras", "", { esMiddleware: false }),
      },

      {
        titulo: "Divisas",
        url: "/divisas",
        permiso: $("menu:compras:divisas", false),
      },
    ],
  }
  return menu
}

function administrador() {
  const menu = {
    permiso: $("login", undefined, {
      esMiddleware: false,
    }),
    titulo: "Configuraciones",
    icono: "fas fa-cogs",
    submenu: [
      {
        titulo: "Usuarios",
        url: "/usuario",
        permiso: $(
          "menu:configuraciones:usuarios",
          "Ver el menu de usuarios dentro del menu administrador",
          { esMiddleware: false }
        ),
      },
      {
        titulo: "Departametos",
        url: "/departamentos",
        permiso: $(
          "menu:configuraciones:departamentos",
          "Ver el menu de gestion de departamentos"
        ),
      },
      {
        titulo: "Parametros",
        url: "/parametros",
        permiso: $(
          "menu:configuraciones:parametros",
          "Ver el menu de parametros",
          { esMiddleware: false }
        ),
      },
      {
        titulo: "Rutas",
        url: "/parametros/rutas-de-entrega",
        permiso: $(
          "menu:configuraciones:rutas-de-entrega",
          "Ver el menu de parametros de ruta de entrega",
          { esMiddleware: false }
        ),
      },

      {
        titulo: "Contactos",
        url: "/parametros/contactos",
        permiso: $("menu:configuraciones:contactos", "", {
          esMiddleware: false,
        }),
      },
      {
        titulo: "Areas",
        url: "/areas",
        permiso: $("menu:configuraciones:areas", false),
      },

      {
        titulo: "Almacen descripcion",
        url: "/almacenDescripcion",
        permiso: $("menu:configuraciones:almacenDescripcion", false),
      },
    ],
  }
  return menu
}

function rh() {
  const menu = {
    permiso: $("menu:rh", "", { esMiddleware: false }),
    titulo: "RH",
    icono: "fas fa-user-plus",
    submenu: [
      {
        titulo: "Empleados",
        url: "/empleados",
        permiso: $("menu:rh:empleados", "", { esMiddleware: false }),
      },
      {
        titulo: "Cursos",
        url: "/cursos",
        permiso: $("menu:rh:cursos", "", { esMiddleware: false }),
      },
      {
        titulo: "Puestos",
        url: "/puestos",
        permiso: $("menu:rh:puestos", "", { esMiddleware: false }),
      },
    ],
  }
  return menu
}
