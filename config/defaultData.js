let colores = require('../utils/colors');
let Usuario = require('../models/usuario');
let _DEPTOS = require('../config/departametosDefaults');
let _PROC = require('../config/procesosDefault');
let _ROLE = require('../config/roles');
let Role = require('../models/role');
let CONSTANTES = require('../utils/constantes');
let Departamento = require('../models/departamento');
let RESP = require('../utils/respStatus');
let Proceso = require('../models/procesos/proceso');
let bcrypt = require('bcryptjs');
var DefaultModelDataModel = require('../config/defaultModelData');

var controlDeActualizaciones = require('../config/controlDeActualizaciones');

let Defaults = require('../models/configModels/default');



const USUARIO_SUPER_ADMIN = {
    nombre: "SUPER-ADMIN",
    email: "super-admin@super.com",
    password: bcrypt.hashSync("XX###adm", 10),
    img: "",
    role: [_ROLE.SUPER_ADMIN],

};

const D = colores.info('DEFAULTS');
module.exports = () => {

    console.log(D + colores.warning('Comprobando información.'));

    Usuario.findOne({ nombre: USUARIO_SUPER_ADMIN.nombre }).exec()
        .then(admin => {

            return crearSuperAdmin(admin);
        }).then((adminCreado) => {

            if (!adminCreado) {
                console.log(D + colores.warning(_ROLE.SUPER_ADMIN) + "Se creo el usuario.");
            } else {
                console.log(D + colores.warning(_ROLE.SUPER_ADMIN) + "Existe el usuario.");
            }

            DefaultModelDataModel.SUPER_ADMIN = adminCreado._id;
            console.log(D + colores.info(adminCreado._id) + "Se almaceno el id");
            // ============================================
            // Deben existir los departamentos.
            // ============================================

            const promesas = [];
            for (const depto in _DEPTOS) {
                if (_DEPTOS.hasOwnProperty(depto)) {
                    const departamento = _DEPTOS[depto];
                    promesas.push(comprobarDepartamentos(departamento._n, depto));
                }
            }

            return Promise.all(promesas);

        }).then(resp => {
            resp.forEach(respuesta => {
                console.log(D + colores.info('DEPARTAMENTOS') + respuesta);
            });

            // ============================================
            // DEBE EXISTIR UN PROCESO DE CONTROL DE PRODUCCIÓN POR DEFECTO.
            // ============================================

            return Promise.all(procesosPorDefautl());

        }).then(procesosDefaults => {

            for (let i = 0; i < procesosDefaults.length; i++) {
                const proc = procesosDefaults[i];
                console.log(D + colores.info('PROCESOS') + proc);
            }

            // let d = new Defaults(DefaultModelDataModel);


            return Defaults.findOneAndUpdate({}, DefaultModelDataModel, { upsert: true, new: true, setDefaultsOnInsert: true });
        }).then(defaults => {
            console.log(D + colores.info('DEFAULTS') + 'Se actualizaron los id de los defaults.');

            return gestionarActualizaciones(defaults);
        }).then(resp => {
            console.log(D + colores.info('ACTUALIZACIONES') + 'Se revisaron las actualizaciones.');

        }).catch(err => {
            console.log(colores.danger('ERROR COMPROBANDO DEFAULTS') + 'Hubo un error en la comprobación de valores por defecto.');
            throw new Error(err);
        });

};


function crearSuperAdmin(adminExistente)
{
    
    if (!adminExistente) {
        console.log(D + colores.warning('SUPER-ADMIN') + "No existe el usuario super admin. Se creará.");
        const nuevoAdmin = new Usuario();
        nuevoAdmin.nombre = USUARIO_SUPER_ADMIN.nombre;
        nuevoAdmin.email = USUARIO_SUPER_ADMIN.email;
        nuevoAdmin.password = USUARIO_SUPER_ADMIN.password;
        nuevoAdmin.role = USUARIO_SUPER_ADMIN.role;
        return nuevoAdmin.save();
    } 
        
    adminExistente.role = CONSTANTES.ROLES.ARRAY
    return adminExistente.save();
    
}

function comprobarDepartamentos(deptoBuscado, nombreVar) {
    // Busca un departamento en una promesa. 
    return new Promise((resolve, reject) => {
        // Buscamos el departamento. 
        Departamento.existe(deptoBuscado).then(deptoEncontrado => {
            // Existencia del departamento.
            if (!deptoEncontrado) {
                const d = new Departamento();
                d.nombre = deptoBuscado;
                return d.save();
            }
            DefaultModelDataModel.DEPARTAMENTOS[nombreVar] = deptoEncontrado._id;
            console.log(D + colores.info(deptoEncontrado._id) + "Se almaceno el id");
            resolve(colores.success(deptoBuscado) + 'Existe en la BD.');
        }).then(deptoGuardado => {
            // Si no tiene id quiere decir que ya existia y no se creo, Entonces
            // se grabo en la linea anterior. 
            if (deptoGuardado) {
                DefaultModelDataModel.DEPARTAMENTOS[deptoBuscado] = deptoGuardado._id;
                console.log(D + colores.info(deptoGuardado._id) + "Se almaceno el id");
            }
            resolve(colores.warning(deptoBuscado) + 'No existia se creo.');
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error comprobando si el departamento ' + deptoBuscado + ' existe.',
                err: err,
            }));
        });
    });
}

