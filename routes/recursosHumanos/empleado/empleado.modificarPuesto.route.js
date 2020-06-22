const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")
const Puesto = require("../../../models/recursosHumanos/puestos/puesto.model")

module.exports = function(datos) {
  // return Promise.all([
    return Empleado.findById(datos._id).exec()
    // Puesto.findById(datos._idPuestoNuevo).exec()
  // ])
    // .then(empleado => obtenerPuestoActual(empleado))
    .then(empleado => crearEventos(empleado, datos))
    
}

// function obtenerPuestoActual(datos) {
//   var empleado = datos[0]
//   var puestoNuevo = datos[1]
//   noExisteAlguno(empleado, puestoNuevo)

//   return new Promise((resolve, reject) => {
//     Puesto.findById(empleado.puestoActualTexto)
//       .exec()
//       .then(puesto => {
//         resolve([empleado, puesto, puestoNuevo])
//       })
//       .catch(err => reject(err))
//   })
// }

function crearEventos(empleado, datos) {
  // var empleado = empleados[0]
  var puestoAnterior = empleado.puestoActualTexto
  var puestoNuevo = datos.puestoNuevoTexto.trim()
  if (String(puestoAnterior) === String(puestoNuevo))
    throw "El puesto actual es igual al nuevo puesto"

  //Comprobamos que hay un arreglo en eventos
  if (!empleado.eventos) empleado.eventos = []
  //Crear un evento nuevo de puesto y hacer unshift
  const evNuevoPuesto = crearEventoDePuesto(puestoAnterior, puestoNuevo)
  empleado.eventos.unshift(evNuevoPuesto)

  //Modificar puestoActual
  empleado.puestoActualTexto = puestoNuevo

  // Crear evento de cambioDeSueldo y hacer unshift

  // if (puestoNuevo.sueldoBase > empleado.sueldoActual) {
  //   // Solo se puede agregar un aumento de sueldo si
  //   // el puestoNuevo.sueldoBase supera al sueldo actual
  //   //
  //   const evNuevoSueldo = crearEventoDeSueldo(
  //     puestoAnterior.sueldoBase,
  //     puestoNuevo.sueldoBase,
  //     empleado.sueldoActual
  //   )
  //   empleado.eventos.unshift(evNuevoSueldo)
  //   //Modificar sueldo actual
  //   empleado.sueldoActual = evNuevoSueldo.evento.cambiosDeSueldo.aumento
  // }

  return empleado.save()
}

// function crearEventoDeSueldo(anterior, nuevo) {
//   var sueldoActual = nuevo
//   var observacion = `[ SISTEMA ] Aumento registrado automaticamente al detectar un cambio de puesto.`

//   const evento = {
//     cambiosDeSueldo: {
//       sueldAnteriorAlCambio: anterior,
//       aumento: nuevo,
//       observacion: observacion
//     }
//   }

//   return crearHistorialDeEventos(evento)
// }

function crearEventoDePuesto(anterior, nuevo) {
  const evento = {
    puesto: {
      anterior,
      nuevo
    }
  }

  return crearHistorialDeEventos(evento)
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}

// function noExisteAlguno(emp, puN) {
//   //Comprobamos si alguno de estos esta vacio
//   // para retornar un throw. Esta comprobacion
//   // es para corroborar que los id que nos pasaron
//   // son correctos y existe el objeto.
//   const a = [
//     {
//       existe: !puN,
//       m: "No existe el puesto nuevo "
//     },
//     {
//       existe: !emp,
//       m: "No existe el empleado "
//     }
//   ]

//   a.forEach(d => {
//     if (d.existe) throw d.m
//   })
// }

// function formatMoney(number, decPlaces, decSep, thouSep) {
//   ;(decPlaces = isNaN((decPlaces = Math.abs(decPlaces))) ? 2 : decPlaces),
//     (decSep = typeof decSep === "undefined" ? "." : decSep)
//   thouSep = typeof thouSep === "undefined" ? "," : thouSep
//   var sign = number < 0 ? "-" : ""
//   var i = String(
//     parseInt((number = Math.abs(Number(number) || 0).toFixed(decPlaces)))
//   )
//   var j = (j = i.length) > 3 ? j % 3 : 0

//   return (
//     sign +
//     (j ? i.substr(0, j) + thouSep : "") +
//     i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
//     (decPlaces
//       ? decSep +
//         Math.abs(number - i)
//           .toFixed(decPlaces)
//           .slice(2)
//       : "")
//   )
// }
