var mongoose = require("mongoose")

var Schema = mongoose.Schema
var procesoSchema = require("./procesos/proceso")
var Folio = require("../models/folios/folio")
var Cliente = require("../models/cliente")

var Modelo = require("../models/modelo")
var Tamano = require("../models/tamano")
var Color = require("../models/colores/color")
var Terminado = require("../models/terminado")

var loteSchema = require("../models/almacenProductoTerminado/lote")

var colores = require("../utils/colors")

var marcaLaser = require("../models/marcaLaser")

var modeloCompletoSchema = new Schema({
    // True cuando se desea generar medias órdenes
    // por defecto.
    medias: { type: Boolean, default: false },

    modelo: {
        type: Schema.Types.ObjectId,
        ref: "Modelo",
        required: [true, "El modelo es necesario."]
    },
    tamano: {
        type: Schema.Types.ObjectId,
        ref: "Tamano",
        required: [true, "El tamano es necesario."]
    },
    color: {
        type: Schema.Types.ObjectId,
        ref: "Color",
        required: [true, "El color es necesario."]
    },
    terminado: {
        type: Schema.Types.ObjectId,
        ref: "Terminado",
        required: [true, "El terminado es necesario."]
    },

    // Hay algúnos modelos que llevan marcaLaser desde que se fabrican.
    laserAlmacen: marcaLaser,
    // Las versiones posibles de un modelo para no perder la nomenclatura anterior.
    versionModelo: { type: String },

    //La familia de procesos es una agrupación de todos los procesos que conlleva
    // este modelo.
    familiaDeProcesos: {
        type: Schema.Types.ObjectId,
        ref: "FamiliaDeProcesos",
        required: [true, "Es necesario que definas la familia de procesos."]
    },

    // Los procesos especiales son acciones especiales para dicho modelo y pueden
    // intervenir dentro de los procesos de la familia de procesos para que
    // se ejecuten en el órden deseado de manera que sean reacomodados. Ejemplo:
    // OrdenDeEjecucion-1 Proceso normal 1
    // OrdenDeEjecucion-2 Proceso normal 2
    // OrdenDeEjecucion-3 Proceso normal 3
    // OrdenDeEjecucion-3 Proceso extra1  3.1
    // OrdenDeEjecucion-3 Proceso extra2  3.2
    // OrdenDeEjecucion-4 Proceso normal 4

    // Cuando se modifica la familia de modelos estos quedan huerfanos.
    // De manera que se si existe el proceso dentro del órden que tienen
    // Se acomodan solos, si no, se van a su posición correspondiente por ejemplo:
    // OrdenDeEjecucion-1 Proceso normal 1
    // OrdenDeEjecucion-3 Proceso extra1  3.1
    // OrdenDeEjecucion-3 Proceso extra2  3.2

    procesosEspeciales: [{
        proceso: {
            type: Schema.Types.ObjectId,
            ref: "Proceso",
            required: [true, "El proceso es necesario."]
        },
        procesoPadre: {
            type: Schema.Types.ObjectId,
            ref: "Proceso"
        },
        // TODO: Aqui debe de ir el proces del que viene para facilitar el óren y mantener integridad de datos.
        orden: { type: Number }
    }],

    nombreCompleto: { type: String },
    porcentajeDeMerma: {
        type: Number,
        default: 2,
        min: [0, "Tiene que ser 0 o mayor que 0."],
        max: [100, "El valor máximo permitido es 100."]
    },
    // Para calcular la materia prima.
    espesor: {
        type: Number,
        min: [0.01, "El espesor mínimo debe ser 0.01"]
    },

    /**
     * La existencia de boton en el almacen.
     * Esta se actualiza automaticamente cuando se
     * se guarda la salida de boton o entra un nuevo lote.
     */
    existencia: { type: Number },

    /**
     * Los lotes de este boton. Ver schema para mas info.
     */
    lotes: [loteSchema],

    actualizarLotesYExistencias: { type: Boolean },

    esBaston: {
        type: Boolean,
        required: [true, "Es necesario definir si el modelo es de baston."],
        default: false
    },

    // Valores para las existencias.
    stockMinimo: { type: Number, default: 0, min: 0 },
    stockMaximo: {
        type: Number,
        default: 0,
        valildate: [{
            validator: function(v) {
                return new Promise((resolve) => {
                    resolve(this.stockMinimo >= v)
                })
            },
            msg: "El valor maximo de stock no puede ser menor que el valor minimo de stock"
        }]
    },
    parte: { type: String, default: "C", enum: ["A", "B", "C", "DES"] },
}, { collection: "modelosCompletos" })
/**
 *
 *
 * @param {*} next
 */
