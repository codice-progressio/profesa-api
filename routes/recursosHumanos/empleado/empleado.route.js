//Esto es necesario
const express = require("express")
const app = express()
const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")
const RESP = require("../../../utils/respStatus")
const parsearBody = require("../../../utils/parsearBody")
const fileUpload = require("express-fileupload")
const fs = require("fs")

const modificarPuesto = require("./empleado.modificarPuesto.route")
const modificarSueldo = require("./empleado.modificarSueldo.route")
const registrarPermiso = require("./empleado.registrarPermiso.route")
const registrarVacaciones = require("./empleado.registrarVacaciones.route")
const registrarCurso = require("./empleado.registrarCurso.route")
const registrarActa = require("./empleado.registrarActa.route")
const registrarFelicitacion = require("./empleado.registrarFelicitacion.route")
const registrarAmonestacion = require("./empleado.registrarAmonestacion.route")
const registrarBono = require("./empleado.registrarBono.route")
const eliminarEvento = require("./empleado.eliminarEvento.route")

const estatusLaboral = require("./empleado.modificarEstatusLaboral.route")

const pathFolderEmpleados = `./uploads/empleados`

var guard =  require('express-jwt-permissions')()
var permisos = require('../../../config/permisos.config')

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

// <!--
// =====================================
//  Todo
// =====================================
// -->
app.get(
  "/",
  permisos.$("empleado:leer:todo"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "empleado")

    const total = await Empleado.countDocuments().exec()

    Empleado.find()
      .sort({ [campo]: sort })
      .limit(limite)
      .skip(desde)
      .exec()
      .then(empleados => {
        return RESP._200(res, null, [
          { tipo: "empleados", datos: empleados },
          { tipo: "total", datos: total }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error buscando los puestos"))
  }
)

// <!--
// =====================================
//  END Todo
// =====================================
// -->

// <!--
// =====================================
//  Id
// =====================================
// -->
app.get("/:id", permisos.$("empleado:leer:id"), (req, res) => {
  Empleado.findById(req.params.id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "empleado", datos: empleado }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los empleados"))
})

// <!--
// =====================================
//  END Id
// =====================================
// -->

// <!--
// =====================================
//  termino
// =====================================
// -->
app.get(
  "/buscar/:termino",
  permisos.$("empleado:leer:termino"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "idNomina")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" }
    })

    const $match = {
      $or: []
    }

    ;[
      "idChecador",
      "idNomina",
      "nombres",
      "apellidos",
      "curp",
      "rfc",
      "numeroDeCuenta",
      "númeroDeSeguridadSocial",
      "email",
      "celular",
      "telCasa",
      "telEmergencia",
      "nivelDeEstudios",
      "domicilio"
    ].forEach(x => $match.$or.push(b(x)))

    const total = await Empleado.aggregate([
      { $match },
      { $count: "total" }
    ]).exec()

    Empleado.aggregate([
      { $match },
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])
      .exec()
      .then(empleados => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "empleados", datos: empleados },
          { tipo: "total", datos: total.pop().total }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error buscando los empleados"))
  }
)

// <!--
// =====================================
//  END termino
// =====================================
// -->

// <!--
// =====================================
//  Crear y Modificar puesto
// =====================================
// -->

// <!--
// =====================================
//  Guardar y modificar
// =====================================
// -->

app.use(fileUpload())
app.post(
  "/", permisos.$("empleado:crear"),
  (req, res) => {
    var empleado = parsearBody(req.body)
    var foto = req.files ? req.files.fotografia : null

    if (foto) {
      //Validacion de la imagen.
      var validar = require("../../../utils/extencionesFicherosValidas.utils")
      if (!validar.extencionPermitida(foto) || !validar.esImagen(foto)) {
        return RESP._500(res, {
          msj: "Formato de imagen no valido",
          err: "Extencion invalida"
        })
      }
    }

    if (empleado.hasOwnProperty("_id")){
      return modificar(res, empleado, foto)
    }
    else {
      return crear(res, empleado, foto)
    }
  }
)

function crear(res, empleado, foto) {
  if (!foto) {
    return RESP._500(res, {
      msj: "La fotografia es obligatoria",
      err: "Es necesario subir una imagen del empleado."
    })
  }

  const nuevoEmpleado = new Empleado(empleado)
  nuevoEmpleado
    .save()
    .then(emp => {
      return Empleado.updateOne(
        { _id: emp._id },
        { $set: { fotografia: guardarImagen(foto, emp._id) } }
      ).exec()
    })
    .then(emp => {
      return RESP._200(res, "Se guardo el empleado de manera correcta", [
        { tipo: "emp", datos: emp }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error guardando al empleado",
        err: err
      })
    })
}

