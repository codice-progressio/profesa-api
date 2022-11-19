const mongoose = require("mongoose")

console.log("[GraphQL][Resolver] Usuario")
module.exports = {
  Query: {
    usuarios: async (nose, parametros) => {
      const docs = await mongoose
        .model("Usuario")
        .find({})
        .limit(parametros?.limit)
        .skip(parametros?.skip)
        .select("+permissions +create_at +password")
        .exec()
      return docs
    },
    usuarios_count: async () => {
      const usuarios = await mongoose.model("Usuario").countDocuments().exec()
      return usuarios || 0
    },
  },
  Mutation: {
    usuario_agregar: async (nose, parametros) => {
      Modelo = mongoose.model("Usuario")
      // Ni password, ni permisos aqui.
        let doc = new Modelo(parametros.datos)
        doc = await doc.save() 
      return doc
    },
  },
}
