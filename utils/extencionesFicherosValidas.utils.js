module.exports.EXTENCIONES_FICHEROS = {
  IMAGENES: ["png", "jpg", "gif", "jpeg"],
  OTROS: []
}

module.exports.esImagen = function (archivo)
{
  return !(archivo.mimetype.match(/image\/*/) == null)
}

module.exports.extencionPermitida = function(archivo) {
  var nombreCortado = archivo.name.split(".")
  var extensionArchivo = nombreCortado[nombreCortado.length - 1]
  var extensionesValidas = require("./extencionesFicherosValidas.utils")
    .EXTENCIONES_FICHEROS.IMAGENES
  return !(extensionesValidas.indexOf(extensionArchivo) < 0)
}
