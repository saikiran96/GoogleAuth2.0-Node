require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser")

////////////////////auth and sessions //////////////////

const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "our secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const logSchema = new mongoose.Schema({
  email: "String",
  password: "String",
  googleId:"String"
});

logSchema.plugin(passportLocalMongoose);
logSchema.plugin(findOrCreate);


const newUser = new mongoose.model("log", logSchema);

passport.use(new LocalStrategy(newUser.authenticate()));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL_ENV,
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    newUser.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return done(err, user);
    });
  }
));

app.get('/', function(req, res) {
  res.render('pages/auth');
});

app.route("/register")
  .get((req, res) => {
    res.send("Registry Page");
  })
  .post((req, res) => {

    newUser.register({
      username: req.body.username
    }, req.body.password, (req, res, function(err, user) {

      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function() {
          res.send("succesfully saved the cookie");
        });
      }
    }))

  });


//////////////////////login///////////////

app.route("/login")
  .post((req, res) => {

  });


///////////////////SuccessLogin////////////////

app.route("/success")
  .get((req, res) => {
    res.render("pages/sucess")
  })

////////////////////google Authorisation//////////////////
app.get('/auth/google',
  passport.authenticate('google', { scope : ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });


app.listen(3000, function(req, res) {
  console.log("Server is Running");
})
