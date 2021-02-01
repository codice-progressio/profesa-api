var express = require("express")
var app = express()

var Parametros = require("../../models/defautls/parametros.model")
var guard = require("express-jwt-permissions")()
var bcrypt = require("bcryptjs")
var Usuario = require("../../models/usuario.model")
const $ =  require("@codice-progressio/easy-permissions").$
var Proceso = require("../../models/procesos/proceso")
var Departamento = require("../../models/departamento")

const permisos = require("../../seguridad/permisos.seguridad")

/**
 * Este route guarda los paramentros para definir el trabajo del sistema.
 * En general hay que crear primero la propiedad correspondiente en el schema
 * segun se vayan requiriendo los parametros.
 */

/**
 *
 * Inicializamos los parametros creando un solo objeto. No debemos tener mas de un documento en la BD
 */
app.post("/", (req, res, next) => {
  Parametros.find()
    .exec()
    .then(parametros => {
      if (parametros.length > 0) throw "Los parametros ya se han creado"
      var nPar = new Parametros()
      return nPar.save()
    })
    .then(parSaved => {
      return res.json(parSaved)
    })
    .catch(err => next(err))
})

app.delete("/", (req, res, next) => {
  Parametros.deleteOne({})
    .exec()
    .then(datos => {
      return res.json(datos)
    })
    .catch(_ => next(_))
})

//Despues de esto tiene que existir el docuemnto de parametros
// para poder continuar
app.use(async (req, res, next) => {
  var parametro = await Parametros.findOne().exec()
  if (!parametro)
    return next("No existe un documento para poder establecer este parametro")

  req["parametros"] = parametro
  next()
})

/**
 * Si el super-admin no existe hay que crearlo aqui. Despues se puede cambiar el usuario definido como super admin.
 *
 */
app.post("/super-admin/crear", async (req, res, next) => {
  var parametrosG = ""

  Parametros.findOne()
    .exec()
    .then(parametros => {
      parametrosG = parametros
      var superAdmin = parametrosG.super
      if (superAdmin.definido) throw "El administrador ya se definio."

      if (!req.body.email) throw "No se espeficio el email"
      if (!req.body.password) throw "No se especifico la contrasena"
      if (!req.body.nombre) throw "No se especifico el nombre"

      const emailEsValido = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
        req.body.email
      )

      if (!emailEsValido) throw "El correo no es valido"

      req.body.password = bcrypt.hashSync(req.body.password, 10)

      var nuevoUsuario = new Usuario()
      nuevoUsuario.email = req.body.email
      nuevoUsuario.password = req.body.password
      nuevoUsuario.nombre = req.body.nombre
      nuevoUsuario.permissions = permisos.lista

      return nuevoUsuario.save()
    })
    .then(usuario => {
      parametrosG.super.id = usuario._id
      parametrosG.super.definido = true

      return parametrosG.save()
    })
    .then(parametros => {
      return res.send(
        `Se creo el administrador como "${req.body.nombre}" con el correo "${req.body.email}". Conserva el usuario y contrasena en un lugar seguro ya que este no se puede cambiar si no se tiene el password. `
      )
    })
    .catch(err => next(err))
})

//Requiere permisos especificos pues todos los usuarios los van a utilizar.

app.get(
  "/localizacionDeOrdenes",
  $("parametros:localizacionDeOrdenes"),
  (req, res, next) => {
    Parametros.findOne({})
      .populate("localizacionDeOrdenes.procesosIniciales", null, "Proceso")
      .populate(
        "localizacionDeOrdenes.procesosInicialesAlmacen",
        null,
        "Proceso"
      )
      .populate("localizacionDeOrdenes.procesosFinales", null, "Proceso")
      .exec()

      .then(r => {
        return res.status(200).send({
          procesosIniciales: r.localizacionDeOrdenes.procesosIniciales,
          procesosFinales: r.localizacionDeOrdenes.procesosFinales,
          procesosInicialesAlmacen:
            r.localizacionDeOrdenes.procesosInicialesAlmacen,
          campoFinal: r.localizacionDeOrdenes.campoFinal,
        })
      })
      .catch(err => next(err))
  }
)

app.get(
  "/procesosEspeciales",
  $("parametros:procesosEspeciales"),
  (req, res) => {
    Proceso.find({
      _id: { $in: req.parametros.procesosEspeciales },
    })
      .then(p => res.json(p))
      .catch(err => next(err))
  }
)
app.get(
  "/departamentoTransformacion",
  $("parametros:departamentoTransformacion"),
  (req, res, next) => {
    Departamento.findById(req.parametros.departamentoTransformacion)
      .exec()
      .then(dep => {
        ;``
        return res.json(dep)
      })
  }
)

