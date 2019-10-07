//Esto es necesario
var express = require("express")
const fileUpload = require("express-fileupload")
const fs = require("fs")

var app = express()

var mdAutenticacion = require("../middlewares/autenticacion")

var Usuario = require("../models/usuario")
var Requisicion = require("../models/requisiciones/requisicion.model")

var RESP = require("../utils/respStatus")

const PATHS = {
  USUARIOS: "./uploads/usuarios/",
  FACTURAS: "./uploads/facturas/",
  LASER: "./uploads/laser/"
}

const TIPOS_DE_IMAGENES = {
  USUARIOS: "usuarios",
  LASERADOS: "laserados",
  FACTURAS: "facturas"
}

const EXTENSIONES_VALIDAS = {
  IMAGENES: ["png", "jpg", "gif", "jpeg"],
  OTROS: []
}

// default options
app.use(fileUpload())

/**
 *Error general para el catch
 *
 * @param {*} msj El mensaje que se quiere mostrar
 * @param {*} err El error producto del catch
 * @param {*} res El response del app.x
 * @returns
 */
function errorGeneral(msj, err, res) {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

function validarTiposFicheros(res, tipo) {
  var tiposValidos = Object.values(TIPOS_DE_IMAGENES)
  if (tiposValidos.indexOf(tipo) < 0) {
    return RESP._500(res, {
      msj: "Coleccion invalida",
      err: "La coleccion para el fichero no es valida"
    })
  }
}

function imagenNoSeleccionada(res, files) {
  if (files) {
    return RESP._500(res, {
      msj: "Fichero vacio",
      err: "Debe seleccionar un fichero o imagen"
    })
  }
}

function validarExtencionesPermitidas(res, extensionArchivo) {
  var extensionesValidas = EXTENSIONES_VALIDAS.IMAGENES

  if (extensionesValidas.indexOf(extensionArchivo) < 0) {
    return RESP._500(res, {
      msj: "Extencion invalida",
      err: "Las extensiones validas son: " + extensionesValidas.join(", ")
    })
  }
}

function moverImagenesParaGuardar(archivo, id, tipo, res) {
  var nombreCortado = archivo.name.split(".")

  var extensionArchivo = nombreCortado[nombreCortado.length - 1]
  //Solo estas extensiónes aceptamos.
  validarExtencionesPermitidas(res, extensionArchivo)
  // Nombre de archivo personalizado

  var ran = Math.trunc(Math.random() * 10000)
  var nombreArchivo = `${id}-${new Date().getMilliseconds()}_${ran}.${extensionArchivo}`
  //Mover el archivo del temporal a un path especifico.
  var pathFolder = `./uploads/${tipo}`
  var path = `${pathFolder}/${nombreArchivo}`
  if (!fs.existsSync(pathFolder)) {
    fs.mkdirSync(pathFolder)
  }

  archivo.mv(path, (path, err) => {
    if (err) throw "Hubo un error moviendo el archivo temporal " + err
  })

  return nombreArchivo
}

app.put("/:tipo/:id", (req, res) => {
  // Obtenemos el tipo de fichero que es el que nos
  // va a dar la carpeta donde vamos a guardar.
  var tipo = req.params.tipo
  //Obtenemos un id
  var id = req.params.id
  // Tipos de colección.
  validarTiposFicheros(res, tipo)
  // El fichero no esta vacio
  imagenNoSeleccionada(req.files)
  
  //Si no hay ficheros pues no guardamos nada. 
  if (!req.files) requisicionOk(null, res)
  
  
  
  // Obtener nombre del archivo.
  //En caso de que no sea cambio de foto de perfil.


  var archivo = req.files.imagen ? [req.files.imagen] : req.files["facturas[]"]
  //La variable que guardara los nombres de archivos
  //creados. En el caso de las facturas tienen que ser
  // varias pero en el caso de las que son de usuario
  // sera solo una. Lo dejamos como arreglo por
  // defecto para estandarizar.
  var nombresDeArchivos = []

  // Archivo puede llegar como un archivo simple o un arreglo. /:
  if (archivo.forEach) {
    archivo.forEach((archivo) =>
      nombresDeArchivos.push(moverImagenesParaGuardar(archivo, id, tipo, res))
    )
  } else {
    nombresDeArchivos.push(moverImagenesParaGuardar(archivo, id, tipo, res))
  }

  //nombreDeArchivo es un arreglo
  subirPorTipo(tipo, id, nombresDeArchivos, res)
})

function subirPorTipo(tipo, id, nombresDeArchivo, res) {
  if (tipo === TIPOS_DE_IMAGENES.USUARIOS) {
    tipoUsuario(id, nombresDeArchivo[0], res)
  }

  if (tipo === TIPOS_DE_IMAGENES.FACTURAS) {
    tipoFactura(id, nombresDeArchivo, res)
  }
}

function tipoUsuario(id, nombreArchivo, res) {
  // Comprobamos si el usuario ya tiene una imágen.
  // Si la tiene la removemos.
  Usuario.findById(id)
    .exec()
    .then((usuario) => usuarioProcesosDeImagen(usuario, nombreArchivo))
    .then((usuarioActualizado) => usuarioOk(usuarioActualizado, res))
    .catch((err) =>
      errorGeneral(
        "Hubo un error subiendo la imagen para este usuario",
        err,
        res
      )
    )
}

function tipoFactura(id, nombresDeArchivo, res)
{
  // Creamos un array para actualizar la requisicion con las nuevas
  // imagenes que vamos a subir.
  var objetoDeImagenes = []
  // Construimos la estructura para guardar la imagen con su fecha de subida.
  nombresDeArchivo.forEach((nombre) =>
  {
    objetoDeImagenes.push({
      imagen: nombre,
      fecha: new Date()
    })
  })
  // Solo hacemos un update para no lanzar las validaciones.

  Requisicion.updateOne(
    { _id: id },
    {
      // Hacemos un push
      $push: {
        // Para cada uno de los elementos que traemos en objetoDeImagenes.
        "estatus.imagenesFacturas": { $each: objetoDeImagenes }
      }
    }
  )
    .exec()
    .then((requisicion) => requisicionOk(requisicion, res))
    .catch((err) =>
      errorGeneral(
        "Hubo un error guardando la imagen para esta requisicion",
        err,
        res
      )
    )
}
function usuarioProcesosDeImagen(usuario, nombreArchivo) {
  if (!usuario) {
    throw "No existe el usuario"
  }

  var pathViejo = PATHS.USUARIOS + usuario.img

  // Si no existe el path lo crea
  if (fs.existsSync(pathViejo)) {
    fs.unlinkSync(pathViejo)
  }

  usuario.img = nombreArchivo
  return usuario.save()
}

function usuarioOk(usuarioActualizado, res) {
  // Eliminamos el password
  usuarioActualizado.password = ":D"

  return RESP._200(res, "Se actualizo la imagen correctamente", [
    { tipo: "usuario", datos: usuarioActualizado }
  ])
}

function requisicionOk(requisicion, res)
{
  return RESP._200(res, null, [
    { tipo: null, datos: null }
  ])
}


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
