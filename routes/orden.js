//Esto es necesario
const express = require("express")
const app = express()
const NVU = require("../config/nivelesDeUrgencia")

const Folio = require("../models/folios/folio")
const Departamento = require("../models/departamento")
const RESP = require("../utils/respStatus")
const CONST = require("../utils/constantes")
const Default = require("../models/configModels/default")

var ModeloCompleto = require("../models/modeloCompleto")
var Lote = require("../models/almacenProductoTerminado/entradaLote.model")

function buscarOrdenDentroDeFolio(fol, id) {
  // Esta función solo funciona si antes se ha comprobado
  // que la órden existe dentro del departamento.
  let orden = null
  for (let i = 0; i < fol.folioLineas.length; i++) {
    const linea = fol.folioLineas[i]
    orden = linea.ordenes.id(id)
    if (orden) {
      break
    }
  }
  return orden
}

function esDeptoActual(orden, depto) {
  // Comprueba que la órden este en el mismo
  // departamento que el se esta mandando.
  return orden.ubicacionActual.departamento.nombre === depto.nombre
}

// ============================================
// Recive la órden que se le pase.
// ============================================
// Todos los departamentos necesitan recibir las
// órdenes antes de empezar a trabajarlas.
//
// Se se pasa req.query.empezarATrabajar en true
// la orden tiene dos pasos para ser recibida. El primero
// es el paso normal de todos los deptos, el segundo es
// aplicable en casos que hay que asignar, por ejemplo en transformacion
// una orden a una maquina antes de empezar a a trabajar.
app.put("/", (req, res) => {
  const id_de_la_orden = req.body._id
  /**
   * Obtenemos el id del departamento. Con este
   * id buscamos los datos que nos interesan.
   *
   */
  const idDepto = req.body.departamento
  let depto_
  const deptoTrabajado = req.body.deptoTrabajado
  var mensajeGeneral = ""

  // ============================================
  // Parametros varios para trabajo de órden.
  // ============================================
  // empeazarATrabajar: Si es true.
  const empezarATrabajar = req.query.empezarATrabajar

  Promise.all([
    existeFolioConOrden(id_de_la_orden),
    existeDepartamento(idDepto)
  ])
    .then(respuestas => {
      const fol = respuestas[0]
      const departamento = respuestas[1]

      // Obtenemos las variables del departamento.
      depto_ = Departamento.obtener(departamento.nombre)
      // Se encuentra en este departamento.
      let orden = buscarOrdenDentroDeFolio(fol, id_de_la_orden)

      // const esDeptoActual = orden.ubicacionActual.departamento.nombre === departamento.nombre;
      if (!esDeptoActual(orden, departamento)) {
        return RESP._400(res, {
          msj: "Esta órden no se encuentra en este departamento",
          err: `La órden existe pero no esta disponible para este departamento. Actualmente se encuentra registrada en '${orden.ubicacionActual.departamento.nombre}'`
        })
      }

      if (orden.ubicacionActual.recivida) {
        // Si la órden ya fue recibida entonces la señalamos que empieza a trabajar.

        if (empezarATrabajar) {
          if (!deptoTrabajado) {
            return RESP._400(res, {
              msj: "No se recivio el departamento para modificar.",
              err:
                "Es necesario pasar el departamento que se va a modificar para guardarlo."
            })
          }

          if (orden.ubicacionActual.hasOwnProperty(depto_._vm)) {
            if (orden.ubicacionActual[depto_._vm].trabajando) {
              return RESP._400(res, {
                msj: "Esta órden ya se encuentra trabajando.",
                err: "La órden ya se encuentra trabajando en esta ubicación."
              })
            }
          }

          deptoTrabajado.trabajando = true
          orden.ubicacionActual[depto_._vm] = deptoTrabajado
          //Si la orden contiene el departamento de transformacion
          // en la ubicacion actual quiere decir que estamos agregando una
          // maquina al proceso productivo.
          if (orden.ubicacionActual.hasOwnProperty("transformacion")) {
            return Maquina.findById(orden.maquinaActual)
              .exec()
              .then(maquina => {
                if (!maquina)
                  throw "La maquina a la que estas asignando esta orden no existe y no se puede hacer el registro."

                maquina.trabajando = true
                maquina.trabajo = {
                  folio: fol._id,
                  pedido: fol.folioLineas.find(x => x.id(orden._id))._id,
                  orden: orden._id
                  //El `inicio` se pone solo
                }
                maquina.parada = false
                if (maquina.paros) maquina.paros = []
                if (maquina.paro) maquina.paros.push(maquina.paro)
                return maquina.save()
              })
              .then(maquina => {
                return fol.save()
              })
          } else {
            mensajeGeneral = "Órden trabajando."
            return fol.save()
          }
        }

        return RESP._400(res, {
          msj: "Está órden ya fue recibida.",
          err: "La órden ya esta trabajandose."
        })
      }
      // Recivimos la órden.
      mensajeGeneral = "Se recivio la órden."
      orden.ubicacionActual.recivida = true
      orden.ubicacionActual.recepcion = new Date()
      return fol.save()
    })
    .then(folioGrabado => {
      const orden = buscarOrdenDentroDeFolio(folioGrabado, id_de_la_orden)
      return RESP._200(res, mensajeGeneral, [{ tipo: "orden", orden }])
    })
    .catch(err => {
      return RESP._500(res, err)
    })
})

