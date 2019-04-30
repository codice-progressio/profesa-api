// Este es dl nuevo route para el folio.

//Esto es necesario
var express = require("express")
var app = express()
var Folio = require("../models/folios/folio")
var RESP = require("../utils/respStatus")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var CRUD = require("./CRUD")
CRUD.app = app
CRUD.modelo = Folio
CRUD.nombreDeObjetoSingular = "folio"
CRUD.nombreDeObjetoPlural = "folios"
CRUD.campoSortDefault = "fechaEntrega"
CRUD.camposActualizables = {
  // numeroDeFolio: null ,
  cliente: null,
  // fechaFolio: null,
  // fechaEntrega: null,
  vendedor: null,
  observaciones: null,
  observacionesVendedor: null,
  folioLineas: null,
  nivelDeUrgencia: null,
  porcentajeAvance: null,
  // ordenesGeneradas: null,
  // impreso: null,
  terminado: null,
  // fechaTerminado: null,
  cantidadProducida: null
}

CRUD.camposDeBusqueda = ["numeroDeFolio", "observaciones"]

CRUD.crud("delete", "post", "getById", "put")

/**
 * Senala el folio listo para produccion o no dependiendo de
 * que valor tenga la bandera. que se le pase como parametro.
 *
 */
app.post("/enviarAProduccion", (req, res) => {
  let msj = ""

  Folio.findById(req.body._id)
    .then((folio) => {
      if (!folio) {
        return RESP._400(res, {
          msj: "No existe el folio.",
          err:
            "El id que ingresaste no coincide contra ninguno en la base de datos."
        })
      }

      if (folio.ordenesGeneradas) {
        return RESP._400(res, {
          msj: "Imposible retornar al vendedor.",
          err:
            "Este folio ya tiene las ordenes generadas y no puede ser modificado por el vendedor. Es necesario cancerlo y crear uno nuevo."
        })
      }

      if (req.body.entregarAProduccion) {
        folio.entregarAProduccion = true
        folio.fechaDeEntregaAProduccion = new Date()
        msj = "Este folio se mando a produccir de manera correcta."
      } else {
        folio.entregarAProduccion = false
        folio.fechaDeEntregaAProduccion = null
        msj = "Se retorno este folio al vendedor."
      }

      return folio.save()
    })
    .then((folioGrabado) => {
      return RESP._200(res, msj, [{ tipo: "folio", datos: folioGrabado }])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error buscando el folio.",
        err: err
      })
    })
})

/**
 * Senala el folio con ordenes impresas.
 */
app.post("/ordenesImpresas", (req, res) => {
  Folio.findById(req.body._id)
    .then((folioEncontrado) => {
      if (!folioEncontrado) {
        return RESP._400(res, {
          msj: "No existe el folio.",
          err: "El id del folio que ingresaste no existe."
        })
      }
      folioEncontrado.impreso = true
      return folioEncontrado.save()
    })
    .then((folioGrabado) => {
      return RESP._200(res, null, [{ tipo: "folio", datos: folioGrabado }])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error buscando el folio para senalarlo como impreso",
        err: err
      })
    })
})

/**
 *
 * El filtro general para los folios. No es nesario definir otro, automaticamente
 * toma los datos de los paramentros y hace la busqueda. Si no se definie ninguno
 * retorna todas las coincidencias.
 *
 *
 * Hay que ver todos los paramentros que tiene. Por que si son bastantes.
 *
 */
