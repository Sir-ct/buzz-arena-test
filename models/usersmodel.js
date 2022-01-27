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
        default: false
    },
    isadmin:{
        type: Boolean,
        default: false
    }
})

module.exports = new mongoose.model("Users", userschema)