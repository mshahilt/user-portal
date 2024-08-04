module.exports = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    } else {
        res.redirect('/admin');
    }
};