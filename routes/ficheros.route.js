// Requires
const express = require("express")
const app = express()
//Mongoose obtiene la instancia del modelo al usarse la misma
// (cosa que paso con la libreria)
const Usuario = require("mongoose").model("Usuario")
const easyImages = require("@codice-progressio/easy-images")
const $ = require("@codice-progressio/easy-permissions").$

const codice_security_utilidades =
  require("@codice-progressio/express-authentication").utilidades

app.put(
  "/usuario/imagen",
  $("login", "Agregar una imagen al usuario"),
  easyImages.recibirImagen.single("img"),
  easyImages.redimencionarMiddleware,
  async (req, res, next) =>
  {
    console.log()
    // Comprobamos si es el mismo usuario
    let esAdminOMismoUsuario =
      codice_security_utilidades.comprobarAdministradorMismoUsuario(req)

    if (!esAdminOMismoUsuario)
      throw "No puedes modificar la imagen de otro usuario"
    let us = await Usuario.findById(req.body._id).exec()
    if (!us) throw new Error("No existe el id")
    //Eliminamos la imagen actual si existe.
    if (us.img?.nombreBD) {
      try {
        await easyImages.eliminarImagenDeBucket(us.img?.nombreBD)
      } catch (error) {
        return next(error)
      }
    }
    // Subimos la imagen nueva
    easyImages
      .subirImagen(req.file)
      .then(data => {
        // Sustituimos los datos de la anterior imagen con
        // los nuevos
        us.img = {
          nombreOriginal: req.file.originalname,
          nombreBD: data.nuevoNombre,
          path: data.publicUrl,
        }
        return us.save()
      })
      .then(usuario => res.send(usuario.img))
      .catch(_ => next(_))
  }
)

//Eliminamos una imagen
app.delete(
  "/uaurio/imagen/:id",
  $("usuario:modificar:eliminar-imagen", "Elimina la imagen del usuario"),
  async (req, res, next) => {
    // El id del sku
    const id = req.params.id
    // Buscamos por id
    const usuario = await Usuario.findById(id).exec()
    easyImages
      .eliminarImagenDeBucket(usuario.img.nombreBD)
      .then(() => {
        usuario.img = null
        return usuario.save()
      })
      .then(() => res.send())
      .catch(_ => next(_))
  }
)

module.exports = app
