// require("dotenv").config()
// const easyPermissions = require("@codice-progressio/easy-permissions")
// // Generación de permisos

// easyPermissions.config({
//   modoProduccion: process.env.NODE_ENV === "production",
//   generarPermisos: true,
// })

// const easyImages = require("@codice-progressio/easy-images")

// easyImages.config({
//   GCLOUD_PROJECT_ID: process.env.GCLOUD_PROJECT_ID,
//   GCLOUD_STORAGE_BUCKET_URL: process.env.GCLOUD_STORAGE_BUCKET_URL,
//   GCLOUD_APPLICATION_CREDENTIALS: process.env.GCLOUD_APPLICATION_CREDENTIALS,
// })

// const compression = require("compression")
// // Requires
const express = require("express")
// const https = require("https")
// const fs = require("fs")
// const mongoose = require("mongoose")
// const colores = require("./utils/colors")
// const bodyParser = require("body-parser")
// const _ROUTES = require("./config/routes")
const cors = require("cors")

// // Inicializar variables.
const app = express()

const config = {
  application: {
    cors: {
      server: [],
    },
  },
}

app.use(
  cors({
    origin: "*", //servidor que deseas que consuma o (*) en caso que sea acceso libre
    // credentials: true,
  })
)

app.all("*", (req, res, next) => {
  res.send({
    token:
      "eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1ZmYzNzQxMzdkZmY5MjAwMTUxNDBhMTEiLCJwZXJtaXNzaW9ucyI6WyJtZW51OmFkbWluaXN0cmFkb3I6cnV0YXMtZGUtZW50cmVnYSIsIm1lbnU6YWRtaW5pc3RyYWRvcjpwYXJhbWV0cm9zIiwibWVudTphZG1pbmlzdHJhZG9yOnVzdWFyaW9zIiwibWVudTphZG1pbmlzdHJhZG9yIiwibWVudTpjb21wcmFzOmNvbnRhY3RvcyIsIm1lbnU6Y29tcHJhcyIsIm1lbnU6dmVudGFzOm1pcy1wZWRpZG9zIiwibWVudTp2ZW50YXMiLCJtZW51OmFsbWFjZW46c2t1IiwibWVudTphbG1hY2VuIiwicnV0YXMtZGUtZW50cmVnYTplbGltaW5hcjppZCIsInJ1dGFzLWRlLWVudHJlZ2E6YnVzY2FyOmNvbnRhY3Rvcy1kZS1ydXRhIiwicnV0YXMtZGUtZW50cmVnYTpidXNjYXI6aWQiLCJydXRhcy1kZS1lbnRyZWdhOmxlZXI6dG9kbyIsInJ1dGFzLWRlLWVudHJlZ2E6Y3JlYXItbW9kaWZpY2FyIiwicGVkaWRvOmVsaW1pbmFyIiwicGVkaWRvOm1vZGlmaWNhciIsInBlZGlkbzpjcmVhciIsInBlZGlkbzpidXNjYXI6dXN1YXJpbyIsInBlZGlkbzpidXNjYXI6Y29udGFjdG8iLCJwZWRpZG86YnVzY2FyOmlkIiwicGVkaWRvOmxlZXI6dG9kbyIsInByb2dyYW1hY2lvblRyYW5zZm9ybWFjaW9uOmFjdHVhbGl6YXJVYmljYWNpb24iLCJwcm9ncmFtYWNpb25UcmFuc2Zvcm1hY2lvbjpvcmRlbmVzUG9yQXNpZ25hciIsInByb2dyYW1hY2lvblRyYW5zZm9ybWFjaW9uOmFzaWduYXIiLCJyZXBvcnRlUGVyc29uYWxpemFkb0FsbWFjZW5EZVByb2R1Y2Npb246ZWxpbWluYXIiLCJyZXBvcnRlUGVyc29uYWxpemFkb0FsbWFjZW5EZVByb2R1Y2Npb246bW9kaWZpY2FyIiwicmVwb3J0ZVBlcnNvbmFsaXphZG9BbG1hY2VuRGVQcm9kdWNjaW9uOmxlZXI6dG9kbzp0ZXJtaW5vIiwicmVwb3J0ZVBlcnNvbmFsaXphZG9BbG1hY2VuRGVQcm9kdWNjaW9uOmxlZXI6aWQiLCJyZXBvcnRlUGVyc29uYWxpemFkb0FsbWFjZW5EZVByb2R1Y2Npb246bGVlcjp0b2RvIiwicmVwb3J0ZVBlcnNvbmFsaXphZG9BbG1hY2VuRGVQcm9kdWNjaW9uOmNyZWFyIiwicGFyYW1ldHJvczplc3RhY2lvbmVzRGVFc2NhbmVvIiwicGFyYW1ldHJvczpkZXBhcnRhbWVudG9UcmFuc2Zvcm1hY2lvbiIsInBhcmFtZXRyb3M6cHJvY2Vzb3NFc3BlY2lhbGVzIiwicGFyYW1ldHJvczpsb2NhbGl6YWNpb25EZU9yZGVuZXMiLCJlbXBsZWFkbzppbmdyZXNvOm1vZGlmaWNhciIsImVtcGxlYWRvOmV2ZW50bzplbGltaW5hciIsImVtcGxlYWRvOmV2ZW50bzpib25vIiwiZW1wbGVhZG86ZXZlbnRvOmFtb25lc3RhY2lvbiIsImVtcGxlYWRvOmV2ZW50bzpmZWxpY2l0YWNpb24iLCJlbXBsZWFkbzpldmVudG86Y2FzdGlnbyIsImVtcGxlYWRvOmV2ZW50bzpjdXJzbyIsImVtcGxlYWRvOmV2ZW50bzp2YWNhY2lvbmVzIiwiZW1wbGVhZG86ZXZlbnRvOnBlcm1pc286cmVjaGF6YXIiLCJlbXBsZWFkbzpldmVudG86cGVybWlzbzphdXRvcml6YXIiLCJlbXBsZWFkbzpldmVudG86cGVybWlzbyIsImVtcGxlYWRvOmV2ZW50bzplc3RhdHVzTGFib3JhbDppbmNhcGFjaWRhZDptYXRlcm5pZGFkIiwiZW1wbGVhZG86ZXZlbnRvOmVzdGF0dXNMYWJvcmFsOmluY2FwYWNpZGFkOnJpZXNnb0RlVHJhYmFqbyIsImVtcGxlYWRvOmV2ZW50bzplc3RhdHVzTGFib3JhbDppbmNhcGFjaWRhZDplbmZlcm1lZGFkR2VuZXJhbCIsImVtcGxlYWRvOmV2ZW50bzplc3RhdHVzTGFib3JhbDpyZWluZ3Jlc28iLCJlbXBsZWFkbzpldmVudG86ZXN0YXR1c0xhYm9yYWw6YmFqYSIsImVtcGxlYWRvOmV2ZW50bzpzdWVsZG8iLCJlbXBsZWFkbzpldmVudG86cHVlc3RvIiwiZW1wbGVhZG86ZWxpbWluYXIiLCJlbXBsZWFkbzpjcmVhciIsImVtcGxlYWRvOmxlZXI6dGVybWlubyIsImVtcGxlYWRvOmxlZXI6aWQiLCJlbXBsZWFkbzpsZWVyOnRvZG8iLCJwdWVzdG86ZWxpbWluYXIiLCJYWFhYWDptdWx0aXBsZVB1ZXN0byIsInB1ZXN0bzptb2RpZmljYXIiLCJwdWVzdG86Y3JlYXIiLCJwdWVzdG86bGVlcjp0ZXJtaW5vIiwicHVlc3RvOmxlZXI6aWQiLCJwdWVzdG86bGVlcjp0b2RvIiwiYXJlYTplbGltaW5hciIsImFyZWE6bW9kaWZpY2FyIiwiYXJlYTpsZWVyOnRlcm1pbm8iLCJhcmVhOmxlZXI6aWQiLCJhcmVhOmxlZXI6dG9kbyIsImFyZWE6Y3JlYXIiLCJjdXJzbzpsZWVyOnRpcG9EZUN1cnNvOnRyb25jb0NvbXVuIiwiY3Vyc286ZWxpbWluYXIiLCJjdXJzbzptb2RpZmljYXIiLCJjdXJzbzpsZWVyOnRlcm1pbm8iLCJjdXJzbzpsZWVyOmlkIiwiY3Vyc286bGVlcjp0b2RvIiwiY3Vyc286Y3JlYXIiLCJyZXF1aXNpY2lvbjplc3RhdHVzOmFjdHVhbGl6YXIiLCJyZXF1aXNpY2lvbjpsZWVyOnRvZG8iLCJyZXF1aXNpY2lvbjpsZWVyOmlkIiwicmVxdWlzaWNpb246ZWxpbWluYXIiLCJyZXF1aXNpY2lvbjptb2RpZmljYXIiLCJyZXF1aXNpY2lvbjpjcmVhciIsImRpdmlzYTplbGltaW5hciIsImRpdmlzYTptb2RpZmljYXIiLCJkaXZpc2E6bGVlcjp0ZXJtaW5vIiwiZGl2aXNhOmxlZXI6aWQiLCJkaXZpc2E6bGVlcjp0b2RvIiwiZGl2aXNhOmNyZWFyIiwicHJvdmVlZG9yOnJ1dGFzOmFncmVnYXIiLCJwcm92ZWVkb3I6ZWxpbWluYXIiLCJwcm92ZWVkb3I6bW9kaWZpY2FyIiwicHJvdmVlZG9yOmxlZXI6dGVybWlubyIsInByb3ZlZWRvcjpsZWVyOmlkIiwicHJvdmVlZG9yOmxlZXI6dG9kbyIsInByb3ZlZWRvcjpjcmVhciIsImFydGljdWxvOmVsaW1pbmFyIiwiYXJ0aWN1bG86bW9kaWZpY2FyIiwiYXJ0aWN1bG86cmVwb3J0ZXM6ZXhpc3RlbmNpYXMiLCJhcnRpY3VsbzpsZWVyOnRlcm1pbm8iLCJhcnRpY3VsbzpsZWVyOmlkIiwiYXJ0aWN1bG86bGVlcjp0b2RvIiwiYXJ0aWN1bG86Y3JlYXIiLCJhbG1hY2VuRGVzY3JpcGNpb246ZWxpbWluYXIiLCJhbG1hY2VuRGVzY3JpcGNpb246bW9kaWZpY2FyIiwiYWxtYWNlbkRlc2NyaXBjaW9uOmNyZWFyIiwiYWxtYWNlbkRlc2NyaXBjaW9uOmxlZXI6dGVybWlubyIsImFsbWFjZW5EZXNjcmlwY2lvbjpsZWVyOmlkIiwiYWxtYWNlbkRlc2NyaXBjaW9uOmxlZXI6dG9kbyIsImZvbGlvOmxpYmVyYXJQYXJhUHJvZHVjY2lvbiIsImZvbGlvOmVudHJlZ2FyQVJldmlzaW9uIiwiZm9saW86cmV0b3JuYXJBbFZlbmRlZG9yIiwiZm9saW86cG9yRW50cmVnYXJBUHJvZHVjY2lvbjp2ZW5kZWRvciIsImZvbGlvOmZpbHRyYXIiLCJmb2xpbzpyZXBvcnRlOnBhcmFSZXZpc2lvbiIsImZvbGlvOmRldGFsbGU6Zm9saW8iLCJmb2xpbzpkZXRhbGxlOnBlZGlkbyIsImZvbGlvOmRldGFsbGU6b3JkZW4iLCJmb2xpbzptb2RpZmljYXI6c2VuYWxhck9yZGVuZXNJbXByZXNhcyIsImZvbGlvOm1vZGlmaWNhciIsImZvbGlvOmxlZXI6aWQiLCJmb2xpbzpjcmVhciIsImZvbGlvOmVsaW1pbmFyIiwiYWxtYWNlbkRlUHJvZHVjdG9UZXJtaW5hZG86Y29uc29saWRhcjptb2RlbG8iLCJhbG1hY2VuUHJvZHVjdG9UZXJtaW5hZG86bGVlcjp0ZXJtaW5vIiwiYWxtYWNlbkRlUHJvZHVjdG9UZXJtaW5hZG86bGVlcjp0b2RvIiwicmVwb3J0ZXM6YWxtYWNlbkRlUHJvZHVjY2lvbjpwZXJzb25hbGl6YWRvOmlkIiwicmVwb3J0ZXM6YWxtYWNlbkRlUHJvZHVjY2lvbjpmYWx0YW50ZXMiLCJyZXBvcnRlczpwcm9kdWN0b1Rlcm1pbmFkbzpmYWx0ZXMiLCJtYXF1aW5hOmxlZXI6ZGVwYXJ0YW1lbnRvIiwibWFxdWluYTplbGltaW5hciIsIm1hcXVpbmE6bW9kaWZpY2FyIiwibWFxdWluYTpsZWVyOnRlcm1pbm8iLCJtYXF1aW5hOmxlZXI6aWQiLCJtYXF1aW5hOmxlZXI6dG9kbyIsIm1hcXVpbmE6Y3JlYXIiLCJmYW1pbGlhRGVQcm9jZXNvczptb2RpZmljYXIiLCJmYW1pbGlhRGVQcm9jZXNvczplbGltaW5hciIsImZhbWlsaWFEZVByb2Nlc29zOmxlZXI6dGVybWlubyIsImZhbWlsaWFEZVByb2Nlc29zOmxlZXI6aWQiLCJmYW1pbGlhRGVQcm9jZXNvczpsZWVyOnRvZG8iLCJmYW1pbGlhRGVQcm9jZXNvczpjcmVhciIsInByb2Nlc286bGVlcjptdWx0aXBsZSIsInByb2Nlc286ZWxpbWluYXIiLCJwcm9jZXNvOm1vZGlmaWNhciIsInByb2Nlc286bGVlcjp0ZXJtaW5vIiwicHJvY2VzbzpsZWVyOmlkIiwicHJvY2VzbzpsZWVyOnRvZG8iLCJwcm9jZXNvOmNyZWFyIiwiZGVwYXJ0YW1lbnRvOmxlZXI6bXVsdGlwbGUiLCJkZXBhcnRhbWVudG86ZWxpbWluYXIiLCJkZXBhcnRhbWVudG86bW9kaWZpY2FyIiwiZGVwYXJ0YW1lbnRvOmxlZXI6dGVybWlubyIsImRlcGFydGFtZW50bzpsZWVyOmlkIiwiZGVwYXJ0YW1lbnRvOmxlZXI6dG9kbyIsImRlcGFydGFtZW50bzpjcmVhciIsImNsaWVudGU6bW9kaWZpY2FyIiwiY2xpZW50ZTplbGltaW5hciIsImNsaWVudGU6bGVlcjp0ZXJtaW5vIiwiY2xpZW50ZTpsZWVyOmlkIiwiY2xpZW50ZTpsZWVyOnRvZG8iLCJjbGllbnRlOmNyZWFyIiwic2t1OmxvdGU6ZWxpbWluYXIiLCJza3U6bG90ZTptb3ZpbWllbnRvOm1vZGlmaWNhciIsInNrdTpsb3RlOm1vdmltaWVudG86dHJhbnNmZXJpci1lbnRyZS1hbG1hY2VuZXMiLCJza3U6bG90ZTptb3ZpbWllbnRvOkVsaW1pbmFyIiwic2t1OmxvdGU6bW92aW1pZW50bzpBZ3JlZ2FyIiwic2t1OmxvdGU6Y3JlYXIiLCJza3U6ZWxpbWluYXI6ZXRpcXVldGEiLCJza3U6ZWxpbWluYXIiLCJza3U6bW9kaWZpY2FyOmFncmVnYXItZXRpcXVldGEiLCJza3U6bW9kaWZpY2FyOnN0b2NrLW1pbWltby1tYXhpbW8iLCJza3U6bW9kaWZpY2FyIiwic2t1OmxlZXI6dGVybWlubyIsInNrdTpsZWVyOmlkIiwic2t1OmxlZXI6dG9kbyIsInNrdTppbWFnZW46ZWxpbWluYXIiLCJza3U6aW1hZ2VuOmFncmVnYXIiLCJza3U6Y3JlYXIiLCJTVVBFUl9BRE1JTiIsImFkbWluaXN0cmFkb3I6dXN1YXJpbzpsZWVyOnRvZG86bGlnZXJvIiwiYWRtaW5pc3RyYWRvcjp1c3VhcmlvOmxlZXI6aWQiLCJhZG1pbmlzdHJhZG9yOnVzdWFyaW86bGVlcjp0ZXJtaW5vIiwiYWRtaW5pc3RyYWRvcjp1c3VhcmlvOmVsaW1pbmFyIiwiYWRtaW5pc3RyYWRvcjp1c3VhcmlvOmNyZWFyIiwiYWRtaW5pc3RyYWRvcjp1c3VhcmlvOm1vZGlmaWNhcjplbGltaW5hci1wZXJtaXNvIiwidXN1YXJpbzptb2RpZmljYXI6ZWxpbWluYXItaW1hZ2VuIiwidXN1YXJpbzptb2RpZmljYXI6YWdyZWdhci1pbWFnZW4iLCJhZG1pbmlzdHJhZG9yOnVzdWFyaW86bW9kaWZpY2FyOmFncmVnYXItcGVybWlzb3MiLCJhZG1pbmlzdHJhZG9yOnVzdWFyaW86bW9kaWZpY2FyOnBhc3N3b3JkIiwiYWRtaW5pc3RyYWRvcjp1c3VhcmlvOm1vZGlmaWNhciIsImFkbWluaXN0cmFkb3I6dXN1YXJpbzpsZWVyIiwibG9naW4iXSwiZW1haWwiOiJhZG1pbkBjcC5jb20iLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIiwiX192Ijo1LCJlbGltaW5hZG8iOmZhbHNlLCJpbWciOnsiX2lkIjoiNjAxZDczMWIxZDU1OTAwMDE1MWE0ZGI0Iiwibm9tYnJlT3JpZ2luYWwiOiIxNjEyNTQyNzI4NzU0MTUwMzQxMzk2MjcyNTY5MzA1OS5qcGciLCJub21icmVCRCI6IjYwMWQ3MzFiMWQ1NTkwMDAxNTFhNGRiMyIsInBhdGgiOiJodHRwczovL2ZpcmViYXNlc3RvcmFnZS5nb29nbGVhcGlzLmNvbS92MC9iL2ltcGVyaXVtc2ljLTUzYzZiLmFwcHNwb3QuY29tL28vNjAxZDczMWIxZDU1OTAwMDE1MWE0ZGIzP2FsdD1tZWRpYSJ9LCJtZW51IjpbeyJ0aXR1bG8iOiJBdmlzb3MiLCJpY29ubyI6ImZhcyBmYS1jb21tZW50cyIsInN1Ym1lbnUiOlt7InRpdHVsbyI6IkRhc2hib2FyZCIsInVybCI6Ii9kYXNoYm9hcmQifV19LHsicGVybWlzbyI6Im1lbnU6YWxtYWNlbiIsInRpdHVsbyI6IiBBbG1hY2VuIiwiaWNvbm8iOiJmYXMgZmEtd2FyZWhvdXNlIiwic3VibWVudSI6W3sidGl0dWxvIjoiQWxtYWNlbiIsInVybCI6Ii9hbG1hY2VuIiwicGVybWlzbyI6Im1lbnU6YWxtYWNlbjpza3UifV19LHsidGl0dWxvIjoiQWRtaW5pc3RyYWRvciIsImljb25vIjoiZmFzIGZhLXVzZXItY29nIiwic3VibWVudSI6W3sidGl0dWxvIjoiUGFyYW1ldHJvcyIsInVybCI6Ii9wYXJhbWV0cm9zIn0seyJ0aXR1bG8iOiJSdXRhcyIsInVybCI6Ii9wYXJhbWV0cm9zL3J1dGFzLWRlLWVudHJlZ2EifSx7InRpdHVsbyI6IlVzdWFyaW9zIiwidXJsIjoiL3VzdWFyaW8ifV19LHsidGl0dWxvIjoiQ29tcHJhcyIsImljb25vIjoiZmFzIGZhLXNob3BwaW5nLWJhZyIsInN1Ym1lbnUiOlt7InRpdHVsbyI6IkNvbXByYXMiLCJ1cmwiOiIvY29tcHJhcyJ9LHsidGl0dWxvIjoiQ29udGFjdG9zIiwidXJsIjoiL2NvbXByYXMvY29udGFjdG9zIn1dfSx7InRpdHVsbyI6IlZlbnRhcyIsImljb25vIjoiZmFzIGZhLWZpbGUtY29udHJhY3QiLCJzdWJtZW51IjpbeyJ0aXR1bG8iOiJNaXMgUGVkaWRvcyIsInVybCI6Ii92ZW50YXMvbWlzUGVkaWRvcyJ9XX1dLCJhcGlWZXJzaW9uIjoiMy4xMC4wIiwiaWF0IjoxNzE5MTIzODk5LCJleHAiOjE3MTkxMzEwOTl9.UKsEYAFBs0NlXXakPyQCRuv_ueiQ1UBKvlceBrnJF-g",
  })
})

