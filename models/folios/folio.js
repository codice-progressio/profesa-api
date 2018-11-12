var mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');
var colores = require('../../utils/colors');
var folioLineaSchema = require('./folioLinea');
var NVU = require('../../config/nivelesDeUrgencia');
var Schema = mongoose.Schema;

var RESP = require('../../utils/respStatus');

// schmea. (key) no es obligatorio el nivel en el folio.
delete NVU.KEY.required;
//Para este folio el nivel de urgencia por default debe ser almacen.

NVU.KEY.default = NVU.LV.A; //ALMACEN

var folioSchema = new Schema({

    numeroDeFolio: { type: String, unique: true, required: [true, 'El folio es necesario'] },
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es necesario'] },
    fechaFolio: { type: Schema.Types.Date, required: [true, 'La fecha es necesaria'] },
    fechaEntrega: { type: Schema.Types.Date },
    vendedor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: [true, 'El vendedor es necesario'] },
    observaciones: { type: String },
    // folioLineas: [{ type: Schema.Types.Mixed, ref: 'FolioLinea' }]
    folioLineas: [folioLineaSchema],
    nivelDeUrgencia: NVU.KEY,
    porcentajeAvance: { type: Number, min: 0, max: 100 },
    ordenesGeneradas: { type: Boolean, default: false }


}, { collection: 'folios', timestamps: true });

folioSchema.plugin(uniqueValidator, { message: '\'{PATH}\' debe ser único.' });

// Borrado de relacionados con folio. Aqui hay que actualizar un poco todavia. 
folioSchema.pre('save', function(next) {
    calcularNivel(this);
    copiarModeloCompletoAOrden(this);
    asignarNumeroDePedido(this);
    calcularPorcentajeDeAvance(this);
    next();
});

folioSchema.post('save', function() {
    // Si la linea se surte de almacen entonces la trayectoria tiene 
    // que estar vacia. 
    let a = colores.warning('Validaciones pendientes: Si es desde almacen entonces en el post no se define la trayectoria de producción');
    trayectoDeOrden(this);
    console.log(a);
});

folioSchema.methods.calcularNivel = function(idFolio) {
    var schema = mongoose.model('Folio', folioSchema);
    schema.findById(idFolio).then(fol => { fol.save(); }).catch(err => {
        let a = colores.danger('No se actualizo el nivel de importancia del folio: ' + err);
        console.log(a);
    });
};

// Copia el trayecto a la órden tomando los valores de el órden
// de procesos de los siguientes puntos: (En este órden. )
//      1.- ModeloCompleto.FamiliaDeProcesos. [Numeros enteros. 1, 2, 3 ... ]
//      2.- ModeloCompleto.FamiliaDeProcesos. [Numeros decimales. 1.1, 2.1, 3.1 ... ]
//      3.- Folio.LineaFolio.Procesos. [Numeros decimales. 1.2, 2.2, 3.2 ... ]
// Los reordena y ese es el órden que tomara el trayecto. 