app.get("/", (req, res) => {
  // Obtenemos todos los parametros.
  let query = req.query
  // Cargamos los objetos de busqueda para obtener
  // los parametros que mandamos por el query.
  let objetoDeBusqueda = {
    /**
     * Define si se va a buscar dentro de los folios terminados
     * o los que todavia estan en produccion.
     */
    terminado:
      query.foliosTerminados == "0"
        ? false
        : query.foliosTerminados === "1"
        ? true
        : undefined,
    /**
     * El id del folio que se quiere buscar.
     */
    numeroDeFolio: query.folio,
    /**
     * El id del pedido que se quiere buscar.
     */
    folioLineas_pedido: query.pedido,
    /**
     * El id del modelo que se quiere buscar.
     */
    folioLineas_modelo: query.modelo,
    /**
     * El id del tamano que se quiere buscar.
     */
    folioLineas_tamano: query.tamano,
    /**
     * El id del color que se quiere buscar.
     */
    folioLineas_color: query.color,
    /**
     * El id del terminado que se quiere buscar.
     */
    folioLineas_terminado: query.terminado,
    /**
     * El id del cliente
     */
    cliente: query.cliente,
    /**
     * El id del vendedor.
     */
    vendedor: query.vendedor,
    /**
     * La cantidad de registros que se van a mostrar.
     */
    limite: query.limite | 5,
    /**
     * Cantidad de resgistros que se va a saltar. Se usa con skip.
     */
    desde: query.desde | 0,
    // fechas
    /**
     * La fecha de creacion desde donde se va a empezar a filtrar.
     */
    fechaCreacionDesdeEl: query.fechaCreacionDesdeEl,
    /**
     * La fecha de creacion hasta la cual se va a filtrar.
     */
    fechaCreacionHasta: query.fechaCreacionHasta,
    /**
     * La fecha de entrega estimada desde donde se va a empezar a filtrar.
     */
    fechaEntregaEstimadaDesdeEl: query.fechaEntregaEstimadaDesdeEl,
    /**
     * La fecha de entrega hasta la cual se va a filtrar.
     */
    fechaEntregaEstimadaHasta: query.fechaEntregaEstimadaHasta,
    /**
     * La fecha de finalizacion desde donde se va a empezar a filtrar.
     */
    fechaFinalizacionFolioDesdeEl: query.fechaFinalizacionFolioDesdeEl,
    /**
     * La fecha de finalizacion hasta la cual se va a filtrar.
     */
    fechaFinalizacionFolioHasta: query.fechaFinalizacionFolioHasta,
    /**
     * Los campos para ordenar. Se utiliza la notacioin tipo campo1>-1@campo2>1
     */
    sortCampos: query.sortCampos,
    /**
     * Define si se muestran los folios con ordenes generadas o no.
     */
    ordenesGeneradas: query.ordenesGeneradas,
    /**
     * Filtra los folios que ya fueron entregados por los vendedores a produccion.
     */
    entregarAProduccion: query.entregarAProduccion,
    /**
     * La fecha de entrega a produccion desde donde se va a empezar a filtrar.
     */
    fechaDeEntregaAProduccionDesdeEl: query.fechaDeEntregaAProduccionDesdeEl,
    /**
     * La fecha de entrega a produccion hasta donde se va a filtrar.
     */
    fechaDeEntregaAProduccionHasta: query.fechaDeEntregaAProduccionHasta
  }

  // Eliminar vacios
  let keys = Object.keys(objetoDeBusqueda)
  // Quitamos todos los parametros de los cuales
  // no se recivio nada. Nos brincamos el primer
  // parametro (foliosTermianados) por que al ser un boleano lo mandamos
  // a volar siempre que sea false
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (objetoDeBusqueda[key] === undefined) {
      delete objetoDeBusqueda[key]
    }
  }

  /**
   * Este arreglo contiene los diferentes pasos de filtro del aggregate.
   */
  let arregloRedact = []

  let arregloAnd = []

  if (objetoDeBusqueda.ordenesGeneradas) {
    arregloAnd.push({
      ordenesGeneradas:
        query.ordenesGeneradas == 1
          ? true
          : query.ordenesGeneradas == 0
          ? false
          : false
    })
  }

  if (objetoDeBusqueda.entregarAProduccion) {
    arregloAnd.push({
      entregarAProduccion:
        query.entregarAProduccion == 1
          ? true
          : query.entregarAProduccion == 0
          ? false
          : false
    })
  }

  if (objetoDeBusqueda.terminado) {
    arregloAnd.push({ terminado: { $ne: objetoDeBusqueda.terminado } })
  }

  if (arregloAnd.length > 0)
    arregloRedact.push({ $match: { $and: arregloAnd } })

  // <!--
  // =====================================
  //  Filtros de fechas
  // =====================================
  // -->

  // fechaDeEntregaAProduccion
  if (
    objetoDeBusqueda.hasOwnProperty("fechaDeEntregaAProduccionDesdeEl") ||
    objetoDeBusqueda.hasOwnProperty("fechaDeEntregaAProduccionHasta")
  ) {
    /**
     * Guarda la construccion para la busqueda de la fecha de creacion
     */
    let obCreacion = {
      fechaDeEntregaAProduccion: {
        $gte: new Date(),
        $lte: new Date()
      }
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaDeEntregaAProduccionDesdeEl")) {
      obCreacion.fechaFolio.$gte = new Date(
        objetoDeBusqueda.fechaDeEntregaAProduccionDesdeEl
      )
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaDeEntregaAProduccionHasta")) {
      obCreacion.fechaFolio.$lte = new Date(
        objetoDeBusqueda.fechaDeEntregaAProduccionHasta
      )
    }

    if (!objetoDeBusqueda.hasOwnProperty("fechaDeEntregaAProduccionDesdeEl"))
      delete obCreacion.fechaFolio.$gte
    if (!objetoDeBusqueda.hasOwnProperty("fechaDeEntregaAProduccionHasta"))
      delete obCreacion.fechaFolio.$lte

    if (arregloRedact.length > 0) {
      arregloRedact[0].$match.$and.push(obCreacion)
    } else {
      arregloRedact.push({ $match: { $and: [obCreacion] } })
    }
  }

  // fechaCreacion
  if (
    objetoDeBusqueda.hasOwnProperty("fechaCreacionDesdeEl") ||
    objetoDeBusqueda.hasOwnProperty("fechaCreacionHasta")
  ) {
    /**
     * Guarda la construccion para la busqueda de la fecha de creacion
     */
    let obCreacion = {
      fechaFolio: {
        $gte: new Date(),
        $lte: new Date()
      }
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaCreacionDesdeEl")) {
      obCreacion.fechaFolio.$gte = new Date(
        objetoDeBusqueda.fechaCreacionDesdeEl
      )
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaCreacionHasta")) {
      obCreacion.fechaFolio.$lte = new Date(objetoDeBusqueda.fechaCreacionHasta)
    }

    if (!objetoDeBusqueda.hasOwnProperty("fechaCreacionDesdeEl"))
      delete obCreacion.fechaFolio.$gte
    if (!objetoDeBusqueda.hasOwnProperty("fechaCreacionHasta"))
      delete obCreacion.fechaFolio.$lte

    if (arregloRedact.length > 0) {
      arregloRedact[0].$match.$and.push(obCreacion)
    } else {
      arregloRedact.push({ $match: { $and: [obCreacion] } })
    }
  }

  // fechaEntregaEstimada
  if (
    objetoDeBusqueda.hasOwnProperty("fechaEntregaEstimadaDesdeEl") ||
    objetoDeBusqueda.hasOwnProperty("fechaEntregaEstimadaHasta")
  ) {
    /**
     * Guarda la construccion para la busqueda de la fecha de creacion
     */
    let obCreacion = {
      fechaEntrega: {
        $gte: new Date(),
        $lte: new Date()
      }
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaEntregaEstimadaDesdeEl")) {
      obCreacion.fechaEntrega.$gte = new Date(
        objetoDeBusqueda.fechaEntregaEstimadaDesdeEl
      )
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaEntregaEstimadaHasta")) {
      obCreacion.fechaEntrega.$lte = new Date(
        objetoDeBusqueda.fechaEntregaEstimadaHasta
      )
    }

    if (!objetoDeBusqueda.hasOwnProperty("fechaEntregaEstimadaDesdeEl"))
      delete obCreacion.fechaEntrega.$gte
    if (!objetoDeBusqueda.hasOwnProperty("fechaEntregaEstimadaHasta"))
      delete obCreacion.fechaEntrega.$lte

    if (arregloRedact.length > 0) {
      arregloRedact[0].$match.$and.push(obCreacion)
    } else {
      arregloRedact.push({ $match: { $and: [obCreacion] } })
    }
  }
  // fechaFinalizacionFolio
  if (
    objetoDeBusqueda.hasOwnProperty("fechaFinalizacionFolioDesdeEl") ||
    objetoDeBusqueda.hasOwnProperty("fechaFinalizacionFolioHasta")
  ) {
    /**
     * Guarda la construccion para la busqueda de la fecha de creacion
     */
    let obCreacion = {
      fechaTerminado: {
        $gte: new Date(),
        $lte: new Date()
      }
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaFinalizacionFolioDesdeEl")) {
      obCreacion.fechaTerminado.$gte = new Date(
        objetoDeBusqueda.fechaFinalizacionFolioDesdeEl
      )
    }

    if (objetoDeBusqueda.hasOwnProperty("fechaFinalizacionFolioHasta")) {
      obCreacion.fechaTerminado.$lte = new Date(
        objetoDeBusqueda.fechaFinalizacionFolioHasta
      )
    }

    if (!objetoDeBusqueda.hasOwnProperty("fechaFinalizacionFolioDesdeEl"))
      delete obCreacion.fechaTerminado.$gte
    if (!objetoDeBusqueda.hasOwnProperty("fechaFinalizacionFolioHasta"))
      delete obCreacion.fechaTerminado.$lte

    if (arregloRedact.length > 0) {
      arregloRedact[0].$match.$and.push(obCreacion)
    } else {
      arregloRedact.push({ $match: { $and: [obCreacion] } })
    }
  }

  //folio
  if (objetoDeBusqueda.hasOwnProperty("numeroDeFolio")) {
    if (isNaN(objetoDeBusqueda.numeroDeFolio))
       throw "El numero de folio debe ser un numero valido."

    arregloRedact.push({
      $match: {
        numeroDeFolio: Number(objetoDeBusqueda.numeroDeFolio)
      }
    })
  }

  // Cliente
  if (objetoDeBusqueda.hasOwnProperty("cliente")) {
    arregloRedact.push({
      $match: { cliente: ObjectId(objetoDeBusqueda.cliente) }
    })
  }

  // vendedor
  if (objetoDeBusqueda.hasOwnProperty("vendedor")) {
    arregloRedact.push({
      $match: { vendedor: ObjectId(objetoDeBusqueda.vendedor) }
    })
  }

  // Buscamos todas las coincidencias con el pedido y solo dejamos el pedido del folio que coincide.
  if (objetoDeBusqueda.hasOwnProperty("folioLineas_pedido")) {
    // Si hay pedido pero no hay numero de folio entones hacemos un match con folioLineas.pedido.
    // De esta manera
    if (!objetoDeBusqueda.hasOwnProperty("numeroDeFolio")) {
      // Si no hay pedido, buscamos que solo coincida contra el pedido de manera
      // que solo se muestre el folio que contiene el pedido.
      arregloRedact.push({
        $match: { "folioLineas.pedido": objetoDeBusqueda.folioLineas_pedido }
      })
    }

    arregloRedact.push({
      // Vamos a filtrar los pedidos que coincidan con el folioLineas_pedido que se paso.
      $project: {
        folioLineas: {
          $filter: {
            // La nueva propiedad que se va crear para poder traer solo los
            // pedidos que coincidan.
            input: "$folioLineas",
            cond: {
              $or: [
                { $eq: ["$$this.pedido", objetoDeBusqueda.folioLineas_pedido] }
              ]
            }
          }
        },

        // Los campos que si puede retornar project. Si no los especificamos no aparecen.
        nivelDeUrgencia: true,
        ordenesGeneradas: true,
        impreso: true,
        terminado: true,
        numeroDeFolio: true,
        cliente: true,
        fechaFolio: true,
        fechaEntrega: true,
        vendedor: true,
        observaciones: true,
        porcentajeAvance: true,
        cantidadProducida: true
      }
    })
  }

  // <!--
  // =====================================
  //  NUEVA SECCION
  // =====================================
  // -->

  let $unwind_FolioLineas = [
    {
      $unwind: {
        path: "$folioLineas",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  /**
   * Requiere $unwind de folioLineas
   */
  let $lookUp_ModeloCompleto = [
    {
      $lookup: {
        from: "modelosCompletos",
        localField: "folioLineas.modeloCompleto",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto"
      }
    },

    {
      $unwind: {
        path: "$folioLineas.modeloCompleto",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  /**
   * Requiere $unwind de modeloCompleto
   */
  let $unwind_$lookup_modeloTamanoColorTerminado = [
    // modelo
    {
      $lookup: {
        // Modelo
        from: "modelos",
        localField: "folioLineas.modeloCompleto.modelo",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.modelo"
      }
    },

    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.modelo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "tamanos",
        localField: "folioLineas.modeloCompleto.tamano",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.tamano"
      }
    },
    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.tamano",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $lookup: {
        from: "colores",
        localField: "folioLineas.modeloCompleto.color",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.color"
      }
    },
    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.color",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "terminados",
        localField: "folioLineas.modeloCompleto.terminado",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.terminado"
      }
    },
    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.terminado",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  /**
   * Requiere $unwind de folioLineas
   */
  let $lookup_FamiliaDeProcesos = [
    {
      $lookup: {
        from: "familiadeprocesos",
        localField: "folioLineas.modeloCompleto.familiaDeProcesos",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.familiaDeProcesos"
      }
    },
    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.familiaDeProcesos",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  /**
   * Requiere $unwind de folioLineas
   */
  let $unwind_Ordenes = [
    {
      $unwind: {
        path: "$folioLineas.ordenes",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  let $group_OrdenesPorPedido = [
    {
      $group: {
        _id: "$folioLineas._id",
        folio: { $first: "$$ROOT" },
        ordenes: {
          $push: "$folioLineas.ordenes"
        }
      }
    },

    {
      $addFields: {
        "folio.folioLineas.ordenes": "$ordenes"
      }
    },

    {
      $replaceRoot: { newRoot: "$folio" }
    }
  ]

  // Deshacemos el arreglo del trayecto normal.
  let $unwind_Orden_TrayectoNormal = [
    {
      $unwind: {
        path: "$folioLineas.ordenes.trayectoNormal",
        preserveNullAndEmptyArrays: true
      }
    }
  ]
  // Deshacemos e arreglo del trayecto recorrido.

  let $unwind_Orden_TrayectoRecorrido = [
    {
      $unwind: {
        path: "$folioLineas.ordenes.trayectoRecorrido",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  // Cargamos los departaemtos del trayecto normal

  let $lookUp_Orden_TrayectoNormal_Departamento = [
    {
      $lookup: {
        from: "departamentos",
        localField: "folioLineas.ordenes.trayectoNormal.departamento",
        foreignField: "_id",
        as: "folioLineas.ordenes.trayectoNormal.departamento"
      }
    },
    // Quitamos el arreglo que se hizo en trayecto normal del departamento.
    {
      $unwind: {
        path: "$folioLineas.ordenes.trayectoNormal.departamento",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  let $group_Orden_TrayectoNormalAOrden = [
    // Agrupamos por ordenes para obtener el trayecto.
    {
      $group: {
        _id: {
          // Se requiere agrupar por estos dos id debido
          // a que las rutas que esten folioLinas.ordenes._id como undefined
          // no se agrupan y se pierden esos pedidos.
          idOrden: "$folioLineas.ordenes._id",
          idPedido: "$folioLineas._id"
        },
        trayectos: { $push: "$folioLineas.ordenes.trayectoNormal" },
        folio: { $first: "$$ROOT" }
      }
    },
    // Agregamos los trayectos a alas ordenes.
    {
      $addFields: {
        "folio.folioLineas.ordenes.trayectoNormal": "$trayectos"
      }
    },
    {
      $replaceRoot: { newRoot: "$folio" }
    }
  ]
  let $group_Orden_TrayectoRecorridoAOrden = [
    // Agrupamos por ordenes para obtener el trayecto.
    {
      $group: {
        _id: {
          // Se requiere agrupar por estos dos id debido
          // a que las rutas que esten folioLinas.ordenes._id como undefined
          // no se agrupan y se pierden esos pedidos.
          idOrden: "$folioLineas.ordenes._id",
          idPedido: "$folioLineas._id"
        },
        trayectos: { $push: "$folioLineas.ordenes.trayectoRecorrido" },
        folio: { $first: "$$ROOT" }
      }
    },
    // Agregamos los trayectos a alas ordenes.
    {
      $addFields: {
        "folio.folioLineas.ordenes.trayectoRecorrido": "$trayectos"
      }
    },
    {
      $replaceRoot: { newRoot: "$folio" }
    }
  ]

  // Cargamos los departamentos del trayectoRecorrido
  let $lookUp_Orden_TrayectoRecorridoDepartamento = [
    {
      $lookup: {
        from: "departamentos",
        localField: "folioLineas.ordenes.trayectoRecorrido.departamento",
        foreignField: "_id",
        as: "folioLineas.ordenes.trayectoRecorrido.departamento"
      }
    },
    // Deshacemos el arreglo que se hizo en trayectorecorrido del departamento
    {
      $unwind: {
        path: "$folioLineas.ordenes.trayectoRecorrido.departamento",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  // Cargamos el departamento de ubicacion actual.
  let $lookUp_Orden_UbicacionActual = [
    {
      $lookup: {
        from: "departamentos",
        localField: "folioLineas.ordenes.ubicacionActual.departamento",
        foreignField: "_id",
        as: "folioLineas.ordenes.ubicacionActual.departamento"
      }
    },

    // Deshacemos el arreglo de ubicacion actual.
    {
      $unwind: {
        path: "$folioLineas.ordenes.ubicacionActual.departamento",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  // cargamos los departamentos de siguiente departamaneto.
  let $lookUp_Orden_SiguienteDepartamento = [
    {
      $lookup: {
        from: "departamentos",
        localField: "folioLineas.ordenes.siguienteDepartamento.departamento",
        foreignField: "_id",
        as: "folioLineas.ordenes.siguienteDepartamento.departamento"
      }
    },
    // Deshacemos el arreglo.
    {
      $unwind: {
        path: "$folioLineas.ordenes.siguienteDepartamento.departamento",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  /**
   * Requiere $unwind de folioLineas
   */
  let $unwind_$lookup_familiaDeProcesos_Procesos_Departamentos = [
    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.familiaDeProcesos.procesos",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $lookup: {
        from: "procesos",
        localField:
          "folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso"
      }
    },
    {
      $lookup: {
        from: "procesos",
        localField:
          "folioLineas.modeloCompleto.familiaDeProcesos.procesos.procesoPadre",
        foreignField: "_id",
        as: "folioLineas.modeloCompleto.familiaDeProcesos.procesos.procesoPadre"
      }
    },
    // Hack para que proceso sea un objeto.
    {
      $unwind: {
        path: "$folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path:
          "$folioLineas.modeloCompleto.familiaDeProcesos.procesos.procesoPadre",
        preserveNullAndEmptyArrays: true
      }
    },
    // Cargamos los departamentos
    {
      $lookup: {
        from: "departamentos",
        localField:
          "folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso.departamento",
        foreignField: "_id",
        as:
          "folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso.departamento"
      }
    },
    {
      $lookup: {
        from: "departamentos",
        localField:
          "folioLineas.modeloCompleto.familiaDeProcesos.procesos.procesoPadre.departamento",
        foreignField: "_id",
        as:
          "folioLineas.modeloCompleto.familiaDeProcesos.procesos.procesoPadre.departamento"
      }
    },
    // Hack para que departamento sea un objeto.
    {
      $unwind: {
        path:
          "$folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso.departamento",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path:
          "$folioLineas.modeloCompleto.familiaDeProcesos.procesos.procesoPadre.departamento",
        preserveNullAndEmptyArrays: true
      }
    }
  ]

  /**
   * Agrupa los procesos de familia de procesos. Aqui no se toma en cuenta las
   * maquinas del procesos por que hasta el momento anaden demasiada complejidad.
   * para volver a juntar los datos. Entrega  como pedido.
   */
  let $group_FamiliaDeProcesos_procesos = [
    // Agrupamos por pedido
    {
      $group: {
        _id: "$folioLineas._id",
        folio: { $first: "$$ROOT" },
        procesos: {
          $push:
            "$folioLineas.modeloCompleto.familiaDeProcesos.procesos.proceso"
        }
      }
    },

    {
      $addFields: {
        "folio.folioLineas.modeloCompleto.familiaDeProcesos.procesos":
          "$procesos"
      }
    },

    {
      $replaceRoot: { newRoot: "$folio" }
    }
  ]

  let $lookup_ClienteYVendedor = [
    {
      $lookup: {
        from: "clientes",
        localField: "cliente",
        foreignField: "_id",
        as: "cliente"
      }
    },
    { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "usuarios",
        localField: "vendedor",
        foreignField: "_id",
        as: "vendedor"
      }
    },
    {
      // Quitamos el password.
      $project: { "vendedor.password": 0 }
    },
    {
      // Unimos ahora si todo.
      $unwind: { path: "$vendedor", preserveNullAndEmptyArrays: true }
    }
  ]

  /**Agrupa los pedidos en sus respectivos folios.
   */
  let $group_Folios_1 = [
    {
      $group: {
        _id: "$_id",
        folio: { $first: "$$ROOT" },
        pedidos: { $push: "$folioLineas" }
      }
    },

    {
      $addFields: {
        "folio.folioLineas": "$pedidos"
      }
    },
    {
      // Volvemos a la estuctura original .
      $replaceRoot: { newRoot: "$folio" }
    }
  ]

  // ModeloCompleto
  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact = arregloRedact.concat($lookUp_ModeloCompleto)
  arregloRedact = arregloRedact.concat(
    $unwind_$lookup_modeloTamanoColorTerminado
  )
  arregloRedact = arregloRedact.concat($group_Folios_1)

  // Cliente y vendedor
  arregloRedact = arregloRedact.concat($lookup_ClienteYVendedor)
  // No se ocupa ningun $group

  // Familia de procesos.
  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact = arregloRedact.concat($lookup_FamiliaDeProcesos)
  arregloRedact = arregloRedact.concat($group_Folios_1)

  // FamiliaDeProcesos.procesos.proceso, departamento,
  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact = arregloRedact.concat(
    $unwind_$lookup_familiaDeProcesos_Procesos_Departamentos
  )
  arregloRedact = arregloRedact.concat($group_FamiliaDeProcesos_procesos)
  arregloRedact = arregloRedact.concat($group_Folios_1)

  // Ordenes Ubicacion Actual y Siguiente departameto
  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact = arregloRedact.concat($unwind_Ordenes)
  arregloRedact = arregloRedact.concat($lookUp_Orden_UbicacionActual)
  arregloRedact = arregloRedact.concat($lookUp_Orden_SiguienteDepartamento)
  arregloRedact = arregloRedact.concat($group_OrdenesPorPedido)
  arregloRedact = arregloRedact.concat($group_Folios_1)

  // // Ordenes | trayectoNormal | Departamento
  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact = arregloRedact.concat($unwind_Ordenes)
  arregloRedact = arregloRedact.concat($unwind_Orden_TrayectoNormal)
  arregloRedact = arregloRedact.concat(
    $lookUp_Orden_TrayectoNormal_Departamento
  )
  arregloRedact = arregloRedact.concat($group_Orden_TrayectoNormalAOrden)
  arregloRedact = arregloRedact.concat($group_OrdenesPorPedido)
  arregloRedact = arregloRedact.concat($group_Folios_1)

  // Ordenes | trayectoReccorrido | Departamento

  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact = arregloRedact.concat($unwind_Ordenes)
  arregloRedact = arregloRedact.concat($unwind_Orden_TrayectoRecorrido)
  arregloRedact = arregloRedact.concat(
    $lookUp_Orden_TrayectoRecorridoDepartamento
  )
  arregloRedact = arregloRedact.concat($group_Orden_TrayectoRecorridoAOrden)
  arregloRedact = arregloRedact.concat($group_OrdenesPorPedido)
  arregloRedact = arregloRedact.concat($group_Folios_1)

  arregloRedact = arregloRedact.concat($unwind_FolioLineas)
  arregloRedact.push(
    {
      $project: {
        folio: "$$ROOT",
        ordenes: {
          $filter: {
            input: "$folioLineas.ordenes",
            as: "orden",
            cond: { $ifNull: ["$$orden._id", false] }
          }
        }
      }
    },
    {
      $addFields: {
        "folio.folioLineas.ordenes": "$ordenes"
      }
    },
    {
      $replaceRoot: { newRoot: "$folio" }
    }
  )

  arregloRedact = arregloRedact.concat($group_Folios_1)

  // <!--
  // =====================================
  //  END NUEVA SECCION
  // =====================================
  // -->

  /**
   * Un arreglo que contiene la agrupacion y proyeccion para volver a
   * la estructura original del folio. Es necesario hacer un concat()
   * al array arregloRedact para agregar cada uno.
   */
  let agruparYProyectarFolio = [
    {
      // Una vez que cargamos los datos ahora hay que volver a agrupar. Primero hacemos un grupo
      // que contenga todos los datos del folio. Este es el id. En este grupo tambien se agregan
      // Las folio lineas.

      $group: {
        _id: {
          _id: "$_id",
          nivelDeUrgencia: "$nivelDeUrgencia",
          ordenesGeneradas: "$ordenesGeneradas",
          impreso: "$impreso",
          terminado: "$terminado",
          numeroDeFolio: "$numeroDeFolio",
          cliente: "$cliente",
          fechaFolio: "$fechaFolio",
          fechaEntrega: "$fechaEntrega",
          vendedor: "$vendedor",
          observaciones: "$observaciones",
          observacionesVendedor: "$observacionesVendedor",
          porcentajeAvance: "$porcentajeAvance",
          cantidadProducida: "$cantidadProducida",
          fechaTerminado: "$fechaTerminado",
          fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
          entregarAProduccion: "$entregarAProduccion"
        },

        folioLineas: { $push: "$folioLineas" }
      }
    },

    // Proyectamos todo para volver a tener la estructura original.

    {
      $project: {
        _id: "$_id._id",
        nivelDeUrgencia: "$_id.nivelDeUrgencia",
        ordenesGeneradas: "$_id.ordenesGeneradas",
        impreso: "$_id.impreso",
        terminado: "$_id.terminado",
        numeroDeFolio: "$_id.numeroDeFolio",
        cliente: "$_id.cliente",
        fechaFolio: "$_id.fechaFolio",
        fechaEntrega: "$_id.fechaEntrega",
        vendedor: "$_id.vendedor",
        observaciones: "$_id.observaciones",
        observacionesVendedor: "$_id.observacionesVendedor",
        folioLineas: "$folioLineas",
        porcentajeAvance: "$_id.porcentajeAvance",
        cantidadProducida: "$_id.cantidadProducida",
        fechaTerminado: "$_id.fechaTerminado",
        fechaDeEntregaAProduccion: "$_id.fechaDeEntregaAProduccion",
        entregarAProduccion: "$_id.entregarAProduccion"
      }
    }
  ]

  // Como ya tenemos los datos referenciados de modeloCompleto ahora buscamos
  // por cada uno en particular.

  // Estos dos son necesarios por que hay que convertir el id de un string

  // Si hay alguno de los siguientes dentro del objeto de busqueda aplicamos
  // el unwind para que no se haga por cada elemento que queremos buscar

  const arregloDeDisparadoresDeUnwind = [
    "folioLineas_modelo",
    "folioLineas_tamano",
    "folioLineas_color",
    "folioLineas_terminado"
  ]

  let generarUwind = false

  let llavesActuales = Object.keys(objetoDeBusqueda).join(" ")
  for (let i = 0; i < arregloDeDisparadoresDeUnwind.length; ++i) {
    const element = arregloDeDisparadoresDeUnwind[i]

    if (llavesActuales.includes(element)) {
      generarUwind = true
      break
    }
  }

  if (generarUwind) {
    // No podemos hacer un match dentro de un arreglo.
    // Separamos cada linea en sus respectivos objetos.
    arregloRedact.push({
      $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true }
    })

    // Modelo
    if (objetoDeBusqueda.hasOwnProperty("folioLineas_modelo")) {
      arregloRedact.push(
        // Buscamos la coincidencia con el modelo
        {
          $match: {
            "folioLineas.modeloCompleto.modelo._id": ObjectId(
              objetoDeBusqueda.folioLineas_modelo
            )
          }
        }
      )
    }

    // tamano
    if (objetoDeBusqueda.hasOwnProperty("folioLineas_tamano")) {
      arregloRedact.push(
        // Buscamos la coincidencia con el tamano
        {
          $match: {
            "folioLineas.modeloCompleto.tamano._id": ObjectId(
              objetoDeBusqueda.folioLineas_tamano
            )
          }
        }
      )
    }

    // color
    if (objetoDeBusqueda.hasOwnProperty("folioLineas_color")) {
      arregloRedact.push(
        // Buscamos la coincidencia con el color
        {
          $match: {
            "folioLineas.modeloCompleto.color._id": ObjectId(
              objetoDeBusqueda.folioLineas_color
            )
          }
        }
      )
    }

    // terminado
    if (objetoDeBusqueda.hasOwnProperty("folioLineas_terminado")) {
      arregloRedact.push(
        // Buscamos la coincidencia con el terminado
        {
          $match: {
            "folioLineas.modeloCompleto.terminado._id": ObjectId(
              objetoDeBusqueda.folioLineas_terminado
            )
          }
        }
      )
    }

    // Volvemos a juntar todo
    arregloRedact = arregloRedact.concat(agruparYProyectarFolio)
  }

  // <!--
  // =====================================
  //  Sort, Limit & skip
  // =====================================
  // -->
  if (objetoDeBusqueda.hasOwnProperty("sortCampos")) {
    /**
     * Los campos por los cuales se puede ordenar.
     */
    let camposSorteables = [
      "nivelDeUrgencia",
      "ordenesGeneradas",
      "impreso",
      "terminado",
      "numeroDeFolio",
      "cliente",
      "fechaFolio",
      "fechaEntrega",
      "vendedor",
      "observaciones",
      "folioLineas",
      "fechaDeEntregaAProduccion"
    ]
    // Separamos los valores
    let lv1 = objetoDeBusqueda.sortCampos.split("@")

    for (let i = 0; i < lv1.length; i++) {
      const ele = lv1[i].toString().trim()
      const regex = /.*>(-|)1/gm
      if (!regex.test(ele)) {
        return RESP._500(res, {
          msj: "El elemento para ordenar no coincide con el patron aceptado. ",
          err: `'${ele}' = Patron aceptado => ${regex.toString()}`
        })
      }
    }

    let lv2 = {}

    for (let i = 0; i < lv1.length; i++) {
      const element = lv1[i]
      let c = element.split(">")[0]
      let o = element.split(">")[1]

      lv2[c] = Number(o)
    }

    let llavesLv2 = Object.keys(lv2)

    let inexistentes = llavesLv2.filter((x) => {
      return !camposSorteables.join(" ").includes(x)
    })

    let t = inexistentes.length
    if (t > 0) {
      return RESP._500(res, {
        msj: `${t > 1 ? "Los campos" : "El campo"} '${inexistentes.join(
          ", "
        )}' no ${t > 1 ? "son validos" : "es valido."} `,
        err: "Es necesario que corrijas el filtro para poder continuar."
      })
    }

    arregloRedact.push({ $sort: lv2 })
  }

  /**
   * Agregamos los resultados hasta ahora para contarlos y poder paginar.
   * La idea aqui es agrupar todo bajo un _id null y crear un nueva propiedad
   * llamada total donde se suman todos los elementos. Despues creamos el paramentro folios
   * y asigamos el $$ROOT para mantener los datos.
   */
  arregloRedact.push({
    $group: { _id: null, total: { $sum: 1 }, folios: { $push: "$$ROOT" } }
  })

  /**
   * Una vez que tenemos el total es necesario restringir la cantidad de elemento que vamos a devolver.
   * Para eso utilizamos $project...
   *
   */
  arregloRedact.push({
    $project: {
      // Este define que si se muestre la propiedad total.
      total: 1,
      // Ahora le dicimos que si muetre la propiedad folios pero...
      folios: {
        // Primero la vamos a cortar.
        $slice: [
          // Le decimos el arreglo que va cortar.
          "$folios",
          // Desde donde va a empezar a cortar.
          Number(objetoDeBusqueda.desde),
          // Hasta donde va a dejar de cortar.
          Number(objetoDeBusqueda.limite)
          // Para estos elememntos previamente ya habiamos
          // definido que si no llega desde o limite damos
          // valores por defecto para usar el paginador.
        ]
      }
    }
  })

  // <!--
  // =====================================
  //  END Sort, Limit & skip
  // =====================================
  // -->

  let error = (err) => {
    return RESP._500(res, {
      msj: "Hubo un error filtrando los folios",
      err: err
    })
  }

  if (arregloRedact.length === 0) {
    Promise.all([
      Folio.find()
        .limit(objetoDeBusqueda.limite)
        .skip(objetoDeBusqueda.desde)
        .exec(),
      Folio.find()
        .limit(objetoDeBusqueda.limite)
        .skip(objetoDeBusqueda.desde)
        .countDocuments()
    ])
      .then((resp) => {
        return RESP._200(res, null, [
          { tipo: "folios", datos: resp[0] },
          { tipo: "total", datos: resp[1] }
        ])
      })
      .catch(error)
  } else {
    Folio.aggregate(arregloRedact)
      .then((folios) => {
        return RESP._200(res, null, [
          { tipo: "total", datos: folios[0] ? folios[0].total : 0 },
          { tipo: "folios", datos: folios[0] ? folios[0].folios : [] }
        ])
      })
      .catch(error)
  }
})

module.exports = app