// app.disable("x-powered-by")
// app.use(compression())

// app.use((req, res, next) => {
//   console.log("Entramos 0")
//   next()
// })
// app.use((req, res, next) => {
//   console.log("Entramos 0.1")
//   next()
// })

// app.use((req, res, next) => {
//   console.log("Entramos 1")
//   next()
// })

// //  Body parser
// // parse application/x-www-form-urlencoded
// app.use(express.json({ limit: "50mb" }))
// app.use((req, res, next) => {
//   console.log("Entramos 2")
//   next()
// })
// app.use(express.urlencoded({ limit: "50mb", extended: true }))
// app.use((req, res, next) => {
//   console.log("Entramos 3")
//   next()
// })

// //Convierte los valores de los query que se pasan por url
// // en valores. Ej. 'true'=> true, '1000' => 1000
// app.use(require("express-query-auto-parse")())

// app.use((req, res, next) => {
//   console.log("Entramos 4")
//   next()
// })

// mongoose.set("useNewUrlParser", true)
// mongoose.set("useUnifiedTopology", true)
// mongoose.set("useCreateIndex", true)
// mongoose.connection.openUri(process.env.URI, (err, res) => {
//   if (err) {
//     // Mensaje de error en la base de datos.
//     console.log(err)
//     throw err
//   }