function existeFolioConOrden(id) {
  const uno = {
    "folioLineas.ordenes": { $elemMatch: { _id: id } }
  }
  return new Promise((resolve, reject) => {
    const fol = Folio.findOne(uno)
      .populate("folioLineas.ordenes.ubicacionActual.departamento")
      .exec()
    fol
      .then(folioEncontrado => {
        if (!folioEncontrado) {
          reject(
            RESP.errorGeneral({
              msj: "No existe la órden.",
              err: "El id de la órden que ingresaste no existe."
            })
          )
        }
        resolve(folioEncontrado)
      })
      .catch(err => {
        reject(
          RESP.errorGeneral({
            msj: "Hubo un error buscando la órden.",
            err: err
          })
        )
      })
  })
}

/**
 * Obtiene la órden de un departamento dado.
 *
 */
app.get("/:idOrden/:departamento", (req, res) => {
  /**
   * El id de la orden que queremos obtener.
   */
  const idOrden = req.params.idOrden
  /**
   * El departamento donde se encuentra.
   */
  const idDepartamento = req.params.departamento

  Promise.all([orden(idOrden), existeDepartamento(idDepartamento)])
    .then(respuestas => {
      const orden = respuestas[0][0]
      if (orden.terminada) {
        return RESP._400(res, {
          msj: "Esta órden ya esta terminada",
          err: "La órden finalizó su trayecto. "
        })
      }

      const modeloCompleto = respuestas[0][1]
      const depto = respuestas[1]

      const esDeptoActual =
        orden.ubicacionActual.departamento.nombre === depto.nombre
      if (!esDeptoActual) {
        return RESP._400(res, {
          msj: "Esta órden no se encuentra en este departamento",
          err: `La órden existe pero no esta disponible para este departamento. Actualmente se encuentra registrada en '${orden.ubicacionActual.departamento.nombre}'`
        })
      }

      if (!orden.ubicacionActual.recivida) {
        const tamanoTrayecto = orden.trayectoRecorrido.length
        // Si no existe trayecto tiene que dar el mensaje de que no ha sido en
        // entregada para producción.
        let msj_Err = ""
        if (tamanoTrayecto > 0) {
          const deptoAnterior = orden.trayectoRecorrido[tamanoTrayecto - 1]
          msj_Err = `Esta órden ya fue terminada por el departamento de ${deptoAnterior.departamento.nombre}, pero es necesario que la recibas para poder empezar a trabajarla.`
        } else {
          const EsteDepto = `Para poder registrarla es necesario que la recibas primero.`
          msj_Err =
            `La órden todavía no ha sido entregada para empezar su producción. ` +
            EsteDepto
        }
        return RESP._400(res, {
          msj: "Órden sin recibir.",
          err: msj_Err
        })
      }

      return RESP._200(res, null, [
        { tipo: "orden", datos: orden },
        { tipo: "modeloCompleto", datos: modeloCompleto }
      ])
    })
    .catch(err => {
      return RESP._500(res, err)
    })
})

/**
 * Buscamos un folio que contenga la órden con el id que le pasemos
 * como parametro. Esto nos devuelve todo el folio pero solo la linea
 * que necesitamos.
 * @param {*} idOrden
 * @returns La orden por su id.
 *
 */
