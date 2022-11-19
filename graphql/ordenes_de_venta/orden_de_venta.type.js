module.exports = /* GraphQL */ `
  type OrdenDeVenta {
    _id: String
    consecutivo: Int!
    eliminado: Boolean
    # contacto: Contacto
    usuario: String
    # articulos: [ArticuloPedido]
    observaciones: String
    # acciones: [PedidoAccion]
    listaDePreciosId: String
    total: Float
    iva: Float
    importe: Float
    folio: String
    # ubicacion: Ubicacion

    sincronizado: Boolean
    # estado: [EstadoDeProceso]
  }


  type Query{
    ordenes_de_venta(usuario: String, limit: Int, skip: Int): [OrdenDeVenta]
    ordenes_de_venta_count(usuario: String): Int
  }

  # type Input{
  #   orden_de_venta_crear_editar(_id: String, datos: OrdenDeVenta): OrdenDeVenta
  # }

#   input OrdenDeVentaInput {
#     consecutivo: Int
#     eliminado: Boolean
#     contacto: String
#     usuario: String
#     articulos: [ArticuloPedidoInput]
#     observaciones: String
#     acciones: [PedidoAccionInput]
#     listaDePreciosId: String
#     total: Float
#     iva: Float
#     importe: Float
#     folio: String
#     ubicacion: UbicacionInput

#     sincronizado: Boolean
#     estado: [EstadoDeProcesoInput]
#   }

#   type Ubicacion {
#     latitud: Float
#     longitud: Float
#   }

#   input UbicacionInput {
#     latitud: Float
#     longitud: Float
#   }

#   type PedidoAccion {
#     _id: String
#     accion: String
#     usuario: String
#     estadoDocumento: [EstadoDeProceso]
#   }

#   input PedidoAccionInput {
#     accion: String
#     usuario: String
#     estadoDocumento: [EstadoDeProcesoInput]
#   }

#   type ArticuloPedido {
#     _id: String
#     cantidad: Float
#     precio: Float
#     sku: String
#     observaciones: String
#     importe: Float
#   }

#   input ArticuloPedidoInput {
#     _id: String
#     cantidad: Float
#     precio: Float
#     sku: String
#     observaciones: String
#     importe: Float
#   }

#   type EstadoDeProceso {
#     nombre: String
#     descripcion: String
#     hora_inicio: String
#     hora_final: String
#     observaciones: String
#     icono: String
#   }

#   input EstadoDeProcesoInput {
#     nombre: String
#     descripcion: String
#     hora_inicio: String
#     hora_final: String
#     observaciones: String
#     icono: String
#   }

#   type Mutation {
#     orden_de_venta_crear_editar(
#       _id: String
#       datos: OrdenDeVentaInput!
#     ): OrdenDeVentaInput
#   }
`
