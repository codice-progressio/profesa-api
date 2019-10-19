//Esto es necesario
const express = require("express")
const app = express()
const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")
const RESP = require("../../../utils/respStatus")

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

const modificarEstatusLaboral = require("./empleado.modificarEstatusLaboral.route")
  .modificarEstatusLaboral

const CRUD = require("../../CRUD")
CRUD.app = app
CRUD.modelo = Empleado
CRUD.nombreDeObjetoSingular = "empleado"
CRUD.nombreDeObjetoPlural = "empleados"
CRUD.campoSortDefault = "idNomina"
CRUD.camposActualizables = {
  idChecador: null,
  idNomina: null,
  nombres: null,
  apellidos: null,
  fechaDeNacimento: null,
  sexo: null,
  curp: null,
  rfc: null,
  numeroDeCuenta: null,
  numeroDeSeguridadSocial: null,
  fotografia: null,
  //   sueldoActual: null,
  //   puestoActual: null,
  //Relacionado a eventosRH. estatusLaboral.
  activo: null,
  //El puesto esta dentro de los eventos.
  documentos: null
}

CRUD.camposDeBusqueda = [
  "idChecador",
  "idNomina",
  "nombres",
  "apellidos",
  "curp",
  "rfc",
  "numeroDeCuenta",
  "númeroDeSeguridadSocial"
]

CRUD.crud()

// TODO: Actualizar sueldo al aumentar/
// TODO: Actualizar el estatus cuando se desencadene un estatusLaboral.

// <!--
// =====================================
//  Modificar puesto
// =====================================
// -->

app.put("/modificar/puesto", (req, res) => {
  //Cambio de puesto
  var datos = {
    _id: req.body._id,
    _idPuestoNuevo: req.body._idPuestoNuevo
  }
  //Buscar que si exista el puesto.
  //Buscar que si exista el empleado
  modificarPuesto(datos)
    .then((empleado) =>
      estatusOk("Se creo el evento correctamente", "empleado", empleado, res)
    )
    .catch((err) => error("Hubo un error modificando el puesto", res, err))
})

// <!--
// =====================================
//  END Modificar puesto
// =====================================
// -->

// <!--
// =====================================
//  Modificar sueldo
// =====================================
// -->

app.put("/modificar/sueldo", (req, res) => {
  // Con un aumento de sueldo necesitamos
  // comprobar que no supere el maximo.

  var datos = {
    _id: req.body._id,
    nuevoSueldo: req.body.nuevoSueldo,
    observaciones: req.body.observaciones
  }

  modificarSueldo(datos)
    .then((empleado) =>
      estatusOk("Sueldo modificado", "empleado", empleado, res)
    )
    .catch((err) => error("Hubo un error modificando el puesto", res, err))
})

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

app.put("/modificar/estatusLaboral", (req, res) => {
  var datos = {
    _id: req.body._id,
    reingreso: req.body.reingreso,
    baja: req.body.baja,
    observaciones: req.body.observaciones
  }
  modificarEstatusLaboral(datos)
    .then((empleado) =>
      estatusOk("Estatus laboral modificado", "empleado", empleado, res)
    )
    .catch((err) =>
      error("Hubo un error modificando el estatus laboral", res, err)
    )
})

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

app.put("/registrar/permiso", (req, res) => {
  var datos = {
    _id: req.body._id,
    eventoPendienteDeDefinir: req.body.eventoPendienteDeDefinir,
    conGoceDeSueldo: req.body.conGoceDeSueldo,
    sinGoceDeSueldo: req.body.sinGoceDeSueldo,
    motivo: {
      porPaternidad: req.body.motivo.porPaternidad,
      porDefunción: req.body.motivo.porDefunción,
      porMatrimonio: req.body.motivo.porMatrimonio,
      paraDesempeñarUnCargoDeElecciónPopular:
        req.body.motivo.paraDesempeñarUnCargoDeElecciónPopular,
      otro: req.body.motivo.otro
    },
    fechaDeInicio: req.body.fechaDeInicio,
    fechaDeFinalizacion: req.body.fechaDeFinalizacion,
    autorizacionSupervisor: req.body.autorizacionSupervisor,
    autorizacionRH: req.body.autorizacionRH,
    comentario: req.body.comentario
  }
  registrarPermiso(datos)
    .then((empleado) =>
      estatusOk("Permiso actualizado", "empleado", empleado, res)
    )
    .catch((err) => error("Hubo un error con el permiso", res, err))
})

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
app.put("/registrar/vacaciones", (req, res) => {
  var datos = {
    _id: req.body._id,
    desde: req.body.desde,
    hasta: req.body.hasta
  }

  registrarVacaciones(datos)
    .then((empleado) =>
      estatusOk("Vacaciones registradas", "empleado", empleado, res)
    )
    .catch((err) => error("Hubo un error registrando las vacaciones", res, err))
})

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

app.put("/registrar/curso", (req, res) => {
  var datos = {
    _id: req.body._id,
    idCurso: req.body.idCurso,
    fecha: req.body.fecha
  }

  registrarCurso(datos)
    .then((empleado) =>
      estatusOk("Curso registrado", "empleado", empleado, res)
    )
    .catch((err) => error("Hubo un error registrando el curso", res, err))
})

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

app.put("/registrar/acta", (req, res) => {
  var datos = {
    _id: req.body._id,
    acta: req.body.acta,
    fecha: req.body.fecha
  }

  registrarActa(datos)
    .then((empleado) => estatusOk("Acta registrada", "empleado", empleado, res))
    .catch((err) => error("Hubo un error registrando el acta", res, err))
})

// <!--
// =====================================
//  END Registrar Acta
// =====================================
// -->

// <!--
// =====================================
//  Registrar Felicitacion
// =====================================
// -->

app.put("/registrar/felicitacion", (req, res) => {
  var datos = {
    _id: req.body._id,
    documento: req.body.documento,
    fecha: req.body.fecha
  }

  registrarFelicitacion(datos)
    .then((empleado) =>
      estatusOk("Felicitacion registrada", "empleado", empleado, res)
    )
    .catch((err) =>
      error("Hubo un error registrando la felicitacion", res, err)
    )
})

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

app.put("/registrar/amonestacion", (req, res) => {
  var datos = {
    _id: req.body._id,
    documento: req.body.documento,
    fecha: req.body.fecha
  }

  registrarAmonestacion(datos)
    .then((empleado) =>
      estatusOk("Amonestacion registrada", "empleado", empleado, res)
    )
    .catch((err) =>
      error("Hubo un error registrando la amonestacion", res, err)
    )
})

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

app.put("/registrar/bono", (req, res) => {
  var datos = {
    _id: req.body._id,
    porAsistencia: req.body.porAsistencia,
    porPuntualidad: req.body.porPuntualidad,
    porProductividad: req.body.porProductividad,
    porResultados: req.body.porResultados,
    ayudaEscolarEventual: req.body.ayudaEscolarEventual
  }

  registrarBono(datos)
    .then((empleado) => estatusOk("Bono registrado", "empleado", empleado, res))
    .catch((err) => error("Hubo un error registrando el bono", res, err))
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

app.delete("/eliminar/:idEmpleado/:idEvento", (req, res) => {
  var datos = {
    _id: req.params.idEmpleado,
    _idEvento: req.params.idEvento
  }

  eliminarEvento(datos)
    .then((empleado) =>
      estatusOk("Evento eliminado", "empleado", empleado, res)
    )
    .catch((err) => error("Hubo un error eliminando el evento", res, err))
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
