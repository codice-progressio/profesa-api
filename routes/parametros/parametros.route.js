var express = require("express")
var app = express()

var Parametros = require("../../models/defautls/parametros.model")
var guard = require("express-jwt-permissions")()
var bcrypt = require("bcryptjs")
var Usuario = require("../../models/usuario")
var permisos = require("../../config/permisos.config")

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

app.use(async (req, res, next) => {
  var parametro = await Parametros.find().exec()
  if (!parametro[0])
    return next("No existe un documento para poder establecer este parametro")
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
      nuevoUsuario.role = permisos.lista

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

//DESPUES DE AQUI TODO LO DEBE SE HACER EL SUPER ADMIN

// app.use(guard.check(permisos.todos.SUPER_ADMIN))

app.put(
  "/configurar-super-admin/cambiar",
  guard.check(permisos.$("SUPER_ADMIN")),
  async (req, res, next) => {
    Promise.all(
      //Contra fuerza bruta
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve([
            Usuario.findById(req.body.id).exec(),
            Parametros.findOne().exec(),
            Usuario.findById(req.user.user).exec()
          ])
        }, 10)
      })
    )
      .then(datos =>
      {
        
        console.log(`req.user`,req.user)
        const usuario = datos[0]
        const parametros = datos[1]
        const usuarioLogueado = datos[2]

        if (!usuario) throw "No existe el usuario"
        if (!usuarioLogueado) throw "Usuario logueado no existe mas."

        //Revisamos dos veces que tenga el permiso por que para llegar
        // aqui usamos el token y ese todavia tiene el permiso.
        if (!usuarioLogueado.role.includes(permisos.$("SUPER_ADMIN")))
          throw "No puedes continuar con esta operacion"

        const contrasenaCorrecta = bcrypt.compareSync(
          req.body.password,
          usuario.password
        )

        if (!contrasenaCorrecta) throw "Contrasena de super admin invalida"

        while (usuario.role > 0) {
          usuario.role.pop()
        }

        permisos.lista.forEach(p => usuario.role.push(p))
        parametros.super.id = usuario._id

        return Promise.all([
          usuario.save(),
          parametros.save(),
          //NINGUN OTRO USUARIO DEBE DE TENER EL ROL SUPER ADMIN
          Usuario.updateMany(
            {},
            { $pull: { role: permisos.$("SUPER_ADMIN") } }
          ).exec()
        ])
      })
      .then(datos => {
        const usuario = datos[0]
        return res.send(
          `Se establecio al usuario "${usuario.nombre}" como el nuevo super-admin`
        )
      })
      .catch(err => next(err))
  }
)

// LO QUE SIGUE SON PERSONALIZABLES PARA CADA PROYECTO

app.put("/localizacionDeOrdenes", (req, res, next) => {
  Parametros.updateOne({}, { localizacionDeOrdenes: req.body })
    .exec()
    .then(nParSave => {
      return res.json(nParSave)
    })
    .catch(err => next(err))
})

module.exports = app
