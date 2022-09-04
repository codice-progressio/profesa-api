module.exports = {

    usuarios: async (prop) =>
    {

        console.log(prop)
        const usuarios = await require("mongoose").model("Usuario")
            .find({})
            .limit(prop.limit)
            .skip(prop.skip)
            .select('+permissions +create_at')
            .exec()
        return usuarios

    },
    usuarios_count: async () =>
    {
        const usuarios = await require("mongoose").model("Usuario").countDocuments().exec()
        return usuarios || 0

    },
}