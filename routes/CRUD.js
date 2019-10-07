var colores = require("../utils/colors");
var RESP = require("../utils/respStatus");
var CONSTANSTES = require("../utils/constantes");

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
 * @param {*} nombreDeObjeto El nombre que recibira el objet. En el caso del get es en plurar (usuarios, modelos, tamanos, etc.)
 * @param {*} campoSortDefault El campo por defecto que se ordenara.
 * @param {*} select Un string con los campos para el select.
 * @return {total, [datos], msj } Retorna el objeto con la estructura comun y los datos consultados. Incluye el total de elementos de la bd.
 */
const get = function(modelo, app, nombreDeObjeto, campoSortDefault, select) {
    app.get("/", (req, res) => {
        const CONSULTAS = CONSTANSTES.consultas(req.query, campoSortDefault);

        Promise.all([
                modelo
                .find()
                .select(select)
                .limit(CONSULTAS.limite)
                .skip(CONSULTAS.desde)
                .sort({
                    [CONSULTAS.campo]: CONSULTAS.sort
                })
                .exec(),
                modelo.countDocuments()
            ])
            .then(resp => {
                return RESP._200(res, null, [
                    { tipo: nombreDeObjeto, datos: resp[0] },
                    { tipo: "total", datos: resp[1] }
                ]);
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error cargando los ${nombreDeObjeto}.`,
                    err: err
                });
            });
    });
};

/**
 * Ejecuta una busqueda por id y retorna el elemento encontrado si existe.  Lanza un pre('findOne', cb).
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta.
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route.
 * @param {*} nombreDeObjeto El nombre que recibira el objet. En el caso del get es en plurar (usuarios, modelos, tamanos, etc.)
 * @param {*} select  Un string con los campos para el select.
 */
const getById = function(modelo, app, nombreDeObjeto, select) {
    app.get("/:id", (req, res) => {
        const id = req.params.id;

        if (!id) {
            return RESP._400(res, {
                msj: "No definiste el id para la busqueda: ${nombreDeObjeto}",
                err: "Es necesario que definas un id para la busqueda."
            });
        }
        // <!--
        // =====================================
        //  BUSCAMOS CON FINDONE Y NO CON FINDBYID PARA QUE SE LANZE EL PRE HOOK
        // =====================================
        // -->
        modelo
            .findOne({ _id: id })
            .select(select)
            .exec()
            .then(elemento => {
                if (!elemento) {
                    return RESP._400(res, {
                        msj: "No hubo coincidencia.",
                        err: `El id que ingresaste no coincide con ninguno en la bd: ${nombreDeObjeto}`
                    });
                }

                return RESP._200(res, null, [
                    { tipo: nombreDeObjeto, datos: elemento }
                ]);
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error buscando el elemento por su id: ${nombreDeObjeto}`,
                    err: err
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
 * @param {*} nombreDeObjeto El nombre que recibira el objet. En el caso del get es en plurar (usuarios, modelos, tamanos, etc.)
 * @param {*} camposDeBusqueda Un arreglo donde se deben enlistar los campos de busqueda que se utilizaran en la busqueda.
 * @param {*} campoSortDefault El campo por defecto que se ordenara. 
 * @param {*} select  Un string con los campos para el select. 
 * @return {total, [datos], msj } Retorna el objeto con la estructura comun y los datos consultados. Incluye el total de elementos de la bd. 

 */
const getBuscar = function(
    modelo,
    app,
    nombreDeObjeto,
    camposDeBusqueda,
    campoSortDefault,
    select
) {
    app.get("/buscar/:termino", (req, res) => {
        const CONSULTAS = CONSTANSTES.consultas(req.query, campoSortDefault);
        // El termino de busqueda que se va a aplicar.
        const termino = req.params.termino;

        // Hace un match completo.
        const regex = new RegExp(`^.*${termino}.*$`, "mig");

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
                modelo
                .find()
                .or(arregloParaBusqueda)
                .countDocuments(),
                // Obtenemos los documentos.
                modelo
                .find()
                .select(select)
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
                    { tipo: "total", datos: resp[0] },
                    { tipo: nombreDeObjeto, datos: resp[1] }
                ]);
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error realizando la busqueda: ${nombreDeObjeto}`,
                    err: err
                });
            });
    });
};

/**
 * Ejecuta una peticion post y retorna el elemento guardado.
 *
 * @param {*} modelo El modelo (schema) para realizar la consulta.
 * @param {*} app El app que se llamaca con express() y que luego se exporta en el route.
 * @param {*} nombreDeObjeto El nombre que recibira el objet. En el caso del post es en singular (usuario, modelo, tamano, etc.)
 * @return { [datos], msj } Retorna el objeto con la estructura comun y los datos consultados.
 */
const post = function(modelo, app, nombreDeObjeto) {
    app.post("/", (req, res) => {
        // Obtenemos el mdelo.
        const datosAGrabar = new modelo(req.body);

        datosAGrabar
            .save()
            .then(resp => {
                return RESP._200(
                    res,
                    `Se guardo de manera correcta el ${nombreDeObjeto}.`, [{ tipo: nombreDeObjeto, datos: resp }]
                );
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error guardando los datos: ${nombreDeObjeto}.`,
                    err: err
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
 * @param {*} nombreDeObjeto El nombre que recibira el objet. En el caso del post es en singular (usuario, modelo, tamano, etc.)
 * @param {*} objetoDeActualizacion El objeto que contiene la estrucutura de los datos que se van a actualizar. Es un objeto con los datos vacios.
 * @return { [dato], msj } Retorna el objeto original y un mensaje de confirmacion.
 *
 */
const put = function(modelo, app, nombreDeObjeto, objetoDeActualizacion) {
    app.put("/", (req, res) => {
        const id = req.body._id;
        if (!id) {
            return RESP._400(res, {
                msj: "No definiste un id para modificar.",
                err: "Es necesario un _id."
            });
        }

        modelo
            .findById(id)
            .then(resp => {
                if (!resp) {
                    return RESP._400(res, {
                        msj: `No existe el elemento: ${nombreDeObjeto}`,
                        err: `El id que ingresaste no esta registrado en la base de datos.`
                    });
                }

                // Cargamos los datos para modificar con el objeto defido para ello.
                for (const key in objetoDeActualizacion) {
                    if (objetoDeActualizacion.hasOwnProperty(key)) {
                        resp[key] = req.body[key];
                    }
                }
                console.log(`estamos aqui`)
                // Guardamos las modificaciones.
                return resp.save();
            })
            .then(elementoGuardado => {
                return RESP._200(
                    res,
                    `Se guardo de manera correcta el elemento ${nombreDeObjeto}`, [{ tipo: nombreDeObjeto, datos: elementoGuardado }]
                );
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error: ${nombreDeObjeto}.`,
                    err: err
                });
            });
    });

    console.log(`nos brincamos todo`)
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
 * @param {*} nombreDeObjeto El nombre que recibira el objet. En el caso del post es en singular (usuario, modelo, tamano, etc.)
 */
const deletee = function(modelo, app, nombreDeObjeto) {
    app.delete("/:id", (req, res) => {
        const id = req.params.id;

        if (!id) {
            return RESP._400(res, {
                msj: "No definiste un id para eliminar.",
                err: "Es necesario que definas un id."
            });
        }

        // Buscamos si el documento existe.
        modelo
            .findById(id)
            .exec()
            .then(eliminar => {
                // Si no existe mandamos un error.
                if (!eliminar) {
                    return RESP._400(res, {
                        msj: `No existe el elemento: ${nombreDeObjeto}`,
                        err: `El id que ingresaste no existe.`
                    });
                }
                // Ejecutamos remove sobre el documento encontrado para que
                // se dispare el hook 'remove'.
                return eliminar.remove();
            })
            .then(eliminado => {
                // Retornamos el documento removido.
                return RESP._200(res, "Se elimino de manera correcta", [
                    { tipo: nombreDeObjeto, datos: eliminado }
                ]);
            })
            .catch(err => {
                return RESP._500(res, {
                    msj: `Hubo un error eliminado: ${nombreDeObjeto}`,
                    err: err
                });
            });
    });
};


module.exports = {
    _modelo: null,
    get modelo() {
        return this._modelo;
    },
    /**
     * El schema que va a realizar la accion.
     * Es el que definimos para trabajar mongoose.
     * @param value El schema con que se va a trabajar.
     */
    set modelo(value) {
        this._modelo = value;
    },

    _app: null,
    get app() {
        return this._app;
    },
    /**
     *El servidor para gestionar la request completa.
     *@oaram El servidor que va a gestionar la request.
     */
    set app(value) {
        this._app = value;
    },

    _nombreDeObjetoSingular: null,
    get nombreDeObjetoSingular() {
        return this._nombreDeObjetoSingular;
    },
    /**
       *El nombre del objeto en singular. Este sirve para los 
       retornos que corresponden a un solo elemento. Este el 
       el nombre que se colocara en el objeto que lo contiene. 
       *@param value El nombre del objeto en singular. 
       */
    set nombreDeObjetoSingular(value) {
        this._nombreDeObjetoSingular = value;
    },
    _nombreDeObjetoPlural: null,
    get nombreDeObjetoPlural() {
        return this._nombreDeObjetoPlural;
    },
    /**
       *  /**
       *El nombre del objeto en plural. Este sirve para los 
       retornos que corresponden a varios elementos. Este el 
       el nombre que se colocara en el objeto que lo contiene. 
       *@param value El nombre del objeto en plural. 
       */
    set nombreDeObjetoPlural(value) {
        this._nombreDeObjetoPlural = value;
    },
    _campoSortDefault: null,
    get campoSortDefault() {
        return this._campoSortDefault;
    },
    /**
       *El campo por medio del cual se ordenadara 
       la lista de objetos obtenidas de una consulta.
       Aplica para todoas las consultas que tengan mas 
       de un elemento. 
       *
       @param value El campo para ordenar. 
       */
    set campoSortDefault(value) {
        this._campoSortDefault = value;
    },
    _camposDeBusqueda: null,
    get camposDeBusqueda() {
        return this._camposDeBusqueda;
    },
    /**
       *Los campos en lo que se buscara el termino de busqueda.
          Los campos que se listen aqui deben corresponder al nombre
          dado en el schema y no pueden ser de tipo numericos. 
       * @param value Un objeto de tipo ['campoDeBusqueda, otroCampoDeBusquedaNoNumerico']
       */
    set camposDeBusqueda(value) {
        this._camposDeBusqueda = value;
    },
    _camposActualizables: null,
    get camposActualizables() {
        return this._camposActualizables;
    },
    /**
       *Setea los campos que se van a actualizar.
       Debe ser un objecto tipo { nombreDelCampo: null }
       *@param value Un objeto con los campos que se van a actualizar. 
       */
    set camposActualizables(value) {
        this._camposActualizables = value;
    },

    _excluir: null,
    get excluir() {
        return this._excluir;
    },
    /**
     *Los campos que se van a excluir de las consultas.
     *@param {String []} Un arreglo con los campos que se van a excluir.
     */
    set excluir(value) {
        this._excluir = value;
    },

    /**
     * Ejecuta las funciones para el CRUD. Esta tiene que ser la ultima operacion.
     *
     *
     *
     * @param {*} DATOS Si se define acepta los siguientes parametros que corresponde
     * con las operaciones basicas del CRUD. Solo se agrega un solo valor solo se ejecutara
     * ese. Es necesario definir todos los que se quieran ejecutar o ninguno. Las
     * operaciones permitidas son:
     *
     *  ```'get', 'getById', 'getBuscar', 'post', 'put', 'delete' ```
     *
     */
    crud: function(...DATOS) {
        let fun = {};

        /**
         * La cadena en donde se aplicaran los campos
         * para excluir. Esto significa que no va a retornar dentro de la consulta
         * ese campo. Es como definir un find({ }, { -campoQueSeExcluye})
         */
        let cadenaParaExcluir = "";
        if (this.excluir) {
            // Si hay un elemento excluir definido
            // aplicamos un menos a cada objeto del arreglo
            // y luego lo unimos en una cadena
            cadenaParaExcluir = this.excluir.map(x => (x = "-" + x)).join(" ");
        }

        fun.get = () => {
            get(
                this.modelo,
                this.app,
                this.nombreDeObjetoPlural,
                this.campoSortDefault,
                cadenaParaExcluir
            );
        };
        fun.getById = () => {
            getById(
                this.modelo,
                this.app,
                this.nombreDeObjetoSingular,
                cadenaParaExcluir
            );
        };
        fun.getBuscar = () => {
            getBuscar(
                this.modelo,
                this.app,
                this.nombreDeObjetoPlural,
                this.camposDeBusqueda,
                this.campoSortDefault,
                cadenaParaExcluir
            );
        };
        fun.post = () => {
            post(this.modelo, this.app, this.nombreDeObjetoSingular);
        };
        fun.put = () => {
            put(
                this.modelo,
                this.app,
                this.nombreDeObjetoSingular,
                this.camposActualizables
            );
        };
        fun.delete = () => {
            deletee(this.modelo, this.app, this.nombreDeObjetoPlural);
        };

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
                throw `${colores.info("CRUD REPOSITORY")}  No existe la propiedad: ${key}`
            }
        }
    }
};