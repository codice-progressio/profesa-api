console.log("[GraphQL][Resolver] Orden de venta")
// Llamamos el schema  de orden de venta porque
// de otra manera no se registra el dentro de monogoose

module.exports = {
  Query: {
    ordenes_de_venta: async (props, a,b,c) => {
      let busqueda = {}

      if (props?.usuario) busqueda[usuario] = props.usuario
        console.log({props, a,b,c})
          
      let ordenes = OrdenDeVenta.find(busqueda)
        .limit(props?.limit)
        .skip(props?.skip)
        .exec()

      return ordenes
    },

    ordenes_de_venta_count: async props => {
      let busqueda = {}

      if (props?.usuario) busqueda[usuario] = props.usuario

      let conteo = OrdenDeVenta.find(busqueda).countDocuments().exec()
      return conteo || 0
    },
  },
//   Input: {
//     orden_de_venta_crear_editar: async props => {
//       let orden

//       if (props?._id) orden = await OrdenDeVenta.findById(props._id).exec()
//       else orden = new OrdenDeVenta(props.datos)

//       Object.keys(props.datos).forEach(key => (orden[key] = props.datos[key]))

//       return await orden.save()
//     },
//   },
}
