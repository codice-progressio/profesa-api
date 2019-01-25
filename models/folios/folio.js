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
    ordenesGeneradas: { type: Boolean, default: false },
    impreso: { type: Boolean, default: false },
    terminado: { type: Boolean, default: false }


}, { collection: 'folios', timestamps: true });

folioSchema.plugin(uniqueValidator, { message: '\'{PATH}\' debe ser único.' });

var autoPopulate = function(next) {


    this.populate('cliente', 'sae nombre');
    this.populate('vendedor', 'nombre');
    this.populate({
        path: 'folioLineas.modeloCompleto',
        populate: {
            path: 'modelo tamano color terminado'
        }
    });

    let populantes = [
        'ubicacionActual',
        'trayectoNormal',
        'trayectoRecorrido',

    ];


    populantes.forEach(pop => {
        this.populate(`folioLineas.ordenes.${pop}.departamento`);
        this.populate(`folioLineas.ordenes.${pop}.laser.maquinaActual`);
        this.populate(`folioLineas.ordenes.${pop}.transformacion.maquinaActual`);
        this.populate(`folioLineas.ordenes.${pop}.materiales.maquinaActual`);
    });






    this.populate('cliente');
    next();
};
folioSchema
    .pre('find', autoPopulate)
    .pre('findOne', autoPopulate)
    .pre('save', function(next) {
        // Borrado de relacionados con folio. Aqui hay que actualizar un poco todavia. 
        calcularNivel(this);
        copiarModeloCompletoAOrden(this);
        asignarNumeroDePedido(this);
        calcularPorcentajeDeAvance(this);
        verificarFolioTerminado(this);
        cargarDatosGeneralesDeFolioYPedidoEnOrden(this);
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
    const populate = {
        path: 'folioLineas.modeloCompleto folioLineas.laserCliente folioLineas.procesos.proceso',
        populate: {
            path: 'modelo tamano color terminado familiaDeProcesos procesosEspeciales.proceso',
            populate: {
                path: 'procesos.proceso departamento',
                populate: {
                    path: 'departamento'
                }
            }
        }
    };

    // Obtenemos la promesa. 

    Promise.all([
            mongoose.models.Folio.findOne(folio._id).populate(populate).exec(),
            new Promise((resolve, reject) => {
                // Obtenemos los id por default para el departamento de 
                // control de produccion y el de laser. 
                mongoose.models.Defaults.find().exec()
                    .then(resp => {
                        // Obtenemos los id de los departamentos. 
                        let idControlDeProduccion = resp[0].PROCESOS.CONTROL_DE_PRODUCCION;
                        let idAlmacenDeBoton = resp[0].PROCESOS.ALMACEN_DE_BOTON;

                        // Generamos las promesas para los deptos. 
                        return Promise.all([
                            mongoose.models.Proceso.findOne({ _id: idControlDeProduccion }).exec(),
                            mongoose.models.Proceso.findOne({ _id: idAlmacenDeBoton }).exec(),
                        ]);
                    }).then(procesos => {
                        // Separamaos los procesos para devolverlos en un  objeto

                        resolve({
                            controlDeProduccion: procesos[0],
                            almacenDeBoton: procesos[1],
                            laser: procesos[2]
                        });

                    })
                    .catch(err => {
                        reject(
                            RESP.errorGeneral({
                                msj: 'Hubo un error al obtener los defaults para este folio.',
                                err: err,
                            })
                        );
                    });
            }),
        ]).then(resp => {
            // Separamos los resultados. 
            let folioPopulado = resp[0];
            let procesoControlDeProduccion = resp[1].controlDeProduccion;
            let procesoAlmacenDeBoton = resp[1].almacenDeBoton;


            // Recorremos cada linea del folio para generar sus órdenes.
            for (let i = 0; i < folioPopulado.folioLineas.length; i++) {
                const linea = folioPopulado.folioLineas[i];
                // Debe tener las órdenes generadas y no debe tener el
                // trayecto generado. 
                if (linea.ordenesGeneradas && !linea.trayectoGenerado) {

                    // <!-- 
                    // =====================================
                    //  TODAS LAS ORDENES INCLUIDAS LAS DE ALMACEN
                    //  DEBEN DE PASAR POR AQUI. LAS ORDENES DE ALMACEN
                    //  TIENEN QUE LLEVAR POR LO MENOS EL CONTROL DE PRODUCCION
                    //  Y LOS PROCESOS ESPECIALES QUE SE DEFINAN.length

                    //  Si las ordenes van laseradas hay que comprobar 
                    // que el departamento de laser tambien esta
                    // asignado. 

                    // =====================================
                    // -->

                    // Definimos la trayectoria que ocupa cada órden.

                    //Recorremos cada órden.
                    linea.ordenes.forEach(ordenParaModificar => {

                        //Si es de almacen agregamos control de produccion y surtir desde almacen. 

                        if (linea.almacen) {
                            // Creamos el objeto trayecto para control de produccion.
                            let trayectoControlDeProduccion = {
                                orden: 0,
                                departamento: procesoControlDeProduccion.departamento
                            };

                            // Creamos el objeto trayecto para surtir desde almacen. 
                            let trayectoSurtirDesdeAlmacen = {
                                orden: 0.1,
                                departamento: procesoAlmacenDeBoton.departamento
                            };

                            // Lo agregamos al trayectoNormal de la orden. 
                            ordenParaModificar.trayectoNormal.push(trayectoControlDeProduccion);
                            ordenParaModificar.trayectoNormal.push(trayectoSurtirDesdeAlmacen);

                        } else {

                            // COMO NO ES DE ALMACEN NO NECESITAMOS CARGAR ENTREGA DE ORDENES A
                            // PROCESO DE CONTROL DE PRODUCCION (EL PROCESO) POR QUE LA FAMILIA DE
                            // MODELOS SIEMPRE LO TRAE INCLUIDO. 

                            // Cargamos los procesos que vienen definimos en el modeloCompleto. 
                            linea.modeloCompleto.familiaDeProcesos.procesos.forEach(procesosDeLaFamilia => {
                                ordenParaModificar.trayectoNormal.push({
                                    orden: procesosDeLaFamilia.orden,
                                    departamento: procesosDeLaFamilia.proceso.departamento,
                                });
                            });

                            // Cargamos los procesos FIJOS extras propios del modelo completo.
                            linea.modeloCompleto.procesosEspeciales.forEach(procesosDelModelo => {
                                ordenParaModificar.trayectoNormal.push({
                                    orden: procesosDelModelo.orden,
                                    departamento: procesosDelModelo.proceso.departamento,
                                });
                            });

                        }

                        // Cargamos los procesos que se definieron en el pedido. Aqui vienen los 
                        // que se guardan cuando el pedido se surte desde almacen. 
                        linea.procesos.forEach(procesosDelPedido => {
                            ordenParaModificar.trayectoNormal.push({
                                orden: procesosDelPedido.orden,
                                departamento: procesosDelPedido.proceso.departamento,
                            });
                        });

                        // Tomamos el primer departamento y lo volvemos como ubicacion
                        // actual.


                        ordenParaModificar.ubicacionActual = {
                            departamento: mongoose.Types.ObjectId(ordenParaModificar.trayectoNormal[0].departamento._id),
                            entrada: new Date().toISOString(),
                            orden: ordenParaModificar.trayectoNormal[0].orden
                        };

                        if (ordenParaModificar.trayectoNormal.length > 1) {
                            ordenParaModificar.siguienteDepartamento = {
                                departamento: mongoose.Types.ObjectId(ordenParaModificar.trayectoNormal[1].departamento._id),
                                orden: ordenParaModificar.trayectoNormal[1].orden
                                    // entrada: new Date().toISOString()
                            };
                        }
                    });


                    folioPopulado.trayectoGenerado = true;
                    folioPopulado.ordenesGeneradas = true;
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

/**
 *Revisamos si el folio tiene todos sus pedidos como terminados. 
 Si es asi entonces cambiamos la bandera a terminado. 
 *
 * @param {*} folio
 */
function verificarFolioTerminado(folio) {


    // Recorremos todos los pedidos.
    for (let i = 0; i < folio.folioLineas.length; i++) {
        const linea = folio.folioLineas[i];
        // Recorremos todas las ordenes.
        folio.terminado = true;
        linea.terminado = true;
        for (let o = 0; o < linea.ordenes.length; o++) {
            const orden = linea.ordenes[o];
            // Si una sola orden no esta terminada 
            // basta para que el pedido y el folio no esten termiandos. 
            if (!orden.terminada) {
                folio.terminado = false;
                linea.terminado = false;
                // Break por que hay que comprobar los demas pedidos.
                break;
            }
        }
    }

}

/**
 * Carga los datos del folio y pedido en la oren para 
 * acceso mas facil. 
 *
 * @param {*} folio
 */
function cargarDatosGeneralesDeFolioYPedidoEnOrden(folio) {
    folio.folioLineas.forEach(pedido => {
        pedido.ordenes.map(orden => {

            // Cargamos el vendedor. 
            orden.vendedor = folio.vendedor;

            // Cargamos la fecha del folio en la ord0en.
            orden.fechaFolio = folio.fechaFolio;

            // cargamos la referencia del folio
            orden.idFolio = folio._id;

            // Unimos todas las observaciones. 
            if (pedido.observaciones) orden.observacionesPedido = pedido.observaciones;
            if (folio.observaciones) orden.observacionesFolio = folio.observaciones;

            // Mostrar como pendiente de surtir si viene de alamcen
            orden.desdeAlmacen = pedido.almacen;

        });
    });
}

module.exports = mongoose.model('Folio', folioSchema);