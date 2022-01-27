const mongoose = require("mongoose")

let commentschema = new mongoose.Schema({
    comment: {
        type: String
    },
    commentTime: {
        type: Date,
        default: Date.now
    },
    postId: {
        type: String
    },
    authorName: {
        type: String
    },
    authorEmail: {
        type: String
    }
})

module.exports = new mongoose.model("Comments", commentschema)