function orden(idOrden) {
  const uno = {
    "folioLineas.ordenes": { $elemMatch: { _id: idOrden } }
  }
  return new Promise((resolve, reject) => {
    const folioPromesa = Folio.findOne(uno)
      .populate("folioLineas.ordenes.ubicacionActual.departamento")
      .populate("folioLineas.ordenes.trayectoRecorrido.departamento")
      .populate({
        path: "folioLineas.ordenes.ubicacionActual.transformacion.maquinaActual"
      })
      .populate("folioLineas.ordenes.trayectoNormal.departamento")
      .populate({
        path: "folioLineas.modeloCompleto",
        populate: {
          path: "modelo tamano color terminado"
        }
      })
      .exec()

    folioPromesa
      .then(folioEncontrado => {
        //No hubo ningúna coincidencia.
        if (!folioEncontrado) {
          // Como no hay coincidencia la órden no existe.
          reject(
            RESP.errorGeneral({
              msj: "La órden no existe.",
              err: "El id que ingresaste no coincide con ningúna órden."
            })
          )
        } else {
          const linea = folioEncontrado.folioLineas.find(linea => {
            return linea.ordenes.id(idOrden)
          })
          const orden = linea.ordenes.id(idOrden)

          resolve([orden, linea.modeloCompleto])
        }
      })
      .catch(err => {
        reject(
          RESP.errorGeneral({
            msj: "Hubo un error buscando la órden",
            err: err
          })
        )
      })
  })
}

/**
 * Busca si el id que se le pase como parametro esta registrado
 * dentro de los departamentos y obtiene toda su informacion.
 * Estos departamentos tienen que existir dentro de los defautl.
 *
 * @param {*} idDepto
 */
function existeDepartamento(idDepto) {
  return new Promise((resolve, reject) => {
    Departamento.findById(idDepto)
      .exec()
      .then(resp => {
        if (!resp) {
          reject(
            RESP.errorGeneral({
              msj: `No existe el id que ingresaste. ${idDepto}`,
              err:
                "Parece que id del departamento que ingresaste no esta registrado. "
            })
          )
        } else {
          resolve(resp)
        }
      })
      .catch(err => {
        reject(
          RESP.errorGeneral({
            msj: "Hubo un error buscando el departamento.",
            err: err
          })
        )
      })
  })
}

// ============================================
// OBTIENE LA LISTA DE ÓRDENES POR DEPARTAMENTO.
// ============================================
app.get("/:depto", (req, res) => {
  const idDepto = req.params.depto

  Departamento.findOne({ _id: idDepto })
    .then(departamento => {
      if (!idDepto) {
        return RESP._500(res, {
          msj: "El departamento no existe. ",
          err: "El id del departamento que ingresaste no existe."
        })
      }

      // Primero buscamos todos los folios que tengan órdenes actuales en ese departamento
      const busqueda = {
        "folioLineas.ordenes.ubicacionActual.departamento": departamento._id,
        // Si la órden no esta terminada si la tomanos en cuenta.
        "folioLineas.ordenes.terminada": false
      }

      return Folio.find(busqueda).exec()
    })
    .then(folios => {
      // Creamos la estrucutura para guardar las órdenes por nivel.
      const ordenes = {}
      for (var n in NVU.LV) {
        ordenes[NVU.LV[n]] = []
      }

      // Recorremos todos los folios para extraer las órdenes.
      for (let i = 0; i < folios.length; i++) {
        const folio = folios[i]
        // Recorremos la linea del folio para extraer órdenes.
        for (let i = 0; i < folio.folioLineas.length; i++) {
          const linea = folio.folioLineas[i]
          // Recorremos los niveles ( El objeto que ya definimos para separar las órdenes)
          // para obtener los diferentes niveles que hay.
          for (var nivel in ordenes) {
            //Filtramos las órdenes
            linea.ordenes.filter(orden => {
              // Si el nivel de urgencia coincide y tambien es el mismo depto.
              // OJO, SE HACE LA COMPROBACIÓN DOS VECES POR QUE ESTAMOS FILTRANDO
              // ARRIBA POR FOLIOS!!! Y NO POR ORDENES!! DE MANERA QUE TODAS LAS ÓRDENES DEL
              // FOLIO SE VAN A MOSTRAR!!! ESTEN EN EL DEPTO QUE ESTEN.
              if (orden.terminada === true) return false
              // Comparamos por el id del departamento.
              if (
                orden.nivelDeUrgencia === nivel &&
                orden.ubicacionActual.departamento._id.toString() ===
                  idDepto.toString()
              ) {
                var ordenO = orden.toObject()
                ordenO.fechaFolio = folio.fechaFolio

                ordenO.modeloCompleto = linea.modeloCompleto
                ordenO.totalOrdenes = linea.ordenes.length
                ordenO.laserCliente = linea.laserCliente
                ordenO.observacionesFolio = folio.observaciones

                ordenes[nivel].push(ordenO)
                return true
              }
              return false
            })

            // Ordenamos por fecha cada nivel.
            ordenes[nivel].sort((a, b) => {
              return a.fechaFolio - b.fechaFolio
            })
          }
        }
      }

      return RESP._200(res, null, [{ tipo: "ordenes", datos: ordenes }])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error buscando las órdenes del departamento ",
        err: err
      })
    })
})

