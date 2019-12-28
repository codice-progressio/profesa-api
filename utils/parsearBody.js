/**
 * Parsea un body que se mande como form data
 * pero con los campos de tipo objetos convertidos a
 * string con JSON.stringfi. Esto lo estamos haciendo
 * para la subida de imagenes.
 *
 * @param body Recive el body en tipo formData
 * y que no contiene las imagenes, puesto que las
 * imagenes deben estar en req.files.miImagen. Esto
 * se hizo pensando en express-upload.
 *
 *
 */
module.exports = function(body) {
  // El objeto que contendra todas las
  // claves parseadas.
  const objPuesto = {}

  // recorremos todas las llaves existentes
  // en el body.
  Object.keys(body).forEach(x => {
    try {
      // Si no es un objeto parseable nos va a tirar
      //   un error. Capturamos ese error por que no
      // significa que este mal, solo que el dato a
      //   convertir no necesita ser parseado.
      objPuesto[x] = JSON.parse(body[x])
    } catch (error) {
      //El valor undefined se convirtio a string, En este caso
      //   es necesario comprobar si es ese texto para retornar ahora
      //   si un verdadero undefined. De otra manera retornamos exactamente
      //   lo que trae la llave en el body.
      objPuesto[x] = body[x] == "undefined" ? undefined : body[x]
    }
  })
  return objPuesto
}