let generarNombreCompleto = function(next) {
    // Obtenemos los id.

    Promise.all([
            Modelo.findById(this.modelo).exec(),
            Tamano.findById(this.tamano).exec(),
            Color.findById(this.color).exec(),
            Terminado.findById(this.terminado).exec()
        ])
        .then((resp) => {
            let modelo = resp[0]
            let tamano = resp[1]
            let color = resp[2]
            let terminado = resp[3]

            this.nombreCompleto = `${modelo.modelo}-${tamano.tamano}-${color.color}-${terminado.terminado}`
            this.nombreCompleto +=
                this.laserAlmacen.laser.length > 0 ? "-" + this.laserAlmacen.laser : ""
            
            if( this.versionModelo ){
                this.nombreCompleto +=
                    this.versionModelo.split("").length > 0 ? "-" + this.versionModelo : ""
            }

            next()
        })
        .catch((err) => {
            next(err)
        })
}

var autoPopulate = function(next) {
    this.populate("modelo", "modelo", null, { sort: { modelo: -1 } })
    this.populate("tamano", "tamano estandar", null, { sort: { tamano: -1 } })
    this.populate("color", "color", null, { sort: { color: -1 } })
    this.populate("terminado", "terminado", null, { sort: { terminado: -1 } })
    this.populate({
        path: "familiaDeProcesos",
        populate: {
            path: "procesos.proceso",
            populate: {
                path: "maquinas  departamento"
            }
        }
    })
    this.populate({
        path: "procesosEspeciales.proceso",
        populate: {
            path: "maquinas  departamento"
        }
    })

    this.populate("lotes.salidas.cliente")
    next()
}

/**
 * Elimina los pedidos, clientes, modelosCompletos y el elemento en si
 * del id que se le pase como parametro y sus relaciones.
 *
 * Esta funcion solo se debe ejecutar desde los hooks.
 *
 * @param {*} IDElemento El id del elemento que se quiere eliminar. (Modelo, tamano, color, terminado)
 * @param {*} campo El nombre del campo en donde se buscara el id del elemento para los modelos completos.
 * @param {*} next Para continuar con la ejecucion del pre.
 */
modeloCompletoSchema.statics.eliminarRelacionados = function(
    IDElemento,
    campo,
    next
) {
    // El id del modelo, tamano, color o termiando a eliminar.
    var idElemento = IDElemento

    // Eliminar los mc que tengan este modelo.
    const mcIDs = []

    // Buscamos los id que correspondan e los modelos
    // Que tengan ese id.
    this.find({
            [campo]: idElemento
        })
        .exec()
        .then((mcCoincidentes) => {
            // Obtenemos el id de los modelosCompletos que coinciden.
            mcCoincidentes.forEach((mc) => {
                // Los guardamos en el array para luego utilizarlos.
                mcIDs.push(mc._id)
            })

            // Las promesas que van a eliminar los datos.
            var promesas = []

            // Las condiciones para eliminar elementos de los arreglos.
            var eliC = {
                $pull: {
                    modelosCompletosAutorizados: { modeloCompleto: { $in: mcIDs } }
                }
            }
            var eliF = { $pull: { folioLineas: { modeloCompleto: { $in: mcIDs } } } }

            // Eliminamos los clientes relacionados con este modeloCompleto.
            promesas.push(
                    eliminarModelosCompletosAutorizadosDeClientesRelacionados(mcIDs, eliC)
                )
                // Eliminamos los pedidos relacionados con este modeloCompleto.
                // promesas.push(Folio.update({ 'folioLineas.modeloCompleto': { $in: mcIDs } }, eliF).exec());
            promesas.push(eliminarPedidosRelacionados(mcIDs, eliF))
                // Eliminamos los modelos completos relacionados con este elemento que se va a eliminar.
            promesas.push(this.deleteMany({ _id: { $in: mcIDs } }).exec())

            return Promise.all(promesas)
        })
        .then((resp) => {
            console.log(
                `${colores.success(
          "CORRECTO"
        )}  Datos relacionados eliminados ${JSON.stringify(resp)}`
            )
            next()
        })
        .catch((err) => {
            next(err)
        })
}

/**
 * Retorna solo los datos necesarios para el
 * almacen de producto terminado. Evitamos
 * que se mande informacion que no nos interesa
 * mostrar.
 *
 *
 * @param {*} next
 * @returns
 */
modeloCompletoSchema.methods.getCamposParaAlmacen = function() {
    let n = {
        existencia: this.existencia,
        nombreCompleto: this.nombreCompleto,
        lotes: this.lotes
    }
    return n
}

modeloCompletoSchema.statics.guardarLote = function(id, lote) {
    return this.findById( id )
        .exec()
        .then((modeloCompleto) =>
        {
            if (!modeloCompleto) throw "No existe el modelo"
            let mc = asignacionDeLote(modeloCompleto, lote)

            // Cuando se crea un nuevo lote su existencia
            // debe ser igual a la cantidaad creada.
            return mc.save()
        })
}

