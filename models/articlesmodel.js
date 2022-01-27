const mongoose = require("mongoose");
let showdown = require("showdown")
const createPurifier = require("dompurify")
const {JSDOM} = require("jsdom");
const purify = createPurifier(new JSDOM("").window)

let converter = new showdown.Converter()

let newArticleSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bannerPath: {
        type: String,
        required: true
    },
    categories: {
        type: Array,
        required: true
    },
    views: {
        type: Number
    },
    author: {
        type: String
    },
    status:{
        type: String
    },
    sanitizedContent: {
        type: String
    }
})

newArticleSchema.pre("validate", function(next){
    if(this.content){
        this.sanitizedContent = purify.sanitize(converter.makeHtml(this.content))
    }
    next()
})
module.exports = new mongoose.model("NewArticle", newArticleSchema);