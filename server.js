const express = require("express");
const path = require("path")
const fileupload = require("express-fileupload")
const mongoose = require("mongoose")
const NewArticle = require("./models/articlesmodel");
const Users = require("./models/usersmodel")
const Comments = require("./models/commentsmodel")
const Usersocials = require("./models/usersocialsmodel") //still
const Token = require("./models/tokenmodel") //arill
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const flash = require("express-flash")
const initpassport = require("./config/passport-config");
const passport = require("passport");
const session = require("cookie-session")
const nodemailer = require("nodemailer")
const { error } = require("console");
const methodOverride = require("method-override")
const {userAuthenticated, userIsAdmin} = require("./config/auth");
const { getMaxListeners } = require("process");



initpassport(passport)

const app = express();

let mongoString = process.env.MONGODB_URI 
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
    secret: process.env.SESSION_KEY, //hide this later
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
    let trending = await NewArticle.find({status: "trending"}).limit(3)
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

//User dash board
app.get("/userdashboard", userAuthenticated, async (req, res)=>{
    let socials = await Usersocials.findOne({userId: req.user.id})
    res.render("userdashboard", {loggedIn: req.isAuthenticated() ? true : false, user: req.user})
   
})
// updateUser profile route
app.get("/updateprofile",userAuthenticated, (req, res)=>{

    res.render("updateprofile", {loggedIn: req.isAuthenticated() ? true : false, user: req.user})
})

// update user social handles get route
app.get("/updatesocials", userAuthenticated, async (req, res)=>{
    let socials = await Usersocials.findOne({userId: req.user.id})
    res.render("updatesocials", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, socials: socials})
})

// change password get route
app.get("/changepassword", userAuthenticated, async(req, res)=>{
    res.render("changepassword", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, msg: ""})
})

//  forgot password get route
app.get("/resetpassword", (req, res)=>{
    res.render("resetpassword", {loggedIn: req.isAuthenticated() ? true : false, msg: ""})
})

//last password reset step
app.get("/passwordreset/:token/:userid", (req, res)=>{
    if(req.isAuthenticated()){
        res.redirect("/")
    } else {
        res.render("lastpasswordstep", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, token: req.params.token, userid: req.params.userid, msg: ""})
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
//edit article route
app.get("/updatearticle/:id", userIsAdmin, async (req, res)=>{
    let article = await NewArticle.findById(req.params.id)
    res.render("updatearticle", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, article: article, msg: ""})
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
    res.render("article", {article: article, loggedIn: true, user: req.user, popular: popposts, comments: comments})
    }else{
        res.render("article", {article: article, loggedIn: false, user: req.user, popular: popposts, comments: comments})
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

                let regmail = `
                    <h2>Welcome</h2>
                    <p> You Are successfully registered on Buzz arena, go ahead and login with the link below<br>
                        <a href="buzz-arena-test.herokuapp.com/login"> Login </a>
                    </p>
                `
                sendmail(user.mail, "Welcome to the hood", regmail)
                res.render("register", {loggedIn: false, user: req.user,errormsg: "congratulations! an email has been sent to your inbox" , feilds: ""})
            });
        });
    }

   function UserUploadError(msg, userperst){
       
       res.render("register", {loggedIn: false, user: req.user,errormsg: msg , feilds: userperst})
   }
})

//loging in users
app.post("/login", passport.authenticate("local", {
        failureRedirect: "/login", 
        failureFlash: true
    }), async (req, res)=>{
        let user = await Users.findById(req.user.id)
        user.lastLoggedIn = Date.now()
        await user.save()

        res.redirect("/")
    }
)


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
        bannerPath: `/uploads/${banner}`,
        views: 0,
        author: `${givenmail.fname} ${givenmail.lname}`,
        authorMail: `${givenmail.mail}`,
        authorId: `${givenmail.id}`
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
    console.log(error)
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

//

// reset password post route
app.post("/forgotpassword", async (req, res)=>{
    let user = await Users.findOne({mail: req.body.email})

    if(!user) {
        res.render("resetpassword", {loggedIn: req.isAuthenticated() ? true : false, msg: "there is no user with this email"})
    }
    else{
        let token = await Token.findOne({userId: user.id})

        if(!token){
            token = new Token({
                userId: user.id,
                token:  crypto.randomBytes(32).toString("hex")
            })
    
            let resetlink = `<h1> click on the link below to reset your password</>
            <a href="https://localhost:5000/passwordreset/${token.token}/${user.id}"> Reset password</a>`

            sendmail(user.mail, "password reset link", resetlink)
            res.render("resetpassword", {loggedIn: req.isAuthenticated() ? true : false, msg: "reset link has been sent to your email"})
       
        }
    }
})

//user socials update
app.post("/updatesocials/:userid", async(req, res)=>{
    let usersocial = await Usersocials.findOne({userId: req.params.userid})
  
    if(usersocial){

       if(req.body.facebook != ""){
           usersocial.facebook = req.body.facebook

           await usersocial.save()
       }
       if(req.body.twitter != ""){
           usersocial.twitter = req.body.twitter

           await usersocial.save()
       }
       if(req.body.instagram != ""){
           usersocial.instagram = req.body.instagram

           await usersocial.save()
       }

       res.redirect("/updatesocials")
       
    }
    else {

        usersocial = new Usersocials({
            userId: req.params.userid,
            facebook: req.body.facebook,
            twitter:  req.body.twitter,
            instagram: req.body.instagram,
        })

        await usersocial.save()
        console.log(usersocial)
        res.redirect("/updatesocials")
        
    }
     
})

