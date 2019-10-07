var mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId
// <!--
// =====================================
//  Recepcion y limpieza de querys para filtros
// =====================================
// -->

function eliminarVacios(ob) {
  // Eliminar vacios
  let keys = Object.keys(ob)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (ob[key] == undefined) {
      delete ob[key]
    }
  }

  return ob
}

module.exports.obtenerFiltros = function(q) {
  var ob = {
    /**
     * La cantidad de registros que se van a mostrar.
     */
    limite: q.limite | 5,
    /**
     * Cantidad de resgistros que se va a saltar. Se usa con skip.
     */
    desde: q.desde | 0,

    folioDesde: q.folioDesde,
    folioHasta: q.folioHasta,
    usuario: q.usuario,
    materiaPrima: q.materiaPrima,
    consumibles: q.consumibles,
    gastosYServicios: q.gastosYServicios,
    articulo: q.articulo,
    estatus_esRequisicion: q.estatus_esRequisicion,
    estatus_esOrdenDeCompra: q.estatus_esOrdenDeCompra,
    estatus_fechaDeGeneracionDeOrdenDeCompraDesde:
      q.estatus_fechaDeGeneracionDeOrdenDeCompraDesde,
    estatus_fechaDeGeneracionDeOrdenDeCompraHasta:
      q.estatus_fechaDeGeneracionDeOrdenDeCompraHasta,
    estatus_fechaTerminoYEntradaAlmacenDesde:
      q.estatus_fechaTerminoYEntradaAlmacenDesde,
    estatus_fechaTerminoYEntradaAlmacenHasta:
      q.estatus_fechaTerminoYEntradaAlmacenHasta,
    estatus_esEntregaParcial: q.estatus_esEntregaParcial,
    estatus_fechaEntregaParcialidadDesde:
      q.estatus_fechaEntregaParcialidadDesde,
    estatus_fechaEntregaParcialidadHasta:
      q.estatus_fechaEntregaParcialidadHasta,
    estatus_cantidadEntregadaALaFecha: q.estatus_cantidadEntregadaALaFecha,
    estatus_esTerminada: q.estatus_esTerminada,
    estatus_fechaTerminadaDesde: q.estatus_fechaTerminadaDesde,
    estatus_fechaTerminadaHasta: q.estatus_fechaTerminadaHasta,
    estatus_esCancelada: q.estatus_esCancelada,
    estatus_fechaCancelacionDesde: q.estatus_fechaCancelacionDesde,
    estatus_fechaCancelacionHasta: q.estatus_fechaCancelacionHasta
  }

  return eliminarVacios(ob)
}

// <!--
// =====================================
//  END Recepcion y limpieza de querys para filtros
// =====================================
// -->

// <!--
// =====================================
//  Generar arreglo redact
// =====================================
// -->
/**
 *Retorna la estructura del arreglo para generar la 
 busqueda fina con el redac.
 */
/**
 *
 *
 * @param {*} filtros
 * @returns
 */
module.exports.generarArregloRedact = function(filtros) {
  var arreglo = []
  arreglo = filtroFolio(arreglo, filtros)
  arreglo = filtroUsuario(arreglo, filtros)
  arreglo = filtroArticulo(arreglo, filtros)
  //Gastos y Servicios | Materia prima | Consumibles
  arreglo = filtroTipoDeMaterial(arreglo, filtros)
  // Requisicion | Orden de compra | Parcialidad | Terminado | Cancelado
  arreglo = filtroEstatus(arreglo, filtros)

  return verficacionesFinalesDeArreglo(arreglo, filtros)
}

// <!--
// =====================================
//  END Generar arreglo redact
// =====================================
// -->

function verficacionesFinalesDeArreglo(arreglo, filtros) {
  if (arreglo.length === 0) {
    // Si el arreglo esta vacio hacemos un $match a todos los
    // folios que tengan $exists: true dentro del campo folio
    arreglo.push({ $match: { folio: { $exists: true } } })
  }
  //Si el arreglo no esta vacio agregamos nuestro limite.

  arreglo = lookup(arreglo, filtros)

  return limiteYSkip(arreglo, filtros)
}

function lookup(arreglo, filtros) {
  arreglo = lookupUsuarios(arreglo)
  arreglo = lookupArticulo(arreglo)
  arreglo = sort(arreglo, filtros)

  return arreglo
}

