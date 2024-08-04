const { name } = require('ejs');
const Customers = require('../models/Costumers');
const bcrypt = require('bcrypt');

/**
 * GET /login
 * User login page
 */
exports.userLoginPage = (req, res) => {
    if (req.session.user) {
        res.redirect('/');
    } else {
        res.render('UserView/login', {
            title: "Login",
            errorMessage: "",
            layout: 'layouts/userLayout'
        });
    }
};

/**
 * POST /login
 * User login
 */
exports.userLoginPagePost = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).render('UserView/login', {
            title: "Login",
            errorMessage: "All fields are required",
            layout: 'layouts/userLayout'
        });
    }

    try {
        const user = await Customers.findOne({ email });
        if (!user) {
            return res.status(400).render('UserView/login', {
                title: "Login",
                errorMessage: "Invalid email or password",
                layout: 'layouts/userLayout'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('UserView/login', {
                title: "Login",
                errorMessage: "Invalid email or password",
                layout: 'layouts/userLayout'
            });
        }

        if (user.isAdmin) {
            req.flash('errorMessage', 'You are an admin. Redirecting to admin page...');
            return res.redirect('/admin');
        }

        req.session.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).render('UserView/login', {
            title: "Login",
            errorMessage: "Server Error. Please try again later.",
            layout: 'layouts/userLayout'
        });
    }
};

/**
 * GET /signup
 * User sign up page
 */
exports.userSignUpPage = (req, res) => {
    res.render('UserView/signup', {
        title: "Sign Up",
        errorMessage: "",
        layout: 'layouts/userLayout'
    });
};

/**
 * POST /signup
 * User sign up
 */
