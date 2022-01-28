const express = require("express");
const path = require("path")
const fileupload = require("express-fileupload")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const NewArticle = require("./models/articlesmodel");
const Users = require("./models/usersmodel")
const Comments = require("./models/commentsmodel")
const bcrypt = require("bcryptjs")
const flash = require("express-flash")
const initpassport = require("./config/passport-config");
const passport = require("passport");
const session = require("cookie-session")
const { error } = require("console");
const methodOverride = require("method-override")
const {userAuthenticated, userIsAdmin} = require("./config/auth")



initpassport(passport)
dotenv.config()

const app = express();

let mongoString = process.env.MONGODB_URI || "mongodb://localhost/buzz-arena-test"
mongoose.connect(mongoString) // hide this later



const staticpath ="./public"

app.use(express.static(staticpath))
app.use(express.json())
app.use(fileupload())
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    cookie:{
    secure: true,
    maxAge:60000
       },
    secret: 'hide later', //hide this later
    resave: false,
    saveUninitialized: false
  }))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride("_method"))





app.set("views", "./views")
app.set('view engine', 'ejs')

port = process.env.PORT || 5000



// index route
app.get("/", async (req, res)=>{ 
    let trending = await NewArticle.find({status: "trending"})
    let totalposts = await NewArticle.count()
    let postsperpage = 12
    let page = req.query.page || 1
    let skipposts = postsperpage * (page - 1)
    let articles = await NewArticle.find().sort({createdAt: -1}).skip(skipposts).limit(postsperpage)
    let popposts = await NewArticle.find().sort({views: -1}).limit(6)

if(req.isAuthenticated()){   
    res.render("index", {articles: articles, popular: popposts, loggedIn: true, user: req.user, totalposts: totalposts, currentpage: page, trend: trending})
 }else {
    
    res.render("index", {articles: articles, popular: popposts, loggedIn: false, user: req.user, totalposts: totalposts, currentpage: page, trend: trending})
 }
})

// categories route
app.get("/categories/:cat", async (req, res)=>{
    let popposts = await NewArticle.find().sort({views: -1}).limit(6)
    let articles = await NewArticle.find({categories: req.params.cat}).sort({createdAt: -1})
    
    if(articles == ""){
       res.redirect("/")
    } else{
        if(req.isAuthenticated()){
            res.render("categories", {articles: articles, popular: popposts, loggedIn: true, user: req.user, category: req.params.cat})
        }else{
            res.render("categories", {articles: articles, popular: popposts, loggedIn: false, user: req.user, category: req.params.cat})
        }
    }
   
})
   
app.get("/forum", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("forum", {loggedIn: true, user: req.user})
    }else {
        res.render("forum", {loggedIn: false, user: req.user})
    }
})

//register get route
app.get("/register", (req, res)=>{
    if(req.isAuthenticated()){
        res.redirect("/")
    }else{
        res.render("register", {loggedIn: false, user: req.user,errormsg: "" , feilds: ""})
    }
})
//login get route
app.get("/login", (req, res)=>{
    if(req.isAuthenticated()){
            res.redirect("/")
    } else{
    res.render("login", {loggedIn: false, user: req.user})
    }
})

//create article route
app.get("/newArticle", userAuthenticated, userIsAdmin,  async (req, res)=>{
    let posts = await NewArticle.find()
    let users = await Users.find()
    if(req.isAuthenticated()){
    res.render("newArticle", {msg: "", article: new NewArticle(), posts: posts, users: users, loggedIn: true, user: req.user})
    }
    else{
        res.render("newArticle", {msg: "", article: new NewArticle(), posts: posts, users: users, loggedIn: false, user: req.user})
    }
})

// article page route
app.get("/:id",  async (req, res)=>{
try{
    let popposts = await NewArticle.find().sort({views: -1}).limit(6)
    let article = await NewArticle.findById(req.params.id)
    let comments = await Comments.find({postId: req.params.id})
    article.views += 1
    article.save()
    console.log(article.views)
    console.log(comments)
    if(req.isAuthenticated()){
        res.render("article", {article: article, popular: popposts, loggedIn: true, user: req.user, comments: comments})
    }else{
        res.render("article", {article: article, popular: popposts, loggedIn: false, user: req.user, comments: comments})
    }

} catch{
    
    res.redirect("/")
}
})


app.get("/404", (req, res)=>{
    res.render("404")
})

