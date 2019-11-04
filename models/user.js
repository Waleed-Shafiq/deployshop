const mongoose = require('mongoose');

const User = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required : true
    },
    resetToken : String ,
    resetTokenExpiration : Date ,
    cart: {
        items: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});


User.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.product.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            product: product._id,
            quantity: newQuantity
        });
    }

    const updatedCart = {
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();
};


User.methods.deleteItemFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.product.toString() !== productId.toString();
    });

    this.cart.items = updatedCartItems ;
    return this.save();
};

User.methods.clearCart = function(){
    this.cart = { items : []};
    this.save() ;
}



module.exports = mongoose.model('User', User);





// const mongodb = require('mongodb');

// const getDb = require('../utility/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {

//     constructor(userName, email, cart, id) {
//         this.userName = userName;
//         this.email = email;
//         this.cart = cart;
//         this._id = id;
//     }


//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }

//     addToCart(product) {
//         const db = getDb();
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });

//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];

//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({
//                 productId: new ObjectId(product._id),
//                 quantity: newQuantity
//             });
//         }

//         const updatedCart = {
//             items: updatedCartItems
//         };
//         return db.collection('users').updateOne({
//             _id: new ObjectId(this._id)
//         }, {
//             $set: {
//                 cart: updatedCart
//             }
//         });
//     };

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         });
//         return db.collection('products').find({
//             _id: {
//                 $in: productIds
//             }
//         }).toArray().then(products => {
//             return products.map(p => {
//                 return {
//                     ...p,
//                     quantity: this.cart.items.find(i => {
//                         return i.productId.toString() === p._id.toString();
//                     }).quantity
//                 }
//             })
//         }).catch(err => console.log(err));
//     };

//     deleteItemFromCart(productId) {
//         const updatedCartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString();
//         });
//         const db = getDb();
//         return db.collection('users').updateOne({
//             _id: new ObjectId(this._id)
//         }, {
//             $set: {
//                 cart: {
//                     items: updatedCartItems
//                 }
//             }
//         })
//     };


//     addOrder() {
//         const db = getDb();
//         return this.getCart().then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         userId: new ObjectId(this._id),
//                         userName: this.userName
//                     }
//                 };
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = {
//                     items: []
//                 };
//                 return db.collection('users').updateOne({
//                     _id: new ObjectId(this._id)
//                 }, {
//                     $set: {
//                         cart: {
//                             items: []
//                         }
//                     }
//                 })
//             }).catch(err => console.log(err));
//     };


//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({
//             'user.userId': new ObjectId(this._id)
//         }).toArray();
//     };


//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({
//             _id: new mongodb.ObjectId(userId)
//         }).then(user => {
//             return user;
//         }).catch(err => {
//             console.log(err);
//         })
//     }

// }