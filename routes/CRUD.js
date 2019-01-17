var colores = require("../utils/colors");
var RESP = require('../utils/respStatus');
var CONSTANSTES = require('../utils/constantes');


/**
 * Esta funcion ejecuta una consulta a la base de datos y retorna los 
 * elementos. 
 * 
 * Por defecto limita los resultados (Ver las constantes dentro del procedimiento.)
 * y tiene la capacidad de paginacion y ordenacion. Para la ordenacion utiliza un campo por 
 * defecto que tiene que ser definido para que no de error. 
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta. 
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route. 
 * @param {*} nombreDeObjeto El nombre que recivira el objet. En el caso del get es en plurar (usuarios, modelos, tamanos, etc.)
 * @param {*} campoSortDefault El campo por defecto que se ordenara. 
 * @return {total, [datos], msj } Retorna el objeto con la estructura comun y los datos consultados. Incluye el total de elementos de la bd. 
 */
const get = function(modelo, app, nombreDeObjeto, campoSortDefault) {
    app.get('/', (req, res, next) => {
        const CONSULTAS = CONSTANSTES.consultas(req.query, campoSortDefault);

        Promise.all([
                modelo.find()
                .limit(CONSULTAS.limite)
                .skip(CONSULTAS.desde)
                .sort({
                    [CONSULTAS.campo]: CONSULTAS.sort
                })
                .exec(),
                modelo.countDocuments()
            ]).then(resp => {

                return RESP._200(res, null, [
                    { tipo: nombreDeObjeto, datos: resp[0] },
                    { tipo: 'total', datos: resp[1] },
                ]);

            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error cargando los ${nombreDeObjeto}.`,
                    err: err,
                });
            });
    });
};


/**
 * Ejecuta una busqueda por id y retorna el elemento encontrado si existe.  
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta. 
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route. 
 * @param {*} nombreDeObjeto El nombre que recivira el objet. En el caso del get es en plurar (usuarios, modelos, tamanos, etc.)
 */
const getById = function(modelo, app, nombreDeObjeto) {
    app.get('/:id', (req, res, next) => {
        const id = req.params.id;

        if (!id) {
            return RESP._400(res, {
                msj: 'No definiste el id para la busqueda: ${nombreDeObjeto}',
                err: 'Es necesario que definas un id para la busqueda.',

            });
        }
        // <!-- 
        // =====================================
        //  BUSCAMOS CON FIND Y NO CON FINDBYID PARA QUE SE LANZE EL PRE HOOK
        // =====================================
        // -->
        modelo.find({ _id: id }).exec()
            .then(elemento => {
                // Como es por id solo se puede obtener un elemento
                if (elemento.length === 0) {
                    return RESP._400(res, {
                        msj: 'No hubo coincidencia.',
                        err: `El id que ingresaste no coincide con ninguno en la bd: ${nombreDeObjeto}`,
                    });
                }

                // Retornamos el unico elemento que debe haber. El [0]
                return RESP._200(res, null, [
                    { tipo: nombreDeObjeto, datos: elemento[0] },
                ]);

            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error buscando el elemento por su id: ${nombreDeObjeto}`,
                    err: err,
                });
            });

        // <!-- 
        // =====================================
        //  END BUSCAMOS CON FIND Y NO CON FINDBYID PARA QUE SE LANZE EL PRE HOOK
        // =====================================
        // -->

    });
};




/**
 * Ejecuta una busqueda en base al termino que se le pase como parametro. Es necesario
 * definir los campos en que se va a buscar. 
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta. 
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route. 
 * @param {*} nombreDeObjeto El nombre que recivira el objet. En el caso del get es en plurar (usuarios, modelos, tamanos, etc.)
 * @param {*} camposDeBusqueda Un arreglo donde se deben enlistar los campos de busqueda que se utilizaran en la busqueda.
 * @param {*} campoSortDefault El campo por defecto que se ordenara. 
 * @return {total, [datos], msj } Retorna el objeto con la estructura comun y los datos consultados. Incluye el total de elementos de la bd. 

 */
