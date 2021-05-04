const path = require('path')
const http = require('http')
require('./db/mongoose')
require('dotenv').config()
const express = require('express')
const hbs = require('hbs')

const session = require('express-session')
const cookieParser = require('cookie-parser')
const passport = require("passport")
const LocalStrategy =  require("passport-local").Strategy
const moment = require('moment')

// Model and Routes
const User =  require("./models/user")
const Article =  require("./models/article")
const { sendWelcomeEmail, sendCancelationEmail } = require('./emails/account')

// Middleware
const auth = require('./middleware/auth')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// app.use('/users', userRouter)

app.use(session({
    secret:"This shall too pass",
    resave: false,          
    saveUninitialized:false
}))

const server = http.createServer(app)
const port = process.env.PORT

// Define Paths for Express Config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

app.use(express.static(publicDirectoryPath))

// Setup Handlebars Engine and Views Location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(User.serializeUser())
// console.log(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
// console.log(User.deserializeUser())
passport.use(new LocalStrategy(User.authenticate()))

// Common Routes
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/home", auth, async (req, res) => {
    const articles = await Article.find({}).sort({ createdAt: 'desc' })
    
    res.render("secret", {
        username: req.user.username,
        articles,
    })
})

app.get('/posts/recent', auth, async (req, res) => {    
    
    const articles = await Article.find({}).sort({ createdAt: 'desc' }).limit(5)
    res.render('postRecent', {
        username: req.user.username,
        articles,
    })
});

app.get("/profile", auth, async (req, res) => {
    const articles = await Article.find({author: req.user.id}).sort({ createdAt: 'desc' })
    const user = await User.findById(req.user.id)
    const users = await User.find()
    console.log(user)
    res.render("profile", {
        createdAt: moment(req.user.createdAt).format('M/y'),
        user,
        users,
        articles
    })
})

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About',
        name: 'Aditya Kataria'
    })
})

app.get('/help', (req, res) => {
    res.render('help', {
        title: 'Help',
        name: 'Aditya Kataria'
    })
})

app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact Us',
        name: 'Aditya Kataria'
    })
})

app.get('/error', (req, res) => {
    res.render('error')
})

// Auth Routes
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
User.register(new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
}), req.body.password, function(err, user){
       if(err) {
            console.log(err);
            return res.render('register');
        } //user stragety
        passport.authenticate("local")(req, res, function(){
            sendWelcomeEmail(user.email, user.username)
            // const token = user.generateAuthToken()
            // console.log(token)
            res.redirect("/home")
       });
    });
});

app.get("/login", function(req, res){
    res.render("login");
})
app.post("/login", passport.authenticate("local",{
    successRedirect:"/home",
    failureRedirect:"/login"
}),function(req, res){
    // const token = req.user.generateAuthToken()
    // console.log(token)
    console.log("User is "+ req.user.id)
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/profile/edit", auth, async (req, res) => {
    res.render("editProfile"), {
        username: req.user.username,
        email: req.user.email,
    }
})

app.post("/update", auth, (req, res) => {
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

app.post('/delete', auth, async (req, res) => {
    const id = req.user.id
    await User.findByIdAndRemove(id).exec()
    await Article.deleteMany({ author: id })
    sendCancelationEmail(req.user.email, req.user.username)
    res.redirect('/');
})

// Post Routes
app.get('/posts/new', auth, (req, res) => {
    res.render('create')
});

app.post('/posts/store', auth, async (req, res) => {
    const articles = new Article({
        ...req.body,
        author: req.user._id,
        authorName: req.user.username
    })
    try {
        await articles.save()
        res.redirect('/home')
    } catch (e) {
        res.status(400).send(e)
    }
})

app.get('/posts/:id', auth, async (req, res) => {
    const articles = await Article.findById(req.params.id)    
    let articleAuthorId = (articles.author).toString()
    let currentUserId = (req.user.id).toString()
    const user = await User.findById(req.user.id)
    const isFollowing = user.following.indexOf(articleAuthorId)

    let modifyPermission = false
    if (articleAuthorId === currentUserId) {
        modifyPermission = true
    }
    console.log(articleAuthorId, currentUserId, modifyPermission, isFollowing)
    res.render('post', {
        id: req.user.id,
        username: req.user.username,
        articles,
        modifyPermission,
        isFollowing
    })
});

app.get('/posts', auth, async (req, res) => {    
    const articles = await Article.find({topic: req.query.topic})
    let count = 0
    if (articles) {
        count += 1
    }
    res.render('postTopic', {
        id: req.user.id,
        username: req.user.username,
        topic: req.query.topic,
        articles,
        count
    })
});

app.get('/posts/:id/edit', auth, async (req, res) => {
    const articles = await Article.findById(req.params.id)
    res.render('editPost', {
        articles
    })
});

app.post("/posts/:id", auth, (req,res) => {
    Article.findOneAndUpdate({_id: req.params.id, author: req.user.id}, {
        $set:{
            title: req.body.title,
            description: req.body.description,
            content: req.body.content
        }
    }).then((docs) => {
        if(docs) {
           res.redirect('/posts/' + req.params.id)
        } else {
           console.log('Error')
        }
    })
})

app.post('/posts/:id/delete', auth, async (req, res) => {
    try {
        const article = await Article.findOneAndDelete({ _id: req.params.id, author: req.user.id })
        if (!article) {
            console.log('Error')
        }
        res.redirect('/home')
    } catch (e) {
        res.status(500).send()
    }
})

app.post('/posts/:id/comment', auth, async (req, res, next) => {
    Article.findById(req.params.id).then((article)=> {
        return article.comment({
            author: req.body.user_id,
            commenterName: req.body.user_name,
            text: req.body.comment
        }).then((doc) => {
            // console.log(doc)
            res.redirect('/posts/' + req.params.id)
        })
    }).catch(next)
})

// Follow Unfollow Routes
app.post('/:id/follow', (req, res, next) => {
    User.findById(req.user.id).then((user) => {
        return user.follow(req.params.id).then(() => {
            
            console.log(`${req.user.id} following ${req.params.id}`)
            User.findById(req.params.id).then((user) => {
                return user.addFollower(req.user.id).then(() => {
                    console.log(`${req.params.id} followed by ${req.user.id}`)
                    res.redirect('/home')
                })
            })
        })
    }).catch(next)
})

app.post('/:id/unfollow', (req, res, next) => {
    User.findById(req.user.id).then((user) => {
        return user.unfollow(req.params.id).then(() => {
            
            console.log(`${req.user.id} unfollowing ${req.params.id}`)
            User.findById(req.params.id).then((user) => {
                return user.removeFollower(req.user.id).then(() => {
                    console.log(`${req.params.id} unfollowed by ${req.user.id}`)
                    res.redirect('/home')
                })
            })
        })
    }).catch(next)
})

// Listening Port
server.listen(port, () => {
    console.log(`Server is up on port ${port} ...`)
})