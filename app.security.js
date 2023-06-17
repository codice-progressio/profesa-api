 //SEGURIDAD --------------------------------------
const codice_security = require("@codice-progressio/express-authentication")
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Path de usuarios 
codice_security.configuraciones.ruta_usuario = '/api/usuario'

 //Gmail requiere conexion segura. 
 codice_security.configuraciones.correo.transport['secure'] = true
 // Contrasena offline
 codice_security.configuraciones.usuario.schema["password_offline"] = String

 // Modificamos el schema de usuario para agregar la estructura
 // de las imagenes.
 codice_security.configuraciones.usuario.schema["img"] = {
   nombreOriginal: String,
   nombreBD: String,
   path: String,
 }

 codice_security.configuraciones.easy_permissions.config({
   modoProduccion: process.env.NODE_ENV === "production",
   generarPermisos: process.env.NODE_ENV !== "production",
   path: require("path").resolve(__dirname).concat("/"),
 })

 // Definimos el modo debug para este demo
 codice_security.configuraciones.debug =
   process.env.NODE_ENV === "development"
 // Usamos la configuracion por defecto de cors, pero
 // siempre la podemos sobreescribir.
 codice_security.configuraciones.cors.origin = process.env.ORIGIN
 //TOKEN
 codice_security.configuraciones.jwt.private_key = process.env.PRIVATE_KEY

 //  CORREO
 codice_security.configuraciones.correo.dominio = process.env.CORREO_DOMINIO
 codice_security.configuraciones.correo.dominio_recuperacion =
   process.env.CORREO_DOMINIO_RECUPERACION
 codice_security.configuraciones.correo.nombre_aplicacion =
   process.env.CORREO_NOMBRE_APLICACION
 codice_security.configuraciones.correo.transport.host =
   process.env.CORREO_TRANSPORT_HOST
 codice_security.configuraciones.correo.transport.port =
   process.env.CORREO_TRANSPORT_PORT
 codice_security.configuraciones.correo.transport.auth.user =
   process.env.CORREO_TRANSPORT_AUTH_USER
 codice_security.configuraciones.correo.transport.auth.pass =
   process.env.CORREO_TRANSPORT_AUTH_PASS

 codice_security.configuraciones.correo.mailOptions.from =
   process.env.CORREO_MAILOPTIONS_FROM


let unless = JSON.parse(JSON.stringify(codice_security.configuraciones.jwt.decode.unless));
unless.push("/parametros")
unless = unless.map(a => `/api` + a);

codice_security.configuraciones.jwt.decode.unless = unless


let schema = new Schema(codice_security.configuraciones.usuario.schema)

 module.exports.basico = codice_security.basico
 module.exports.schema = schema