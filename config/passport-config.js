const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")

//user model
const User = require("../models/usersmodel")
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

    passport.serializeUser((user, done)=>{
        done(null, user.id)
    })
    passport.deserializeUser((id, done)=>{
        User.findById(id, (err, user)=>{
            done(err, user)
        })
    })
}

module.exports = initialize 