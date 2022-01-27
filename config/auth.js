module.exports = {
    userAuthenticated: function(req, res, next){
        if(req.isAuthenticated()){
           return next()
        }

        res.redirect("/login")
    },
    userIsAdmin: function (req, res, next){
        if(req.isAuthenticated() && req.user.isadmin){
            return next()
        }

        console.log("you are not an admin")
        res.redirect("/")
    }
}