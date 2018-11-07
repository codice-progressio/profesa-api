var col = require('../utils/colors');
const URI_PRODUCTION = 'mongodb://localhost:27017/carrduci';

const PORT_DEV = 2999;
const PORT_PRO = 3000;

const URI_DEVELOPMENT = 'mongodb://localhost:27017/hospitalDB';

module.exports.enviroment = (env) => {
    const uri = env ? URI_PRODUCTION : URI_DEVELOPMENT;
    const port = env ? PORT_PRO : PORT_DEV;

    const msj_dev_bienvenida = col.danger('***********| PRECAUCIÓN |**********') + 'Estas en modo desarrollo.';
    const msj_pro_bienvenida = col.success('PRODUCCIóN ') + 'Estas en modo producción.';

    const msj_bd_ok = col.success('BD ONLINE') + `Conexión existosa a la BD. ${uri}`;
    const msj_bd_err = col.danger('BD OFFLINE') + `No se pudo conectar a la BD. ${uri}`;

    const msj_mongo = col.success('SERVER ONLINE') + `Express esta corriendo en el puerto ${port}`;

    // Selecciona cambia entre base de datos. 

    const o = {
        uri: uri,
        msj_bienvenida: env ? msj_pro_bienvenida : msj_dev_bienvenida,
        msj_bd_ok: msj_bd_ok,
        msj_bd_err: msj_bd_err,
        env: env,
        port: port,
        msj_mongoose_ok: msj_mongo
    };
    ENVIROMENT = o;
    return o;

};

// module.exports = ENVIROMENT;