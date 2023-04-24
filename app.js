// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const flash = require('connect-flash');

const methodOverride = require('method-override')


require('dotenv').config();


// Initialize Express app
const app = express();


app.use(methodOverride('_method'))

app.use(flash());
app.use(express.static('public'))

// Configure database connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Connected to MongoDB");
})
.catch((err) => {
  console.log("Failed to connect to MongoDB", err);
});

// Configure middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: true
}));



app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Define User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  secret: [{
    type: String
  }]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

// Configure Passport for local authentication
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Define routes
app.get('/', (req, res) => {


  res.render('login', {
    message: "hello"
  });
});

app.get('/register', (req, res) => {
  res.render('register', {
    message: null
  });
});

app.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.register(new User({
    username
  }), password, (err, user) => {
    if (err) {
      res.render('register', {
        message: err.message
      });
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/secret');
      });
    }
  });
});

app.get('/login', (req, res) => {
  res.render('login',
    {
      message: "username and password do not match..."
    });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/secret',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', (req, res) => {
  req.logout(()=> {
    res.redirect("/");
  });

});

app.get('/secret', isLoggedIn, (req, res) => {
  res.render('secret',
    {
      user: req.user
    });
});


app.post('/secret', isLoggedIn, (req, res)=> {

  const secrect = req.body.secret;

  User.findById(req.user._id)
  .then((user)=> {
    user.secret.push(secrect);
    user.save().then(()=> {
      res.redirect('/secret')}).catch((e)=> {
      console.log(e)})
  })
  .catch((e)=> {
    console.log(e)})

})


app.delete('/secret/:index', isLoggedIn, (req, res) => {
  const index = req.params.index;
  const userId = req.user._id;

  User.findById(userId)
  .then(user => {
    user.secret.splice(index, 1);
    return user.save();
  })
  .then(() => {
    res.redirect('/secret');
  })
  .catch(err => {
    console.log(err);
    res.status(500).send('Error deleting secret');
  });
});




// Define custom middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});