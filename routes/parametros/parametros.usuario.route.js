const app = require('express')()


app.post('/', async (req, res, next) => {
    
    
    if (!req.body) throw "No se recibieron datos"
    let datos = req.body
    if (!Array.isArray(datos)) throw "No es un arreglo de datos"

    
  
     function usuario(datos) {
        // Debemos buscar si el email existe, si no existe el email,
        // entoces debemos crear un nuevo elemento.

         return new Promise((resolve, reject) =>  {
             
             const express_authentication= require('@codice-progressio/express-authentication')
             
             
             datos['email'] = datos.email?.toLowerCase() ?? undefined 

             console.log("")

             // Encriptamos el pasword
             express_authentication.hash.crypt(datos.password)
             .then(password=>{
                let filter = {
                    email: datos.email,
                    
                  }
                  console.log("")           
                  let update = {
                      ...datos,
                      inhabilitado: false,
                      password  
                  }
                  console.log("")
                  let options = {
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                    context: 'query'
                  }
                  console.log("")
                 let Usuario = require('mongoose')
                     .model(express_authentication
                     .configuraciones
                     .usuario
                     .nombre_bd)
                     console.log("")
                 return  Usuario.updateOne(filter, update, options)
                    .exec()
                  })
                  .then(() => resolve())
                  .catch(error => {
                    reject({ error: error.toString(), datos })
                  })
       
         })
      }

    const PROMESAS = req.body.map(u => usuario(u))
    Promise.allSettled(PROMESAS)
    .then(r => {
     let rechazados =
        r.filter(x => x.status === "rejected").map(x => x.reason) ?? []
      let correctos = r.filter(x => x.status === "fulfilled")?.length ?? 0

      // 2.- Separar listas de precio
        console.log(r)

      res.send({ rechazados, correctos })
    })
    .catch(_ => next(_))


});


module.exports = app