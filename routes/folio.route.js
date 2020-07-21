// Este es dl nuevo route para el folio.

//Esto es necesario
var express = require("express")
var app = express()
var Folio = require("../models/folios/folio")
var RESP = require("../utils/respStatus")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

const Proceso = require("../models/procesos/proceso")
const Departamento = require("../models/departamento")
const SKU = require("../models/modeloCompleto")
const Maquina = require("../models/maquina")
const Parametros = require("../models/defautls/parametros.model")

var permisos = require("../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.delete("/:id", permisos.$("folio:eliminar"), (req, res) => {
  const id = req.params.id

  if (!id) {
    return RESP._400(res, {
      msj: "No definiste un id para eliminar.",
      err: "Es necesario que definas un id.",
    })
  }

  Folio.findById(id)
    .exec()
    .then(folio => {
      if (!folio) throw "No existe el folio"

      return folio.remove()
    })
    .then(folio => {
      return RESP._200(res, "Se elimino el folio", [
        { tipo: "folio", datos: folio },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el folio"))
})

app.post("/", permisos.$("folio:crear"), (req, res) => {
  new Folio(req.body)
    .save()
    .then(folio => {
      return RESP._200(res, "Se guardo el folio", [
        { tipo: "folio", datos: folio },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el folio"))
})

app.get("/buscar/id/:id", permisos.$("folio:leer:id"), (req, res) => {
  Folio.findById(req.params.id)
    .exec()
    .then(folio => {
      if (!folio) throw "No existe el folio"

      return RESP._200(res, null, [{ tipo: "folio", datos: folio }])
    })
    .catch(err => erro(res, err, "Hubo un error obteniendo el folio por su id"))
})

app.put("/", permisos.$("folio:modificar"), (req, res) => {
  Folio.findById(req.body._id)
    .exec()
    .then(folio => {
      if (!folio) throw "No existe el folio"
      ;[
        "cliente",
        "vendedor",
        "observaciones",
        "observacionesVendedor",
        "folioLineas",
        "nivelDeUrgencia",
        "porcentajeAvance",
        "terminado",
        "cantidadProducida",
      ].forEach(x => (folio[x] = req.body[x]))
      return folio.save()
    })
    .then(folio => {
      return RESP._200(res, "Se modifico el folio", [
        { tipo: "folio", datos: folio },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error modificando el folio"))
})

app.put("/marcarPEdidosComoImpresos", (req, res, next) => {
  let promesas = req.body.map(objeto => {
    {
      return Folio.updateMany(
        { _id: ObjectId(objeto.folio) },
        {
          $set: {
            "folioLineas.$[i].impreso": true,
          },
        },
        {
          multi: true,
          arrayFilters: [
            { "i._id": { $in: objeto.pedidos.map(x => ObjectId(x)) } },
          ],
        }
      ).exec()
    }
  })
  Promise.all(promesas)
    .then(_ => RESP._200(res, null, []))
    .catch(_ => next(_))
})

/**
 * Senala el folio con ordenes impresas.
 */
app.post(
  "/ordenesImpresas",
  permisos.$("folio:modificar:senalarOrdenesImpresas"),
  (req, res) => {
    Folio.findById(req.body._id)
      .then(folioEncontrado => {
        if (!folioEncontrado) {
          return RESP._400(res, {
            msj: "No existe el folio.",
            err: "El id del folio que ingresaste no existe.",
          })
        }
        folioEncontrado.impreso = true
        return folioEncontrado.save()
      })
      .then(folioGrabado => {
        return RESP._200(res, null, [{ tipo: "folio", datos: folioGrabado }])
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error buscando el folio para senalarlo como impreso",
          err: err,
        })
      })
  }
)

app.get(
  "/detalle/orden/:folio/:pedido/:orden",
  permisos.$("folio:detalle:orden"),
  (req, res) => {
    Folio.findById(req.params.folio)
      .exec()

      .then(folio => {
        if (!folio) throw "No existe el folio"

        const orden = folio.folioLineas
          .id(req.params.pedido)
          .ordenes.id(req.params.orden)

        if (!orden) throw "No existe la orden"

        return RESP._200(res, null, [{ tipo: "orden", datos: orden }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el detalle de la orden")
      )
  }
)
app.get(
  "/detalle/pedido/:folio/:pedido",
  permisos.$("folio:detalle:pedido"),
  (req, res) => {
    Folio.findById(req.params.folio)
      .exec()

      .then(folio => {
        if (!folio) throw "No existe el folio"

        const pedido = folio.folioLineas.id(req.params.pedido)

        if (!pedido) throw "No existe el pedido"

        return RESP._200(res, null, [{ tipo: "pedido", datos: pedido }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el detalle del pedido")
      )
  }
)
app.get(
  "/detalle/folio/:folio",
  permisos.$("folio:detalle:folio"),
  (req, res) => {
    Folio.findById(req.params.folio)
      .exec()

      .then(folio => {
        if (!folio) throw "No existe el folio"

        return RESP._200(res, null, [{ tipo: "folio", datos: folio }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el detalle del folio ")
      )
  }
)

app.get(
  "/reporte/paraRevision",
  permisos.$("folio:reporte:paraRevision"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 300)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "fechaDeEntregaAProduccion")

    const total = await Folio.aggregate([
      {
        $match: {
          ordenesGeneradas: false,
          terminado: false,
        },
      },

      { $count: "total" },
    ]).exec()

    Folio.aggregate([
      {
        $match: {
          ordenesGeneradas: false,
          terminado: false,
          entregarAProduccion: true,
        },
      },

      { $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: "$_id",
          folio: { $first: "$$ROOT" },
          totalDePiezas: { $sum: "$folioLineas.cantidad" },
        },
      },
      { $addFields: { "folio.totalDePiezas": "$totalDePiezas" } },
      { $replaceRoot: { newRoot: "$folio" } },
      {
        $project: {
          folio: "$numeroDeFolio",
          idFolio: "$_id",
          cliente: "$cliente",
          idCliente: "$cliente",
          vendedor: "$vendedor",
          idVendedor: "$vendedor",
          fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
          totalDePiezas: "$totalDePiezas",
        },
      },
      {
        $lookup: {
          from: "clientes",
          foreignField: "_id",
          localField: "cliente",
          as: "cliente",
        },
      },
      { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },
      {
        $addFields: { cliente: "$cliente.nombre" },
      },
      {
        $lookup: {
          from: "usuarios",
          foreignField: "_id",
          localField: "vendedor",
          as: "vendedor",
        },
      },
      { $unwind: { path: "$vendedor", preserveNullAndEmptyArrays: true } },
      {
        $addFields: { vendedor: "$vendedor.nombre" },
      },

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .then(folios => {
        return RESP._200(res, null, [
          { tipo: "folios", datos: folios },
          { tipo: "total", datos: total },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error obteniendo el reporte de folios para revision"
        )
      )
  }
)

app.get("/filtrar", permisos.$("folio:filtrar"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "folio")

  delete req.query.desde
  delete req.query.limite
  delete req.query.sort
  delete req.query.campo

  // Hay tres elementos que deben ser objecto id. Hacemos un
  // hard code para convertirlos

  if (req.query["cliente"]) req.query.cliente = ObjectId(req.query.cliente)
  if (req.query["vendedor"]) req.query.vendedor = ObjectId(req.query.vendedor)

  if (req.query["folioLineas.modeloCompleto"]) {
    req.query["folioLineas.modeloCompleto"] = ObjectId(
      req.query["folioLineas.modeloCompleto"]
    )
  }
  if (req.query.hasOwnProperty("folioLineas.laserado")) {
    var ob = {}

    const esLaserado = req.query["folioLineas.laserado"]

    if (esLaserado) {
      ob["$and"] = [
        {
          "folioLineas.laserCliente.laser": { $not: { $eq: null } },
        },
        {
          "folioLineas.laserCliente.laser": {
            $exists: true,
          },
        },
      ]
    } else {
      ob["$and"] = [
        {
          "folioLineas.laserCliente.laser": { $eq: null },
        },
        {
          "folioLineas.laserCliente.laser": {
            $exists: false,
          },
        },
      ]
    }

    req.query = { ...req.query, ...ob }

    delete req.query["folioLineas.laserado"]
  }

  //Separam que aplican a los filtros por que
  // asi podemos retornar todo mas limpio como pedidos.

  var $folio = null
  var $pedido = null

  Object.keys(req.query).forEach(x => {
    if (x.includes("folioLineas.") || x.includes("$and")) {
      if (!$pedido) $pedido = { $match: {} }
      $pedido.$match[x] = req.query[x]
    } else {
      if (!$folio) $folio = { $match: {} }
      $folio.$match[x] = req.query[x]
    }
  })

  var agg = []

  if ($folio) agg.push($folio)
  agg.push({
    $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true },
  })
  if ($pedido) agg.push($pedido)

  agg = agg.concat([
    { $unset: "folioLineas.ordenes" },
    {
      $project: {
        idFolio: "$_id",
        idPedido: "$folioLineas._id",
        folio: "$numeroDeFolio",
        idCliente: "$cliente",
        idVendedor: "$vendedor",
        idSKU: "$folioLineas.modeloCompleto",
        fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
        fechaTerminadoFolio: "$fechaTerminado",
        fechaTerminadoPedido: "$folioLineas.fechaTerminado",
        cantidadProducidaFolio: "$cantidadProducida",
        porcentajeAvanceFolio: "$porcentajeAvance",
        //Datos sobre el pedido
        pedido: "$folioLineas.pedido",
        laserCliente: "$folioLineas.laserCliente.laser",

        porcentajeAvancePedido: "$folioLineas.porcentajeAvance",
        cantidadProducidaPedido: "$folioLineas.cantidadProducida",

        cantidadSolicitadaPedido: "$folioLineas.cantidad",
        impreso: "$folioLineas.impreso",
      },
    },
    { $unset: "_id" },
    // <!--
    // =====================================
    //  Cliente
    // =====================================
    // -->
    {
      $lookup: {
        from: "clientes",
        foreignField: "_id",
        localField: "idCliente",
        as: "cliente",
      },
    },
    { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },

    { $addFields: { cliente: "$cliente.nombre" } },
    // <!--
    // =====================================
    //  END Cliente
    // =====================================
    // -->

    // <!--
    // =====================================
    //  Vendedor
    // =====================================
    // -->

    {
      $lookup: {
        from: "usuarios",
        foreignField: "_id",
        localField: "idVendedor",
        as: "vendedor",
      },
    },
    { $unwind: { path: "$vendedor", preserveNullAndEmptyArrays: true } },

    { $addFields: { vendedor: "$vendedor.nombre" } },

    // <!--
    // =====================================
    //  END Vendedor
    // =====================================
    // -->
    // <!--
    // =====================================
    //  sku
    // =====================================
    // -->

    {
      $lookup: {
        from: "modelosCompletos",
        foreignField: "_id",
        localField: "idSKU",
        as: "sku",
      },
    },
    { $unwind: { path: "$sku", preserveNullAndEmptyArrays: true } },

    { $addFields: { laserSKU: "$sku.laserAlmacen.laser" } },
    { $addFields: { sku: "$sku.nombreCompleto" } },

    // <!--
    // =====================================
    //  END Vendedor
    // =====================================
    // -->
  ])

  //Obtenemos el total de elementos filtrados para la paginacion
  const aggTotal = agg.concat([{ $count: "total" }])
  const total = await Folio.aggregate(aggTotal).exec()

  agg = agg.concat([
    //Primera ordeneda para que todo entre bien al limte antes de cortar.
    // De otra manera cortamos y luego ordenamos dando mal los datos.
    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } },
  ])

  Folio.aggregate(agg)
    .exec()
    .then(foliosConsulta => {
      return RESP._200(res, null, [
        { tipo: "pedidos", datos: foliosConsulta },
        { tipo: "total", datos: total[0] ? total[0].total : 0 },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error obteniendo "))
})

app.get(
  "/porEntregarAProduccion/:vendedor",
  permisos.$("folio:porEntregarAProduccion:vendedor"),
  (req, res) => {
    Folio.aggregate([
      {
        $match: {
          vendedor: ObjectId(req.params.vendedor),
          ordenesGeneradas: false,
          entregarAProduccion: false,
          terminado: false,
        },
      },
      {
        $project: {
          folio: "$numeroDeFolio",
          cliente: "$cliente",
          fechaDeCreacion: "$createdAt",
        },
      },
      {
        $lookup: {
          from: "clientes",
          foreignField: "_id",
          localField: "cliente",
          as: "cliente",
        },
      },

      { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          cliente: "$cliente.nombre",
          idCliente: "$cliente._id",
        },
      },
    ])
      .exec()
      .then(folios => {
        return RESP._200(res, null, [{ tipo: "folios", datos: folios }])
      })
  }
)

app.put(
  "/retornarAlVendedor",
  permisos.$("folio:retornarAlVendedor"),
  (req, res) => {
    const id = req.body.id

    Folio.findById(id)
      .exec()
      .then(folio => {
        if (!folio) throw "No existe el folio"
        if (folio.ordenesGeneradas)
          throw "Imposible retornar. Las ordenes ya estan generadas"
        ;(folio.entregarAProduccion = false),
          (folio.fechaDeEntregaAProduccion = null),
          folio.folioLineas.forEach(pedido => {
            pedido.ordenesGeneradas = false
            pedido.trayectoGenerado = false
            pedido.porcentajeDeAvance = false
            pedido.ordenes = []
          })
        return folio.save()
      })
      .then(respuesta => {
        return RESP._200(res, "Se retorno el folio al vendedor", [])
      })
      .catch(err =>
        erro(res, err, "Hubo un error retornando el folio al vendedor")
      )
  }
)

/**
 * Senala el folio listo para produccion o no dependiendo de
 * que valor tenga la bandera. que se le pase como parametro.
 *
 */
app.put(
  "/entregarARevision",
  permisos.$("folio:entregarARevision"),
  (req, res) => {
    Folio.updateOne(
      { _id: ObjectId(req.body._id) },
      { entregarAProduccion: true, fechaDeEntregaAProduccion: new Date() }
    )
      .exec()
      .then(respuesta => {
        if (respuesta.nModified != 1)
          throw "No se pudo enviar el folio a produccion"

        return RESP._200(res, "Folio enviado a produccion", [])
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error buscando el folio.",
          err: err,
        })
      })
  }
)

app.put(
  "/liberarParaProduccion",
  permisos.$("folio:liberarParaProduccion"),
  (req, res) => {
    const procesosFijos = {
      procesosIniciales: [],
      procesosInicialesAlmacen: [],
      procesosFinales: [],
    }

    Parametros.findOne({})
      .populate("localizacionDeOrdenes.procesosIniciales", null, "Proceso")
      .populate(
        "localizacionDeOrdenes.procesosInicialesAlmacen",
        null,
        "Proceso"
      )
      .populate("localizacionDeOrdenes.procesosFinales", null, "Proceso")
      .exec()
      .then(parametros => {
        //Asignamos los procesos
        procesosFijos.procesosIniciales =
          parametros.localizacionDeOrdenes.procesosIniciales
        procesosFijos.procesosInicialesAlmacen =
          parametros.localizacionDeOrdenes.procesosInicialesAlmacen
        procesosFijos.procesosFinales =
          parametros.localizacionDeOrdenes.procesosFinales

        return Folio.findById(req.body._id).exec()
      })

      .then(folio => {
        if (!folio) throw "No existe el folio"

        var contadorPedido = 0
        //Vamos a hacer todas las modificaciones aqui.
        folio.folioLineas.forEach(pedidoBD => {
          //Obtenemos el pedido que corresponda
          // al gui contra el pedido en la BD
          const pedidoGUI = req.body.folioLineas.find(
            p => p._id.toString() === pedidoBD._id.toString()
          )
          pedidoBD.pedido = folio.numeroDeFolio + "-" + contadorPedido
          contadorPedido++

          //Aqui hacemos todas las operaciones.
          generarOrdenesDePedido(pedidoBD, pedidoGUI, procesosFijos)
        })

        const folioGUI = req.body

        folio.ordenesGeneradas = true
        folio.observaciones = folioGUI.observaciones

        for (let i = 0; i < folioGUI.length; i++) {
          folio.folioLineas[i].observaciones =
            folioGUI.folioLineas[i].observaciones
          for (let a = 0; a < folio.folioLineas[i].ordenes.length; a++) {
            folio.folioLineas[i].ordenes[a].observaciones =
              folioGUI[i].folioLineas[i].ordenes[a].observaciones
          }
        }

        return folio.save()
      })
      .then(folio => {
        return RESP._200(res, "El folio esta en produccion", [
          { tipo: "folio", datos: folio },
        ])
      })

      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error buscando el folio.",
          err: err,
        })
      })
  }
)

function generarOrdenesDePedido(pedidoBD, pedidoGUI, procesosFijos) {
  // Asignamos generales
  pedidoBD.observaciones = pedidoGUI.observaciones
  pedidoBD.ordenesGeneradas = true

  const procesosExtraordinarios = pedidoGUI.procesosExtraordinarios || []

  const procesosAUsar =
    pedidoBD.almacen || procesosExtraordinarios.length > 0
      ? pedidoGUI.procesosExtraordinarios
      : pedidoGUI.modeloCompleto.familiaDeProcesos.procesos.map(x => x.proceso)

  if (pedidoGUI.almacen) {
    procesosAUsar.unshift(...procesosFijos.procesosInicialesAlmacen)
  } else {
    procesosAUsar.unshift(...procesosFijos.procesosIniciales)
  }

  procesosAUsar.push(...procesosFijos.procesosFinales)
  //Copiamos las ordenes
  var contador = 0
  pedidoGUI.ordenes.forEach(ordenGUI => {
    //Inicializamos la ruta para que no nos marque undefined
    ordenGUI.ruta = []

    ordenGUI.modeloCompleto = pedidoBD.modeloCompleto
    ordenGUI.pedido = pedidoBD.pedido
    ordenGUI.orden = pedidoBD.pedido + "-" + contador
    ordenGUI.numeroDeOrden = contador

    var actual = true
    var consecutivo = 0
    procesosAUsar.forEach(p => {
      const estructuraBasica = {
        idProceso: p._id.toString(),
        idDepartamento: p.departamento._id.toString(),
        entrada: null,
        salida: null,
        recibida: false,
        recepcion: null,
        ubicacionActual: actual,
        consecutivo: consecutivo,
        datos: {},
      }

      ordenGUI.ruta.push(estructuraBasica)
      actual = false
      consecutivo++
    })

    contador++

    pedidoBD.ordenes.push(ordenGUI)
  })
}

app.put("/aplicarActualizacionDeOrdenes", (req, res, next) => {
  Folio.find({})
    .exec()
    .then(folios => {
      folios.map(folio => generarCambios(folio))

      return Promise.all(folios)
    })
    .then(folios => {
      return res.send("Se actualizaron " + folios.length + " folios")
    })
    .catch(err => next(err))
})

function generarCambios(folio) {
  folio.folioLineas.forEach(pedido => {
    if (!pedido.modeloCompleto) return

    const procesosAUsar = pedido.modeloCompleto.familiaDeProcesos.procesos.map(
      x => x.proceso
    )
    pedido.ordenes.forEach(orden => {
      //Inicializamos la ruta para que no nos marque undefined
      orden["ruta"] = []

      var consecutivo = 0
      procesosAUsar.forEach(p => {
        const estructuraBasica = {
          idProceso: p._id.toString(),
          idDepartamento: p.departamento._id.toString(),
          entrada: null,
          salida: null,
          recibida: false,
          recepcion: null,
          ubicacionActual: orden.ubicacionActual
            ? orden.ubicacionActual.orden == consecutivo
            : false,
          consecutivo: consecutivo,
          datos: {},
        }

        obtenerDatosDeTrayectoRecorrido(orden, consecutivo, estructuraBasica)

        if (orden.ubicacionActual)
          obtenerDatosDeUbicacionActual(orden, consecutivo, estructuraBasica)

        orden["ruta"].push(estructuraBasica)

        consecutivo++
      })
    })
  })

  return folio.save()
}

function obtenerDatosDeTrayectoRecorrido(orden, consecutivo, estructuraBasica) {
  //si hay menos de trayecto recorrido quiere decir que no hay ningun dato
  // a tomar en cuenta, por lo tanto no es necesario que hagamos ninguna
  // modificacion
  if (orden.trayectoRecorrido.length - 1 < consecutivo) {
    return estructuraBasica
  }
  const trayecto = orden.trayectoRecorrido[consecutivo]

  // Si hay trayectos recorridos copiamos todos los datos
  estructuraBasica.entrada = trayecto.entrada
  estructuraBasica.salida = trayecto.salida
  estructuraBasica.recibida = trayecto.recivida
  estructuraBasica.recepcion = trayecto.recepcion
  // estructuraBasica.ubicacionActual = trayecto.
  // estructuraBasica.consecutivo = trayecto.
  estructuraBasica.datos = copiarDatos(trayecto)
}

function copiarDatos(trayecto) {
  var keys = [
    "controlDeProduccion",
    "materiales",
    "pastilla",
    "transformacion",
    "pulido",
    "seleccion",
    "empaque",
    "productoTerminado",
    "metalizado",
    "barnizado",
    "burato",
    "laser",
    "almacenDeBoton",
    "tenido",
  ]

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (trayecto[key]) return trayecto[key]
  }

  return null
}

function obtenerDatosDeUbicacionActual(orden, consecutivo, estructuraBasica) {
  const ubicacionActual = orden.ubicacionActual

  if (ubicacionActual.orden != consecutivo) return

  estructuraBasica.recibida = ubicacionActual.recivida
  estructuraBasica.recepcion = ubicacionActual.recepcion
  estructuraBasica.entrada = ubicacionActual.entrada
}

app.get("/ordenes/:idDepartamento", async (req, res, next) => {
  Departamento.findById(req.params.idDepartamento)
    .exec()
    .then(dep => {
      if (!dep) throw "No existe el departamento"

      return Folio.aggregate([
        {
          $match: {
            ordenesGeneradas: true,
            terminado: false,
          },
        },
        {
          $unwind: {
            path: "$folioLineas",
            includeArrayIndex: "string",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "folioLineas.terminado": false,
          },
        },

        {
          $addFields: {
            "folioLineas.totalOrdenes": { $size: "$folioLineas.ordenes" },
          },
        },
        {
          $unwind: {
            path: "$folioLineas.ordenes",
            includeArrayIndex: "string",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "folioLineas.ordenes.terminada": false,
          },
        },

        {
          $unset: [
            "folioLineas.ordenes.trayectoNormal",
            "folioLineas.ordenes.trayectoRecorrido",
          ],
        },

        {
          $addFields: {
            "folioLineas.ordenes.rutaTemp": "$folioLineas.ordenes.ruta",
          },
        },
        {
          $unwind: {
            path: "$folioLineas.ordenes.ruta",
            includeArrayIndex: "string",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "folioLineas.ordenes.ruta.idDepartamento":
              req.params.idDepartamento,
            "folioLineas.ordenes.ruta.ubicacionActual": true,
          },
        },

        {
          $project: {
            _id: {
              recibida: "$folioLineas.ordenes.ruta.recibida", //
              consecutivoRuta: "$folioLineas.ordenes.ruta.consecutivo", //
              totalDeOrdenes: "$folioLineas.totalOrdenes", //
              consecutivoOrden: "$folioLineas.ordenes.numeroDeOrden", //
              procesoActual: {
                //
                $toObjectId: "$folioLineas.ordenes.ruta.idProceso",
              },
              idProcesoActual: "$folioLineas.ordenes.ruta.idProceso", //
              numeroDeOrden: "$folioLineas.ordenes.orden", //
              fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion", //
              sku: { $toObjectId: "$folioLineas.ordenes.modeloCompleto" }, //
              idSKU: "$folioLineas.ordenes.modeloCompleto", //
              laser: "$folioLineas.laserCliente.laser", //
              laserAlmacen: null, //
              unidad: "$folioLineas.ordenes.unidad", //
              piezas: "$folioLineas.ordenes.piezasTeoricas", //
              observacionesOrden: "$folioLineas.ordenes.observaciones", //`
              observacionesPedido: "$folioLineas.observaciones", //`
              observacionesFolio: "$observaciones", //`
              folio: "$_id",
              pedido: "$folioLineas._id",
              orden: "$folioLineas.ordenes._id",

              ubicacionActual: "$folioLineas.ordenes.ruta",
              ruta: "$folioLineas.ordenes.rutaTemp",
            },
          },
        },

        {
          $replaceRoot: { newRoot: "$_id" },
        },

        {
          $lookup: {
            from: "procesos",
            localField: "procesoActual",
            foreignField: "_id",
            as: "procesoActual",
          },
        },
        {
          $unwind: {
            path: "$procesoActual",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $addFields: {
            procesoActual: "$procesoActual.nombre",
          },
        },

        {
          $lookup: {
            from: "modelosCompletos",
            localField: "sku",
            foreignField: "_id",
            as: "sku",
          },
        },
        {
          $unwind: {
            path: "$sku",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            sku: "$sku.nombreCompleto",
            laserAlmacen: "$sku.laserAlmacen.laser",
          },
        },
      ]).exec()
    })

    .then(folios => {
      return RESP._200(res, null, [{ tipo: "ordenes", datos: folios }])
    })
    .catch(_ => next(_))
})

app.put("/recibirOrden", (req, res, next) => {
  var orden = null
  Folio.findOne({ _id: req.body.idFolio })
    .exec()
    .then(async folio => {
      if (!folio) throw "No existe la orden."

      orden = folio.folioLineas
        .id(req.body.idPedido)
        .ordenes.id(req.body.idOrden)

      var ubicacion = orden.ruta.find(x => x.ubicacionActual)

      //No debe estar terminada

      if (orden.terminada) throw "Esta orden ya fue terminada"

      //Debe ser el mismo departamento
      if (req.body.idDepartamento !== ubicacion.idDepartamento) {
        var deptoActual = await Departamento.findById(
          ubicacion.idDepartamento
        ).exec()

        throw `Esta orden no esta ubicada en este departamento. Actualmente se encuentra en el departamento de ${deptoActual.nombre}`
      }

      //No debe estar recibida
      if (ubicacion.recibida) throw "Esta orden ya fue recibida"

      ubicacion.recibida = true
      ubicacion.recepcion = new Date()

      return folio.save()
    })
    .then(folio => {
      return RESP._200(res, `Orden ${orden.orden} recibida`, [
        {
          tipo: "orden",
          datos: folio.folioLineas
            .id(req.body.idPedido)
            .ordenes.id(req.body.idOrden),
        },
      ])
    })
    .catch(_ => next(_))
})

app.put("/ponerATrabajar", (req, res, next) => {
  var orden = null
  var msj = null
  var folio = null

  Folio.findOne({ _id: req.body.idFolio })
    .exec()
    .then(async f => {
      folio = f
      if (!folio) throw "No existe la orden."
      orden = folio.folioLineas
        .id(req.body.idPedido)
        .ordenes.id(req.body.idOrden)

      var ubicacion = orden.ruta.find(x => x.ubicacionActual)
      //No debe estar terminada

      if (orden.terminada) throw "Esta orden ya fue terminada"
      //Debe ser el mismo departamento
      if (req.body.idDepartamento !== ubicacion.idDepartamento) {
        var deptoActual = await Departamento.findById(
          ubicacion.idDepartamento
        ).exec()

        throw `Esta orden no esta ubicada en este departamento. Actualmente se encuentra en el departamento de ${deptoActual.nombre}`
      }
      //Debe estar recibida

      if (!ubicacion.recibida) throw "No has recibido la orden"
      //Extraemos de los parametros los permisos si
      // esta estacion pone a trabajar o no.
      const estacion = req.parametros.estacionesDeEscaneo.find(
        x => x.departamento === req.body.idDepartamento
      )
      //Si no esta trabajando la ponemos a trabajar.

      if (estacion.ponerATrabajar && !ubicacion.trabajando) {
        ubicacion.trabajando = true
        ubicacion.trabajandoDesde = new Date()

        msj = `La orden ${orden.orden} empezo a trabajar. `
      } else {
        //Si ya esta trabajando mandamos un error
        throw "Esta orden ya esta trabajando."
      }

      return folio.save()
    })
    .then(folio => {
      return RESP._200(res, msj, [
        {
          tipo: "orden",
          datos: folio.folioLineas
            .id(req.body.idPedido)
            .ordenes.id(req.body.idOrden),
        },
      ])
    })
    .catch(_ => next(_))
})

app.put("/ponerATrabajarEnMaquina", (req, res, next) => {
  var orden = null
  var msj = null
  var folio = null

  if (!req.body.datos) req.body.datos = {}
  req.body.datos["user"] = req.user._id

  Folio.findOne({ _id: req.body.idFolio })
    .exec()
    .then(async f => {
      folio = f
      if (!folio) throw "No existe la orden."
      orden = folio.folioLineas
        .id(req.body.idPedido)
        .ordenes.id(req.body.idOrden)

      var ubicacion = orden.ruta.find(x => x.ubicacionActual)
      //No debe estar terminada

      if (orden.terminada) throw "Esta orden ya fue terminada"
      //Debe ser el mismo departamento
      if (req.body.idDepartamento !== ubicacion.idDepartamento) {
        var deptoActual = await Departamento.findById(
          ubicacion.idDepartamento
        ).exec()

        throw `Esta orden no esta ubicada en este departamento. Actualmente se encuentra en el departamento de ${deptoActual.nombre}`
      }
      //Debe estar recibida

      if (!ubicacion.recibida) throw "No has recibido la orden"
      //Extraemos de los parametros los permisos si
      // esta estacion pone a trabajar o no.
      const estacion = req.parametros.estacionesDeEscaneo.find(
        x => x.departamento === req.body.idDepartamento
      )
      //Si no esta trabajando la ponemos a trabajar.

      var maquinaSeleccionada = await Maquina.findById(
        req.body.idMaquina
      ).exec()
      if (!maquinaSeleccionada) throw "No existe la maquina"

      //La maquina ya esta trabajando
      if (maquinaSeleccionada.trabajando)
        throw "La maquina seleccinada esta trabajando actualmente. Necesitas finalizar su trabajo para empezar a trabajar con esta orden. "

      //La maquina no tiene la orden asignada en su pila de trabajo.
      var ordenExistePila = maquinaSeleccionada.pila.filter(
        ordenPila => ordenPila.orden === req.body.idOrden
      )
      //Ordenamos los pasos que hay en la pila de la misma orden y obtenemos siempre el menor para descontar.

      var ordenExiste = ordenExistePila
        .sort((a, b) => (a.paso > b.paso ? -1 : 1))
        .pop()
      if (!ordenExiste)
        throw "Esta orden no esta asignada a la pila de trabajo de esta maquina "

      if (estacion.ponerATrabajarConMaquina && !ubicacion.trabajando) {
        ubicacion.trabajando = true
        ubicacion.trabajandoDesde = new Date()
        ubicacion.idMaquina = maquinaSeleccionada._id.toString()

        maquinaSeleccionada.trabajando = true
        maquinaSeleccionada.trabajo.inicio = new Date()
        maquinaSeleccionada.trabajo.datos = ordenExiste

        //Eliminamos de la pila la orden que acabamos de poner a trabajar
        // La operacion pull es de mongoose
        maquinaSeleccionada.pila.pull({ _id: ordenExiste._id })

        msj = `La orden ${orden.orden} empezo a trabajar en la maquina ${maquinaSeleccionada.clave} `
      } else {
        //Si ya esta trabajando mandamos un error
        throw "Esta orden ya esta trabajando."
      }

      await maquinaSeleccionada.save()

      return folio.save()
    })
    .then(folio => {
      return RESP._200(res, msj, [
        {
          tipo: "orden",
          datos: folio.folioLineas
            .id(req.body.idPedido)
            .ordenes.id(req.body.idOrden),
        },
      ])
    })
    .catch(_ => next(_))
})

app.put("/registrar", (req, res, next) => {
  var orden = null
  var msj = null
  var folio = null

  if (!req.body.datos) req.body.datos = {}
  req.body.datos["user"] = req.user._id

  Folio.findOne({ _id: req.body.idFolio })
    .exec()
    .then(async f => {
      folio = f
      if (!folio) throw "No existe la orden."
      orden = folio.folioLineas
        .id(req.body.idPedido)
        .ordenes.id(req.body.idOrden)

      var ubicacion = orden.ruta.find(x => x.ubicacionActual)
      //No debe estar terminada

      if (orden.terminada) throw "Esta orden ya fue terminada"
      //Debe ser el mismo departamento
      if (req.body.idDepartamento !== ubicacion.idDepartamento) {
        var deptoActual = await Departamento.findById(
          ubicacion.idDepartamento
        ).exec()

        throw `Esta orden no esta ubicada en este departamento. Actualmente se encuentra en el departamento de ${deptoActual.nombre}`
      }
      //Debe estar recibida

      if (!ubicacion.recibida) throw "No has recibido la orden"
      //Extraemos de los parametros los permisos si
      // esta estacion pone a trabajar o no.
      const estacion = req.parametros.estacionesDeEscaneo.find(
        x => x.departamento === req.body.idDepartamento
      )

      if (estacion.ponerATrabajar && !ubicacion.trabajando)
        throw "La orden no se ha puesto a trabajar"

      if (estacion.ponerATrabajarConMaquina && !ubicacion.trabajando)
        throw "La orden no se ha puesto a trabajar en ninguna maquina"

      ubicacion.salida = new Date()
      ubicacion.ubicacionActual = false
      ubicacion.trabajando = false
      ubicacion.datos = req.body.datos
      ubicacion.markModified("datos")
      //Obtenemos el siguiente departamento en base
      //  al consecutivo que tenemos + 1

      var maquina = null

      if (estacion.ponerATrabajarConMaquina) {
        maquina = await Maquina.findById(ubicacion.idMaquina)
          .select("trabajado")
          .exec()

        if (!maquina) throw "La maquina no existe"

        maquina.trabajado.push({
          datos: orden,
        })
        maquina.trabajando = false
        maquina.trabajo = null
        orden.asignada = false
      }

      var siguiente = orden.ruta[ubicacion.consecutivo + 1]
      if (siguiente) {
        siguiente.ubicacionActual = true
        siguiente.entrada = new Date()

        //Si es la penultima ubicacion agregamos la cantidad
        //desde datos a siguiente definido en los parametros
        // de localizacion de ordenes, en campoFinal.

        const esPenultimo = orden.ruta.length - 2 === ubicacion.consecutivo
        const campoFinal = req.parametros.localizacionDeOrdenes.campoFinal
        if (!campoFinal)
          throw "No se ha definido el campo final en los parametros de localizacion de ordenes. Para poder continuar el adminitrador del sistema debe definir estos datos. No se puede continuar"
        if (esPenultimo) {
          if (!siguiente.hasOwnProperty("datos"))
            siguiente.datos = { [campoFinal]: 0 }

          if (!req.body.hasOwnProperty("datos"))
            throw `Es necesario enviar la propiedad datos con la sub propiedad '${campoFinal}' para anexarla al ultimo departamento. Este error debe ser reportado al administrador del sistema.`

          if (!req.body.datos.hasOwnProperty(campoFinal))
            throw `Es necesario definir en el formulario de esta estacion el campo '${campoFinal}' para definir el valor total de la orden al finalizar en el siguiente departamento. Este error debe ser reportado al administrador. `

          siguiente.datos[campoFinal] = req.body.datos[campoFinal]
          siguiente.markModified("datos")
        }

        msj = `La orden ${orden.orden} se registro correctamente.`
      } else {
        //Termino el proceso modificando el folio
        accionesDeOrdenFinalizada(folio, orden, ubicacion, req)
        msj = `La orden ${orden.orden} esta finalizada.`

        const idSKU = folio.folioLineas.id(req.body.idPedido).modeloCompleto._id

        const sk = null
        try {
          const lote = {
            cantidadEntrada: orden.piezasFinales,
            observaciones: `[SISTEMA] Entrada automatica desde produccion orden # ${orden.orden}`,
            idOrden: orden._id,
          }

          await SKU.guardarLote(idSKU, lote)
        } catch (error) {
          next(err)
        }
      }
      //Actualizamos el porcentaje de avance del folio
      actualizarPorcentajesDeAvance(folio, orden, ubicacion)

      if (maquina) await maquina.save()

      return folio.save()
    })
    .then(folio => {
      return RESP._200(res, msj, [
        {
          tipo: "orden",
          datos: folio.folioLineas
            .id(req.body.idPedido)
            .ordenes.id(req.body.idOrden),
        },
      ])
    })
    .catch(_ => next(_))
})

function actualizarPorcentajesDeAvance(folio, orden, ubicacionActual) {
  const porcentajeOrden =
    ((ubicacionActual.consecutivo + 1) / (orden.ruta.length + 1)) * 100

  orden.porcentajeAvance = orden.terminada ? 100 : porcentajeOrden

  //Calculamos el porcentaje actual del pedido sacando el promedio de
  // las ordenes

  var sumaPedidos = 0
  folio.folioLineas.forEach(pedido => {
    var suma = 0

    suma = pedido.ordenes.reduce((a, b) => (a += b.porcentajeAvance), 0)
    var promedio = suma / pedido.ordenes.length
    pedido.porcentajeAvance = promedio
    sumaPedidos += promedio
  })

  folio.porcentajeAvance = sumaPedidos / folio.folioLineas.length
}

function accionesDeOrdenFinalizada(folio, orden, ubicacion, req) {
  //Como es el ultimo departamento y no hay mas en la ruta por seguir
  // el ultimo departamento debe contener la estructura que corresponde
  // al campoFinal de localizacionDeOrdenes. Este campo lo copiamos a la orden
  // como el total de piezas producidas.

  orden.piezasFinales =
    ubicacion.datos[req.parametros.localizacionDeOrdenes.campoFinal]
  //Primero terminamos la orden y la marcamos como finzalizada.
  orden.terminada = true
  orden.porcentajeAvance = 100

  var totalDelFolio = 0
  folio.folioLineas.forEach(pedido => {
    pedido.cantidadProducida = pedido.ordenes
      .filter(x => x.terminada)
      .reduce((a, b) => (a += b.piezasFinales), 0)

    totalDelFolio += pedido.cantidadProducida
    var ordenesTerminadas = pedido.ordenes.filter(orden => orden.terminada)
      .length

    if (ordenesTerminadas === pedido.ordenes.length) {
      //El pedido esta terminado

      pedido.terminado = true
      pedido.fechaTerminado = new Date()
    }
  })

  folio.cantidadProducida = totalDelFolio
  var pedidosTerminados = folio.folioLineas.filter(pedido => pedido.terminado)
    .length

  if (pedidosTerminados === folio.folioLineas.length) {
    folio.terminado = true
    folio.fechaTerminado = new Date()
  }
}

app.get(
  "/estatusDeLaOrdenParaRegistro/:folio/:pedido/:orden/:departamento",
  (req, res, next) => {
    Folio.findById(req.params.folio)
      .exec()
      .then(async folio => {
        if (!folio) throw "No existe el folio"
        var orden = folio.folioLineas
          .id(req.params.pedido)
          .ordenes.id(req.params.orden)

        if (!orden) throw "No existe la orden"

        var rutaActual = orden.ruta.find(r => r.ubicacionActual)

        var deptoActual = await Departamento.findById(
          rutaActual.idDepartamento
        ).exec()

        if (rutaActual.idDepartamento !== req.params.departamento)
          throw `Esta orden no esta ubicada en este departamento. Actualmente esta ubicada en ${deptoActual.nombre}.`

        if (!rutaActual.recibida) throw "Esta orden no ha sido recibida."

        //Requiere poner a trabajar o no

        const estaEstacion = req.parametros.estacionesDeEscaneo.find(
          x => x.departamento === req.params.departamento
        )

        const yaEstaTrabajando = rutaActual.trabajando

        return RESP._200(res, null, [
          { tipo: "ponerATrabajar", datos: estaEstacion.ponerATrabajar },
          {
            tipo: "ponerATrabajarConMaquina",
            datos: estaEstacion.ponerATrabajarConMaquina,
          },
          { tipo: "yaEstaTrabajando", datos: yaEstaTrabajando },
        ])
      })
      .catch(_ => next(_))
  }
)

app.put("/ponerOrdenATrabajarEnMaquina", (req, res, next) => {
  Folio.findById(req.body.idFolio)
    .exec()
    .then(async folio => {
      if (!folio) throw "No existe el folio"

      const orden = folio.folioLineas
        .id(req.body.idPedido)
        .ordenes.id(req.body.idOrden)

      if (!orden) throw "No existe la orden"
      if (orden.terminada) throw "Esta orden ya esta terminada"

      const depaActual = await Departamento.findById(
        req.body.idDepartamento
      ).exec()

      if (!depaActual) throw "No existe el departamento"

      const ubicacion = orden.ruta.find(x => x.ubicacionActual)

      if (ubicacion.idDepartamento !== req.body.idDepartamento)
        throw `Esta orden no se ecuentra en este departamento. Actualmente esta en '${depActual.nombre}'`

      if (!ubicacion.recibida) throw "Esta orden no ha sido recibida"

      let maquina = Maquina.findById(req.body.idMaquina).exec()

      if (!maquina) throw "No existe la maquina"

      //Debe estar en la pila de trabajo de la maquina.

      const ordenEnPila = maquina.pila
        .filter(x => x.orden.toString() === req.body.idOrden)
        .find(x => x.numeroDeOrden)

      if (!ordenEnPila)
        throw "Esta orden no se encuentra en esta maquina. Es necesario que el supervisor la asigne a la pila."

      maquina.trabajando = true
      maquina.trabajo = ordenEnPila
      orden.maquinaActual = maquina
    })
    .catch(_ => next(_))
})

app.post("/ordenesParaImpresion", (req, res, next) => {
  let folios = req.body.map(x => ObjectId(x.folio))
  let pedidos = req.body.map(x => ObjectId(x.pedido))

  Folio.aggregate([
    { $match: { _id: { $in: folios } } },
    { $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true } },
    { $match: { "folioLineas._id": { $in: pedidos } } },
    {
      $unwind: {
        path: "$folioLineas.ordenes",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        nivelDeUrgencia: "$folioLineas.ordenes.nivelDeUrgencia",
        fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
        numeroDeOrden: "$folioLineas.ordenes.numeroDeOrden",
        piezasTeoricas: "$folioLineas.ordenes.piezasTeoricas",
        unidad: "$folioLineas.ordenes.unidad",
        orden: "$folioLineas.ordenes.orden",
        sku: "$folioLineas.modeloCompleto",
        ruta: "$folioLineas.ordenes.ruta",
        observacionesOrden: "$observaciones",
        observacionesPedido: "$folioLineas.observaciones",
        observacionesFolio: "$folioLineas.ordenes.observaciones",
        laser: "$folioLineas.laserCliente.laser",
      },
    },
    {
      $lookup: {
        from: "modelosCompletos",
        foreignField: "_id",
        localField: "sku",
        as: "sku",
      },
    },
    {
      $unwind: {
        path: "$sku",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $unwind: {
        path: "$ruta",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "ruta.idDepartamento": { $toObjectId: "$ruta.idDepartamento" },
      },
    },

    {
      $lookup: {
        from: "departamentos",
        foreignField: "_id",
        localField: "ruta.idDepartamento",
        as: "ruta.idDepartamento",
      },
    },
    {
      $addFields: {
        laserAlmacen: "$sku.laserAlmacen.laser",
        sku: "$sku.nombreCompleto",
        ruta: "$ruta.idDepartamento.nombre",
      },
    },
    {
      $unwind: {
        path: "$ruta",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: {
          nivelDeUrgencia: "$nivelDeUrgencia",
          fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
          numeroDeOrden: "$numeroDeOrden",
          piezasTeoricas: "$piezasTeoricas",
          unidad: "$unidad",
          orden: "$orden",
          observacionesOrden: "$observacionesOrden",
          observacionesPedido: "$observacionesPedido",
          observacionesFolio: "$observacionesFolio",
          sku: "$sku",
          laser: "$laser",
          laserAlmacen: "$laserAlmacen",
        },
        ruta: { $push: "$ruta" },
      },
    },

    {
      $addFields: {
        _id: { ruta: "$ruta" },
      },
    },

    {
      $replaceRoot: {
        newRoot: "$_id",
      },
    },
  ])
    .exec()
    .then(ordenes => {
      ordenes = ordenes.sort((a, b) => {
        let numerosA = a.orden.split("-").join("") * 1
        let numerosB = b.orden.split("-").join("") * 1
        return numerosA < numerosB ? -1 : 1
      })
      return res.send(ordenes)
    })

    .catch(_ => next(_))
})

module.exports = app
