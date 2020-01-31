const express = require("express")
const app = express()
const RESP = require("../../utils/respStatus")

var RepoPer = require("../../models/almacenRefaccionesYMateriaPrima/reportePersonalizadoAlmacenProduccion.model")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", (req, res) => {
  const newRepo = new RepoPer(req.body)
  newRepo
    .save()
    .then(repo => {
      return RESP._200(res, "Se guardo el reporte personalizado", [
        { tipo: "reportePersonalizadoAlmacenProduccion", datos: repo }
      ])
    })
    .catch(err =>
      erro(res, err, "Hubo un error guardando el reporte personalizado")
    )
})

app.get("/", async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await RepoPer.countDocuments().exec()

  RepoPer.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(repopers => {
      return RESP._200(res, null, [
        { tipo: "reportesPersonalizadosAlmacenProduccion", datos: repopers },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err =>
      erro(res, err, "Hubo un error buscando los reportes personalizados")
    )
})

// <!--
// =====================================
//  Id
// =====================================
// -->
app.get("/:id", (req, res) => {
  RepoPer.findById(req.params.id)
    .exec()
    .then(repoper => {
      if (!repoper) throw "No existe el id"

      return RESP._200(res, null, [
        { tipo: "reportePersonalizadoAlmacenProduccion", datos: repoper }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los puestos"))
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
app.get("/buscar/:termino", async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")
  const termino = String(
    req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
  const b = campo => ({
    [campo]: { $regex: termino, $options: "i" }
  })

  const $match = {
    $or: []
  }

  ;["nombre", "descripcion"].forEach(x => $match.$or.push(b(x)))

  const total = await RepoPer.aggregate([
    { $match },
    { $count: "total" }
  ]).exec()

  RepoPer.aggregate([
    { $match },
    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } }
  ])
    .exec()
    .then(repopers => {
      //Si no hay resultados no se crea la propiedad
      // y mas adelante nos da error.
      if (!total.length) total.push({ total: 0 })

      return RESP._200(res, null, [
        { tipo: "reportesPersonalizadosAlmacenProduccion", datos: repopers },
        { tipo: "total", datos: total.pop().total }
      ])
    })
    .catch(err =>
      erro(res, err, "Hubo un error buscando los reportes personalizados")
    )
})

// <!--
// =====================================
//  END termino
// =====================================
// -->

//   <!--
//   =====================================
//    Modificar
//   =====================================
//   -->
app.put("/", (req, res) => {
  RepoPer.findById(req.body._id)
    .exec()
    .then(repoPer => {
      if (!repoPer) {
        throw "No existe el reporte personalizado"
      }

      let a = ["nombre", "articulos", "descripcion"].forEach(x => {
        repoPer[x] = req.body[x]
      })

      return repoPer.save()
    })
    .then(repoPer => {
      return RESP._200(
        res,
        "Se modifico correctamente el reporte personalizado",
        [{ tipo: "reportePersonalizado", datos: repoPer }]
      )
    })
    .catch(err =>
      erro(res, err, "Hubo un error actualizando el reporte personalizado")
    )
})

//   <!--
//   =====================================
//    END Modificar
//   =====================================
//   -->

app.delete("/:id", (req, res) => {
  RepoPer.findById(req.params.id)
    .exec()
    .then(repoPer => {
      if (!repoPer) throw "No existe el reporte personalizado"

      return repoPer.remove()
    })
    .then(repoPer => {
      return RESP._200(
        res,
        "Se elimino de manera correcta el reporte personalizado",
        [{ tipo: "reportePersonalizado", datos: repoPer }]
      )
    })
    .catch(err =>
      erro(res, err, "Hubo un error eliminando el reporte personalizado")
    )
})

module.exports = app
