const express = require('express')
const passport = require("passport")
const moment = require('moment')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const User = require('../models/user')
const Article = require('../models/article')
const auth = require('../middleware/auth')

const router = express.Router()

router.get("/profile", auth, async (req, res) => {
    const articles = await Article.find({author: req.user.id}).sort({ createdAt: 'desc' })
    const user = await User.findById(req.user.id)
    
    userFollowers = []
    userFollowing = []

    for (let i=0; i<user.followers.length; i++) {
        const tempUser = await User.findById(user.followers[i])
        userFollowers.push({
            id: user.followers[i],
            username: tempUser.username
        })
    }
    for (let i=0; i<user.following.length; i++) {
        const tempUser = await User.findById(user.following[i])
        userFollowing.push({
            id: user.following[i],
            username: tempUser.username
        })
    }

    res.render("profile", {
        createdAt: moment(req.user.createdAt).format('M/y'),
        user,
        articles,
        userFollowers,
        userFollowing
    })
})

router.get("/register", function(req, res){
    res.render("register");
});

router.post("/register", function(req, res){
    User.register(new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }), req.body.password, function(err, user){
       if(err) {
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
            sendWelcomeEmail(user.email, user.username)
            res.redirect("/home")
       });
    });
});

router.get("/login", function(req, res){
    res.render("login");
})

router.post("/login", passport.authenticate("local",{
    successRedirect:"/home",
    failureRedirect:"/login"
}),function(req, res){
    console.log("User is "+ req.user.id)
});

router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

router.get("/profile/edit", auth, async (req, res) => {
    res.render("editProfile"), {
        username: req.user.username,
        email: req.user.email,
    }
})

router.post("/update", auth, (req, res) => {
    const id = req.user.id

    User.findById(id, async (err, user) => {
      if (err) {
        console.error('error, no entry found')
        res.redirect('/error')
      }
      user.username = req.body.username;
      user.email = req.body.email;
      user.password = req.body.password;
      await user.save();
    })
    res.redirect('/profile');
})

router.post('/delete', auth, async (req, res) => {
    const id = req.user.id
    await User.findByIdAndRemove(id).exec()
    await Article.deleteMany({ author: id })
    sendCancelationEmail(req.user.email, req.user.username)
    res.redirect('/');
})

router.post('/:id/follow', (req, res, next) => {
    User.findById(req.user.id).then((user) => {
        return user.follow(req.params.id).then(() => {
            
            // console.log(`${req.user.id} following ${req.params.id}`)
            User.findById(req.params.id).then((user) => {
                return user.addFollower(req.user.id).then(() => {
                    // console.log(`${req.params.id} followed by ${req.user.id}`)
                    res.redirect('/home')
                })
            })
        })
    }).catch(next)
})

router.post('/:id/unfollow', (req, res, next) => {
    User.findById(req.user.id).then((user) => {
        return user.unfollow(req.params.id).then(() => {
            
            // console.log(`${req.user.id} unfollowing ${req.params.id}`)
            User.findById(req.params.id).then((user) => {
                return user.removeFollower(req.user.id).then(() => {
                    // console.log(`${req.params.id} unfollowed by ${req.user.id}`)
                    res.redirect('/home')
                })
            })
        })
    }).catch(next)
})

module.exports = router