app.get(
  "/estacionesDeEscaneo",
  $("parametros:estacionesDeEscaneo"),
  (req, res, next) => {
    Parametros.findOne({})
      .populate(" estacionesDeEscaneo.departamento", null, "Departamento")
      .populate(" estacionesDeEscaneo.usuarios", null, "Usuario")
      .populate(" estacionesDeEscaneo.maquinas", null, "Maquina")
      .then(p => res.json(p.estacionesDeEscaneo))
      .catch(err => next(err))
  }
)

//DESPUES DE AQUI TODO LO DEBE SE HACER EL SUPER ADMIN

app.use($("SUPER_ADMIN"))

// ESTA FUNCION ES DE UN SOLO USO Y ES PARA ELIMINAR TODOS LOS
// ROLES DE LOS USUARIOS QUE EXISTEN ACTUALMENTE. SE PUEDE
// ELIMINAR UNA VEZ SE APLIQUE EN EL SERVIDOR.

app.post("/limpiarRolesAtiguos", (req, res, next) => {
  Usuario.updateMany({}, [{ $unset: ["role"] }])
    .exec()
    .then(update => res.send(update))
    .catch(err => next(err))
})

app.put("/configurar-super-admin/cambiar", async (req, res, next) => {
  Promise.all(
    //Contra fuerza bruta
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([
          Usuario.findById(req.body.id).select("+password").exec(),
          Parametros.findOne().exec(),
          Usuario.findById(req.user._id).exec(),
        ])
      }, 10)
    })
  )
    .then(datos => {
      const usuario = datos[0]
      const parametros = datos[1]
      const usuarioLogueado = datos[2]

      if (!usuario) throw "No existe el usuario"
      if (!usuarioLogueado) throw "Usuario logueado no existe mas."

      //Revisamos dos veces que tenga el permiso por que para llegar
      // aqui usamos el token y ese todavia tiene el permiso.
      if (
        !usuarioLogueado.permissions.includes($("SUPER_ADMIN", false))
      )
        throw "No puedes continuar con esta operacion"

      const contrasenaCorrecta = bcrypt.compareSync(
        req.body.password,
        usuario.password
      )

      if (!contrasenaCorrecta) throw "Contrasena de super admin invalida"

      while (usuario.permissions > 0) {
        usuario.permissions.pop()
      }

      permisos.lista.forEach(p => usuario.permissions.push(p))
      parametros.super.id = usuario._id

      return Promise.all([
        parametros.save(),
        //NINGUN OTRO USUARIO DEBE DE TENER EL ROL SUPER ADMIN
        Usuario.updateMany(
          {},
          { $pull: { permissions: $("SUPER_ADMIN") } }
        )
          .exec()
          .then(u => usuario.save()),
      ])
    })
    .then(datos => {
      const usuario = datos[1]
      return res.send(
        `Se establecio al usuario "${usuario.nombre}" como el nuevo super-admin`
      )
    })
    .catch(err => next(err))
})

app.put("/configurar-super-admin/permisos/reiniciar", (req, res) => {
  //Reiniciamos todos los permisos del super administrador para agregar permisos nuevos que existan o eliminar los que ya no existen.

  Usuario.findById(req.parametros.super.id)
    .select("+permissions")
    .exec()
    .then(u => {
      if (!u) throw "No existe usuario super-admin"

      while (u.permissions.length > 0) {
        u.permissions.pop()
      }

      Object.keys(permisos).forEach(p => u.permissions.push(p))

      return u.save()
    })
    .then(uS => {
      return res.send({
        mensaje: "Se actualizaron los permisos del super-administrador",
      })
    })
})

// LO QUE SIGUE SON PERSONALIZABLES PARA CADA PROYECTO

app.put("/localizacionDeOrdenes", (req, res, next) => {
  Parametros.updateOne({}, { localizacionDeOrdenes: req.body })
    .exec()
    .then(nParSave => {
      return res.json(nParSave)
    })
    .catch(err => next(err))
})

app.put("/procesosEspeciales", (req, res, next) => {
  Parametros.updateOne({}, { procesosEspeciales: req.body })
    .exec()
    .then(n => res.json(n))
    .catch(err => next(err))
})

app.put("/departamentoTransformacion", (req, res, next) => {
  Parametros.updateOne(
    {},
    { $set: { departamentoTransformacion: req.body.id } }
  )
    .exec()
    .then(p => res.json(p))
    .catch(err => next(err))
})

app.put("/estacionesDeEscaneo", (req, res, next) => {
  Parametros.updateOne({}, { $set: { estacionesDeEscaneo: req.body } })
    .exec()
    .then(p => res.json(p))
    .catch(err => next(err))
})

module.exports = app
