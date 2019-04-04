// Este es dl nuevo route para el folio. 

//Esto es necesario
var express = require('express');
var app = express();
var Folio = require('../models/folios/folio');
var RESP = require('../utils/respStatus');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


var CRUD = require('./CRUD');
CRUD.app = app;
CRUD.modelo = Folio;
CRUD.nombreDeObjetoSingular = 'folio';
CRUD.nombreDeObjetoPlural = 'folios';
CRUD.campoSortDefault = 'fechaEntrega';
CRUD.camposActualizables = {

    // numeroDeFolio: null ,
    cliente: null,
    fechaFolio: null,
    fechaEntrega: null,
    vendedor: null,
    observaciones: null,
    folioLineas: null,
    nivelDeUrgencia: null,
    porcentajeAvance: null,
    ordenesGeneradas: null,
    impreso: null,
    terminado: null,
    fechaTerminado: null,
    cantidadProducida: null

};

CRUD.camposDeBusqueda = [
    'numeroDeFolio',
    'observaciones',

];

CRUD.crud(
    'post', 'put', 'deletee',
);


app.get('/', (req, res) => {

    // Obtenemos todos los parametros. 
    let query = req.query;
    // Cargamos los objetos de busqueda para obtener 
    // los parametros que mandamos por el query. 
    let objetoDeBusqueda = {
        /**
         * Define si se va a buscar dentro de los folios terminados
         * o los que todavia estan en produccion. 
         */
        terminado: query.foliosTerminados == '0' ? false : query.foliosTerminados === '1' ? true : undefined,
        /**
         * El id del folio que se quiere buscar.
         */
        numeroDeFolio: query.folio,
        /**
         * El id del pedido que se quiere buscar.
         */
        folioLineas_pedido: query.pedido,
        /**
         * El id del modelo que se quiere buscar.
         */
        folioLineas_modelo: query.modelo,
        /**
         * El id del tamano que se quiere buscar.
         */
        folioLineas_tamano: query.tamano,
        /**
         * El id del color que se quiere buscar.
         */
        folioLineas_color: query.color,
        /**
         * El id del terminado que se quiere buscar.
         */
        folioLineas_terminado: query.terminado,
        /**
         * El id del cliente
         */
        cliente: query.cliente,
        /**
         * El id del vendedor. 
         */
        vendedor: query.vendedor,
        /**
         * La cantidad de registros que se van a mostrar. 
         */
        limite: query.limite,
        /**
         * Cantidad de resgistros que se va a saltar. Se usa con skip. 
         */
        desde: query.desde,
        // fechas
        /**
         * La fecha de creacion desde donde se va a empezar a filtrar. 
         */
        fechaCreacionDesdeEl: query.fechaCreacionDesdeEl,
        /**
         * La fecha de creacion hasta la cual se va a filtrar. 
         */
        fechaCreacionHasta: query.fechaCreacionHasta,
        /**
         * La fecha de entrega estimada desde donde se va a empezar a filtrar. 
         */
        fechaEntregaEstimadaDesdeEl: query.fechaEntregaEstimadaDesdeEl,
        /**
         * La fecha de entrega hasta la cual se va a filtrar. 
         */
        fechaEntregaEstimadaHasta: query.fechaEntregaEstimadaHasta,
        /**
         * La fecha de finalizacion desde donde se va a empezar a filtrar. 
         */
        fechaFinalizacionFolioDesdeEl: query.fechaFinalizacionFolioDesdeEl,
        /**
         * La fecha de finalizacion hasta la cual se va a filtrar. 
         */
        fechaFinalizacionFolioHasta: query.fechaFinalizacionFolioHasta,
        /**
         * Los campos para ordenar. Se utiliza la notacioin tipo campo1#-1@campo2#+1
         */
        sortCampos: query.sortCampos
    }

    // Eliminar vacios
    let keys = Object.keys(objetoDeBusqueda)
        // Quitamos todos los parametros de los cuales 
        // no se recivio nada. Nos brincamos el primer
        // parametro (foliosTermianados) por que al ser un boleano lo mandamos
        // a volar siempre que sea false
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (objetoDeBusqueda[key] === undefined) {
            delete objetoDeBusqueda[key]
        }
    }

    /**
     * Este arreglo contiene los diferentes pasos de filtro del aggregate. 
     */
    let arregloRedact = []


    if (objetoDeBusqueda.terminado) {
        arregloRedact.push({ $match: { terminado: objetoDeBusqueda.terminado } })
    }

    // <!-- 
    // =====================================
    //  Filtros de fechas
    // =====================================
    // -->

    // fechaCreacion
    if (objetoDeBusqueda.hasOwnProperty('fechaCreacionDesdeEl') || objetoDeBusqueda.hasOwnProperty('fechaCreacionHasta')) {

        /**
         * Guarda la construccion para la busqueda de la fecha de creacion
         */
        let obCreacion = {
            $match: {
                fechaFolio: {
                    $gte: new Date(),
                    $lte: new Date()
                }
            }
        }

        if (objetoDeBusqueda.hasOwnProperty('fechaCreacionDesdeEl')) {
            obCreacion.$match.fechaFolio.$gte = new Date(objetoDeBusqueda.fechaCreacionDesdeEl)
        }

        if (objetoDeBusqueda.hasOwnProperty('fechaCreacionHasta')) {
            obCreacion.$match.fechaFolio.$lte = new Date(objetoDeBusqueda.fechaCreacionHasta)
        }

        if (!objetoDeBusqueda.hasOwnProperty('fechaCreacionDesdeEl')) delete obCreacion.$match.fechaFolio.$gte
        if (!objetoDeBusqueda.hasOwnProperty('fechaCreacionHasta')) delete obCreacion.$match.fechaFolio.$lte

        arregloRedact.push(obCreacion)

    }
    // fechaEntregaEstimada
    if (objetoDeBusqueda.hasOwnProperty('fechaEntregaEstimadaDesdeEl') || objetoDeBusqueda.hasOwnProperty('fechaEntregaEstimadaHasta')) {

        /**
         * Guarda la construccion para la busqueda de la fecha de creacion
         */
        let obCreacionEntregaEstimada = {
            $match: {
                fechaEntrega: {
                    $gte: new Date(),
                    $lte: new Date()
                }
            }
        }

        if (objetoDeBusqueda.hasOwnProperty('fechaEntregaEstimadaDesdeEl')) {
            obCreacionEntregaEstimada.$match.fechaEntrega.$gte = new Date(objetoDeBusqueda.fechaEntregaEstimadaDesdeEl)
        }
        if (objetoDeBusqueda.hasOwnProperty('fechaEntregaEstimadaHasta')) {
            obCreacionEntregaEstimada.$match.fechaEntrega.$lte = new Date(objetoDeBusqueda.fechaEntregaEstimadaHasta)
        }

        if (!objetoDeBusqueda.hasOwnProperty('fechaEntregaEstimadaDesdeEl')) delete obCreacionEntregaEstimada.$match.fechaEntrega.$gte
        if (!objetoDeBusqueda.hasOwnProperty('fechaEntregaEstimadaHasta')) delete obCreacionEntregaEstimada.$match.fechaEntrega.$lte

        arregloRedact.push(obCreacionEntregaEstimada)

    }
    // fechaFinalizacionFolio
    if (objetoDeBusqueda.hasOwnProperty('fechaFinalizacionFolioDesdeEl') || objetoDeBusqueda.hasOwnProperty('fechaFinalizacionFolioHasta')) {

        /**
         * Guarda la construccion para la busqueda de la fecha de creacion
         */
        let obFinalizacionFolio = {
            $match: {
                fechaTerminado: {
                    $gte: new Date(),
                    $lte: new Date()
                }
            }
        }

        if (objetoDeBusqueda.hasOwnProperty('fechaFinalizacionFolioDesdeEl')) {
            obFinalizacionFolio.$match.fechaTerminado.$gte = new Date(objetoDeBusqueda.fechaFinalizacionFolioDesdeEl)
        }
        if (objetoDeBusqueda.hasOwnProperty('fechaFinalizacionFolioHasta')) {
            obFinalizacionFolio.$match.fechaTerminado.$lte = new Date(objetoDeBusqueda.fechaFinalizacionFolioHasta)
        }

        if (!objetoDeBusqueda.hasOwnProperty('fechaFinalizacionFolioDesdeEl')) delete obFinalizacionFolio.$match.fechaTerminado.$gte
        if (!objetoDeBusqueda.hasOwnProperty('fechaFinalizacionFolioHasta')) delete obFinalizacionFolio.$match.fechaTerminado.$lte

        arregloRedact.push(obFinalizacionFolio)

    }

    // <!-- 
    // =====================================
    //  END Filtros de fechas
    // =====================================
    // -->

    //folio
    if (objetoDeBusqueda.hasOwnProperty('numeroDeFolio')) {
        arregloRedact.push({ $match: { 'numeroDeFolio': objetoDeBusqueda.numeroDeFolio } })
    }

    // Cliente
    if (objetoDeBusqueda.hasOwnProperty('cliente')) {
        arregloRedact.push({ $match: { 'cliente': ObjectId(objetoDeBusqueda.cliente) } })
    }

    // vendedor
    if (objetoDeBusqueda.hasOwnProperty('vendedor')) {
        arregloRedact.push({ $match: { 'vendedor': ObjectId(objetoDeBusqueda.vendedor) } })
    }


    // Buscamos todas las coincidencias con el pedido y solo dejamos el pedido del folio que coincide.
    if (objetoDeBusqueda.hasOwnProperty('folioLineas_pedido')) {

        // Si hay pedido pero no hay numero de folio entones hacemos un match con folioLineas.pedido.
        // De esta manera
        if (!objetoDeBusqueda.hasOwnProperty('numeroDeFolio')) {

            // Si no hay pedido, buscamos que solo coincida contra el pedido de manera
            // que solo se muestre el folio que contiene el pedido. 
            arregloRedact.push({ $match: { 'folioLineas.pedido': objetoDeBusqueda.folioLineas_pedido } })

        }

        arregloRedact.push({
            // Vamos a filtrar los pedidos que coincidan con el folioLineas_pedido que se paso. 
            $project: {
                folioLineas: {
                    $filter: {
                        // La nueva propiedad que se va crear para poder traer solo los
                        // pedidos que coincidan.
                        input: "$folioLineas",
                        cond: {
                            $or: [
                                { $eq: ["$$this.pedido", objetoDeBusqueda.folioLineas_pedido] }

                            ]
                        }
                    }
                },

                // Los campos que si puede retornar project. Si no los especificamos no aparecen. 
                nivelDeUrgencia: true,
                ordenesGeneradas: true,
                impreso: true,
                terminado: true,
                numeroDeFolio: true,
                cliente: true,
                fechaFolio: true,
                fechaEntrega: true,
                vendedor: true,
                observaciones: true,
            }
        }, )
    }

    // <!-- 
    // =====================================
    //  ESTA SECCION ES EL LOOKUP-> POPULATE PERO DESDE MONGODB
    // =====================================
    // -->

    // Esta seccion de aqui se encarga de cargar de manera propia de mongoDB las referencias
    // contenidas dentro de folioLineas.modeloCompleto. 
    // Es una especia de populate. 

    /**
     * Un arreglo que contiene la agrupacion y proyeccion para volver a
     * la estructura original del folio. Es necesario hacer un concat()
     * al array arregloRedact para agregar cada uno. 
     */
    let agruparYProyectarFolio = [{

            // Una vez que cargamos los datos ahora hay que volver a agrupar. Primero hacemos un grupo 
            // que contenga todos los datos del folio. Este es el id. En este grupo tambien se agregan 
            // Las folio lineas. 
            $group: {

                _id: {
                    _id: '$_id',
                    nivelDeUrgencia: '$nivelDeUrgencia',
                    ordenesGeneradas: '$ordenesGeneradas',
                    impreso: '$impreso',
                    terminado: '$terminado',
                    numeroDeFolio: '$numeroDeFolio',
                    cliente: '$cliente',
                    fechaFolio: '$fechaFolio',
                    fechaEntrega: '$fechaEntrega',
                    vendedor: '$vendedor',
                    observaciones: '$observaciones',
                },

                folioLineas: { $push: '$folioLineas' }

            }
        },

        // Proyectamos todo para volver a tener la estructura original. 

        {
            $project: {
                _id: '$_id._id',
                nivelDeUrgencia: '$_id.nivelDeUrgencia',
                ordenesGeneradas: '$_id.ordenesGeneradas',
                impreso: '$_id.impreso',
                terminado: '$_id.terminado',
                numeroDeFolio: '$_id.numeroDeFolio',
                cliente: '$_id.cliente',
                fechaFolio: '$_id.fechaFolio',
                fechaEntrega: '$_id.fechaEntrega',
                vendedor: '$_id.vendedor',
                observaciones: '$_id.observaciones',
                folioLineas: '$folioLineas',
            }
        }
    ]




    arregloRedact.push(
        // El arreglo lo separamos en propieades folioLineas. Despues lo vamos a jutar. 
        { $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true } },
        // Buscamos la referencia con el id del modeloCompleto. 
        {
            $lookup: {
                // La referencia a las colecciones debe de estar con el nombre
                // que le da mongo, y no el nombre de el modelo. 
                from: 'modelosCompletos',
                localField: 'folioLineas.modeloCompleto',
                foreignField: '_id',
                as: 'folioLineas.modeloCompleto'
            }
        },



        // ESTO ES MUY NECESARIO. Necesitamos que modelo completo no sea un arra. 
        { $unwind: { path: "$folioLineas.modeloCompleto", preserveNullAndEmptyArrays: true } },

        // Cargamos las referencias para el modelo, tamano, color, terminado.
        {
            $lookup: {
                // Modelo
                from: 'modelos',
                localField: 'folioLineas.modeloCompleto.modelo',
                foreignField: '_id',
                as: 'folioLineas.modeloCompleto.modelo'
            }
        }, { $unwind: { path: "$folioLineas.modeloCompleto.modelo", preserveNullAndEmptyArrays: true } }, {
            $lookup: {
                from: 'tamanos',
                localField: 'folioLineas.modeloCompleto.tamano',
                foreignField: '_id',
                as: 'folioLineas.modeloCompleto.tamano'
            }
        }, { $unwind: { path: "$folioLineas.modeloCompleto.tamano", preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'colores',
                localField: 'folioLineas.modeloCompleto.color',
                foreignField: '_id',
                as: 'folioLineas.modeloCompleto.color'
            }
        }, { $unwind: { path: "$folioLineas.modeloCompleto.color", preserveNullAndEmptyArrays: true } }, {
            $lookup: {
                from: 'terminados',
                localField: 'folioLineas.modeloCompleto.terminado',
                foreignField: '_id',
                as: 'folioLineas.modeloCompleto.terminado'
            }
        }, { $unwind: { path: "$folioLineas.modeloCompleto.terminado", preserveNullAndEmptyArrays: true } }

        , {
            $lookup: {
                from: 'clientes',
                localField: 'cliente',
                foreignField: '_id',
                as: 'cliente'
            }
        }, { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'usuarios',
                localField: 'vendedor',
                foreignField: '_id',
                as: 'vendedor'
            }
        }, {
            // Quitamos el password. 
            $project: { "vendedor.password": 0 }
        }, {
            // Unimos ahora si todo. 
            $unwind: { path: "$vendedor", preserveNullAndEmptyArrays: true }
        },

    )

    // Unimos todo de nuevo 
    arregloRedact = arregloRedact.concat(agruparYProyectarFolio)



    // <!-- 
    // =====================================
    //  END ESTA SECCION ES EL LOOKUP-> POPULATE PERO DESDE MONGODB
    // =====================================
    // -->

    // Como ya tenemos los datos referenciados de modeloCompleto ahora buscamos 
    // por cada uno en particular. 

    // Estos dos son necesarios por que hay que convertir el id de un string
    // 


    // Si hay alguno de los siguientes dentro del objeto de busqueda aplicamos
    // el unwind para que no se haga por cada elemento que queremos buscar

    const arregloDeDisparadoresDeUnwind = [
        'folioLineas_modelo',
        'folioLineas_tamano',
        'folioLineas_color',
        'folioLineas_terminado',
    ]

    let generarUwind = false;

    let llavesActuales = Object.keys(objetoDeBusqueda).join(' ');
    for (let i = 0; i < arregloDeDisparadoresDeUnwind.length; ++i) {
        const element = arregloDeDisparadoresDeUnwind[i];

        if (llavesActuales.includes(element)) {
            generarUwind = true
            break
        }

    }

    if (generarUwind) {
        // No podemos hacer un match dentro de un arreglo. 
        // Separamos cada linea en sus respectivos objetos. 
        arregloRedact.push({ $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true } })

        // Modelo
        if (objetoDeBusqueda.hasOwnProperty('folioLineas_modelo')) {
            arregloRedact.push(
                // Buscamos la coincidencia con el modelo
                { $match: { 'folioLineas.modeloCompleto.modelo._id': ObjectId(objetoDeBusqueda.folioLineas_modelo) } },
            )
        }

        // tamano
        if (objetoDeBusqueda.hasOwnProperty('folioLineas_tamano')) {
            arregloRedact.push(
                // Buscamos la coincidencia con el tamano
                { $match: { 'folioLineas.modeloCompleto.tamano._id': ObjectId(objetoDeBusqueda.folioLineas_tamano) } },
            )
        }

        // color
        if (objetoDeBusqueda.hasOwnProperty('folioLineas_color')) {
            arregloRedact.push(
                // Buscamos la coincidencia con el color
                { $match: { 'folioLineas.modeloCompleto.color._id': ObjectId(objetoDeBusqueda.folioLineas_color) } },
            )
        }

        // terminado
        if (objetoDeBusqueda.hasOwnProperty('folioLineas_terminado')) {
            arregloRedact.push(
                // Buscamos la coincidencia con el terminado
                { $match: { 'folioLineas.modeloCompleto.terminado._id': ObjectId(objetoDeBusqueda.folioLineas_terminado) } },
            )
        }

        // Volvemos a juntar todo
        arregloRedact = arregloRedact.concat(agruparYProyectarFolio)
    }


    // <!-- 
    // =====================================
    //  Sort, Limit & skip
    // =====================================
    // -->
    if (objetoDeBusqueda.hasOwnProperty('sortCampos ')) {

        /**
         * Los campos por los cuales se puede ordenar. 
         */
        let camposSorteables = [
                'nivelDeUrgencia',
                'ordenesGeneradas',
                'impreso',
                'terminado',
                'numeroDeFolio',
                'cliente',
                'fechaFolio',
                'fechaEntrega',
                'vendedor',
                'observaciones',
                'folioLineas',
            ]
            // Separamos los valores
        let lv1 = objetoDeBusqueda.sortCampos.split('@');

        for (let i = 0; i < lv1.length; i++) {
            const ele = lv1[i].toString().trim();
            const regex = /.*>(-|)1/gm;
            if (!regex.test(ele)) {
                return RESP._500(res, {
                    msj: 'El elemento para ordenar no coincide con el patron aceptado. ',
                    err: `'${ele}' = Patron aceptado => ${ regex.toString() }`,

                });
            }
        }

        let lv2 = {}

        for (let i = 0; i < lv1.length; i++) {
            const element = lv1[i];
            let c = element.split('>')[0]
            let o = element.split('>')[1]

            lv2[c] = Number(o)
        }

        let llavesLv2 = Object.keys(lv2)

        let inexistentes = llavesLv2.filter(x => { return !camposSorteables.join(' ').includes(x) })

        let t = inexistentes.length
        if (t > 0) {
            return RESP._500(res, {
                msj: `${t>1?'Los campos':'El campo'} '${inexistentes.join(', ')}' no ${t>1?'son validos':'es valido.'} `,
                err: 'Es necesario que corrijas el filtro para poder continuar.',
            });
        }

        arregloRedact.push({ $sort: lv2 })
    }

    if (objetoDeBusqueda.hasOwnProperty('desde')) {
        arregloRedact.push({ "$skip": Number(objetoDeBusqueda.desde) })
    }

    if (objetoDeBusqueda.hasOwnProperty('limite')) {

        let limiteP = Number(objetoDeBusqueda.limite);
        // if (objetoDeBusqueda.hasOwnProperty('desde')) {
        //     limiteP += Number(objetoDeBusqueda.desde)
        // }
        arregloRedact.push({ "$limit": Number(limiteP) })
    }


    // <!-- 
    // =====================================
    //  END Sort, Limit & skip
    // =====================================
    // -->


    Folio.aggregate(arregloRedact).then(folios => {
            return RESP._200(res, null, [
                { tipo: 'folios', datos: folios },
            ]);
        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error filtrando los folios',
                err: err,
            });
        });

})










module.exports = app;