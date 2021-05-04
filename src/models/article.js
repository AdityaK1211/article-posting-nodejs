const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    likes: Number,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    authorName: {
        type: String,
        required: true
    },
    comments: [
        {
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            commenterName: String,
            text: String
        }
    ],
    createdAt: {
        type: Date,
        default: new Date()
    }
}, {
    timestamps: true
})

articleSchema.methods.like = function() {
    this.likes++
    return this.save()
}

articleSchema.methods.comment = function(c) {
    this.comments.push(c)
    return this.save()
}

const Article = mongoose.model("Article", articleSchema);
module.exports = Article;