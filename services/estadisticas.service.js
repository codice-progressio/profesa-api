const Sku = require("../models/sku.model");
const Contacto = require("../models/contacto/contacto.model");
const Pedidos = require("../models/pedido.model");
const mongoose = require("mongoose");

const dayjs = require("dayjs");

const REDONDEAR = (numero) => Math.round(numero * 100) / 100;

const getTotalSkus = (req, res, next) => {
  Sku.countDocuments()
    .exec()
    .then((total) => res.send({ total }))
    .catch((_) => next(_));
};

const getTotalCostoExistencias = (req, res, next) => {
  Sku.find()
    .select("existencia costoVenta ")
    .exec()
    .then((skus) => {
      const total = skus.reduce((acumulado, sku) => {
        // La existencia debe ser >= 0 para que se calcule, si no, no
        // se toma en cuenta.
        let existencia = sku.existencia >= 0 ? sku.existencia ?? 0 : 0;
        const multiplicacion = existencia * (sku.costoVenta ?? 0);
        return multiplicacion + acumulado;
      }, 0);

      res.send({ total });
    })
    .catch((_) => next(_));
};

const getTotalContactos = (req, res, next) => {
  Contacto.countDocuments()
    .exec()
    .then((total) => res.send({ total }))
    .catch((_) => next(_));
};

const getHoy = async (req, res, next) => {
  let fecha_inicial = dayjs().startOf("day").add(-1, "day").toDate();
  let fecha_final = dayjs().endOf("day").add(1, "day").toDate();

  let pedidos = await Pedidos.find({
    createdAt: { $gte: fecha_inicial },
    updatedAt: { $lte: fecha_final },
  }).exec();

  let vendido = pedidos.reduce(
    (acumulado, pedido) => acumulado + pedido.importe,
    0
  );

  let vendedores = pedidos.reduce((acumulado, pedido) => {
    let usuario = pedido.usuario;
    if (!acumulado.hasOwnProperty(usuario))
      acumulado[usuario] = { pedidos: 0, vendido: 0 };
    acumulado[usuario].pedidos++;
    acumulado[usuario].vendido += pedido.importe;

    return acumulado;
  }, {});

  let grafico = Object.entries(vendedores).map((vendedor) => {
    return { name: vendedor[0], value: vendedor[1].vendido };
  });

  let user = await mongoose
    .model("Usuario")
    .find({ _id: { $in: grafico.map((x) => x.name) } })
    .select("nombre")
    .exec();

  grafico.forEach((x) => {
    let nombre = user.find(
      (y) => y._id.toString() === x.name.toString()
    )?.nombre;
    x.name = nombre;
  });

  vendedores = Object.entries(vendedores).length;

  let articulos = pedidos
    .map((p) => p.articulos)
    .flat()
    .reduce((acumulado, articulo) => {
      let sku = articulo.sku;
      if (!acumulado.hasOwnProperty(sku)) acumulado[sku] = 0;
      acumulado[sku] += articulo.importe;
      return acumulado;
    }, {});

  let masVendido = Object.entries(articulos)
    .sort((a, b) => b[1] - a[1])
    ?.pop()[0];

  if (masVendido)
    masVendido = await Sku.findOne({ sku: masVendido })
      .select("nombreCompleto")
      .exec();

  return res.send({
    vendido: REDONDEAR(vendido),
    pedidos: pedidos.length,
    vendedores,
    masVendido: masVendido?.nombreCompleto ?? "N/A",
    grafico,
  });
};

const getVentasTrimestre = (req, res, next) => {};

const getDiezMasVendidos = (req, res, next) => {};

const getMejorCliente = (req, res, next) => {};

const getVentasPorVendedor = (req, res, next) => {};

module.exports = {
  getTotalSkus,
  getTotalCostoExistencias,
  getTotalContactos,
  getVentasTrimestre,
  getDiezMasVendidos,
  getMejorCliente,
  getHoy,
  getVentasPorVendedor,
};
