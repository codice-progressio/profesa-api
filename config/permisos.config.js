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
  if (permisos.hasOwnProperty(permiso)) return permiso
  console.log('no definodo')
  throw "Permiso no definido"
}
module.exports.lista = Object.keys(permisos)
