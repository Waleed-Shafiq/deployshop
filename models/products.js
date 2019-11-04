const mongoose = require('mongoose');


const Product = new mongoose.Schema({
    title : {
        type: String ,
        required: true
    } ,
    price: {
        type: Number ,
        required: true 
    },
    description : {
        type: String ,
        required : true
    },
    imageUrl : {
        type : String ,
        required: true
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'User',
        required: true
    }
});

module.exports = mongoose.model('Product', Product);






// const getDb = require('../utility/database').getDb;
// const mongodb = require('mongodb');



// class Product {
//     constructor(title, price, imageUrl, description, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             dbOp = db.collection('products').updateOne({
//                 _id: this._id
//             }, {
//                 $set: this
//             });
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp.then(result => {
//                 return result;
//             })
//             .catch(err => console.log(err));
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products').find().toArray()
//             .then(products => {
//                 return products;
//             }).catch(err => console.log(err));
//     }


//     static findById(prodId) {
//         const db = getDb();
//         return db.collection('products').find({
//             _id: new mongodb.ObjectId(prodId)
//         }).next().then(product => {
//             return product;
//         }).catch(err => {
//             console.log(err);
//         })
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db.collection('products').deleteOne({
//             _id: new mongodb.ObjectId(prodId)
//         }).then(result => {
//             console.log('deleted');
//         }).catch(err => console.log(err));
//     }



// }

