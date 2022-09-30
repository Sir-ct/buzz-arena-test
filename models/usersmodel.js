const mongoose = require("mongoose")

let userschema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true
    },
    isauthor:{
        type: Boolean,
        default: true
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

module.exports = new mongoose.model("Users", userschema)