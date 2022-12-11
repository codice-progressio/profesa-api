const PedidoModel = require("../../models/pedido.model");

function es_admin(permissions) {
  administrado = "administrador";
  administrador_ventas = "administrador:ventas";

  es_administrador = permissions.includes("administrador");
  es_administrador_ventas = permissions.includes("administrador:ventas");

  return es_administrador || es_administrador_ventas;
}

module.exports.Obtener = async (req, res) => {
  let querys = req.query;
  let queryFind = { usuario: req.user._id };

  // Si tiene permisos de administrador, puede ver todos los pedidos
  if (es_admin(req.user?.permissions)) queryFind = {};

  // Si el query trae un id de pedido, es detalle.
  if (req.params.id) queryFind._id = req.query.id;

  // No buscamos los que están eliminados.
  queryFind.eliminado = false;

  let pedidos = await PedidoModel.find(queryFind)
    .limit(querys.limit)
    .skip(querys.skip)
    .populate("usuario", "nombre apellido", 'Usuario')
    .populate("contacto", "nombre razonSocial rfc codigo domicilios", 'Contacto')
    .populate("listaDePreciosId", "nombre iva", 'ListaDePrecios')
    .populate("articulos.sku", "codigo nombreCompleto", 'sku')
    .exec();
  let total = await PedidoModel.countDocuments().exec();
  return res.send({
    pedidos,
    total,
  });
};

module.exports.Guardar = async (req, res, next) => {
  delete req.body._id;
  let pedido = new PedidoModel(req.body);
  pedido.usuario = req.user._id;
  try {
    pedido = await pedido.save();
    return res.send({ pedido });
  } catch (err) {
    next(err);
  }
};

module.exports.Eliminar = async (req, res) => {
  let pedido = await PedidoModel.findById(req.params.id).exec();

  if (!pedido) return res.status(404).send("No se encontró el pedido.");
  if (pedido.eliminado)
    return res.status(404).send("El pedido ya está eliminado.");

  // No es administrador ni es el usuario que creó el pedido.
  if (!es_admin(req.user.permissions) && pedido.usuario != req.user._id)
    return res.status(403).send("No tiene permisos para eliminar este pedido.");

  pedido.eliminado = true;
  pedido = await pedido.save();

  return res.send({ pedido });
};

module.exports.Modificar = async (req, res) => {
  if (!es_admin(req.user.permissions))
    return res.status(403).send("No tiene permisos para modificar pedidos.");

  let pedido = await PedidoModel.findById(req.body._id).exec();
  delete req.body._id;
  delete req.body.eliminado;
  delete req.body.createdAt;
  delete req.body.updatedAt;

  pedido = Object.assign(pedido, req.body);
  pedido = await pedido.save();
  return res.send({ pedido });
};
