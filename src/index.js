const path = require('path')
const http = require('http')
require('./db/mongoose')
require('dotenv').config()
const express = require('express')
const hbs = require('hbs')
const LocalStrategy =  require("passport-local").Strategy
const session = require('express-session')
const passport = require("passport")

// Model and Routes
const User = require('./models/user')
const userRouter = require("./routes/user")
const articleRouter = require("./routes/article")

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
passport.deserializeUser(User.deserializeUser())
passport.use(new LocalStrategy(User.authenticate()))

// Common Routes
app.get("/", (req, res) => {
    res.render("home");
});
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

// Routes
app.use(userRouter)
app.use(articleRouter)

// Listening Port
server.listen(port, () => {
    console.log(`Server is up on port ${port} ...`)
})