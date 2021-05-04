const { setApiKey } = require('@sendgrid/mail')
const sgMail = require('@sendgrid/mail')
require('dotenv').config()

const sendGrid_API = process.env.SENDGRID_API_KEY
sgMail.setApiKey(sendGrid_API)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: `${process.env.EMAIL_ID}`,
        subject: 'Thanks for joining in!',
        text: `Welcome to the Article Posting App, ${name}. \n\nLet me know how you get along with the app. This is developed for you to post fascinating articles on a wide list of topics available.\n\nSpread your views!\n\nThank You\nTeam Article Posting`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'adityak2527@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}. \n\nI hope to see you back sometime soon.\n\nThank You\nTeam Article Posting`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}