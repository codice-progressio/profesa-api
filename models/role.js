var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var roleSchema = new Schema({
    role: { type: String, requiered: [true, 'Es obligatorio que definas el role.'] }
});
module.exports = roleSchema;