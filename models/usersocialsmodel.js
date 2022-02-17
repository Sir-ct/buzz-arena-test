const mongoose = require("mongoose")

const socialsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    facebook: {
        type: String
    },
    twitter: {
        type: String
    },
    instagram: {
        type: String
    }
})

module.exports = new mongoose.model("usersocials", socialsSchema)