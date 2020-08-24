const { db } = require('../util/admin');


exports.getAllTweets = (req, res) => {
    db.collection('tweets')
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
};

exports.postOneTweet = (req, res) => {
    const newTweet = {
      body: req.body.body, 
      userHandle: req.body.userHandle,
      createdAt: new Date().toISOString()
    };
    db.collection('tweets')
      .add(newTweet)
      .then(doc => {
        res.json({ message: `document ${doc.id} created successfully`});
      })
      .catch(err => {
        res.status(500).json({ error: 'something went wrong'});
        console.error(err);
      });
  };