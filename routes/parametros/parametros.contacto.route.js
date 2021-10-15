
const app = require("express")()
const Contacto = require("../../models/contacto/contacto.model")
const ListaDePrecios = require("../../models/listaDePrecios.model")


app.post("/", async (req, res, next) => {
  ["contactos", "cuentas", "eliminado", "rutas"].forEach(x => {
    if (Object.keys(req.body).includes(x)) delete req.body[x]
  })
  
  // Obtenemos las listas existentes para obtener el id.

   req.body = organizarDomicilios(req.body)

  let listasExistentes = await ListaDePrecios.find().select("nombre").exec()
  
  async function updateContacto(datos) {
    const mongoose = require('mongoose')
    let usuarios = await mongoose
      .model(
        require('@codice-progressio/express-authentication')
        .configuraciones
        .usuario
        .nombre_bd
      )
      .find()
      .select('_id nombre email')
      .lean()
      .exec()
    // Transformamos las etiquetas.

    let error = undefined

    if (datos?.etiquetas) {
      datos.etiquetas = datos.etiquetas
        .split(",")
        .map(x => x.trim())
        .filter(x => x)
    }

    // Remplazar lista
    if (datos?.listaDePrecios) {
      let idLista = listasExistentes.find(
        x => x.nombre === datos.listaDePrecios
      )?._id

      if (!idLista) {
        error = `No existe una lista llamada ${datos.listaDePrecios}`
      } else datos.listaDePrecios = idLista
    } else datos["listaDePrecios"] = undefined

    // Agregar vendedores
    // Debe ser un string separado por comas
    if (datos?.usuariosAsignados) {

      let leyenda = ' [ NO ENCONTRADO ]'
      let msjError = (d) => `${ leyenda } "${ d }"`
      
      let usuariosConvertidos = datos.usuariosAsignados
        .split(',')
        .map(x => x.trim())
        .map(x => {
          let us = usuarios.find(u => x === u.nombre)
          if(!us) error = error ? error +   msjError( x ) : msjError( x )
          return us
        }).filter(x=> x)
               
      datos['usuariosAsignados'] =[ ... usuariosConvertidos
        .map(x => mongoose.Types.ObjectId(x._id))]
        
    } else datos['usuariosAsignados'] = []
 
    let filter = {
      codigo: datos.codigo,
    }

    let update = datos
    let opciones = {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }

    let promesa = Contacto.updateOne(filter, update, opciones)
    
    return new Promise((resolve, reject) => {
      if (error) {
        return reject({ error, datos })
      }

      promesa
        .exec()
        .then(() => resolve())
        .catch(error => {
          reject({ error: error.toString(), datos })
        })
    })
  }

  let PROMESAS = req.body.map(x => updateContacto(x))

  Promise.allSettled(PROMESAS)

    .then(respuesta => {
      let rechazados =
        respuesta.filter(x => x.status === "rejected").map(x => x.reason) ?? []
      let correctos =
        respuesta.filter(x => x.status === "fulfilled")?.length ?? 0

      res.send({
        rechazados,
        correctos,
      })
    })
    .catch(_ => next(_))
})




/**
 *Devuevle los domicilios estructurados
 *Debe tener la estructura 
 *  domicilio1_numeroExterior
 *  domicilio1_numeroInterior
 *  domicilio1_calle
 * 
 *  domicilio2_calle
 *
 * 
 * Los numeros depues de domicilio son los que agrupan el domicilio
 * @param {*} datosEstructurados
 */
function organizarDomicilios(datosEstructurados) {
  
  let nombreEncabezado = "domicilio"
  
  if (datosEstructurados?.length < 1) return []
  //Debe haber por lo menos un encabezado con "domicilio" 
  let todosLosEncabezados = Object.keys(datosEstructurados[0])
  let existeDomicilio = !!todosLosEncabezados
  .find(x => x.includes(nombreEncabezado))
  if (!existeDomicilio) return []

  // Obtenemos todos los encabezados que incluyen domicilio
  let encabezados = todosLosEncabezados.filter(x => x.includes(nombreEncabezado))
  let re = /\D+/g
  let cantidadDeDomicilios = Array.from(
    
    new Set(encabezados.map(x => x.replace(re, "")))
  
  )

  return datosEstructurados
    .map(linea => {
      linea['domicilios'] = []
      cantidadDeDomicilios.forEach(i => {
        let domicilio = {}
       //recorremos todos los encabezados de domicilios existenes 
        encabezados.forEach(encabezado => { 

        //Debe de incluir el grupo actual i
          let grupoActual = nombreEncabezado + i + "_"
          if (encabezado.includes(grupoActual)) {
            
            let variable = encabezado.slice(grupoActual.length)
            domicilio[variable] = linea[encabezado]
          }
        })

        linea['domicilios'].push(domicilio)
  })
  return linea
  })
}

module.exports = app
