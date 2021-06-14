const app = require("express")()

const Facturapi = require("facturapi")
const facturapi = new Facturapi(process.env.FACTURACION_API_KEY)

app.post("/", (req, res, next) => {
  facturapi.invoices
    .create({
      customer: {
        legal_name: "John Doe",
        email: "email@example.com",
        tax_id: "ABCD111111CBA",
      },
      items: [
        {
          product: {
            description: "Ukelele",
            product_key: "60131324",
            price: 345.6,
          },
        },
      ],
      payment_form: Facturapi.PaymentForm.DINERO_ELECTRONICO,
    })
    .then(factura => res.send({ factura }))
    .catch(_ => next(_))
})

module.exports = app