function lookupUsuarios(arreglo) {
  // <!--
  // =====================================
  //  usuario
  // =====================================
  // -->
  arreglo.push({
    $lookup: {
      from: "usuarios",
      localField: "usuario",
      foreignField: "_id",
      as: "usuario"
    }
  })

  arreglo.push({
    $unwind: {
      path: "$usuario",
      preserveNullAndEmptyArrays: true
    }
  })
  // <!--
  // =====================================
  //  END usuario
  // =====================================
  // -->

  // <!--
  // =====================================
  //  historialEstatus.usuarioQueActualiza
  // =====================================
  // -->

  // Tenemos que separar el arreglo.
  arreglo.push({
    $unwind: {
      path: "$historialDeEstatus",
      preserveNullAndEmptyArrays: true
    }
  })

  //populamos el usuario que modifica

  arreglo.push({
    $lookup: {
      from: "usuarios",
      localField: "historialDeEstatus.usuarioQueModifica",
      foreignField: "_id",
      as: "historialDeEstatus.usuarioQueModifica"
    }
  })
  //Limpiamos el arreglo que se crea
  arreglo.push({
    $unwind: {
      path: "$historialDeEstatus.usuarioQueModifica",
      preserveNullAndEmptyArrays: true
    }
  })

  //Reconstruimos todo

  arreglo.push({
    $group: {
      _id: {
        _id: "$_id",
        folio: "$folio",
        usuario: "$usuario",
        materiaPrima: "$materiaPrima",
        consumibles: "$consumibles",
        gastosYServicios: "$gastosYServicios",
        cantidad: "$cantidad",
        articulo: "$articulo",
        estatus: "$estatus",
        createdAt: "$createdAt",
        updateddAt: "$updateddAt",

        razonDeCambioTemp: "$razonDeCambioTemp"
      },
      historialDeEstatusGrupo: {
        $push: "$historialDeEstatus"
      }
    }
  })

  arreglo.push({
    $project: {
      _id: "$_id._id",
      folio: "$_id.folio",
      usuario: "$_id.usuario",
      materiaPrima: "$_id.materiaPrima",
      consumibles: "$_id.consumibles",
      gastosYServicios: "$_id.gastosYServicios",
      cantidad: "$_id.cantidad",
      articulo: "$_id.articulo",
      estatus: "$_id.estatus",
      historialDeEstatus: "$historialDeEstatusGrupo",
      razonDeCambioTemp: "$_id.razonDeCambioTemp",
      createdAt: "$_id.createdAt",
      updateddAt: "$_id.updateddAt"
    }
  })

  // <!--
  // =====================================
  //  END historialEstatus.usuarioQueActualiza
  // =====================================
  // -->

  return arreglo
}

function lookupArticulo(arreglo) {
  arreglo.push({
    $lookup: {
      from: "articulos",
      localField: "articulo",
      foreignField: "_id",
      as: "articulo"
    }
  })
  arreglo.push({
    $unwind: {
      path: "$articulo",
      preserveNullAndEmptyArrays: true
    }
  })

  return arreglo
}

function sort(arreglo, filtros) {
  //Para cuando lo implementemos. 
  let valor = filtros
  valor
  

  arreglo.push({ $sort: { folio: -1 } })
  return arreglo
}

/**
 *
 * Para ejecutar esta funcion ya todos las requisiciones
 * deben de estar bien estructuradas.
 *
 * @param {*} arreglo
 * @param {*} filtros
 */
function limiteYSkip(arreglo, filtros) {
  arreglo.push({
    $group: {
      _id: null,
      total: { $sum: 1 },
      requisiciones: { $push: "$$ROOT" }
    }
  })

  arreglo.push({
    $project: {
      // Este define que si se muestre la propiedad total.
      total: 1,
      // Ahora le dicimos que si muestre la propiedad requisiciones pero...
      requisiciones: {
        // Primero la vamos a cortar.
        $slice: [
          // Le decimos el arreglo que va cortar.
          "$requisiciones",
          // Desde donde va a empezar a cortar.
          Number(filtros.desde),
          // Hasta donde va a dejar de cortar.
          Number(filtros.limite)
          // Para estos elememntos previamente ya habiamos
          // definido que si no llega desde o limite damos
          // valores por defecto para usar el paginador.
        ]
      }
    }
  })
  return arreglo
}

/**
 *Comprueba folioDesde y folioHasta. No destructiva.
 *
 * @param {*} arr
 * @param {*} filtros
 * @returns El el arreglo modificado.
 */
function filtroFolio(arr, filtros) {
  var objeto = { $match: { folio: null } }
  //Comprobamos folioDesde y folioHasta
  objeto.$match.folio = Number(filtros.folioDesde || filtros.folioHasta)
  if (filtros.folioDesde && filtros.folioHasta) {
    objeto.$match.folio = {
      $gte: Number(filtros.folioDesde),
      $lte: Number(filtros.folioHasta)
    }
  }

  if (objeto.$match.folio) arr.push(objeto)
  return arr
}

function filtroUsuario(arr, filtros) {
  if (filtros.usuario) {
    arr.push({
      $match: { usuario: ObjectId(filtros.usuario) }
    })
  }
  return arr
}
function filtroArticulo(arr, filtros) {
  if (filtros.articulo) {
    arr.push({
      $match: { articulo: ObjectId(filtros.articulo) }
    })
  }
  return arr
}

function filtroTipoDeMaterial(arreglo, filtros) {
  var fil = ["materiaPrima", "consumibles", "gastosYServicios"]

  fil.forEach((x) => {
    if (filtros[x]) {
      var booleano = filtros[x] == 1
      arreglo.push({
        $match: { [x]: booleano }
      })
    }
  })

  return arreglo
}
function filtroEstatus(arreglo, filtros) {
  var fil = [
    "esRequisicion",
    "esOrdenDeCompra",
    "esEntregaParcial",
    "esTerminada",
    "esCancelada"
  ]
  fil.forEach((x) => {
    if (filtros["estatus_" + x]) {
      var boleano = filtros["estatus_" + x] == 1
      arreglo.push({
        $match: {
          ["estatus." + x]: boleano
        }
      })
    }
  })

  return arreglo
}