const getBuscar = function(modelo, app, nombreDeObjeto, camposDeBusqueda, campoSortDefault) {

    app.get('/buscar/:termino', (req, res, next) => {
        const CONSULTAS = CONSTANSTES.consultas(req.query, campoSortDefault);
        // El termino de busqueda que se va a aplicar. 
        const termino = req.params.termino;

        // Hace un match completo.
        const regex = new RegExp(`^.*${termino}.*$`, 'mig');

        // El arreglo que contendra los diferentes campos 
        // para buscar en ellos. 
        const arregloParaBusqueda = [];
        for (let i = 0; i < camposDeBusqueda.length; i++) {
            const nombreCampo = camposDeBusqueda[i];
            const objBusqueda = {
                [nombreCampo]: { $regex: regex }
            };
            arregloParaBusqueda.push(objBusqueda);
        }

        Promise.all([
                // Contamos los documentos.
                modelo.find().or(arregloParaBusqueda).countDocuments(),
                // Obtenemos los documentos. 
                modelo.find()
                .or(arregloParaBusqueda)
                .limit(CONSULTAS.limite)
                .skip(CONSULTAS.desde)
                .sort({
                    [CONSULTAS.campo]: CONSULTAS.sort
                })
                .exec()

            ])
            .then(resp => {
                return RESP._200(res, null, [
                    { tipo: 'total', datos: resp[0] },
                    { tipo: nombreDeObjeto, datos: resp[1] },
                ]);

            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error realizando la busqueda: ${nombreDeObjeto}`,
                    err: err,
                });
            });

    });
};


/**
 * Ejecuta una peticion post y retorna el elemento guardado. 
 * 
 * @param {*} modelo El modelo (schema) para realizar la consulta. 
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route. 
 * @param {*} nombreDeObjeto El nombre que recivira el objet. En el caso del post es en singular (usuario, modelo, tamano, etc.)
 * @return { [datos], msj } Retorna el objeto con la estructura comun y los datos consultados.  
 */
const post = function(modelo, app, nombreDeObjeto) {
    app.post('/', (req, res, next) => {
        // Obtenemos el mdelo. 
        const datosAGrabar = new modelo(req.body);

        console.log(datosAGrabar)

        datosAGrabar.save().then(resp => {
                return RESP._200(res, `Se guardo de manera correcta el ${nombreDeObjeto}.`, [
                    { tipo: nombreDeObjeto, datos: resp },
                ]);

            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error guardando los datos: ${nombreDeObjeto}.`,
                    err: err,
                });
            });
    });
};


/**
 * Ejecuta una peticion put y retorna el elemento modificado. Esta operacion no utilza ningun 
 * comando de actualizacion. Primero busca el elemento con findById y luego ejecuta el save para
 * que las validaciones se apliquen y no haya choques en futuras inplementaciones de pre y post. 
 * 
 * Requiere un objeto que contenga req.body._id para actualizarlo.
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta. 
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route. 
 * @param {*} nombreDeObjeto El nombre que recivira el objet. En el caso del post es en singular (usuario, modelo, tamano, etc.)
 * @param {*} objetoDeActualizacion El objeto que contiene la estrucutura de los datos que se van a actualizar. Es un objeto con los datos vacios. 
 * @return { [dato], msj } Retorna el objeto original y un mensaje de confirmacion.  
 * 
 */
const put = function(modelo, app, nombreDeObjeto, objetoDeActualizacion) {

    app.put('/', (req, res, next) => {

        const id = req.body._id;
        if (!id) {
            return RESP._400(res, {
                msj: 'No definiste un id para modificar.',
                err: 'Es necesario un _id.',

            });
        }

        modelo.findById(id).then(resp => {
                if (!resp) {
                    return RESP._400(res, {
                        msj: `No existe el elemento: ${nombreDeObjeto}`,
                        err: `El id que ingresaste no esta registrado en la base de datos.`,
                    });
                }

                // Cargamos los datos para modificar con el objeto defido para ello. 
                for (const key in objetoDeActualizacion) {
                    if (objetoDeActualizacion.hasOwnProperty(key)) {
                        resp[key] = req.body[key];
                    }
                }

                // Guardamos las modificaciones. 
                return resp.save();
            }).then(elementoGuardado => {
                return RESP._200(res, `Se guardo de manera correcta el elemento ${nombreDeObjeto}`, [
                    { tipo: nombreDeObjeto, datos: elementoGuardado },
                ]);
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error: ${nombreDeObjeto}.`,
                    err: err,
                });
            });


    });
};



/**
 * Ejecuta una peticion delete y retorna el elemento eliminado. 
 * 
 * Requiere un elemento /:idDelObjeto para ejecutar la accion. 
 * 
 * Este funcion desata un prehook 'remove' por que primero buscamos por id y luego
 * si el documento exite invocamos documentoEncontrado.remove()
 *
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta. 
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route. 
 * @param {*} nombreDeObjeto El nombre que recivira el objet. En el caso del post es en singular (usuario, modelo, tamano, etc.)
 */
const deletee = function(modelo, app, nombreDeObjeto) {

    app.delete('/:id', (req, res, next) => {
        const id = req.params.id;

        if (!id) {
            return RESP._400(res, {
                msj: 'No definiste un id para eliminar.',
                err: 'Es necesario que definas un id.',
            });
        }

        // Buscamos si el documento existe. 
        modelo.findById(id).exec()
            .then(eliminar => {
                // Si no existe mandamos un error. 
                if (!eliminar) {
                    return RESP._400(res, {
                        msj: `No existe el elemento: ${nombreDeObjeto}`,
                        err: `El id que ingresaste no existe.`,
                    });
                }
                // Ejecutamos remove sobre el documento encontrado para que 
                // se dispare el hook 'remove'.
                return eliminar.remove();
            }).then(eliminado => {
                // Retornamos el documento removido. 
                return RESP._200(res, 'Se elimino de manera correcta', [
                    { tipo: nombreDeObjeto, datos: eliminado },
                ]);

            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error eliminado: ${nombreDeObjeto}`,
                    err: err,
                });
            });

    });


};