function trayectoDeOrden(folio) {
    // Si el folio ya genero las órdenes no se ejecuta esta acción. Así no hay un bucle infinito. 
    if (folio.ordenesGeneradas) { return; }

    // Datos para popular el folio. Es necesario buscarlo de nuevo para tener
    // toda la información que requerimos para el trayecto de las órdenes. 
    const p = {
        path: 'folioLineas.modeloCompleto folioLineas.laserCliente folioLineas.procesos.proceso',
        populate: {
            path: 'modelo tamano color terminado laserAlmacen versionModelo familiaDeProcesos procesosEspeciales.proceso',
            populate: {
                path: 'procesos.proceso departamento',
                populate: {
                    path: 'departamento'
                }
            }
        }
    };

    // Obtenemos la promesa. 
    var folPopu = mongoose.models['Folio'].findById(folio._id).populate(p).exec();

    folPopu.then(folioPopulado => {
            // Recorremos cada linea del folio para generar sus órdenes.
            for (let i = 0; i < folioPopulado.folioLineas.length; i++) {
                const linea = folioPopulado.folioLineas[i];
                // No puede ir para alamacen, debe tener las órdenes generadas y no debe tener el
                // trayecto generado. 
                if (!linea.almacen && linea.ordenesGeneradas && !linea.trayectoGenerado) {
                    console.log(`5.${i}`);
                    //No es de almacen y se generaron las órdenes. 
                    // Definimos la trayectoria que ocupa cada órden.
                    // A esta altura se supone que todo debe de pasar por 
                    // producción en algún nivel. 

                    // Populamos el folio.
                    // Ahora recorremos todos los departamentos que tenemos 
                    // los procesos.
                    //Recorremos cada órden.
                    linea.ordenes.forEach(orden => {

                        // Cargamos los procesos que vienen definimos en el modeloCompleto. 
                        linea.modeloCompleto.familiaDeProcesos.procesos.forEach(f => {
                            orden.trayectoNormal.push({
                                orden: f.orden,
                                departamento: f.proceso.departamento,
                            });
                        });

                        // Cargamos los procesos especiales extras del modelo. 
                        linea.modeloCompleto.procesosEspeciales.forEach(proc => {
                            orden.trayectoNormal.push({
                                orden: proc.orden,
                                departamento: proc.proceso.departamento,
                            });
                        });

                        // Cargamos los procesos que se definieron en el pedido. 
                        linea.procesos.forEach(proc => {
                            orden.trayectoNormal.push({
                                orden: proc.orden,
                                departamento: proc.proceso.departamento,
                            });
                        });

                        // Tomamos el primer departamento y lo volvemos como ubicacion
                        // actual.

                        orden.trayectoNormal.sort(function(a, b) {
                            return (a.orden - b.orden);
                        });

                        // Actualizamos la ubicación actual. 
                        orden.ubicacionActual = {
                            departamento: mongoose.Types.ObjectId(orden.trayectoNormal[0].departamento._id),
                            entrada: new Date().toISOString(),
                            orden: orden.trayectoNormal[0].orden
                        };

                        if (orden.trayectoNormal.length > 1) {
                            orden.siguienteDepartamento = {
                                departamento: mongoose.Types.ObjectId(orden.trayectoNormal[1].departamento._id),
                                orden: orden.trayectoNormal[1].orden
                                    // entrada: new Date().toISOString()
                            };
                        }
                    });

                    folioPopulado.trayectoGenerado = true;
                    folioPopulado.ordenesGeneradas = true;
                } else {
                    console.log(colores.warning('NO SE ORDENA POR QUE VA PARA ALMACEN =>>>') + 'No se ordena por que va para almacen.');
                }
            }
            if (folioPopulado.trayectoGenerado) {
                return folioPopulado.save();
            }
            return;
        }).then(folioParaGrabar => {
            console.log(colores.success('ORDENES') + 'Se generaron las órdenes de manera correcta.');
            return;
        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
        });

}

function calcularNivel(folio) {
    // RECORREMOS TODAS LAS ORDENES PARA OBTENER 
    // LOS VALORES MÁS ALTOS DE nivelDeUrgencia. URGENTE ES EL MÁS ALTO. 

    var temp = NVU.LV.A;

    for (let i = 0; i < folio.folioLineas.length; i++) {
        const linea = folio.folioLineas[i];

        if (linea.nivelDeUrgencia === NVU.LV.U) {
            // Si hay una sola linea urgente entonces 
            // tlodo el folio es urgente. 
            temp = NVU.LV.U;
            break;
        } else if (linea.nivelDeUrgencia === NVU.LV.M) {
            // Si hay una linea que sea muestra entonces
            // lo mandamos a temporal para revisar que no haya
            // lineas urgentes. 
            temp = NVU.LV.M;
        } else if (linea.nivelDeUrgencia === NVU.LV.P && temp !== NVU.LV.M) {
            // Si no es muestra y hay una linea que sea producción
            // entonces lo mandamos a temporal para revisar que no haya
            //  lineas urgentes o muestras. 
            temp = NVU.LV.P;
        } else if (temp !== NVU.LV.P && temp !== NVU.LV.M) {
            // Si temp no es ni producción ni muestras entonces
            // tiene que ser almacen y lo mandamos a temporal 
            // para seguir revisando la otras lineas. 
            console.log('El almacen');
        }
    }
    folio.nivelDeUrgencia = temp;
}

