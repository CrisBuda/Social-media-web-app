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

exports.getTweet = (req, res) => {
  let tweetData = {};
  db.doc(`/tweets/${req.params.tweetId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Tweet not found' });
      }
      tweetData = doc.data();
      tweetData.tweetId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('tweetId', '==', req.params.tweetId)
        .get();
    })
    .then((data) => {
      tweetData.comments = [];
      data.forEach((doc) => {
        tweetData.comments.push(doc.data());
      });
      return res.json(tweetData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.commentOnTweet = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'Must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    tweetId: req.params.tweetId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };
  console.log(newComment);

  db.doc(`/tweets/${req.params.tweetId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Tweet not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
};