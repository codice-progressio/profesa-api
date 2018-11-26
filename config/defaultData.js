var colores = require('../utils/colors');
var Usuario = require('../models/usuario');
var _DEPTOS = require('../config/departametosDefaults');
var _PROC = require('../config/procesosDefault');
var _ROLE = require('../config/roles');
var Role = require('../models/role');
var CONSTANTES = require('../utils/constantes');
var Departamento = require('../models/departamento');
var RESP = require('../utils/respStatus');
var Proceso = require('../models/procesos/proceso');
var bcrypt = require('bcryptjs');

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

    // ============================================
    // Debe existir un SUPER-ADMIN
    // ============================================

    Usuario.findOne({ nombre: USUARIO_SUPER_ADMIN.nombre }).exec().then(admin => {

        return crearSuperAdmin(admin);
    }).then((adminCreado) => {

        if (!adminCreado) {
            console.log(D + colores.warning(_ROLE.SUPER_ADMIN) + "Se creo el usuario.");
        } else {
            console.log(D + colores.warning(_ROLE.SUPER_ADMIN) + "Existe el usuario.");

        }
        // ============================================
        // Deben existir los departamentos.
        // ============================================

        const promesas = [];
        for (const depto in _DEPTOS) {
            if (_DEPTOS.hasOwnProperty(depto)) {
                const departamento = _DEPTOS[depto];
                promesas.push(comprobarDepartamentos(departamento._n));
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

        return debeExistirProcesoPorDefectoEnControlProduccion();

    }).then(proEntregaDeOrden => {
        console.log(D + colores.info('PROCESOS') + proEntregaDeOrden);

        //     // ============================================
        //     // Deben existir los roles en la base de datos.
        //     // ============================================
        //     const promesasRoles = [];
        //     for (let i = 0; i < _ROLE.ARRAY.length; i++) {
        //         const role = _ROLE.ARRAY[i];
        //         promesasRoles.push(comprobarRolPorDefecto(role));

        //     }


        //     return Promise.all(promesasRoles);
        // }).then(resp => {
        //     resp.forEach(respuesta => {
        //         console.log(D + colores.info('ROLES') + respuesta);
        //     });

    }).catch(err => {
        console.log(colores.danger('ERROR COMPROBANDO DEFAULTS') + 'Hubo un error en la comprobación de valores por defecto.');
        throw new Error(err);
    });
    // TODO: Roles por defecto. 

};

function comprobarRolPorDefecto(role) {
    return new Promise((resolve, reject) => {
        Role.existe(role).then(roleEncontrado => {
            if (!roleEncontrado) {
                const b = new Role();
                b.role = role;
                return b.save();
            }
            resolve(colores.success(role) + 'Existe en la BD.');
        }).then(roleGuardado => {
            resolve(colores.warning(role) + 'No existia se creo.');
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error buscando el role.',
                err: err,
            }));
        });
    });
}



function crearSuperAdmin(adminExistente) {
    if (!adminExistente) {
        console.log(D + colores.warning('SUPER-ADMIN') + "No existe el usuario super admin. Se creará.");
        const nuevoAdmin = new Usuario();
        nuevoAdmin.nombre = USUARIO_SUPER_ADMIN.nombre;
        nuevoAdmin.email = USUARIO_SUPER_ADMIN.email;
        nuevoAdmin.password = USUARIO_SUPER_ADMIN.password;
        // TODO: Tomar este rol de la configuración general y 
        nuevoAdmin.role = USUARIO_SUPER_ADMIN.role;
        return nuevoAdmin.save();
    } else {
        return adminExistente;
    }
}

function comprobarDepartamentos(deptoBuscado) {
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
            resolve(colores.success(deptoBuscado) + 'Existe en la BD.');
        }).then(deptoGuardado => {
            resolve(colores.warning(deptoBuscado) + 'No existia se creo.');
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error comprobando si el departamento ' + deptoBuscado + ' existe.',
                err: err,
            }));
        });
    });
}

function debeExistirProcesoPorDefectoEnControlProduccion() {
    const nombreProceso = _PROC.CONTROL_DE_PRODUCCION._n;
    const nombreDepto = _DEPTOS.CONTROL_DE_PRODUCCION._n;

    return new Promise((resolve, reject) => {

        Promise.all([
            existeDepartamento(nombreDepto),
            existeProceso(nombreProceso, nombreDepto)
        ]).then(respuestas => {
            const depto = respuestas[0];
            const proce = respuestas[1];

            if (!depto) {
                reject(RESP.errorGeneral({
                    msj: 'No existe el departamento: ' + _DEPTOS.CONTROL_DE_PRODUCCION._n,
                    err: 'Algo extraño paso. Este departamento debería existir.',
                }));
            } else {
                if (!proce) {
                    // No existe, hay que crearlo. 
                    const p = new Proceso();
                    p.departamento = depto;
                    p.nombre = nombreProceso;
                    p.pasos.push({ orden: 1, descripcion: 'Entregar órdenes para empezar producción.' });
                    p.observaciones = 'Este proceso debe ir simpre al principio de todas las familias.';
                    p.especial = false;
                    p.save().then(procGrabado => {
                        resolve(colores.warning(nombreProceso) + 'El proceso no existia. Se grabo.');
                    }).catch(err => {
                        reject(RESP.errorGeneral({
                            msj: 'Hubo un error grabando el proceso: ' + nombreProceso,
                            err: err,
                        }));
                    });
                } else {
                    resolve(colores.success(nombreProceso) + 'Existe el proceso.');
                }
            }
        }).catch(err => {
            reject(err);
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