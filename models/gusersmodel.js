const mongoose = require("mongoose")

let guserschema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    mail:{
        type: String,
        required: true
    },
    isauthor:{
        type: Boolean,
        default: false
    },
    isadmin:{
        type: Boolean,
        default: false
    },
    issuperadmin: {
        type: Boolean,
        default: false
    },
    timeJoined: {
        type: Date,
        default: Date.now
    },
    lastLoggedIn: {
        type: Date
    },
    profileImgPath: {
        type: String
    },
    aboutUser: {
        type: String
    }
})

module.exports = new mongoose.model("Gusers", guserschema)