//   app.use((req, res, next) => {
//     console.log("Entramos 5")
//     next()
//   })
//   // Mensaje de conexion exitosa a la BD
//   console.log("[ INFO ] Conectado a la BD")

//   app.use((req, res, next) => {
//     if (process.env.NODE_ENV !== "production") {
//       console.log(
//         `${new Date()}|` +
//           colores.success("PETICION RECIBIDA") +
//           colores.danger(req.method) +
//           colores.info(req.originalUrl)
//       )
//     }
//     next()
//   })

//   app.use((req, res, next) => {
//     console.log("Entramos 6")
//     next()
//   })

//   app.use(_ROUTES)

//   app.use((req, res, next) => {
//     console.log("Entramos 7")
//     next()
//   })

// Llamamos a los errores.
app.use(function (req, res, next) {
  console.log("No existe la pagina")
  return res.status(404).send("No existe la pagina")
})

//   app.use((req, res, next) => {
//     console.log("Entramos 8")
//     next()
//   })

//   app.use(function (err, req, res, next) {
//     console.log(`err`, err)
//     //Errores de permisos
//     const errores = [
//       //Cuando el token no trae un usuario
//       "user_object_not_found",
//       //No autorizado
//       "permission_denied",
//     ]

//     if (errores.includes(err.code)) {
//       return res
//         .status(403)
//         .send(
//           `No tienes permisos para acceder a este contenido: '${req.permisoSolicitado}'`
//         )
//     }

//     if (err.code === "invalid_token") {
//       return res.status(401).send("Token invalido. Inicia sesion de nuevo")
//     }

//     if (err.code === "credentials_required") {
//       return res.status(401).send("Es necesario loguearte")
//     }

//     if (err.errors) {
//       return res.status(500).send(err.message)
//     }

//     return res.status(500).send(err)
//   })

const msjServidor = () => {
  console.log(`[ INFO ] Servidor iniciado en el puerto: ${process.env.PORT}`)
}

//   console.log("[ INFO ] Modo:" + process.env.NODE_ENV)

//   if (process.env.NODE_ENV === "production") {
app.listen(process.env.PORT, msjServidor)
//   } else {
//     https
//       .createServer(
//         {
//           key: fs.readFileSync(
//             "./node_modules/@codice-progressio/easy-https/cert/desarrollo.key"
//           ),
//           cert: fs.readFileSync(
//             "./node_modules/@codice-progressio/easy-https/cert/desarrollo.crt"
//           ),
//         },
//         app
//       )
//       .listen(process.env.PORT, msjServidor)
//   }
// })