// ============================================
// Guarda todas las órdenes.
// ============================================

app.post("/", (req, res) => {
  var datos = req.body
  Folio.findById(datos.idFolio, (err, folioEncontrado) => {
    // TODO: Mover a catch.
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al buscar folio.",
        errors: err
      })
    }

    if (!folioEncontrado) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error al buscar folio.",
        errors: "El folio no existe"
      })
    }

    // Buscamos cada coincidencia de id de linea para
    // guardar los órdenes.
    datos.folioLineas.forEach(lineaN => {
      // Buscamos dentro del folio una linea que coincida.
      folioEncontrado.folioLineas.forEach(lineaParaActualizar => {
        if (lineaParaActualizar._id == lineaN._id) {
          lineaParaActualizar.ordenesGeneradas = true
          lineaParaActualizar.ordenes = lineaN.ordenes
          return
        }
      })

      // var lineaF = folioEncontrado.folioLineas.filter(l => { return linea._id === l._id; });
      // lineaF.ordenes = linea.ordenes;
    })
    // IMPORTANTE!!! El save lanza un pre en el modelo que
    // calcula el nivel de importancia del todo el folio. Por favor
    // no modifiques por otro sin antes revisar lo que estas haciendo.
    folioEncontrado.save((err, folioGrabado) => {
      if (err) {
        return RESP._500(res, {
          msj: "Hubo un error grabando el folio.",
          err: err
        })
      }
      return RESP._200(res, "Se guardo el folio correctamente.", [
        { tipo: "folio", datos: folioGrabado }
      ])
    })
  })
})

// ============================================
// Modifica las ordenes que se le pasen para
// recibirlas y entregaras en el depto. Control de produccion.
// ============================================

app.put("/controlDeProduccionRecibirYEntregar", (req, res) => {
  const arreglo = req.body
  // Obtenemos los defautls:

  Default.find()
    .exec()
    .then(defaults => {
      const d = defaults[0]
      return Folio.find({
        // Buscamos los folios que contengan los id.
        "folioLineas.ordenes._id": { $in: arreglo },
        // y que esten en el departamento.
        "folioLineas.ordenes.ubicacionActual.departamento":
          d.DEPARTAMENTOS.CONTROL_DE_PRODUCCION
      }).exec()
    })
    .then(foliosEncontrados => {
      if (!foliosEncontrados) {
        return RESP._400(res, {
          msj:
            "No se encontraron coincidencias con las ordenes que se buscaron.",
          err: "Las ordenes que se buscaron no coinciden con ninguna en la BD."
        })
      }

      // Filtramos las ordenes para modificarlas.

      foliosEncontrados.forEach(x => {
        arreglo.forEach(_id => {
          var ordenEncontrada = buscarOrdenDentroDeFolio(x, _id)
          if (ordenEncontrada) {
            ordenEncontrada.ubicacionActual.recivida = true
            ordenEncontrada.ubicacionActual.recepcion = new Date()
            datosDeOrdenYAvanzar(
              ordenEncontrada,
              { entregadoAProduccion: new Date() },
              CONST.DEPARTAMENTOS.CONTROL_DE_PRODUCCION._n.toLowerCase()
            )
          }
        })
      })

      var a = foliosEncontrados.filter(x => {
        x.save()
        return true
      })
      return Promise.all(a)
    })
    .then(foliosGrabados => {
      return RESP._200(res, "Ordenes actualizadas correctamente.", [
        { tipo: "ok", datos: foliosGrabados.length }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj:
          "Hubo un error buscando las ordenes para recibirlas y entregarlas.",
        err: err
      })
    })
})

