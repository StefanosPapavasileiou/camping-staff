const express = require('express');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const passport = require('passport');
const { isLoggedIn, isAuthor } = require('../middleware');


const router = express.Router();



router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}));

router.get('/new', isLoggedIn, (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must sign in to proceed');
        return res.redirect('/login');
    }
    res.render('campgrounds/new');
});

// Set up the end-point as a post where form is submitted
router.post('/', isLoggedIn, catchAsync(async (req, res, next) => {
    // Newly submitted campground

    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Succesfully made a new campground');
    // Redirect to that new camp
    res.redirect(`/campgrounds/${campground._id}`);

}));

// Need ID to look for corresponding campgrounds in DB
router.get('/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews').populate('author');
    console.log(campground)
    res.render('campgrounds/show', { campground })
}));

// Edit a campground route
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
}));

router.put('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success', 'Succesfully updated campground');
    res.redirect(`/campgrounds/${campground._id}`)
}));

router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));



module.exports = router;