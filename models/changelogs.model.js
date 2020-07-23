const mongoose = require("mongoose")
const Schema = mongoose.Schema

const changelogSchema = new Schema(
  {
    changelog: String,
  },
  { collection: "changelog" }
)

module.exports = mongoose.model("changelogs", changelogSchema)