function asignacionDeLote(modeloCompleto, lote) {
    // Si hay lotes entonces comprobamos que el ultimo
    // corresponda a este mes

    let datos = comprobarLote(modeloCompleto)

    if (datos.nuevoLote) {
        // Si no hay lotes entonces creamos uno nuevo
        lote.existencia = lote.cantidadEntrada
        lote.entradas = []
        lote.entradas.push({
            cantidad: lote.cantidadEntrada,
            observaciones: lote.observaciones,
            idOrden: lote.idOrden,
        })
        modeloCompleto.lotes.push(lote)
        return modeloCompleto
    }

    // Lote existente. Solo le sumamos a la cantidad entrada
    datos.ultimoLote.existencia += lote.cantidadEntrada * 1
    datos.ultimoLote.cantidadEntrada += lote.cantidadEntrada *1
    datos.ultimoLote.entradas.push({
        //  Como ya existe un lote solo registramos la entrada con su
        // respectiva fecha.
        cantidad: lote.cantidadEntrada*1, 
        observaciones: lote.observaciones
    })

    return modeloCompleto
}

/**
 *Comprueba si es necesario crear un lote nuevo y
 * retorna los datos necesarios para hacerlo.
 *
 * @param {*} modeloCompleto
 * @param {*} lote
 */
function comprobarLote(modeloCompleto) {
    //Si no hay un lote debemos obtener null, por lo tanto vamos a crear
    // uno. Si hay un lote obtenemos el ultimo por que es el que nos interesa
    // para comparar y agregar el lote.
    var ultimoLote = modeloCompleto.lotes[modeloCompleto.lotes.length - 1]
    var nuevoLote = !ultimoLote

    if (!ultimoLote) {
        // Si hay un lote comprobamos sus fechas.
        var mesActual = new Date().getMonth()
            // Si no hay un lote entonces mandamos un menos uno 
            // para que la comprobacion nunca sea igual
        var mesLote = ultimoLote ? ultimoLote.getMonth() : -1
            // Si las fechas son iguales quiere decir que no
            // debemos crear nuevo lote.
        nuevoLote = !(mesActual === mesLote)
    }

    return {
        ultimoLote,
        nuevoLote
    }
}

/**
 *Busca y elimina los pedidos que esten relacionados con el id del modelo completo que se le
 pase como parametro. Debe ser un arreglo de id de modelo completo. 
 *
 * @param {*} mcIDs [Arreglo] ids de modelo completo. 
 * @param {*} eliF El objeto pull parra eliminar: { $pull: { folioLineas: { modeloCompleto: { $in: [this._id] } } } }
 * @returns El query para hacer el then. 
 */
function eliminarPedidosRelacionados(mcIDs, eliF) {
    return Folio.update({ "folioLineas.modeloCompleto": { $in: mcIDs } },
        eliF
    ).exec()
}

/**
 *Busca y elimina los modelosCompletosAutorizados relacionados con el id del modeloCompleto que se le pase como
 parametro. Deber ser un arreglo de id de modeloCompleto.
 *
 * @param {*} mcIDs [Arreglo] ids de modelo completo. 
 * @param {*} eliC El objeto pull parra eliminr { $pull: { modelosCompletosAutorizados: { modeloCompleto: { $in: [this._id] } } } }
 * @returns El query para hacer el then.
 */
function eliminarModelosCompletosAutorizadosDeClientesRelacionados(
    mcIDs,
    eliC
) {
    return Cliente.update({ "modelosCompletosAutorizados.modeloCompleto": { $in: mcIDs } },
        eliC
    ).exec()
}

/**
 * Busca todos los folios que contengan pedidos con este modelo y los elimina del
 * folio.
 *
 * @param {*} next
 */
let eliminarLineasDeFoliosRelacionadas = function(next) {
    Promise.all([
            eliminarPedidosRelacionados([this._id], {
                $pull: { folioLineas: { modeloCompleto: { $in: [this._id] } } }
            }),
            eliminarModelosCompletosAutorizadosDeClientesRelacionados([this._id], {
                $pull: {
                    modelosCompletosAutorizados: { modeloCompleto: { $in: [this._id] } }
                }
            })
        ])
        .then((resp) => {
            console.log(
                colores.info("DATOS ELIMINADOS") +
                "Se eliminaron los datos modelo autorizado para el cliente y pedidos existentes relacionados con este modelo:" +
                this.nombreCompleto
            )
            next()
        })
        .catch((err) => {
            next(err)
        })
}

/**
 *Esta funcion se encarga de actualizar las existencias del modelo que se grabe
  y la de los lotes. 
 *
 * @param {*} next
 */
let actualizarExistencias = function(next) {
    // Recorremos todos los lotes y sumamos sus existencias
    // para modificar la existencia total.
    let existenciaTotal = 0

    this.lotes.forEach((lote) => {
        existenciaTotal += lote.existencia
    })

    this.existencia = existenciaTotal

    next()
}

// El orden de es importante sobre todo cuando son el mismo hook.

modeloCompletoSchema
    .pre("findOne", autoPopulate)
    .pre("find", autoPopulate)
    // Este orden de save es importante.

.pre("save", autoPopulate)
    .pre("save", generarNombreCompleto)
    .pre("save", actualizarExistencias)
    .pre("remove", eliminarLineasDeFoliosRelacionadas)

module.exports = mongoose.model("ModeloCompleto", modeloCompletoSchema)