// ============================================
// Modifica una órden para agregarle un registro.
// ============================================

app.put("/:idOrden", (req, res) => {
  /**
   * El departamento del cual se agregara un registro.
   *
   */
  let idDepto = req.query.depto

  const datos = req.body

  // Obtenemos el id de la órden.
  const id = req.params.idOrden
  Promise.all([existeFolioConOrden(id), existeDepartamento(idDepto)])
    .then(respuestas => {
      const folio = respuestas[0]
      const departamento = respuestas[1]

      const orden = buscarOrdenDentroDeFolio(folio, id)
      const dep = Departamento.obtener(departamento.nombre)
      if (!dep) throw "El departamento ${dep} no esta defindo en el sistema. "

      // Comprobamos que el departamento sea empaque para
      // guardar las piezas finales en la orden.
      elDepartamentoEsProductoTerminado(orden, dep._vm, datos)

      // ============================================
      // AQUI ES DONDE SE AVANZA EN LA ORDEN
      // ============================================

      // schemaParaOrden[depto](orden, datos, departamento);
      // Requerimos el nombre de la variable para buscar dinamicamente la funcion.
      datosDeOrdenYAvanzar(orden, datos, dep._vm)

      return folio.save()
    })
    .then(folioGrabado => {
      // Comprobamos si la orden esta terminada:
      // Si esta terminada entonces la guardamos directamente al
      //almacen de producto terminado.

      //   Obtenemos de nuevo la orden.

      let ordenModificada = buscarOrdenDentroDeFolio(folioGrabado, id)

      if (ordenModificada.terminada) {
        //Creamos el lote.
        var lote = {
          cantidadEntrada: ordenModificada.piezasFinales,
          observaciones: `Entrada a almacen desde produccion. ORD: ${
            ordenModificada.orden
          }, | ${new Date()} |`
        }

        return ModeloCompleto.guardarLote(
          ordenModificada.modeloCompleto._id,
          lote
        )
      }
    })
    .then(resp => {
      var msj = "Órden modificada correctamente."

      if (resp != null) msj = "Orden modificada y lote guardado correctamente."

      return RESP._200(res, msj, [{ tipo: "todoCorrecto", datos: true }])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error actualizando el folio.",
        err: err
      })
    })
})

/**
 *Esta comprobacion se hace antes de que empaque de el salto
 a producto terminado. Lo que hace es pasar la cantidad empacada
 al valor de piezas finales de la orden unicamente cuando el departamento
 en el que esta es empaque. Por eso es necesario hacer la comprobacion antes
 por que despues de esta funcion se ejecuta el cambio de ubicacion actual. 
 *
 * @param {*} orden
 * @param {*} dep
 * @param {*} datos
 */
function elDepartamentoEsProductoTerminado(orden, dep, datos) {
  // Estamos en empaque.
  if (dep === CONST.DEPARTAMENTOS.EMPAQUE._vm) {
    // Tomamos desde los datos la cantidaad de boton
    // por que estamos reciviendo el departamento de empaque
    orden.piezasFinales = datos.cantidadDeBoton
  }
}

function datosDeOrdenYAvanzar(orden, datos, depto) {
  orden.ubicacionActual[depto] = datos
  avanzarCamino(orden)
}

function avanzarCamino(orden) {
  // Obtenemos la ubicacion actual.
  const ubicacionActual = orden.ubicacionActual

  // Obtenemos el siguiente departamento desde el trayecto
  // normal.
  for (let i = 0; i < orden.trayectoNormal.length; i++) {
    const trayecto = orden.trayectoNormal[i]

    // Revisamos si estamos en este trayecto
    if (trayecto.orden === ubicacionActual.orden) {
      // Damos la salida.
      ubicacionActual.salida = new Date()
      // Si estamos en este trayecto entonces guardamos la ubicación actual
      // como trayecto recorrido
      orden.trayectoRecorrido.push(ubicacionActual)
      orden.ubicacionActual = orden.siguienteDepartamento
      //No se da entrada por que hay que recibir la órden.

      // Si hay todavía un departamento en el trayecto normal
      // entonces si ponemos siguiente departamento, si no,
      // lo dejamos así.
      if (orden.trayectoRecorrido.length >= orden.trayectoNormal.length) {
        orden.terminada = true

        return
      } else {
        orden.siguienteDepartamento = orden.trayectoNormal[i + 2]
      }

      return
    }
  }
}

module.exports = app
