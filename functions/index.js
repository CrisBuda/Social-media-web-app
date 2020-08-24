const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { getAllTweets, postOneTweet } = require('./handlers/tweets');
const { signup, login } = require('./handlers/users');

//tweet routes
app.get('/tweets', getAllTweets);
app.post('/tweet',  FBAuth, postOneTweet);

//users route
app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.https.onRequest(app);