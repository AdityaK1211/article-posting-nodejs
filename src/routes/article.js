const express = require('express')
const User = require('../models/user')
const Article = require('../models/article')
const auth = require('../middleware/auth')

const router = express.Router()

router.get("/home", auth, async (req, res) => {
    const articles = await Article.find({}).sort({ createdAt: 'desc' })
    const user = await User.findById(req.user.id)
    const userArticles = await Article.find({author: req.user.id})
    const articlesFollowing = []
    userFollowers = []
    userFollowing = []

    for (let i=0; i<userArticles.length; i++) {
        articlesFollowing.push(userArticles[i])
    }
    for (let i=0; i<user.following.length; i++) {
        const tempArticle = await Article.find({author: user.following[i]})
        for (let j=0; j<tempArticle.length; j++) {
            articlesFollowing.push(tempArticle[j])
        }
    }
    articlesFollowing.sort(GetSortOrder("createdAt"))
    
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
    
    res.render("secret", {
        username: req.user.username,
        articlesFollowing,
        articles,
        userFollowers,
        userFollowing
    })
})

router.get('/posts/recent', auth, async (req, res) => {    
    
    const articles = await Article.find({}).sort({ createdAt: 'desc' }).limit(5)
    res.render('postRecent', {
        username: req.user.username,
        articles,
    })
});

router.get('/posts/new', auth, (req, res) => {
    res.render('create')
});

router.post('/posts/store', auth, async (req, res) => {
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

router.get('/posts/:id', auth, async (req, res) => {
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

router.get('/posts', auth, async (req, res) => {    
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

router.get('/posts/:id/edit', auth, async (req, res) => {
    const articles = await Article.findById(req.params.id)
    res.render('editPost', {
        articles
    })
});

router.post("/posts/:id", auth, (req,res) => {
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

router.post('/posts/:id/delete', auth, async (req, res) => {
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

router.post('/posts/:id/comment', auth, async (req, res, next) => {
    Article.findById(req.params.id).then((article)=> {
        return article.comment({
            author: req.body.user_id,
            commenterName: req.body.user_name,
            text: req.body.comment
        }).then((doc) => {
            res.redirect('/posts/' + req.params.id)
        })
    }).catch(next)
})

function GetSortOrder(prop) {    
    return function(a, b) {    
        if (a[prop] < b[prop]) {    
            return 1;    
        } 
        else if (a[prop] > b[prop]) {    
            return -1;    
        }    
        return 0;    
    }    
}

module.exports = router