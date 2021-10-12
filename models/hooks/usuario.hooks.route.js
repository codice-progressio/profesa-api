const mongoose = require('mongoose')
const codice_security = require('@codice-progressio/express-authentication')


module.exports = (schema) => {
    // Solo hooks para organizarlos.
    schema.pre('save', (next) => {

    const usuarioModel =  mongoose.model(codice_security
        .configuraciones
        .usuario
        .nombre_bd)

    // Validamos la cantidad de usuarios que deben existir. 
    let cantidadUsuarios = +process.env.LIC ?? 1

    usuarioModel
        .countDocuments()
        .then(c => {
            if( c <=cantidadUsuarios ) return next()
            throw next(`Limite de usuarios alcanzado - Usuarios:${c}, Licencias: ${process.env.LIC}'`)
        })
        .catch(_=>next(_))
    })
} 



    
