const mongoose = require("mongoose")

const likesSchema = new mongoose.Schema({
    likerId: {
        type: String,
        required: true
    },
    likerName: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = new mongoose.model("likes", likesSchema)