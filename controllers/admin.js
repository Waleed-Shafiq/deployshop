const Product = require('../models/products')
const { validationResult } = require('express-validator/check');
const fileHelper = require('../utility/file');


exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        errorMessage: null,
        oldInput: { title: '', price: '', description: '' },
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            errorMessage: validationResult(req).array()[0].msg,
            oldInput: { title: req.body.title, price: req.body.price, description: req.body.description },
            validationErrors: validationResult(req).array()
        });
    }

    if (!req.file) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            errorMessage: 'Attached file is not an image',
            oldInput: { title: req.body.title, price: req.body.price, description: req.body.description },
            validationErrors: []
        });
    }

    const product = new Product({
        title: req.body.title,
        imageUrl: req.file.path,
        price: req.body.price,
        description: req.body.description,
        userId: req.user
    });
    product.save()
        .then(result => {
            console.log('Created');
            console.log(result);
            res.redirect('/admin/products');
        }).catch(err => {
            const error = new Error(err);
            error.statusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    let editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/admin/products');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/admin/products');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: editMode,
                product: product,
                validationErrors: [],
                errorMessage: null
            })
        }).catch(err => {
            const error = new Error(err);
            error.statusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {

    if (!validationResult(req).isEmpty()) {
        console.log(validationResult(req))
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            errorMessage: validationResult(req).array()[0].msg,
            editing: true,
            product: { title: req.body.title, price: req.body.price, description: req.body.description, _id: req.body.productId },
            validationErrors: validationResult(req).array()
        });
    }

    Product.findById(req.body.productId).then(product => {
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        if (req.file) {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = req.file.path;
        }
        product.title = req.body.title;
        product.price = req.body.price;
        product.description = req.body.description;
        return product.save().then(result => {
            console.log('Updated');
            res.redirect('/admin/products');
        })
    }).catch(err => {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    })
};

exports.getProducts = (req, res, next) => {
    Product.find({
        userId: req.user._id
    })
        // .select('name price imageUrl description') // for getting some fields only
        //  .populate('userId') // for populating a refference object
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        }).catch(err => {
            const error = new Error(err);
            error.statusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    Product.findById(req.params.productId).then(product => {
        if (!product) {
            return next(new Error('no product found'));
        }
        fileHelper.deleteFile(product.imageUrl);
        Product.deleteOne({ _id: req.params.productId, userId: req.user._id })
            .then(result => {
                return req.user.deleteItemFromCart(req.params.productId);
            })
            .then(result => {
                console.log('deleted');
                res.status(200).json({message : 'success'});
            })
            .catch(err => {
               res.status(500).json({message: 'deleting failed'});
            });

    }).catch(err => next(err));


};