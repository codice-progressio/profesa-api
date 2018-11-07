//Esto es necesario
var express = require("express");
var Cliente = require("../models/cliente");
var colores = require("../utils/colors");
var MarcaLaser = require("../models/marcaLaser");

var app = express();

app.get("/", (req, res, next) => {
    console.log(colores.info("/clientes") + "[get] Funcionando.");

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Cliente.find({})
        .skip(desde)
        .limit(5)
        .exec((err, clientes) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error cargando clientes.",
                    errors: err
                });
            }

            Cliente.count({}, (err, conteo) => {
                // Si no sucede ningún error.
                res.status(200).json({
                    ok: true,
                    clientes: clientes,
                    total: conteo
                });
            });

        });
});

// ============================================
// Guardar un cliente??
// ============================================

app.post("/", (req, res, next) => {
    var body = req.body;
    var cliente = new Cliente({
        nombre: body.nombre,
        sae: body.sae
    });

    cliente.save((err, clienteGuardado) => {
        if (err) {
            console.log(
                colores.danger("Error POST - cliente") +
                "No se pudo completar la petición =>" +
                err
            );

            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear cliente.",
                errors: err
            });
        }

        console.log(colores.info("POST") + " Petición correcta: clientes");
        res.status(201).json({
            ok: true,
            cliente: clienteGuardado
        });
    });
});

// ============================================
// Actualizar cliente
// ============================================

app.put("/:id", (req, res) => {
    console.log(colores.info("/cliente") + "[put] Funcionando.");
    var id = req.params.id;
    var body = req.body;

    Cliente.findById(id, (err, cliente) => {
        if (err) {
            console.log(
                colores.danger("Error PUT - cliente") +
                "Error al buscar cliente. =>" +
                err
            );

            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar cliente.",
                errors: err
            });
        }

        //Validamos que haya un cliente con ese id.
        if (!cliente) {
            console.log(
                colores.danger("Error PUT - cliente") +
                `El cliente con id ${id} no existe. =>` +
                err
            );

            return res.status(400).json({
                ok: false,
                mensaje: `El cliente con id ${id} no existe.`,
                errors: { message: "No existe un cliente con ID." }
            });
        }

        cliente.nombre = body.nombre;
        cliente.sae = body.sae;

        cliente.save((err, clienteGuardado) => {
            if (err) {
                console.log(
                    colores.danger("Error PUT - cliente") +
                    "Error al actualizar cliente. =>" +
                    err
                );

                return res.status(400).json({
                    ok: false,
                    mensaje: "Error al actualizar cliente.",
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                cliente: clienteGuardado
            });
        });
    });
});

// ============================================
// Borrar un cliente
// ============================================

app.delete("/:id", (req, res) => {
    console.log(colores.info("/cliente") + "[delete] Funcionando.");

    var id = req.params.id;

    Cliente.findByIdAndRemove(id, (err, clienteBorrado) => {
        if (err) {
            var msj = "Error al borrar el cliente";
            console.log(colores.danger("Error DELETE - cliente") + `${msj} =>` + err);
            return res.status(500).json({
                ok: false,
                mensaje: `${msj}`,
                errors: err
            });
        }

        if (!clienteBorrado) {
            var msj2 = "No existe un cliente con ese id.";

            console.log(
                colores.danger("Error DELETE - cliente") + `${msj2} =>` + err
            );
            return res.status(400).json({
                ok: false,
                mensaje: msj2,
                errors: { message: msj2 }
            });
        }

        console.log(colores.info("DELETE") + " Petición correcta: clientes");
        res.status(200).json({
            ok: true,
            cliente: clienteBorradop
        });
    });
});

// ============================================
// Agregar una marca laser al cliente.
// ============================================

app.put("/laser/:idCliente", (req, res) => {
    var idCliente = req.params.idCliente;
    var marcaLaser = req.body.laser;




    Cliente.findById(idCliente)
        .populate('laserados')
        .exec((err, cliente) => {
            if (err) {
                console.log(
                    colores.danger("Error PUT:/laser/idCliente - cliente") +
                    "Error al buscar cliente. =>" +
                    err
                );

                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al buscar cliente.",
                    errors: err
                });
            }

            //Validamos que haya un cliente con ese id.
            if (!cliente) {
                console.log(
                    colores.danger("Error PUT - cliente") +
                    `El cliente con id ${idCliente} no existe. =>` +
                    err
                );

                return res.status(400).json({
                    ok: false,
                    mensaje: `El cliente con id ${idcliente} no existe.`,
                    errors: { message: "No existe un cliente con ID." }
                });
            }

            //El cliente existe. Agregamos el nuevo laserado.

            if (!marcaLaser) {
                // El parametro no puede estar vacio.
                return res.status(500).json({
                    ok: false,
                    mensaje: "La marca laser no puede estar vacia.",
                    errors: err
                });
            }


            MarcaLaser.find({ 'laser': marcaLaser })
                .exec((err, marcaLaserObject) => {
                    if (err) {
                        console.log(
                            colores.danger("Error PUT:/laser/idCliente - cliente") +
                            "Error al buscar marcaLaser. =>" +
                            err
                        );

                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al buscar la marca laser.",
                            errors: err
                        });
                    }

                    // Transformamos la marca laser en un objeto que podamos manejar.
                    // Como solo quiero obtener el id necesito hacer todo esto para que funcione.
                    const mlO = JSON.parse(JSON.stringify((marcaLaserObject)));

                    if (mlO.length > 0) {

                        // La marca existe. Solo lo guardamos el en cliente.

                        var _id = mlO[0]._id;
                        // Ahora es necesario que revisemos si el cliente tiene esa 
                        // marca laser. 

                        if (!clienteTieneMarcaLaser(cliente, _id)) {
                            cliente.laserados.push(_id);
                            guardarCliente(cliente, res);
                        } else {
                            return res.status(400).json({
                                ok: false,
                                mensaje: "El cliente ya tiene asignada la marca.",
                                errors: err
                            });
                        }

                    } else {

                        // Creamos la nueva marca laser.
                        nuevaMarca = new MarcaLaser({
                            laser: marcaLaser,
                            imagen: ''
                        });
                        nuevaMarca.save((err, marcarLaserGuardada) => {
                            if (err) {
                                return res.status(500).json({
                                    ok: false,
                                    mensaje: "Error al guardar nueva marca laser.",
                                    errors: err
                                });
                            }

                            if (!marcarLaserGuardada) {
                                return res.status(500).json({
                                    ok: false,
                                    mensaje: "Algo paso y no se guardo la marca laser.",
                                    errors: err
                                });
                            }
                            cliente.laserados.push(marcarLaserGuardada);
                            guardarCliente(cliente, res);

                        });
                    }
                });
        });
});

function clienteTieneMarcaLaser(cliente, _id) {
    // Revisamos si el cliente tiene una marca laser. 

    //Convertimo el cliente a un objeto manejable. 
    var clienteJ = JSON.parse(JSON.stringify(cliente));

    let a = clienteJ.laserados.filter(
        laserado => {
            // Aqui no existe el id por que no esta populado el objeto que nos 
            // esta devolviendo el arreglo con los laserados del cliente. 
            if (laserado === _id) {
                return true;
            }
        }
    );

    if (a.length === 0) {
        // No tiene esta marca laser asignada. 
        return false;
    }
    // Tiene la marca laser asignada. 
    return true;
}

function guardarCliente(cliente, res) {
    cliente.save((err, clienteModificado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al modificar el cliente.",
                errors: err
            });
        }
        return res.status(200).json({
            ok: true,
            cliente: clienteModificado
        });
    });

}

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;