// env file is a convenient way to store environment-specific variables, such as API keys and database passwords, in a simple text file. This enables you to manage sensitive information consistently while maintaining its security.
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// console.log(process.env.SECRET);
// console.log(process.env.API_KEY);
// console.log(process.env.MAPBOX_TOKEN);

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

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
const MongoDBStore = require('connect-mongo');
// const MongoDBStore = require('connect-mongo').default;

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';
// const dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';
// console.log(dbUrl);
mongoose.connect(dbUrl, {
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
app.use(mongoSanitize({
    replaceWith: '_'
}))

// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
// const secret = 'thisshouldbeabettersecret!';

const store = MongoDBStore.create({
// const store = new MongoDBStore({
    mongoUrl: dbUrl,
    // mongooseConnection: db,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    // secret: 'thisshouldbeabettersecret!',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

// app.use(session(sessionConfig));
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com",
    "https://api.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com",
];

const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://stackpath.bootstrapcdn.com",
    "https://api.mapbox.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://cdn.jsdelivr.net",
];

const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://a.tiles.mapbox.com",
    "https://b.tiles.mapbox.com",
    "https://events.mapbox.com",
];

const fontSrcUrls = [];

app.use(    
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [],
                connectSrc: ["'self'", ...connectSrcUrls],
                scriptSrc: ["'self'","'unsafe-inline'", ...scriptSrcUrls],
                styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
                workerSrc: ["'self'", "blob:"],
                objectSrc: [],
                imgSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "blob:",
                    "data:",
                    "https://res.cloudinary.com/drvz6utna/",
                    "https://images.unsplash.com/",
                ],
                fontSrc: ["'self'", ...fontSrcUrls],
            },
        },
    })
);


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
    // console.log(req.session);
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
    // res.render('home');
    res.render('campgrounds/home');
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
    // console.log("Listening On Port 3000");
})