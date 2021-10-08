const mongoose = require('mongoose')
const codice_security = require('@codice-progressio/express-authentication')


module.exports = (schema) => {
    
    // Solo hooks para organizarlos.
    
    schema.pre('find', (next) => {

    const usuarioModel =  mongoose.model(codice_security
        .configuraciones
        .usuario
        .nombre_bd)

    console.log("entro pre save")
    // Validamos la cantidad de usuarios que deben existir. 
    let cantidadUsuarios = +process.env.LIC ?? 0

    usuarioModel
        .countDocuments()
        .then(c => {
            if( c <=cantidadUsuarios ) return next()
            throw next('Limite de usuarios alcanzado')
        })
        .catch(_=>next(_))
    })
} 



    
