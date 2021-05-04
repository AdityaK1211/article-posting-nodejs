const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passportLocalMongoose = require("passport-local-mongoose")
const Article = require("./article");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true
})

userSchema.virtual("articles", {
    ref: "Article",
    localField: "_id",
    foreignField: "author",
});

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'thisisasecretformyapp')

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.follow = function (user_id) {
    if (this.following.indexOf(user_id) === -1) {
        this.following.push(user_id)        
    }
    return this.save()
}

userSchema.methods.unfollow = function (user_id) {
    this.following.pop(user_id)        
    return this.save()
}

userSchema.methods.addFollower = function (fs) {
    if (this.followers.indexOf(fs) === -1) {
        this.followers.push(fs)
    }
    return this.save()
}

userSchema.methods.removeFollower = function (fs) {
    this.followers.pop(fs)
    return this.save()
}

userSchema.pre('save', function (next) {
    const user = this

    bcrypt.hash(user.password, 10, function (error, encrypted) {
        user.password = encrypted
        next()
    })
})

userSchema.pre('remove', async function (next) {
    const user = this
    await Article.deleteMany({ author: user._id })
    next()
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema)
module.exports = User