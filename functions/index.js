const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const config = {
    apiKey: "AIzaSyBH2RHjUjuqu6lEyM-Sdbe5syH2B9pSZJo",
    authDomain: "social-media-app-43b7f.firebaseapp.com",
    databaseURL: "https://social-media-app-43b7f.firebaseio.com",
    projectId: "social-media-app-43b7f",
    storageBucket: "social-media-app-43b7f.appspot.com",
    messagingSenderId: "205597909661",
    appId: "1:205597909661:web:0384b0e8c3a788cb146a74",
    measurementId: "G-G8S9FQ7KDR"
};

const firebase = require('firebase');
const { user } = require('firebase-functions/lib/providers/auth');
firebase.initializeApp(config);

const db = admin.firestore();


app.get('/tweets', (req, res) => {
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
});

const FBAuth =  (req, res, next) => {
  let idToken;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    console.error('No token found')
    return res.status(403).json({ error: 'Unauthorized' });
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch(err => {
      console.error('Error while verifying token ', err);
      return res.status(403).json(err);
    })
}



app.post('/tweet',  FBAuth, (req, res) => {
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
});

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; 
  if(email.match(regEx)) return true;
  else return false;
}

const isEmpty = (string) => {
  if(string.trim() === '') return true;
  else return false;
}

//signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if(isEmpty(newUser.email)) {
    errors.email = 'Must not be empty'
  } else if(!isEmail(newUser.email)) {
    errors.email = 'Must be valid email address'
  }

  if(isEmpty(newUser.password)) errors.password = 'Must not be empty';
  if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
  if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

  if(Object.keys(errors).length > 0) return res.status(400).json(errors);


  let token, usedId;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
      if(doc.exists){
        return res.status(400).json({ handle: 'this handle is already taken!' });
      } else {
        return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })  
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken()
    })
    .then(idToken  => {
      token = idToken;
      const userCredentials = {
        handle:  newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then((data) => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if(err.code === 'auth/email-already-in-use'){
        return res.status(400).json({ email: 'Email is already in use'})
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

app.post('/login', (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  if(Object.keys(errors).length > 0) return res.status(400).json(errors)

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({token});
    })
    .catch(err => {
      console.error(err);
      if(err.code === 'auth/wrong-password' || 'auth/user-not-found'){
        return res.status(403).json({ general: 'Wrong credentials, please try again'});
      } else return res.status(500).json({error: err.code});
    });
});

exports.api = functions.https.onRequest(app);