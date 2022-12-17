const Sku = require("../models/sku.model");
const Contacto = require("../models/contacto/contacto.model");
const Pedidos = require("../models/pedido.model");
const mongoose = require("mongoose");

const dayjs = require("dayjs");
require("dayjs/locale/es-mx");
require("dayjs/locale/en");

const REDONDEAR = (numero) => Math.round(numero * 100) / 100;
const formatoDeFecha = "YYYY-MM-DD";

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
  try {
    let fecha_inicial = dayjs().startOf("day").toDate();
    let fecha_final = dayjs().endOf("day").toDate();

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
      ?.pop();

    if (masVendido)
      masVendido = await Sku.findOne({ sku: masVendido[0] })
        .select("nombreCompleto")
        .exec();

    return res.send({
      vendido: REDONDEAR(vendido),
      pedidos: pedidos.length,
      vendedores,
      masVendido: masVendido?.nombreCompleto ?? "N/A",
      grafico,
    });
  } catch (error) {
    next(error);
  }
};

async function generar_mes(restar_al_mes, permissions, user_id) {
  // Obtenemos el dia 1 de este mes y el último día.
  let fecha_inicial = dayjs()
    .add(-restar_al_mes, "month")
    .locale("es-mx")
    .startOf("month");

  let mes = fecha_inicial.format("MMMM");
  fecha_inicial = fecha_inicial.locale("en").toDate();

  let fecha_final = dayjs()
    .add(-restar_al_mes, "month")
    .endOf("month")
    .locale("en")
    .toDate();
  let query = {
    createdAt: { $gte: fecha_inicial, $lte: fecha_final },
  };

  let esAdmin = permissions.includes("administrador");
  if (esAdmin) query.usuario = user_id;

  let pedidos = await Pedidos.aggregate([
    {
      $match: query,
    },

    {
      $project: {
        importe: 1,
        createdAt: 1,
      },
    },
  ]);

  // Cambiamos el format de fecha para solo obtener el yyyy-MM-dd y poder
  // agrupar los datos más fácilmente
  pedidos.forEach((x) => {
    x.createdAt = dayjs(x.createdAt).format(formatoDeFecha);
  });

  // Agrupamos por fecha
  pedidos = pedidos.reduce((acumulados, pedido) => {
    let fecha = pedido.createdAt;
    if (!(fecha in acumulados))
      acumulados[fecha] = {
        name: fecha,
        importe: 0,
        datosAgrupados: 0,
      };
    let acumulado = acumulados[fecha];
    acumulado.importe += pedido.importe;
    acumulado.datosAgrupados++;

    return acumulados;
  }, {});

  pedidos = Object.entries(pedidos);

  let dias_del_mes = dayjs(fecha_final).diff(fecha_inicial, "day") + 1;

  let grafico_fechas_completas = new Array(dias_del_mes)
    .fill()
    .map((x, i) => dayjs(fecha_final).add(-i, "days").format(formatoDeFecha))
    .map((fecha, i) => {
      let registro = pedidos.find((ped) => ped[0] === fecha);

      if (registro) {
        registro = registro[1];
        let name = ` [ ${registro.datosAgrupados} ] ${registro.name}`;
        let value = registro.importe;
        let datosAgrupados = registro.datosAgrupados;

        let datos = {
          name,
          value,
          datosAgrupados,
        };

        return datos;
      }
      return {
        name: fecha,
        value: 0,
        datosAgrupados: 0,
      };
    })
    .reverse();

  let total_mes = grafico_fechas_completas.reduce((acumulado, dia) => {
    return acumulado + dia.value;
  }, 0);

  let este_mes = {
    name: mes,
    total_mes,
    series: grafico_fechas_completas,
  };
  return este_mes;
}

const getVentasTrimestre = async (req, res, next) => {
  meses_a_calcular = 3;

  let meses = [];
  let totales = [];

  for (let i = 0; i < meses_a_calcular; i++) {
    let mes = await generar_mes(i, req.user.permissions, req.user._id);
    meses.push(mes);
    totales.push({ name: mes.name, value: mes.total_mes });
  }

  let datos = {
    graficos: {
      totales,
      meses,
    },
  };

  res.send(datos);
};

const getDiezMasVendidos = async (req, res, next) => {
  let diasCalculados = 30;

  let fecha_inicial = dayjs()
    .startOf("day")
    .add(-diasCalculados, "day")
    .toDate();
  let fecha_final = dayjs().endOf("day").toDate();
  let query = {
    createdAt: { $gte: fecha_inicial },
    updatedAt: { $lte: fecha_final },
  };

  let esAdmin = req.user.permissions.includes("administrador");
  if (!esAdmin) query.usuario = req.user._id;
  Pedidos.aggregate([
    {
      $match: query,
    },
    {
      $project: {
        articulos: 1,
      },
    },
    {
      $unwind: {
        path: "$articulos",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        sku: {
          $toObjectId: "$articulos.sku",
        },
      },
    },
    {
      $lookup: {
        from: "skus",
        localField: "sku",
        foreignField: "_id",
        as: "sku",
      },
    },

    {
      $unwind: {
        path: "$sku",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        articulos: 1,
        sku: {
          codigo: 1,
          nombreCompleto: 1,
        },
      },
    },

    {
      $group: {
        _id: "$articulos.sku",
        importe: { $sum: "$articulos.importe" },
        codigo: { $first: "$sku.codigo" },
        nombreCompleto: { $first: "$sku.nombreCompleto" },
      },
    },
  ])
    .then((articulos) => {
      let datos = articulos
        .sort((a, b) => b.importe - a.importe)
        .slice(0, 10)
        .map((x) => ({
          name: `[${x.codigo}] ${x.nombreCompleto}`,
          value: REDONDEAR(x.importe),
        }));
      res.send({ datos });
    })
    .catch((_) => next(_));
};

