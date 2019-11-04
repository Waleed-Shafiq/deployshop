const express = require("express");
const { check, body } = require("express-validator/check");
const User = require('../models/user');

const router = express.Router();

const authController = require("../controllers/auth");

router.get("/signup", authController.getSignup);

router.post("/signup",
    [
        check("email", 'Enter a Valid Email')
            .isEmail()
            .custom((value, { req }) => {
                return User.findOne({
                    email: value
                }).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email already exist');
                    }
                });
            })
            .normalizeEmail(),
        check("password", "Enter a password of minimum 6 characters")
            .isLength({
                min: 6
            })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword', 'Passwords have to match')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    return false;
                }
                return true;
            }),
    ],
    authController.postSignup
);

router.get("/login", authController.getLogin);

router.post("/login", [
    check("email", 'Enter a Valid Email')
        .isEmail()
        .normalizeEmail(),
    check("password", "Enter a password of minimum 6 characters")
        .isLength({
            min: 6
        })
        .trim()
        .isAlphanumeric()
], authController.postLogin);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
