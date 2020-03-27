const CONST = require("../../utils/constantes")

module.exports = function(rolesDelUsuario) {
  var menuSeleccionado = generarMenus()

  if (!rolesDelUsuario.includes("SUPER_ADMIN")) {
    menuSeleccionado = generarMenuSegunRoles(rolesDelUsuario, menuSeleccionado)
  }

  //Obtenemos solo los valores
  var menu = Object.values(menuSeleccionado)
  menu.sort((a, b) => (a.titulo > b.titulo ? 1 : -1))
  //Agregmos el dashboar
  menu.unshift(principal())
  menu.forEach(m => m.submenu.sort((a, b) => (a.titulo > b.titulo ? 1 : -1)))
  return menu
}

function generarMenuSegunRoles(rolesDelUsuario, OBJETO_MENUS) {
  //ES NECESARIO QUE LOS PERMISOS INCLUYAN EL TEXTO MENU!!!
  const menusSeleccionados = {}

  rolesDelUsuario
    .filter(rol => rol.includes("MENU"))
    .forEach(rol => {
      for (const key in OBJETO_MENUS) {
        const menuCompleto = OBJETO_MENUS[key]
        if (menuCompleto.roles.includes(rol))
          menusSeleccionados[key] = menuCompleto
      }
    })

  for (const key in menusSeleccionados) {
    const menu = menusSeleccionados[key]
    menu.submenu = menu.submenu.filter(submenu => {
      return submenu.roles.every(rolActual =>
        rolesDelUsuario.includes(rolActual)
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
    RH: rh()
  }
}

function principal() {
  const menu = {
    // TODO MUNDO DEBE DE TENER ESTO.
    roles: [],
    titulo: "Avisos",
    icono: "fas fa-comments",
    submenu: [
      {
        titulo: "Dashboard",
        url: "/dashboard",
        roles: []
      }
    ]
  }
  return menu
}

function reportes() {
  const menu = {
    roles: [CONST.ROLES.REPORTES_MENU],
    titulo: "Reportes",
    icono: "fas fa-chart-pie",
    submenu: [
      {
        titulo: "Faltante producto terminado",
        url: "/reportes/productoTerminado/faltantes",
        roles: [CONST.ROLES.REPORTES_PRODUCTO_TERMINADO_FALTANTES]
      },
      {
        titulo: "Faltantes almacen de produccion",
        url: "/reportes/almacenDeProduccion/faltantes",
        roles: [CONST.ROLES.REPORTES_ALMACEN_PRODUCCION_FALTANTES]
      },
      {
        titulo: "Personalizados",
        url: "/reportes/almacenDeProduccion/personalizado",
        roles: [CONST.ROLES.REPORTES_ALMACEN_PRODUCCION_PERSONALIZADOS]
      },
      {
        titulo: "Transformacion",
        url: "/reportes/transformacion",
        roles: [CONST.ROLES.REPORTES_TRANSFORMACION]
      }
    ]
  }

  return menu
}

function almacenes() {
  const menu = {
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
      {
        titulo: "Produccion - ES",
        url: "/almacen/produccion/entradasYSalidas",
        roles: [CONST.ROLES.ALMACEN_MATERIA_PRIMA_ENTRADA_Y_SALIDA]
      },
      {
        titulo: "Requisiciones",
        url: "/almacen/requisiciones",
        roles: [CONST.ROLES.ALMACEN_REQUISICION]
      },
      {
        titulo: "Reportes personalizados",
        url: "/almacen/reportesPersonalizados",
        roles: [CONST.ROLES.ALMACEN_PRODUCCION_REPORTES_PERSONALIZADOS]
      }
    ]
  }
  return menu
}

function controlDeProduccion() {
  const menu = {
    roles: [CONST.ROLES.CONTROL_DE_PRODUCCION_MENU],
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
      },
      {
        titulo: "Asignar ordenes",
        url: "/folios/asignarOrdenes",
        roles: [CONST.ROLES.CONTROL_DE_PRODUCCION_ASIGNAR_ORDENES]
      },
    ]
  }

  return menu
}

function ingenieria() {
  const menu = {
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
        titulo: "SKU - Produccion",
        url: "/sku",
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
  }
  return menu
}

function ventas() {
  const menu = {
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
  }

  return menu
}

function compras() {
  const menu = {
    roles: [CONST.ROLES.COMPRAS_MENU],
    titulo: "Compras",
    icono: "fas fa-shopping-bag",
    submenu: [
      {
        titulo: "Proveedores",
        url: "/proveedores",
        roles: [CONST.ROLES.COMPRAS_PROVEEDORES]
      },
      {
        titulo: "Divisas",
        url: "/divisas",
        roles: [CONST.ROLES.COMPRAS_DIVISAS]
      }
    ]
  }
  return menu
}

function administrador() {
  const menu = {
    roles: [CONST.ROLES.ADMINISTRADOR_MENU],
    titulo: "Administrador",
    icono: "fas fa-user-cog",
    submenu: [
      {
        titulo: "Usuarios",
        url: "/usuarios",
        roles: [CONST.ROLES.ADMINISTRADOR_USUARIOS]
      },
      {
        titulo: "Departametos",
        url: "/departamentos",
        roles: [CONST.ROLES.ADMINISTRADOR_DEPARTAMENTOS]
      },
      {
        titulo: "Areas",
        url: "/areas",
        roles: [CONST.ROLES.ADMINISTRADOR_AREAS]
      },
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
  }
  return menu
}

function produccion() {
  const menu = {
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
  }

  return menu
}

function rh() {
  const menu = {
    roles: [CONST.ROLES.RH_MENU],
    titulo: "RH",
    icono: "fas fa-user-plus",
    submenu: [
      {
        titulo: "Empleados",
        url: "/empleados",
        roles: [CONST.ROLES.RH_EMPLEADOS]
      },
      {
        titulo: "Cursos",
        url: "/cursos",
        roles: [CONST.ROLES.RH_CURSOS]
      },
      {
        titulo: "Puestos",
        url: "/puestos",
        roles: [CONST.ROLES.RH_PUESTOS]
      }
    ]
  }
  return menu
}
