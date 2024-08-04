require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const session = require('express-session');
const flash = require('connect-flash');
const nochache = require('nocache');

const app = express();
const port = process.env.PORT || 5000;

// Express Session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: {                       
            maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        }
    })
);

// Connect Database  
connectDB();

app.use(flash());
app.use(nochache());

// To encode data from client
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Static folder
app.use(express.static('public'));

// Template engine  
app.use(expressLayouts);
app.set('layout', './layouts/adminLayout');
app.set('view engine', 'ejs');

// Routes
app.use('/', require('./server/routes/costumer'));

// Handle 404
app.get('*', (req, res) => { 
    res.status(404).render('UserView/404', {
        title: "404",
        layout: 'layouts/userLayout',
        errorMessage: ""
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
