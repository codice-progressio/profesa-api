const fs = require("fs")

const permisos = {
  SUPER_ADMIN: "El usuario administrador",
  login: "Permite que un usuario se loguee"
}

/**
 *Comprueba que el permiso esta definido. Si el estring
 esta definido lo retorna, si no, manda un error. 
 *
 * @param {*} permiso
 * @returns
 */
module.exports.$ = permiso => {
  if (process.env.NODE_ENV === "production") return permiso

  if (permisos.hasOwnProperty(permiso)) return permiso

  const archivo = "config/permisos.config.txt"

  if (fs.existsSync(archivo)) {
    var data = fs.readFileSync(archivo, "utf-8")
    if (!data.includes(permiso)) {
      data = data
        .concat(`"${permiso}":"NO SE HA DEFINIDO DESCRIPCION",\n`)
        
      fs.writeFileSync(archivo, data)

      console.log("Permiso no definido " + permiso)
    }
  }
}
module.exports.lista = Object.keys(permisos)
