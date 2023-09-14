// env file is a convenient way to store environment-specific variables, such as API keys and database passwords, in a simple text file. This enables you to manage sensitive information consistently while maintaining its security.
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// console.log(process.env.SECRET);
// console.log(process.env.API_KEY);

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utills/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    // useCreateIndex: true,        //--> it throwing an error so it's commented -> refer it in future
    useUnifiedTopology: true,
    // useFindAndModify: false      //--> it throwing an error so it's commented -> refer it in future
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Database Connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());


// Initialize Passport.js for authentication in the Express.js app
app.use(passport.initialize());

// Use Passport's session management middleware
app.use(passport.session());

// Configure Passport to use the LocalStrategy for authentication
passport.use(new LocalStrategy(User.authenticate()));

// Serialize the user's information to be stored in the session
passport.serializeUser(User.serializeUser());

// Deserialize the user's information from the session
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
    // res.send('HELLO FROM YELP CAMP');
    res.render('home');
})

// app.get('/makecampground', async (req, res) => {
//     const camp = new Campground({ title: 'My Backyard', description: 'cheap camping!' });
//     await camp.save();
//     res.send(camp);
// })

app.all('*', (req, res, next) => {
    // res.send('404!!!');
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    // res.send('Oh boy, something went wrong');

    // const { statusCode = 500, message = 'Something went wrong' } = err;
    // res.status(statusCode).send(message);

    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log("Listening On Port 3000");
})