function existeDepartamento(nombreDepto) {
    return new Promise((resolve, reject) => {
        const p = Departamento.findOne({ nombre: nombreDepto }).exec();
        p.then(depto => {
            resolve(depto);
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error buscando el departamento.',
                err: err,
            }));
        });
    });
}

/**
 * Busca que los procesos de la lista por default exista y si no existen
 * los crea.
 *
 * @returns Un arreglo de promesas para ejectuar las acciones por cada proceso.
 */
function procesosPorDefautl() {

    // Guardamos todo en promesas retornarlo luego. 
    let promesas = [];

    // const nombreProceso = _PROC.CONTROL_DE_PRODUCCION._n;
    // const nombreDepto = _DEPTOS.CONTROL_DE_PRODUCCION._n;

    for (const key in _PROC) {
        if (_PROC.hasOwnProperty(key)) {
            const dpd = _PROC[key];
            var p = new Promise((resolve, reject) => {

                Promise.all([
                    existeDepartamento(dpd._departamento),
                    existeProceso(dpd._n, dpd._departamento)
                ]).then(respuestas => {
                    const depto = respuestas[0];
                    const proce = respuestas[1];

                    // Si algo extrano pasa y no se crea el departamento mandamos un error
                    // para depurar. 
                    if (!depto) {
                        reject(RESP.errorGeneral({
                            msj: 'No existe el departamento: ' + dpd._departamento,
                            err: 'Algo extraño paso. Este departamento debería existir.',
                        }));
                    } else {
                        if (!proce) {

                            // No existe, hay que crearlo
                            const p = new Proceso();
                            p.departamento = depto;
                            p.nombre = dpd._n;
                            p.observaciones = dpd.observaciones;
                            p.requiereProduccion = dpd.requiereProduccion;

                            p.save().then(procGrabado => {
                                DefaultModelDataModel.PROCESOS[key] = procGrabado._id;
                                console.log(D + colores.info(procGrabado._id) + "Se almaceno el id");
                                resolve(colores.warning(dpd._n) + 'El proceso no existia. Se grabo.');
                            }).catch(err => {
                                reject(RESP.errorGeneral({
                                    msj: 'Hubo un error grabando el proceso: ' + dpd._n,
                                    err: err,
                                }));
                            });
                        } else {
                            DefaultModelDataModel.PROCESOS[key] = proce._id;
                            console.log(D + colores.info(proce._id) + "Se almaceno el id");
                            resolve(colores.success(dpd._n) + 'Existe el proceso.');
                        }
                    }
                }).catch(err => {
                    reject(err);
                });
            });
            promesas.push(p);
        }
    }

    return promesas;

}

function existeDepartamento(nombreDepto) {
    return new Promise((resolve, reject) => {
        const p = Departamento.findOne({ nombre: nombreDepto }).exec();
        p.then(depto => {
            resolve(depto);
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error buscando el departamento.',
                err: err,
            }));
        });
    });
}

function existeProceso(nombre, nombreDepto) {
    return new Promise((resolve, reject) => {
        // Si existe el proceso de control de producción lo retorna. 
        const p = Proceso.findOne({ nombre: nombre }).exec();
        p.then(proc => {
            resolve(proc ? proc : false);
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error buscando el departamento.',
                err: err,
            }));
        });
    });
}


/**
 /**
  *
  *
 * Ejecuta la gestion de actualizaciones para saber si la BD 
 * ya cuenta con las actualizaciones necesarias. 
 *
 *
 * @param {*} defaults Los valores por default. 
 * @returns La promesa que revisa las actualizaciones. 
 */
function gestionarActualizaciones(defaults) {

    return new Promise((resolve, reject) => {
        // Revisamos si los default contienen la actualizacion. ]
        let promesas = [];

        if (!defaults.ACTUALIZACIONES) defaults.ACTUALIZACIONES = {};

        for (const actualizacion in controlDeActualizaciones) {

            if (defaults.ACTUALIZACIONES.hasOwnProperty(actualizacion)) {
                // LA ACTUALIZACION YA ESTA ECHA. 
                resolve();
            } else {
                // Guardamos la promesa de la actualizacion para ejecutarla.
                promesas.push(controlDeActualizaciones[actualizacion]());
                // Modificamos el objeto defaults para agregar la nueva actualizacion aplicada.
                defaults.ACTUALIZACIONES = {
                    [actualizacion]: true
                };
            }
        }


        // Ejecutamos todas las actualizacioones pendiente. 
        Promise.all(promesas).then(resp => {

            resp.forEach(r => {
                console.log(`${colores.info('UPDATE')}  ${r}`);
            });
            // Guaramos los cambios echos al default. 
            return defaults.save();
        }).then(resp => {
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}