const User = require('../models/user');
const nodeMailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
    validationResult
} = require('express-validator/check');

const transporter = nodeMailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}));


exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'signup',
        path: '/signup',
        errorMessage: null,
        oldInput: { email: '', password: '', confirmPassword: '' },
        validationErrors: []
    });
};

exports.postSignup = (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'signup',
            path: '/signup',
            errorMessage: validationResult(req).array()[0].msg,
            oldInput: { email: req.body.email, password: req.body.password, confirmPassword: req.body.confirmPassword },
            validationErrors: validationResult(req).array()
        });
    }
    bcrypt.hash(req.body.password, 12).then(hashedPass => {
        req.body = {
            ...req.body,
            password: hashedPass,
            cart: {
                items: []
            }
        };
        const user = new User(req.body);
        return user.save();
    })
        .then(user => {
            res.redirect('/login');
            return transporter.sendMail({
                to: req.body.email,
                from: 'shop@node.com',
                subject: 'signup succeded',
                html: '<h1> you successfully signed up </h1>'
            });
        }).catch(err => {
            const error = new Error(err);
            error.statusCode = 500;
            return next(error);
        });
};


exports.getLogin = (req, res, body) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: null,
        oldInput: { email: '', password: '' },
        validationErrors: []
    });
};



exports.postLogin = (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: validationResult(req).array()[0].msg,
            oldInput: { email: req.body.email, password: req.body.password },
            validationErrors: validationResult(req).array()
        });
    }
    User.findOne({
        email: req.body.email
    }).then(user => {
        console.log(user);
        if(!user) {
            return res.status(422).render('auth/login', {
                pageTitle: 'Login',
                path: '/login',
                errorMessage: 'No account Found. Please Signup',
                oldInput: { email: req.body.email, password: req.body.password },
                validationErrors: []
            });
        }
        bcrypt.compare(req.body.password, user.password).then(doMatch => {
            if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(() => {
                    res.redirect('/');
                });
            }
            return res.status(422).render('auth/login', {
                pageTitle: 'Login',
                path: '/login',
                errorMessage: 'Incorrect Password',
                oldInput: { email: req.body.email, password: req.body.password },
                validationErrors: []
            });
        }).catch(err => {
            res.redirect('/login');
        });
    }).catch(err => {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    });

};


exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/');
    });
};


exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: req.flash('error')[0]
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({
            email: req.body.email
        }).then(user => {
            if (!user) {
                req.flash('error', 'No account with that email');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            user.save().then(user => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@node.com',
                    subject: 'Password reset',
                    html: ` <p>You requested a Password reset </p>
                            <p> click this <a href = "http://localhost:8008/reset/${token}"> Link </a> to set a new password </p> `
                });
            }).catch(err => console.log(err));
        }).catch(err => {
            const error = new Error(err);
            error.statusCode = 500;
            return next(error);
        });

    });
};


exports.getNewPassword = (req, res, next) => {
    User.findOne({
        resetToken: req.params.token,
        resetTokenExpiration: {
            $gt: Date.now()
        }
    }).then(user => {
        if (!user) {
            req.flash('error', 'Invalid token for reseting password');
            return res.redirect('/reset')
        }
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/new-password',
            errorMessage: req.flash('error')[0],
            userId: user._id.toString()
        });
    }).catch(err => {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    });

};

exports.postNewPassword = (req, res, next) => {
    let resetUser;
    User.findOne({
        _id: req.body.userId
    }).then(user => {
        console.log(user);
        resetUser = user;
        return bcrypt.hash(req.body.password, 12);
    })
        .then(hashedPass => {
            resetUser.password = hashedPass;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        }).catch(err => {
            const error = new Error(err);
            error.statusCode = 500;
            return next(error);
        });
};