var Folio = require('../models/folios/folio');

// <!-- 
// =====================================
//  FICHERO CON FUNCIONES PARA GENERAR ACTUALZIACIONES.
// =====================================

/**
 * Este fichero almacena las actualzaciones que se deben de ir aplicando 
 * cada funcion despues debe de comprobarse antes si la actualizacion no esta registrada
 * como aplicada.
 */

// -->


module.exports = {
    /**
     *Esta actualizacion se aplica para la version beta0.3.2. 
    
     Modifica las ordenes de todos los folios existen para que se adapten 
     a los cambios realizados. En general agrega nuevas propiedases
     para las ordenes:
    
        vendedor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        fechaFolio: { type: Date },
        idFolio: { type: Schema.Types.ObjectId, ref: 'Folio' },
        observacionesPedido: { type: String },
        observacionesFolio: { type: String },
        desdeAlmacen: { type: Boolean },
     .
     * Despues guarda los folios para que estos datos se actualizen en cada
     orden y este disponible la informacion.
     * @returns
     */
    actualizacion_beta0_3_3: function() {
        return new Promise((resolve, reject) => {
            Folio.find().exec().then(fols => {
                    let p = [];
                    fols.forEach(fol => {
                        p.push(fol.save());
                    });
                    return Promise.all(p);
                }).then(resp => {
                    resolve('Actualizacion beta_0.3.3 aplicada correctamente');
                })
                .catch(err => {
                    reject(err);
                });

        });

    }

};