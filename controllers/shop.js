const Product = require('../models/products');

const Order = require('../models/orders');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const PdfDocument = require('pdfkit');
const ITEMS_PER_PAGE = 2;


const fs = require('fs');

const path = require('path');



exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find().countDocuments().then(numProducts => {
    totalItems = numProducts;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  }).then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  }).catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    return next(error);;
  });
};



exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then(product => {
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products'
    });
  }).catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    return next(error);;
  });
};




exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.product').execPopulate().then(user => {
    const products = user.cart.items;
    res.render('shop/cart', {
      pageTitle: 'Cart',
      path: '/cart',
      products: products
    });
  }).catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    return next(error);
  });
};



exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product => {
    return req.user.addToCart(product);
  }).then(result => {
    res.redirect('/cart');
  }).catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    return next(error);
  });
};


exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteItemFromCart(prodId).then(result => {
    res.redirect('/cart');
  })
    .catch(err => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};


exports.getCheckout = (req, res, next) => {
  req.user.populate('cart.items.product').execPopulate().then(user => {
    const products = user.cart.items;
    let total = 0 ;
    products.forEach(p =>{
      total += p.quantity * p.product.price ;
    });
    res.render('shop/checkout', {
      pageTitle: 'checkout',
      path: '/checkout',
      products: products,
      totalSum : total 
    });
  }).catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    return next(error);
  });
};


exports.postOrder = (req, res, next) => {

  const token = req.body.stripeToken ;
  let total = 0 ;

  req.user.populate('cart.items.product').execPopulate().then(user => {
    user.cart.items.forEach(p =>{
      total += p.quantity * p.product.price ;
    })
   
    // console.log(user.cart.items);
    const products = user.cart.items.map(i => {
      return {
        quantity: i.quantity,
        product: {
          ...i.product._doc
        }
      }
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products: products
    })
    return order.save()
  })
    .then(result => {
      const charge = stripe.charges.create({
        amount : total * 100 ,
        currency : 'usd' ,
        description : 'Demo order' ,
        source : token,
        metadata: {order_id : result._id.toString()}
      });
      return req.user.clearCart();
    }).then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({
    'user.userId': req.user._id
  }).then(orders => {
    res.render('shop/orders', {
      pageTitle: 'Orders',
      path: '/orders',
      orders: orders
    });
  }).catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    return next(error);
  });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId).then(order => {
    if (!order) {
      return next(new Error('No order found'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Not authorized'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);

    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition', 'inline; filename = "' + invoiceName + '"');
    //   res.send(data);
    // });

    const pdf = new PdfDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename = "' + invoiceName + '"');

    pdf.pipe(fs.createWriteStream(invoicePath));
    pdf.pipe(res);

    pdf.fontSize(24).text('Invoice', { underline: true });

    pdf.text('-------------------');

    let totalPrice = 0;

    order.products.forEach(prod => {
      pdf.fontSize(15).text(prod.product.title + ' - ' + prod.quantity + 'x' + '$' + prod.product.price);

      totalPrice += prod.quantity * prod.product.price;

    });

    pdf.text('---------------');
    pdf.fontSize(20).text('total price : $' + totalPrice);
    pdf.end();

    // const file = fs.createReadStream(invoicePath);
    // file.pipe(res);

  }).catch(err => next(err));

};