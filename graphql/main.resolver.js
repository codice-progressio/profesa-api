const path = require("path")
const { buildSchema } = require("graphql")
const fs = require("fs")

try {
  // AQUI LOS RESOLVER

  const resolvers = {
    ...require("./usuario.resolver"),
    ...require("./orden_de_venta.resolver"),
  }

  // LOS SCHEMAS SE AGREGAN SOLOS
  //Buscamos todos los ficheros de esta carpeta
  const ficheros = fs.readdirSync(__dirname)
  let schemas = ficheros
    .map(fichero => {
      if (fichero.endsWith(".gql"))
        return fs.readFileSync(path.join(__dirname, fichero), "utf8")
      return null
    })
    .filter(x => x)
    .join("\n")
  schemas = buildSchema(schemas)

  module.exports = {
    schemas,
    resolvers,
  }
} catch (error) {
  console.error(error)
}