// user profile update
app.post("/updateprofile/:userid", async (req, res)=>{
    let user = await Users.findById(req.params.userid)
    if(req.files != null){
        let file = req.files.profilepic
        let date = new Date()
        let dp = date.getDate() + date.getTime() + file.name
        let dpdir = path.join(staticpath,  `/uploads/${dp}`)
        file.mv(dpdir, (err, results)=>{
            console.log(results)
        })

        user.profileImgPath = `/uploads/${dp}`

        user = await user.save()
        console.log(dpdir)
    }

    user.fname = req.body.firstname
    user.lname = req.body.lastname
    user.aboutUser = req.body.about

    await user.save()

    res.redirect("/updateprofile")
})

// update article
app.put("/newArticle/:articleid", async (req, res)=>{
    try{
        let article = await NewArticle.findById(req.params.articleid)
    if(req.files != null){
        let file = req.files.bannerimage
        let date = new Date()
        let banner = date.getDate() + date.getTime() + file.name
        let bannerdir = path.join(staticpath,  `/uploads/${banner}`)
        file.mv(bannerdir, (err, results)=>{
            console.log(results)
        })

        article.bannerPath =  `/uploads/${banner}`

        await article.save()
    }

    if(req.body.authormail == ""){
        articleEditError("author field cannot be empty", req)
    }

    if(req.body.authormail != ""){
        let givenmail = await Users.findOne({mail: req.body.authormail})
        if(!givenmail){
            articleEditError("This email is not Registered", req)
        }
        else if(givenmail.isauthor == false){
            articleEditError("This User is not an author", req)
        }
        else if(givenmail.isauthor){
            article.author =  `${givenmail.fname} ${givenmail.lname}`,
            article.authorMail =  `${givenmail.mail}`,
            article.authorId =  `${givenmail.id}`

                await article.save()
        }
                
    }

    if(!req.body.category){
       articleEditError("select category", req)
       
    }
    else{
        article.categories = req.body.category

        await article.save()
    }

    article.title = req.body.title
    article.description = req.body.description
    article.content = req.body.content

    await article.save()

    res.redirect("/updatearticle")
    } catch{
        console.log(error)
    }

    async function articleEditError(emsg, persist){
        let message = emsg
        let article = await NewArticle.findById(persist.params.articleid)
    res.render("updatearticle", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, article: article, msg: message})
    }
})


// change password post route
app.post("/changepassword/:userid", async (req, res)=>{

    let user = await Users.findById(req.params.userid)

    if(req.body.oldPassword == ""){
        changePassError("Please enter your previous password!")
    }
    else{
        let isMatch = await bcrypt.compare(req.body.oldPassword, user.password)
        if(!isMatch){
            changePassError("Old password is incorrect")
        }else{
            if(req.body.newPassword != req.body.confirmPassword || req.body.newPassword == ""){
                changePassError("The two passwords do not match")
                console.log(req.body)
            }
            else{
                console.log(req.body)
                user.password = req.body.newPassword
    
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(user.password, salt, async function(err, hash) {
                        user.password = hash
            
                        user = await user.save()
                        
                        console.log(user)
                        
                    });
                });
                req.logout()
                res.redirect("/login")
            }
            
        }
    
        }
        
       
    async function changePassError(emsg, persist){
        let message = emsg
        
    res.render("changepassword", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, msg: message})
    }
})

//forgotpassword post route
app.post("/passwordreset/:token/:userid", async(req, res)=>{
    let token = await Token.findOne({token: req.params.token, userId: req.params.userid})
    if(!token){
        res.render("lastpasswordstep", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, token: req.params.token, userid: req.params.userid, msg: "link is invalid or has expired"})
    }
    else{
        let  user = await Users.findById(req.params.userid)

        if(req.body.newPassword != req.body.confirmPassword || req.body.newPassword == ""){
            res.render("lastpasswordstep", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, token: req.params.token, userid: req.params.userid, msg: "the passwords don't match"})
        }
        else{
            user.password = req.body.newPassword
    
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(user.password, salt, async function(err, hash) {
                    user.password = hash
        
                    user = await user.save()
                    
                    console.log(user)
                    await token.delete()
                });
            });

            res.render("lastpasswordstep", {loggedIn: req.isAuthenticated() ? true : false, user: req.user, token: req.params.token, userid: req.params.userid, msg: "password reset successful"})
        }
    }
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

async function sendmail(tomail, sbj, content){
    let transport = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 587,
        secure: false,
        auth: {
          user: "c41069c65c7cb5",
          pass: "7dadca14f63eca"
        }
      });

    let message = {
        from: "davidsirct@gmail.com",
        to: tomail,
        subject: sbj,
        html: content
    }

    await transport.sendMail(message, (err, info)=>{
        if(err){
            console.log(err)
        } else{
            console.log(info)
        }
    })
}

app.listen(port)