function modificar(res, empModificaciones, foto) {
  Empleado.findById(empModificaciones._id)
    .exec()
    .then(empleado => {
      if (!empleado) {
        throw "No existe el empleado"
      }

      let a = [
        "idChecador",
        "idNomina",
        "nombres",
        "apellidos",
        "fechaDeNacimiento",
        "sexo",
        "curp",
        "rfc",
        "numeroDeCuenta",
        "numeroDeSeguridadSocial",
        "email",
        "celular",
        "telCasa",
        "telEmergencia",
        "nombreEmergencia",
        "estadoCivil",
        "domicilio",
        "nivelDeEstudios",
        "hijos",
        "parentescoEmergencia"
      ].forEach(x => {
        empleado[x] = empModificaciones[x]
      })

      if (foto) {
        //Si la foto tiene una extencion diferente entonces valio quesadilla.
        empleado.fotografia = guardarImagen(
          foto,
          empleado._id,
          empleado.fotografia
        )
      }

      return empleado.save()
    })
    .then(empleado => {
      return RESP._200(res, "Se modifico correctamente el empleado", [
        { tipo: "empleado", datos: empleado }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error actualizando al empleado",
        err: err
      })
    })
}

function guardarImagen(foto, id, nombreAnterior = "XXXXXXXXXX") {
  var nombreCortado = foto.name.split(".")
  var ext = nombreCortado[nombreCortado.length - 1]
  var path = `${pathFolderEmpleados}/${id}.${ext}`
  //Si no existe el directorio se crea
  if (!fs.existsSync(pathFolderEmpleados)) {
    fs.mkdirSync(pathFolderEmpleados)
  }

  let viejo = `${pathFolderEmpleados}/${nombreAnterior}`
  if (fs.existsSync(viejo)) fs.unlinkSync(viejo)

  foto.mv(path, (path, err) => {
    if (err) throw "No se pudo guardar la imagen de este empleado" + err
  })

  return `${id}.${ext}`
}
// <!--
// =====================================
//  END Guardar y modificar
// =====================================
// -->

// <!--
// =====================================
//  Eliminar
// =====================================
// -->