var modelo;


module.exports = {

    _modelo: null,
    get modelo() {
        return this._modelo;
    },
    set modelo(value) {
        this._modelo = value;
    },

    _app: null,
    get app() {
        return this._app;
    },
    set app(value) {
        this._app = value;
    },

    _nombreDeObjetoSingular: null,
    get nombreDeObjetoSingular() {
        return this._nombreDeObjetoSingular;
    },
    set nombreDeObjetoSingular(value) {
        this._nombreDeObjetoSingular = value;
    },
    _nombreDeObjetoPlural: null,
    get nombreDeObjetoPlural() {
        return this._nombreDeObjetoPlural;
    },
    set nombreDeObjetoPlural(value) {
        this._nombreDeObjetoPlural = value;
    },
    _campoSortDefault: null,
    get campoSortDefault() {
        return this._campoSortDefault;
    },
    set campoSortDefault(value) {
        this._campoSortDefault = value;
    },
    _camposDeBusqueda: null,
    get camposDeBusqueda() {
        return this._camposDeBusqueda;
    },
    set camposDeBusqueda(value) {
        this._camposDeBusqueda = value;
    },
    _camposActualizables: null,
    get camposActualizables() {
        return this._camposActualizables;
    },
    set camposActualizables(value) {
        this._camposActualizables = value;
    },


    /**
     * Ejecuta las funciones para el CRUD.
     *
     *
     * @param {*} DATOS Si se define acepta los siguientes parametros para ejectuar o no
     * los patterns:
     *  
     *  'get', 'getById', 'getBuscar', 'post', 'put', 'deletee',   
     * 
     */
    crud: function(...DATOS) {

        fun = {};

        fun.get = () => { get(this.modelo, this.app, this.nombreDeObjetoPlural, this.campoSortDefault); };
        fun.getById = () => { getById(this.modelo, this.app, this.nombreDeObjetoSingular); };
        fun.getBuscar = () => { getBuscar(this.modelo, this.app, this.nombreDeObjetoPlural, this.camposDeBusqueda, this.campoSortDefault); };
        fun.post = () => { post(this.modelo, this.app, this.nombreDeObjetoSingular); };
        fun.put = () => { put(this.modelo, this.app, this.nombreDeObjetoPlural, this.camposActualizables); };
        fun.delete = () => { deletee(this.modelo, this.app, this.nombreDeObjetoPlural); };

        // Si no se definen parametros ejecutamos todo. 
        if (DATOS.length < 1) {
            // Recorremos todas las propiedades. 
            for (const key in fun) {
                if (fun.hasOwnProperty(key)) {
                    const element = fun[key];
                    // Ejecutamos las funciones.
                    element();
                }
            }
            return;
        }

        // Si hay DATOS entonces revisamos que funciones se han pasado para ejectarse. 
        for (let i = 0; i < DATOS.length; i++) {
            const key = DATOS[i];
            // Si no existe la propiedad en el objeto no ejecutamos nada.
            if (fun.hasOwnProperty(key)) {
                const element = fun[key];
                element();

            } else {
                console.log(`${colores.info('CRUD REPOSITORY')}  No existe la propiedad: ${key}`);
            }
        }

    }


};