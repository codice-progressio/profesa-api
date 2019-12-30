const CONST = require("../../utils/constantes")

module.exports = function(rolesDelUsuario) {
  const MENUS = generarMenus()

  agregarAdministradores(MENUS)

  const menuSeleccionado = generarMenuSegunRoles(rolesDelUsuario, MENUS)
  //Obtenemos solo los valores
  var menu = Object.values(menuSeleccionado)
  return menu
}

function generarMenus() {
  return {
    PRINCIPAL: principal(),
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

function agregarAdministradores(MENUS) {
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
}

function generarMenuSegunRoles(rolesDelUsuario, MENUS) {
  const menuSeleccionado = {}
  // Recorremos los roles.
  for (let i = 0; i < rolesDelUsuario.length; i++) {
    // Obtenemos el nombre del rol.
    const rol = rolesDelUsuario[i]
    generarMenuSegunRoles_recorrido(
      MENUS,
      menuSeleccionado,
      rol,
      rolesDelUsuario
    )
  }
  return menuSeleccionado
}

function generarMenuSegunRoles_recorrido(
  MENUS,
  menuSeleccionado,
  rol,
  rolesDelUsuario
) {
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
        generarMenuSegunRoles_recorrido_contieneLosPermisos(
          menuSeleccionado[menu],
          rolesDelUsuario
        )

        // Lo borramos para que el menú no se repita.
        delete MENUS[menu]
      }
    }
  }
}

function generarMenuSegunRoles_recorrido_contieneLosPermisos(
  menuSeleccionado,
  rolesDelUsuario
) {
  menuSeleccionado.submenu = menuSeleccionado.submenu.filter((submenu) => {
    for (let i = 0; i < submenu.roles.length; i++) {
      const rolSubmenu = submenu.roles[i].toString()
      if (rolesDelUsuario.includes(rolSubmenu)) {
        return true
      }
    }

    return false
  })
}

function principal() {
  const menu = {
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
  }
  return menu
}

function reportes() {
  const menu = {
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
        titulo: "Requisiciones",
        url: "/almacen/requisiciones",
        roles: [CONST.ROLES.ALMACEN_REQUISICION]
      }
    ]
  }
  return menu
}

function controlDeProduccion() {
  const menu = {
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
    roles: [CONST.ROLES.VENTAS_MENU],
    titulo: "Compras",
    icono: "fas fa-shopping-bag",
    submenu: [
      {
        titulo: "Proveedores",
        url: "/proveedores",
        roles: [CONST.ROLES.VENTAS_MIS_FOLIOS]
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
