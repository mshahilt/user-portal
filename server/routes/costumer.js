const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController'); // Ensure path is correct
const ensureAuthenticated = require('../middleware/auth');
const ensureUserAuth = require('../middleware/userAuth');

/**
 * User routes
 */
// Login
router.get('/login', customerController.userLoginPage);
router.post('/login', customerController.userLoginPagePost);

// Sign up
router.get('/signup', customerController.userSignUpPage);
router.post('/signup', customerController.userSignUpPagePost);

// User Home
router.get('/', ensureUserAuth, customerController.homeCustomer);

// Edit Profile
router.get('/edit', ensureUserAuth, customerController.editUserProfile);
router.post('/edit', ensureUserAuth, customerController.editUserProfilePost);

// Delete Profile
router.delete('/delete/:id', ensureUserAuth, customerController.deleteUser);

/**
 * Admin routes
 */
// Login page
router.get('/admin', customerController.adminLoginPage);
router.post('/admin', customerController.adminLoginPagePost);

// Apply the middleware to admin routes
router.get('/admin/home', ensureAuthenticated, customerController.homePage);

router.get('/admin/home/add', ensureAuthenticated, customerController.addCustomer);
router.post('/admin/home/add', ensureAuthenticated, customerController.postCustomer);
router.get('/admin/home/view/:id', ensureAuthenticated, customerController.viewCustomer);
router.get('/admin/home/edit/:id', ensureAuthenticated, customerController.editCustomer);
router.put('/admin/home/edit/:id', ensureAuthenticated, customerController.editCustomerPost);
router.delete('/admin/home/delete/:id', ensureAuthenticated, customerController.deleteCustomer);
router.post('/admin/home/search', ensureAuthenticated, customerController.searchCustomer);

// Logout
router.post('/admin/logout', ensureAuthenticated, customerController.logoutAdmin);
router.post('/logoutUser', ensureUserAuth, customerController.logoutUser);

module.exports = router;