const getMejorCliente = (req, res, next) => {
  let diasCalculados = 30;

  let fecha_inicial = dayjs()
    .startOf("day")
    .add(-diasCalculados, "day")
    .toDate();
  let fecha_final = dayjs().endOf("day").toDate();
  let query = {
    createdAt: { $gte: fecha_inicial },
    updatedAt: { $lte: fecha_final },
  };

  let esAdmin = req.user.permissions.includes("administrador");
  if (!esAdmin) query.usuario = req.user._id;

  Pedidos.find(query)
    .select("contacto importe createdAt")
    .populate("contacto", "nombre razonSocial", "Contacto")
    .then((pedidos) => {
      let clientes = {};

      pedidos.forEach((pedido) => {
        let contacto_id = pedido.contacto._id;
        if (!clientes.hasOwnProperty(contacto_id))
          clientes[contacto_id] = {
            pedidos: [],
            importe: 0,
            nombre: pedido.contacto.nombre ?? pedido.contacto.razonSocial,
          };

        let registro = clientes[contacto_id];
        registro.pedidos.push(pedido);
        registro.importe += pedido.importe;
      });

      let mejorCliente = Object.entries(clientes)
        .sort((a, b) => b[1].importe - a[1].importe)
        ?.pop()[1];

      let grafico = mejorCliente.pedidos
        .map((pedido) => {
          return {
            fecha: dayjs(pedido.createdAt).format(formatoDeFecha),
            value: pedido.importe,
          };
        })
        .reduce((acumulado, pedido) => {
          if (!acumulado.hasOwnProperty(pedido.fecha))
            acumulado[pedido.fecha] = {
              name: pedido.fecha,
              value: 0,
              datosAgrupados: 0,
            };
          acumulado[pedido.fecha].value += pedido.value;
          acumulado[pedido.fecha].datosAgrupados++;

          return acumulado;
        }, {});

      grafico = Object.entries(grafico).map((x) => x[1]);

      // Completar fechas faltantes.
      let grafico_fechas_completas = new Array(30)
        .fill()
        .map((x, i) => dayjs().add(-i, "days").format(formatoDeFecha))
        .map((fecha, i) => {
          let registro = grafico.find((graf) => graf.name === fecha);

          if (registro) {
            registro.name = ` [ ${registro.datosAgrupados} ] ${registro.name}`;
            return registro;
          }
          return {
            name: fecha,
            value: 0,
            datosAgrupados: 0,
          };
        })
        .reverse();

      let datos = {
        nombre: mejorCliente.nombre,
        comprado: mejorCliente.importe,
        pedidos: mejorCliente.pedidos.length,
        grafico: [
          {
            name: mejorCliente.nombre,
            series: grafico_fechas_completas,
          },
        ],
      };

      return res.send(datos);
    })
    .catch((_) => next(_));
};

const getVentasPorVendedor = async (req, res, next) => {
  let fecha_inicial = dayjs().startOf("day").add(-30, "day").toDate();
  let fecha_final = dayjs().endOf("day").toDate();

  let esAdmin = req.user.permissions.includes("administrador");

  let query = {
    createdAt: { $gte: fecha_inicial },
    updatedAt: { $lte: fecha_final },
  };
  if (!esAdmin) query.usuario = req.user._id;

  Pedidos.find(query)
    .select("usuario importe")
    .populate("usuario", "nombre", "Usuario")
    .exec()
    .then((pedidos) => {
      let vendedores = pedidos.reduce((acumulado, pedido) => {
        let usuario_id = pedido.usuario._id;
        if (!acumulado.hasOwnProperty(usuario_id))
          acumulado[usuario_id] = { pedidos: 0, vendido: 0 };
        acumulado[usuario_id].pedidos++;
        acumulado[usuario_id].vendido += pedido.importe;
        acumulado[usuario_id].nombre = pedido.usuario.nombre;

        return acumulado;
      }, {});

      let grafico = Object.entries(vendedores)
        .map((vendedor) => {
          return {
            name: vendedor[1].nombre,
            value: REDONDEAR(vendedor[1].vendido),
          };
        })
        .sort((a, b) => b.value - a.value);

      return res.send({ grafico });
    })
    .catch((_) => next(_));
};

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
