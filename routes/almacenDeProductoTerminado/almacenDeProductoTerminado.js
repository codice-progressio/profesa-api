let express = require("express")
let app = express()

var ModeloCompleto = require("../../models/modeloCompleto")
var CRUD = require("../CRUD")

const RESP = require("../../utils/respStatus")

CRUD.app = app
CRUD.modelo = ModeloCompleto
CRUD.nombreDeObjetoSingular = "modeloCompleto"
CRUD.nombreDeObjetoPlural = "modelosCompletos"
CRUD.campoSortDefault = "nombreCompleto"
CRUD.camposDeBusqueda = ["nombreCompleto"]

/**
 * Excluimmos de aqui por que las consultas para el almacen
 * de producto termiando no requieren tanta informacion del modelo
 * completo.
 */

CRUD.excluir = [
  "medias",
  "modelo",
  "tamano",
  "color",
  "terminado",
  "laserAlmacen",
  "versionModelo",
  "familiaDeProcesos",
  "procesosEspeciales",
  "porcentajeDeMerma",
  "espesor",
  "actualizarLotesYExistencias"
]

CRUD.crud("get", "getBuscar")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

/**
 * Consolidamos los lotes de los modelos completos de manera manual.l
 * Esta operacion recalcula los lotes existentes en base al mes y anio de
 * creacion y despues junta las entradas y salidas calculando a su vez
 * existencia total, existencia por lote y cantidad entrada.
 *
 *
 *
 *
 */
app.get("/consolidar/:idModelo", (req, res) => {
  const idModelo = req.params.idModelo
  ModeloCompleto.findById(idModelo)
    .exec()
    .then(mod => {
      if (!mod) throw "No existe el modelo"
      //Organizamos todo en base a una llave
      const lotesOrganizados = {}

      mod.lotes.forEach(lote => {
        const fl = lote.createAt
        // la estructura de la llave se obtiene de la fecha de creacion
        // del lote y tiene la siguientee estructura 2020@01 que representa
        // anio y mes. No afecta demasiado pero si pasan varios anios
        // se puede confundir un lote de 2019-01 con 2020-01 si no se toma
        // en cuenta la fecha.
        const mesLote = fl.getFullYear() + "@" + fl.getMonth()

        if (!lotesOrganizados.hasOwnProperty(mesLote))
          lotesOrganizados[mesLote] = []

        lotesOrganizados[mesLote].push(lote)
      })

      //Almacenamos la estructura final de los lotes.
      const lotesFinales = []

      //Recorremos todos los lotes semi-ordenados para
      //obtener los nuevos calculos.
      for (const key in lotesOrganizados) {
        if (lotesOrganizados.hasOwnProperty(key)) {
          const lotes = lotesOrganizados[key]

          const lnew = {
            existencia: 0,
            cantidadEntrada: 0,
            salidas: [],
            entradas: [],
            devoluciones: [],
            validandoDevolucion: false,
            observaciones: "",
            createAt: null
          }

          lotes.forEach(lote => {
            //Reciclamos la operacion de reduccion.
            const reduce = (a, b) => +a + +b.cantidad
            //Sumamos todas las salidas y las entradas
            const salidas = lote.salidas.reduce(reduce, 0)
            const entradas = lote.entradas.reduce(reduce, 0)
            //Calculamos de nuevo la existencia para el nuevo lote
            lnew.existencia += entradas - salidas

            //Guardamos la cantidad de entrada que se registraron
            lnew.cantidadEntrada += entradas

            //Concatenamos los arreglos de cada lote sin arreglar
            // para que queden dentro del nuevo grupo.
            lnew.salidas = lnew.salidas.concat(lote.salidas)
            lnew.entradas = lnew.entradas.concat(lote.entradas)
            lnew.devoluciones = lnew.devoluciones.concat(lote.devoluciones)
          })
          const loteParaDatos = lotes.pop()
          //Copiamos la fecha del primer lote del grupo.
          //Funciona por que los lotes ya estaban ordenados.
          lnew.createAt = loteParaDatos.createAt
          lnew.observaciones = loteParaDatos.observaciones
          lnew.validandoDevolucion = loteParaDatos.validandoDevolucion

          lotesFinales.push(lnew)
        }
      }
      //Asignamos los lotes.
      mod.lotes = lotesFinales
      //Sumanos la existencia de cada lote nuevo.
      mod.existencia = mod.lotes.reduce((a, b) => +a + +b.existencia, 0)
      return mod.save()
    })
    .then(mod => {
      return RESP._200(
        res,
        "Se consolidaron los lotes del modelo de manera correcta",
        [{ tipo: "modeloCompleto", datos: mod }]
      )
    })
    .catch(err => erro(res, err, "Error consolidando"))
})

function comprobarLote(modeloCompleto) {
  //Si no hay un lote debemos obtener null, por lo tanto vamos a crear
  // uno. Si hay un lote obtenemos el ultimo por que es el que nos interesa
  // para comparar y agregar el lote.
  var ultimoLote = modeloCompleto.lotes[modeloCompleto.lotes.length - 1]
  var nuevoLote = !ultimoLote

  if (!ultimoLote) {
    // Si hay un lote comprobamos sus fechas.
    var mesActual = new Date().getMonth()
    // Si no hay un lote entonces mandamos un menos uno
    // para que la comprobacion nunca sea igual
    var mesLote = ultimoLote ? ultimoLote.getMonth() : -1
    // Si las fechas son iguales quiere decir que no
    // debemos crear nuevo lote.
    nuevoLote = !(mesActual === mesLote)
  }

  return {
    ultimoLote,
    nuevoLote
  }
}

module.exports = app
