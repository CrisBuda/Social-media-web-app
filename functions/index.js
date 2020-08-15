const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/tweets', (req, res) => {
  admin
      .firestore()
      .collection('tweets')
      .orderBy('createdAt', 'desc')
      .get()
      .then((data) => {
        let tweets = [];
        data.forEach((doc) => {
          tweets.push({
            tweetId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt : doc.data().createdAt
          });
        });
        return res.json(tweets);
      })
      .catch((err) => console.error(err));
});

app.post('/tweet', (req, res) => {
  const newTweet = {
    body: req.body.body, 
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  admin
    .firestore()
    .collection('tweets')
    .add(newTweet)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully`});
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong'});
      console.error(err);
    });
});

exports.api = functions.https.onRequest(app);