app.delete("/:id", permisos.$("empleado:eliminar"), (req, res) => {
  Empleado.findById(req.params.id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "No existe el id"
      return empleado.remove()
    })
    .then(emp => {
      return RESP._200(res, null, [{ tipo: "empleado", datos: emp }])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando al empleado"))
})

// <!--
// =====================================
//  END Eliminar
// =====================================
// -->

app.put(
  "/evento/puesto",
  permisos.$("empleado:evento:puesto"),
  (req, res) => {
    //Cambio de puesto
    var datos = {
      _id: req.body._id,
      _idPuestoNuevo: req.body._idPuestoNuevo
    }
    //Buscar que si exista el puesto.
    //Buscar que si exista el empleado
    modificarPuesto(datos)
      .then(empleado =>
        estatusOk("Se creo el evento correctamente", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error modificando el puesto", res, err))
  }
)

// <!--
// =====================================
//  END Crear y Modificar puesto
// =====================================
// -->

// <!--
// =====================================
//  Modificar sueldo
// =====================================
// -->

app.put(
  "/evento/sueldo",
  permisos.$("empleado:evento:sueldo"),
  (req, res) => {
    // Con un aumento de sueldo necesitamos
    // comprobar que no supere el maximo.

    var datos = {
      _id: req.body._id,
      nuevoSueldo: req.body.nuevoSueldo,
      observacion: req.body.observacion
    }

    modificarSueldo(datos)
      .then(empleado =>
        estatusOk("Sueldo modificado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error modificando el puesto", res, err))
  }
)

// <!--
// =====================================
//  END Modificar sueldo
// =====================================
// -->

// <!--
// =====================================
//  Estatus laboral
// =====================================
// -->

app.put(
  "/evento/estatusLaboral/baja",
  permisos.$("empleado:evento:estatusLaboral:baja"),
  (req, res) => {
    var datos = req.body

    estatusLaboral
      .baja(datos)
      .then(empleado =>
        estatusOk("Se dio de baja al empleado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error dando de baja el empleado", res, err))
  }
)

app.put(
  "/evento/estatusLaboral/reingreso",
  permisos.$("empleado:evento:estatusLaboral:reingreso"),
  (req, res) => {
    var datos = req.body

    estatusLaboral
      .reingreso(datos)
      .then(empleado =>
        estatusOk("Se reingreso al empleado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error reingresando al empleado", res, err))
  }
)

app.put(
  "/evento/estatusLaboral/incapacidad/enfermedadGeneral",
  guard.check(
    permisos.$("empleado:evento:estatusLaboral:incapacidad:enfermedadGeneral")
  ),
  (req, res) => {
    //Debe ser la estructura del estatusLaboral
    var datos = req.body
    estatusLaboral
      .enfermedadGeneral(datos)
      .then(empleado =>
        estatusOk(
          "Se agrego la incapacidad por enfermedad",
          "empleado",
          empleado,
          res
        )
      )
      .catch(err =>
        error(
          "Hubo un error registrando la incapacidad por enfermedad",
          res,
          err
        )
      )
  }
)
app.put(
  "/evento/estatusLaboral/incapacidad/riesgoDeTrabajo",
  guard.check(
    permisos.$("empleado:evento:estatusLaboral:incapacidad:riesgoDeTrabajo")
  ),
  (req, res) => {
    //Debe ser la estructura del estatusLaboral
    var datos = req.body
    estatusLaboral
      .riesgoDeTrabajo(datos)
      .then(empleado =>
        estatusOk(
          "Se agrego la incapacidad por riesgo de trabajo",
          "empleado",
          empleado,
          res
        )
      )
      .catch(err =>
        error(
          "Hubo un error registrando la incapacidad por riesgo de trabajo",
          res,
          err
        )
      )
  }
)
app.put(
  "/evento/estatusLaboral/incapacidad/maternidad",
  guard.check(
    permisos.$("empleado:evento:estatusLaboral:incapacidad:maternidad")
  ),
  (req, res) => {
    //Debe ser la estructura del estatusLaboral
    var datos = req.body
    estatusLaboral
      .maternidad(datos)
      .then(empleado =>
        estatusOk(
          "Se agrego la incapacidad por maternidad",
          "empleado",
          empleado,
          res
        )
      )
      .catch(err =>
        error(
          "Hubo un error registrando la incapacidad por maternidad",
          res,
          err
        )
      )
  }
)

// <!--
// =====================================
//  END Estatus laboral
// =====================================
// -->

// <!--
// =====================================
//  Permiso
// =====================================
// -->

app.put(
  "/evento/permiso",
  permisos.$("empleado:evento:permiso"),
  (req, res) => {
    var datos = {
      _id: req.body._id,
      eventoPendienteDeDefinir: req.body.eventoPendienteDeDefinir,
      conGoceDeSueldo: req.body.conGoceDeSueldo,
      sinGoceDeSueldo: req.body.sinGoceDeSueldo,
      motivo: req.body.motivo,
      fechaDeInicio: req.body.fechaDeInicio,
      fechaDeFinalizacion: req.body.fechaDeFinalizacion,
      autorizacionSupervisor: req.body.autorizacionSupervisor,
      autorizacionRH: req.body.autorizacionRH,
      comentario: req.body.comentario
    }
    registrarPermiso
      .nuevoPermiso(datos)
      .then(empleado =>
        estatusOk("Permiso actualizado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error con el permiso", res, err))
  }
)

app.put(
  "/evento/permiso/autorizar",
  permisos.$("empleado:evento:permiso:autorizar"),
  (req, res) => {
    var datos = {
      _id: req.body._id,
      idHisto: req.body.idHisto
    }
    registrarPermiso
      .autorizar(datos)
      .then(empleado =>
        estatusOk("Permiso actualizado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error con el permiso", res, err))
  }
)
app.put(
  "/evento/permiso/rechazar",
  permisos.$("empleado:evento:permiso:rechazar"),
  (req, res) => {
    var datos = {
      _id: req.body._id,
      idHisto: req.body.idHisto,
      motivoRechazado: req.body.motivo
    }
    registrarPermiso
      .rechazar(datos)
      .then(empleado =>
        estatusOk("Permiso actualizado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error con el permiso", res, err))
  }
)

// <!--
// =====================================
//  END Permiso
// =====================================
// -->

// <!--
// =====================================
//  Vacaciones
// =====================================
// -->
app.put(
  "/evento/vacaciones",
  permisos.$("empleado:evento:vacaciones"),
  (req, res) => {
    var datos = {
      _id: req.body._id,
      desde: req.body.desde,
      hasta: req.body.hasta
    }

    registrarVacaciones(datos)
      .then(empleado =>
        estatusOk("Vacaciones registradas", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error registrando las vacaciones", res, err))
  }
)

// <!--
// =====================================
//  END Vacaciones
// =====================================
// -->

// <!--
// =====================================
//  Curso
// =====================================
// -->

app.put(
  "/evento/curso",
  permisos.$("empleado:evento:curso"),
  (req, res) => {
    var datos = {
      _id: req.body._id,
      idCurso: req.body.idCurso,
      fecha: req.body.fecha
    }

    registrarCurso(datos)
      .then(empleado =>
        estatusOk("Curso registrado", "empleado", empleado, res)
      )
      .catch(err => error("Hubo un error registrando el curso", res, err))
  }
)

// <!--
// =====================================
//  END Curso
// =====================================
// -->

// <!--
// =====================================
//  Registrar Acta
// =====================================
// -->
app.put(
  "/evento/castigo",
  permisos.$("empleado:evento:castigo"),
  (req, res) => {
    var datos = {
      _id: JSON.parse(req.body._id),
      acta: req.files.acta,
      fecha: JSON.parse(req.body.fecha)
    }

    datos.acta = moverDocumentoDeEmpleado(datos.acta, datos._id, "ACTA")

    registrarActa(datos)
      .then(empleado => estatusOk("Acta registrada", "empleado", empleado, res))
      .catch(err => error("Hubo un error registrando el acta", res, err))
  }
)

// <!--
// =====================================
//  END Registrar Acta
// =====================================
// -->

function moverDocumentoDeEmpleado(foto, id, tipoEvento) {
  const validar = require("../../../utils/extencionesFicherosValidas.utils")
  if (!validar.extencionPermitida(foto) || !validar.esImagen(foto)) {
    return RESP._500(res, {
      msj: "Formato de imagen no valido",
      err: "Extencion invalida"
    })
  }

  const sp = foto.name.split(".")
  const ext = sp[sp.length - 1]

  // Existe la carpeta?

  if (!fs.existsSync(pathFolderEmpleados)) fs.mkdirSync(pathFolderEmpleados)

  const nombre = `${id}_EVENTO_${tipoEvento}_${new Date().getTime()}.${ext}`

  foto.mv(`${pathFolderEmpleados}/${nombre}`, (path, err) => {
    if (err)
      throw new Error(
        `No se pudo guardar el documento de este evento:${tipoEvento}`
      )
  })

  return nombre
}

// <!--
// =====================================
//  Registrar Felicitacion
// =====================================
// -->

app.put(
  "/evento/felicitacion",
  permisos.$("empleado:evento:felicitacion"),
  (req, res) => {
    const datos = {
      _id: JSON.parse(req.body._id),
      documento: req.files.documento,
      fecha: JSON.parse(req.body.fecha)
    }

    datos.documento = moverDocumentoDeEmpleado(
      datos.documento,
      datos._id,
      "FELICITACION"
    )

    registrarFelicitacion(datos)
      .then(empleado =>
        estatusOk("Felicitacion registrada", "empleado", empleado, res)
      )
      .catch(err =>
        error("Hubo un error registrando la felicitacion", res, err)
      )
  }
)

// <!--
// =====================================
//  END Registrar Felicitacion
// =====================================
// -->

// <!--
// =====================================
//  Registrar amonestacion
// =====================================
// -->

app.put(
  "/evento/amonestacion",
  permisos.$("empleado:evento:amonestacion"),
  (req, res) => {
    var datos = {
      _id: JSON.parse(req.body._id),
      documento: req.files.documento,
      fecha: JSON.parse(req.body.fecha)
    }

    datos.documento = moverDocumentoDeEmpleado(
      datos.documento,
      datos._id,
      "AMONESTACION"
    )

    registrarAmonestacion(datos)
      .then(empleado =>
        estatusOk("Amonestacion registrada", "empleado", empleado, res)
      )
      .catch(err =>
        error("Hubo un error registrando la amonestacion", res, err)
      )
  }
)

// <!--
// =====================================
//  END Registrar amonestacion
// =====================================
// -->

// <!--
// =====================================
//  Registrar bono
// =====================================
// -->

app.put("/evento/bono", permisos.$('empleado:evento:bono'), (req, res) => {
  var datos = {
    _id: req.body._id,
    porAsistencia: req.body.porAsistencia,
    porPuntualidad: req.body.porPuntualidad,
    porProductividad: req.body.porProductividad,
    porResultados: req.body.porResultados,
    ayudaEscolarEventual: req.body.ayudaEscolarEventual,
    otros: req.body.otros
  }

  registrarBono(datos)
    .then(empleado => estatusOk("Bono registrado", "empleado", empleado, res))
    .catch(err => error("Hubo un error registrando el bono", res, err))
})

// <!--
// =====================================
//  END Registrar bono
// =====================================
// -->

// <!--
// =====================================
//  Eliminar eventos
// =====================================
// -->

app.delete("/evento/:idEmpleado/:idEvento", permisos.$('empleado:evento:eliminar'), (req, res) => {
  var datos = {
    _id: req.params.idEmpleado,
    _idEvento: req.params.idEvento
  }

  eliminarEvento(datos)
    .then(empleado => estatusOk("Evento eliminado", "empleado", empleado, res))
    .catch(err => error("Hubo un error eliminando el evento", res, err))
})

// <!--
// =====================================
//  END Eliminar eventos
// =====================================
// -->

const error = (msj, res, err) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

const estatusOk = (msj, tipo, datos, res) => {
  return RESP._200(res, msj, [{ tipo: tipo, datos: datos }])
}

module.exports = app
