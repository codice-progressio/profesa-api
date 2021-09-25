const app = require("express")()
const Contacto = require("../../models/contacto/contacto.model")
const ListaDePrecios = require("../../models/listaDePrecios.model")


app.post("/", async (req, res, next) => {
  ["domicilios", "contactos", "cuentas", "eliminado", "rutas"].forEach(x => {
    if (Object.keys(req.body).includes(x)) delete req.body[x]
  })

  // Obtenemos las listas existentes para obtener el id.

  let listasExistentes = await ListaDePrecios.find().select("nombre").exec()
  let usuarios = await require('mongoose')
    .model(
      require('@codice-progressio/express-authentication')
      .configuraciones
      .usuario
      .nombre_bd
    )
    .find()
    .select('_id nombre email')
    .exec()

  function updateContacto(datos) {
    // Transformamos las etiquetas.

    let error = undefined

    if (datos?.etiquetas) {
      datos.etiquetas = datos.etiquetas
        .split(",")
        .map(x => x.trim())
        .filter(x => x)
    }

    // Remplazar listas

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
    if (datos?.usuarios_asignados) {
      let leyenda = '[ NO ENCONTRADO ]'
      let msjError = (d) => leyenda + ' ' + d
      let usuarios = datos.usuarios_asignados
        .split(',')
        .map(x => x.trim())
        .map(x => {
          usuarios.find(u => x === u.nombre) ?? msjError(x)
        })
       
      let erroresExistentes = usuarios.filter(x => x.includes(leyenda))
      
      if (erroresExistentes.length > 0)
        error = error + ` { ERRORES DE USUARIO } => ${ erroresExistentes.join(' ** ') } `
    } else datos['usuarios_asignados'] = usuarios.map(x=>x._id)


    
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

module.exports = app
