const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;

//user model
const User = require("../models/usersmodel")
const Guser = require("../models/gusersmodel")
const sendmail = require("../server")


function initialize(passport){
    passport.use(new LocalStrategy({usernameField: "email"}, async (email, password, done)=>{
        let user = await User.findOne({mail: email})

        if(!user){
            
           return done(null, false, {message: "This User is not registered, join up?"})
        }
        else{
            let isMatch = await bcrypt.compare(password, user.password)
            if(isMatch){
                return done(null, user)
            }else{
                return done(null, false, {message: "password is incorrect"})
            }
        }
    
    }))

    passport.use(new GoogleStrategy({
        clientID:    process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://buzzarena.net/auth/google/callback",
        passReqToCallback   : true
      },
      async (request, accessToken, refreshToken, profile, done) => {
          //checking if user already signed up with username and password
        let user = await User.findOne({mail: profile.emails[0].value})

        if(user){
           return done(null, false, {message: "A user already registered with this mail"})
        }else{
               let user =  await Guser.findOne({ googleId: profile.id })

               if(user){

                console.log(`user is registered already ${user}`)
                   return done(null, user)
               }else {

                let user = new Guser({
                    googleId: profile.id,
                    fname: profile.name.givenName,
                    lname: profile.name.familyName,
                    mail: profile.emails[0].value,
                    profileImgPath: profile.photos[0].value
                })

                let regmail = `
                <h2>Welcome</h2>
                <p> You Are successfully registered on Buzz arena, go ahead and login with the link below<br>
                    <a href="buzz-arena-test.herokuapp.com/login"> Login </a>
                </p>
            `
                sendmail(req.body.email, "Welcome to the hood", regmail)

                 await user.save()
                 console.log(`user is not registered already regigistering now ${user}`)
                 return done(null, user)
               }
        }
      }
    ));

    passport.serializeUser((user, done)=>{
        done(null, user)
    })
    passport.deserializeUser((user, done)=>{
        done(null, user)
    })
}

module.exports = initialize 