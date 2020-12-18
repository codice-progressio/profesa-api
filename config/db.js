var col = require("../utils/colors")

const URI_DEVELOPMENT = "mongodb://localhost:27017/IMPERIUMsic"

module.exports.enviroment = env => {
  const uri = env ? process.env.URI : URI_DEVELOPMENT
  const port = env ? process.env.PORT : 3000

  const msj_dev_bienvenida =
    col.danger("***********| PRECAUCIÓN |**********") +
    "Estas en modo desarrollo."
  const msj_pro_bienvenida =
    col.success("PRODUCCIóN ") + "Estas en modo producción."

  
  const msj_mongo =
    col.success("SERVER ONLINE") +
    `Express esta corriendo en el puerto: ${port}`

  // Selecciona cambia entre base de datos.

  const o = {
    uri: uri,
    msj_bienvenida: env ? msj_pro_bienvenida : msj_dev_bienvenida,
    env: env,
    // Este es lo mismo que env pero para hacerlo más leible.
    esModoProduccion: env,
    port: port,
    msj_mongoose_ok: msj_mongo,
  }
  return o
}

// module.exports = ENVIROMENT;
