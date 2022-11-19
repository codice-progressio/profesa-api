module.exports = /* GraphQL */ `
  type Usuario {
    _id: String!
    nombre: String!
    email: String!
    password: String
    permissions: [String]
    inhabilitado: Boolean
    password_offline: String
    create_at: String
  }
  
  input UsuarioAgregar {
    nombre: String!
    email: String!
  }


  type Query {
    usuarios(limit: Int, skip: Int): [Usuario]
    usuarios_count: Int
  }

  type Mutation {
    usuario_agregar (datos:UsuarioAgregar):Usuario
  }
`