const path = require("path")

const { makeExecutableSchema } = require("@graphql-tools/schema")
const { mergeResolvers, mergeTypeDefs } = require("@graphql-tools/merge")
const { loadFilesSync } = require("@graphql-tools/load-files")

const resolverFiles = loadFilesSync(path.join(__dirname, "./**/*.resolver.*"))
const typeFiles = loadFilesSync(path.join(__dirname, "./**/*.type.*"))

console.log({resolverFiles, typeFiles})

const resolvers = mergeResolvers(resolverFiles)
const typeDefs = mergeTypeDefs(typeFiles)
const schema = makeExecutableSchema({ typeDefs, resolvers })

module.exports = {
  schema,
}

