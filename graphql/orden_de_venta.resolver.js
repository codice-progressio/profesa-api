// Llamamos el schema  de orden de venta porque
// de otra manera no se registra el dentro de monogoose
const OrdenDeVenta = require("../models/orden_de_venta.model")

module.exports = {
  ordenes_de_venta: async props => {
    let busqueda = {}

    if (props?.usuario) busqueda[usuario] = props.usuario

    let ordenes = OrdenDeVenta.find(busqueda)
      .limit(props.limit)
      .skip(props.skip)
      .exec()

    return ordenes
  },

  ordenes_de_venta_count: async props => {
    let busqueda = {}

    if (props?.usuario) busqueda[usuario] = props.usuario

    let conteo = OrdenDeVenta.find(busqueda).countDocuments().exec()
    return conteo || 0
  },

  crear_orden_de_venta: async props => {
    let orden

    if (props?._id) orden = await OrdenDeVenta.findById(props._id).exec()
    else orden = new OrdenDeVenta(props.datos)

    Object.keys(props.datos).forEach(key => {
      // No debe incluir el id
      if (key !== "_id") orden[key] = props.datos[key]
    })

    return await orden.save()
  },
}