function copiarModeloCompletoAOrden(folio) {
    let a = 'Copiando modelo completo a órden.';
    console.log(colores.success(['DEBUG']) + a);

    // Recorremos todas las órdenes de todos los pedidos y copiamos
    // a la órden. 
    folio.folioLineas.forEach(linea => {
        let modeloCompleto = linea.modeloCompleto;
        linea.ordenes.forEach(orden => {
            orden.modeloCompleto = modeloCompleto;
        });
    });
}

function asignarNumeroDePedido(folio) {
    // ASIGNAMOS EL NÚMERO DE PEDIDO. 
    for (let i = 0; i < folio.folioLineas.length; i++) {
        const linea = folio.folioLineas[i];
        let definicionPed = `${folio.numeroDeFolio}-${i}`;
        linea.pedido = definicionPed;
        for (let j = 0; j < linea.ordenes.length; j++) {
            const orden = linea.ordenes[j];
            orden.pedido = definicionPed;
            orden.orden = `${definicionPed}-${orden.numeroDeOrden}`;
        }
    }
}

function calcularPorcentajeDeAvance(folio) {
    // Esta función se encarga de calcular el porcentaje de avance 
    // del folio, la linea y la órden. 

    // Declamramos la sumatoria de porcentaje de la linea 
    // para asignar el porcentaje de avance del folio. 
    var sumatoriaDePorcentajeDeLinea = 0;

    // Recorremos cada linea.
    for (let i = 0; i < folio.folioLineas.length; i++) {
        const linea = folio.folioLineas[i];

        // Declaramos la sumatoria de porcentaje de las órdenes
        // de cada linea. 
        var sumatoriaDePorcentajesDeOrden = 0;

        // Recorremos cada órden. 
        for (let i = 0; i < linea.ordenes.length; i++) {
            const orden = linea.ordenes[i];

            // Si la órden está terminada entonces definimos el porcentaje 
            // al 100%. 
            if (orden.terminada) {
                orden.porcentajeAvance = 100;
            } else {
                // Tamaño del recorrido. 
                var tamanoTrayectoNormal = orden.trayectoNormal.length;
                // Recorrido actual 
                var tamanoTrayectoRecorrido = orden.trayectoRecorrido.length;


                // console.log('trayectonormal: ' + tamanoTrayectoNormal);
                // console.log('recorrido: ' + tamanoTrayectoRecorrido);


                if (tamanoTrayectoNormal > tamanoTrayectoRecorrido) {
                    orden.porcentajeAvance = (tamanoTrayectoRecorrido / tamanoTrayectoNormal) * 100;
                    orden.porcentajeAvance = tamanoTrayectoRecorrido > 0 ? orden.porcentajeAvance : 0;
                } else {
                    // console.log(` El trayecto recorrido de esta órden ${orden.orden} es mayor que su trayecto normal`);
                    orden.porcentajeAvance = 0;
                }
            }
            sumatoriaDePorcentajesDeOrden += orden.porcentajeAvance;
        }
        // Asignamos el porcentaje de la linea. 
        // console.log('Sumatoria orden ' + sumatoriaDePorcentajesDeOrden);
        // console.log('Total de órdenes ' + linea.ordenes.length);


        linea.porcentajeAvance = sumatoriaDePorcentajesDeOrden / linea.ordenes.length;
        sumatoriaDePorcentajeDeLinea += linea.porcentajeAvance;
        // console.log('% linea' + linea.porcentajeAvance);
    }

    folio.porcentajeAvance = sumatoriaDePorcentajeDeLinea / folio.folioLineas.length;
    // console.log('Folio porcentaje: ' + folio.porcentajeAvance);


}

module.exports = mongoose.model('Folio', folioSchema);