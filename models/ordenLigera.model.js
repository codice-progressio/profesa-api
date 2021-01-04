module.exports = {
    recibida: Boolean,
    consecutivoRuta: Number,
    consecutivoOrden: Number,
    totalDeOrdenes: Number,
    procesoActual: String,
    idProcesoActual: String,
  
    numeroDeOrden: String,
    sku: String,
    idSKU: String,
    fechaDeEntregaAProduccion: Date, //era fechaPedidoProduccion,
  
    laser: String,
    laserAlmacen: String,
    marcaLaser: String, ///Revisar esto!!!,
  
    cliente: String,
    idCliente: String,
    esBaston: Boolean,
  
    unidad: Number,
    piezas: Number,
  
    disponible: Boolean,
    folio: String,
    pedido: String,
    orden: String,
  
    ubicacionActual: require('./ruta.model'),
    ruta: [require('./ruta.model')],
    pasos: Number,
    numerosDeOrden: [Number],
    paso: Number,
    // No siempre aparecen estos,
    inicio: Date,
    finalizacion: Date,
    observacionesOrden: String,
    observacionesPedido: String,
    observacionesFolio: String,
}