exports.userSignUpPagePost = async (req, res) => {
    const { email, password, firstName, lastName, tel, details } = req.body;

    if (!email || !password || !firstName || !lastName || !tel) {
        return res.status(400).render('UserView/signup', {
            title: "Sign Up",
            errorMessage: "All fields are required",
            layout: 'layouts/userLayout'
        });
    }

    try {
        const user = await Customers.findOne({ email });
        if (user) {
            return res.status(400).render('UserView/signup', {
                title: "Sign Up",
                errorMessage: "User already exists",
                layout: 'layouts/userLayout'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Customers({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            tel,
            details
        });

        await newUser.save();

        req.session.user = {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).render('UserView/signup', {
            title: "Sign Up",
            errorMessage: "Server Error. Please try again later.",
            layout: 'layouts/userLayout'
        });
    }
};

/**
 * GET /home
 * User home page
 */
exports.homeCustomer = async (req, res) => {
    if (req.session.user) {
    const fname = req.session.user.firstName;
    const lname = req.session.user.lastName;

    const fullName = fname + " " + lname; 
    
        res.render('UserView/home', {
            title: "Home",
            user: fullName,
            layout: 'layouts/userLayout',
        });
    } else {
        res.redirect('/login');
    }
};

/**
 * GET /edit
 * User edit profile page
 */
exports.editUserProfile = async (req, res) => {
    try {
        const user = await Customers.findById(req.session.user.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('UserView/edit', {
            title: "Edit Profile",
            user,
            layout: 'layouts/userLayout'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


/**
 * DELETE /delete/:id
 * Delete user account
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;


        await Customers.findByIdAndDelete(userId);
        console.log('delete success');

        req.session.destroy((err) => {
            if (err) {
                console.error('Failed to destroy session:', err);
                return res.status(500).send('Server Error');
            }

            res.redirect('/login');
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }
};
/**
 * POST /edit
 * Update user profile
 */

exports.editUserProfilePost = async (req, res) => {
    let { firstName, lastName, tel, email, details, password } = req.body;

    firstName = firstName ? firstName.trim() : '';
    lastName = lastName ? lastName.trim() : '';
    tel = tel ? tel.trim() : '';
    email = email ? email.trim() : '';
    details = details ? details.trim() : '';

    if (!firstName || !lastName || !email) {
        res.redirect('/edit')
    }

    try {
        const user = await Customers.findById(req.session.user.id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const updatedFields = {
            firstName,
            lastName,
            tel,
            email,
            details,
            updatedAt: Date.now()
        };

        if (password) {
            updatedFields.password = await bcrypt.hash(password.trim(), 10);
        }

        await Customers.findByIdAndUpdate(req.session.user.id, updatedFields);

        req.session.user = {
            ...req.session.user,
            firstName,
            lastName,
            email
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * GET /admin
 * Admin login page
 */
exports.adminLoginPage = async (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/home');
    }

    const errorMessages = req.flash('message');

    res.render('login', {
        title: "Admin Login",
        errorMessage: errorMessages.length ? errorMessages[0] : '',
        layout: 'layouts/adminLayout'
    });
};

/**
 * POST /admin
 * Admin login
 */
exports.adminLoginPagePost = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('message', 'All fields are required');
        return res.redirect('/admin');
    }

    try {
        const user = await Customers.findOne({ email });

        if (!user) {
            req.flash('message', 'Invalid email or password');
            return res.redirect('/admin');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.flash('message', 'Invalid email or password');
            return res.redirect('/admin');
        }

        if (!user.isAdmin) {
            req.flash('message', 'Access denied');
            return res.redirect('/admin');
        }

        req.session.admin = { id: user._id, email: user.email };
        
        res.redirect('/admin/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * POST /admin/logout
 * Admin logout
 */
exports.logoutAdmin = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        } else {
            res.redirect('/admin');
        }
    });
};

/**
 * POST /logout
 * User logout
 */
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        } else {
            res.redirect('/login');
        }
    });
};

/**
 * GET /admin/home
 * Admin home page
 */
exports.homePage = async (req, res) => {
    const locals = {
        title: "Dashboard",
        description: "NodeJs user management system",
    };

    let perPage = 20;
    let page = parseInt(req.query.page) || 1;

    try {
        const customers = await Customers.find()
            .sort({ updatedAt: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage);

        const count = await Customers.countDocuments();

        res.render('index', {
            locals,
            messages: [],
            customers,
            current: page,
            pages: Math.ceil(count / perPage),
            layout: 'layouts/adminLayout'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * GET /admin/home/add
 * Add new customer page
 */
exports.addCustomer = (req, res) => {
    const locals = {
        title: "Add New Customer",
        description: "NodeJs user management system"
    };

    res.render('customer/add', {
        locals,
        layout: 'layouts/adminLayout'
    });
};

/**
 * POST /admin/home/add
 * Create new customer
 */
exports.postCustomer = async (req, res) => {
    const { firstName, lastName, details, tel, email, password, admin } = req.body;

    if (!firstName || !lastName || !tel || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    try {
        const existingCustomer = await Customers.findOne({ email });
        if (existingCustomer) {
            return res.status(400).send('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newCustomer = new Customers({
            firstName,
            lastName,
            details,
            tel,
            email,
            password: hashedPassword,
            isAdmin: admin === 'true'
        });

        await newCustomer.save();
        res.redirect('/admin/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * GET /admin/home/view/:id
 * View customer details
 */
exports.viewCustomer = async (req, res) => {
    try {
        const customer = await Customers.findById(req.params.id);
        const locals = {
            title: "View Customer Data",
            description: "NodeJs user management system"
        };
        res.render('customer/view', {
            locals,
            customer,
            layout: 'layouts/adminLayout'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * GET /admin/home/edit/:id
 * Edit customer details
 */
exports.editCustomer = async (req, res) => {
    try {
        const customer = await Customers.findById(req.params.id);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }
        const locals = {
            title: "Edit Customer Data",
            description: "NodeJs user management system"
        };
        res.render('customer/edit', {
            locals,
            customer,
            layout: 'layouts/adminLayout'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * PUT /admin/home/edit/:id
 * Update customer details
 */
exports.editCustomerPost = async (req, res) => {
    const { firstName, lastName, tel, email, details, password, isAdmin } = req.body;

    // Trim and validate the first name and last name
    if (!firstName.trim() || !lastName.trim()) {
        const customer = await Customers.findById(req.params.id);
        const locals = {
            title: "Edit Customer Data",
            description: "NodeJs user management system"
        };
        return res.status(400).render('customer/edit', {
            locals,
            customer,
            errorMessage: "First name and last name cannot be empty or contain only white spaces.",
            layout: 'layouts/adminLayout'
        });
    }

    try {
        const customer = await Customers.findById(req.params.id);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        const updatedFields = {
            firstName,
            lastName,
            tel,
            email,
            details,
            updatedAt: Date.now(),
            isAdmin: isAdmin === 'on'
        };

        if (password) {
            updatedFields.password = await bcrypt.hash(password, 10);
        }

        await Customers.findByIdAndUpdate(req.params.id, updatedFields);

        res.redirect(`/admin/home/view/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * DELETE /admin/home/delete/:id
 * Delete customer
 */
exports.deleteCustomer = async (req, res) => {
    try {
        await Customers.findByIdAndDelete(req.params.id);
        res.redirect('/admin/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

/**
 * POST /admin/home/search
 * Search customer
 */
exports.searchCustomer = async (req, res) => {
    try {
        const searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "");

        const customers = await Customers.find({
            $or: [
                { firstName: { $regex: new RegExp(searchNoSpecialChar, "i") } },
                { lastName: { $regex: new RegExp(searchNoSpecialChar, "i") } }
            ]
        });

        const locals = {
            title: "Search Customer Data",
            description: "NodeJs user management system"
        };

        res.render("search", {
            customers,
            locals,
            layout: 'layouts/adminLayout'
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
