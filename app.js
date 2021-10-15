const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv')
const ejsMate = require('ejs-mate');
const session = require('express-session');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const campRouter = require('./routes/campgrounds');
const reviewRouter = require('./routes/reviews');
const userRoutes = require('./routes/user');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const MongoStore = require('connect-mongo');


dotenv.config({ path: './config/.env' });


const app = express();

// Connect to DB

const dbLocal = 'mongodb://localhost:27017/yelp-camp';
const url = process.env.MONGO_URI || 'mongodb://localhost:27017/yelp-camp';

// connectDB();
mongoose.connect(url, {
    //useNewUrlParser: true,
    //useCreateIndex: true,
    //useUnifiedTopology: true
});


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});



app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Body needs to be parsed first from express

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoStore.create({
    mongoUrl: url,
    touchAfter: 24 * 3600, // Expiration Date
    crypto: {
        secret: process.env.SESSIONCODE
    }
});


const sessionConfig = {
    store,
    name: 'sc',
    secret: process.env.SESSIONCODE,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7 // Session expires after 1 week
    }
}


app.use(session(sessionConfig));
app.use(flash());



app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// Routes

app.use('/', userRoutes);
app.use('/campgrounds', campRouter);
app.use('/campgrounds/:id/reviews', reviewRouter);






app.get('/', (req, res) => {
    res.render('home')
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})


// Basic error handler

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

//Port Listening

app.listen(5000, () => {
    console.log('Serving on port 5000')
})