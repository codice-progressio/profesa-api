const app = require("express")()

const Usuario = require("mongoose").model("Usuario")

app.get("/sincronizar", (req, res, next) => {
  Usuario.find({
    inhabilitado: false,
    "email_validado.validado": true,
  })
    .select("-password")
    .then(usuarios => res.send({ usuarios }))
    .catch(_ => next(_))
})

module.exports = app
