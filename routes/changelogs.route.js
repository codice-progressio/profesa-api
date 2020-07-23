const express = require("express")
const app = express()

const Changelog = require("../models/changelogs.model")
const pjson = require("../package.json")
var permisos = require("../config/permisos.config")

app.put("/", permisos.$("SUPER_ADMIN"), (req, res, next) => {
  Changelog.findOne()
    .exec()
    .then(x => {
      if (!x) {
        return new Changelog(req.body).save()
      }

      x.changelog = req.body.changelog
      return x.save()
    })
    .then(c => res.send({ changelog: c.changelog, apiVersion: pjson.version }))
    .catch(_ => next(_))
})

app.get("/", (req, res, next) => {
  Changelog.findOne({})
    .exec()
    .then(c => res.send({ changelog: c?.changelog, apiVersion: pjson.version }))
    .catch(_ => next(_))
})

module.exports = app