//register users
app.post("/register", async (req, res)=>{

    //checking if user exists
    let finduser = await Users.findOne({mail: req.body.email})

    if(finduser){
        UserUploadError("User with the email already exists", req.body)
    } 
    else if(!req.body.firstname || req.body.firstname < 2){
        UserUploadError("firstname is too short", req.body)
    }
    else if(!req.body.lastname || req.body.lastname < 2){
        UserUploadError("lastname is too short", req.body)
    }
    else {
        let user = new Users({
            fname: req.body.firstname,
            lname: req.body.lastname,
            mail: req.body.email,
            password: req.body.password
        })
        // if user doesn't already exist, hash password and save info
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(user.password, salt, async function(err, hash) {
                user.password = hash
    
                user = await user.save()
                
                res.redirect("/login")
            });
        });
    }

   function UserUploadError(msg, userperst){
       
       res.render("register", {loggedIn: false, user: req.user,errormsg: msg , feilds: userperst})
   }
})

//loging in users
app.post("/login", (req, res, next)=>{
    passport.authenticate("local", {
        successRedirect: "/", 
        failureRedirect: "/login", 
        failureFlash: true
    })(req, res, next)

})
//log out
app.post("/logout", (req, res)=>{
    req.logout();
   
    res.redirect("/")
    
})
// posting articles route
app.post("/newArticle", async (req, res)=>{

//handling sending back file path for immediate use in frontend
console.log(req.files)
   if(req.files == null){
       articleUploadError("this post contains no image", req.body)
   } 
   else{
    let file = req.files.bannerimage
    let date = new Date()
    let banner = date.getDate() + date.getTime() + file.name
    let bannerdir = path.join(staticpath,  `/uploads/${banner}`)
    file.mv(bannerdir, (err, results)=>{
        console.log(results)
    })
    
   
    // validating inputs
    if(req.body.title =="" || req.body.title < 5){
        articleUploadError("Title is not long enough", req.body)
        }
        else if(req.body.description == "" || req.body.description < 10){
            articleUploadError("description is not long enough", req.body)
        }
        else if(req.body.content =="" || req.body.content < 20){
            articleUploadError("Article is empty or not long enough", req.body)
       }
       else if(!req.body.category){
           articleUploadError("Article category is not selected", req.body)
       }
       else if(!req.body.authormail){
            articleUploadError("Enter author's email", req.body)
       }
        else{

        //checking if email owner is an author
        let givenmail = await Users.findOne({mail: req.body.authormail})
        if(givenmail == null){
            articleUploadError("This email is not Registered", req.body)
}
else if(givenmail.isauthor == false){
    articleUploadError("This User is not an author", req.body)
}
  else{  
    
    //setting article
    let newarticle = new NewArticle({
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        categories: req.body.category,
        bannerPath: `uploads/${banner}`,
        views: 0,
        author: `${givenmail.fname} ${givenmail.lname}`
    })

try{
    newarticle = await newarticle.save()
    res.redirect(`/${newarticle.id}`)
    console.log(newarticle)
}catch (e){
   articleUploadError("fill in the fields properly", req.body)
  
}
}
}
}

async function articleUploadError(emsg, persist){
    let posts = await NewArticle.find()
    let users = await Users.find()
    let message = emsg
    res.render("newArticle", {msg: message, article: persist, posts: posts, users: users, loggedIn: req.isAuthenticated() ? true : false, user: req.user })
}
})
       
 
//making user author
app.post("/admin/makeauthor", async (req, res)=>{

    try{
    let author = await Users.findOne({mail: req.body.authormail})

    if(author == ""){
        console.log("User is not registered")
        res.redirect("/newArticle")
    }
    else if(author.isauthor){
        console.log("user is an author")
        res.redirect("/newArticle")
    }
    else if(!author.isauthor){
         author.isauthor = true
         author = await author.save()

         res.redirect("/newArticle")

         
    }
} catch{
    res.redirect("/newArticle")
}
})

//make post trending
app.post("/maketrending/:id", async (req, res)=>{
    let trend = await NewArticle.findById(req.params.id)

    trend.status = "trending"
    await trend.save()

    res.redirect("/newArticle")
})
//remove trending post
app.post("/removetrending/:id", async (req,res)=>{
    let trending = await NewArticle.findById(req.params.id)
    trending.status = ""

    await trending.save()

    res.redirect("/")
})
//posting comment
app.post("/comment/:id", userAuthenticated, async(req, res)=>{
    article = await NewArticle.findById(req.params.id)

    if(req.body.comment == ""){
        res.redirect(`/${req.params.id}`)
    }
    
        let postcomment = new Comments({
            comment: req.body.comment,
            postId: article.id,
            authorName: `${req.user.fname} ${req.user.lname}`,
            authorEmail: req.user.mail
        })

        postcomment = await postcomment.save()
        
       
        res.redirect(`/${req.params.id}`)
    
})

//delete post
app.delete("/:id", async (req,res)=>{
    await NewArticle.findByIdAndDelete(req.params.id)
    res.redirect("/newArticle")
})

//delete user
app.delete("/user/:id", async (req, res)=>{
    await Users.findByIdAndDelete(req.params.id)
    res.redirect("/newArticle")
})


app.use((req, res)=>{
    res.redirect("/404")
})

app.listen(port)