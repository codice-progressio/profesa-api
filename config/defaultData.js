var col = require('../utils/colors');
var Usuario = require('../models/usuario');


const USUARIO_SUPER_ADMIN = {
    nombre: "SUPER-ADMIN",
    email: "super-admin@super.com",
    password: "XX###adm",
    img: "",
    role: "",

};

const D = col.info('DEFAULTS');
module.exports = () => {
    console.log(col.warning('DEFAULTS') + 'Comprobanco información.');

    // Debe existir un SUPER-ADMIN
    const comprobaciones = Usuario.find({ nombre: USUARIO_SUPER_ADMIN.nombre }).exec();

    comprobaciones.then(admin => {
        return crearSuperAdmin(admin);
    }).catch(err => {
        console.log(col.danger('ERROR COMPROBANDO DEFAULTS') + 'Hubo un error en la comprobación de valores por defecto.');
        throw new Error(err);
    });
    // TODO: Roles por defecto. 

};

function crearSuperAdmin(admin) {
    if (!admin) {
        console.log(D + col.warning('SUPER-ADMIN') + "No existe el usuario super admin. Se creará.");
        admin.nombre = USUARIO_SUPER_ADMIN.nombre;
        admin.email = USUARIO_SUPER_ADMIN.email;
        admin.password = USUARIO_SUPER_ADMIN.password;
        // TODO: Tomar este rol de la configuración general y 
        admin.role = USUARIO_SUPER_ADMIN.role;
    } else {
        console.log(D + col.warning('SUPER-ADMIN') + "Existe el usuario.");
    }
}