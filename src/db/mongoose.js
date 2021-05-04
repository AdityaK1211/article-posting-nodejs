const mongoose = require('mongoose')
require('dotenv').config()

// const url = 'mongodb://127.0.0.1:27017/article-test'
const url = process.env.MONGODB_URL

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    'You are now connected to Mongo!'
}).catch(err => {
    console.error('Something went wrong', err)
})

