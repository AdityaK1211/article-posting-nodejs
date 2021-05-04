const express = require('express')
const router = express.Router()
const User = require('../models/user')

router.get('/', async(req,res) => {
    try {
           const users = await User.find()
           res.json(users)
    } catch(err) {
        res.send('Error ' + err)
    }
})

router.get('/:id', async(req,res) => {
    try{
           const user = await User.findById(req.params.id)
           res.json(user)
    } catch(err) {
        res.send('Error ' + err)
    }
})

router.post('/', async(req,res) => {
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })

    try {
        const user = await user.save() 
        res.json(user)
    } catch(err) {
        res.send('Error')
    }
})

router.patch('/:id', async(req,res) => {
    try {
        const user = await User.findById(req.params.id) 
        user.username = req.body.username
        user.password = req.body.password
        const u1 = await user.save()
        res.json(u1)   
    } catch(err) {
        res.send('Error')
    }

})

module.exports = router