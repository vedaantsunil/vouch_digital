const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');




const person = new Schema({

    name: {
        type: String,
        required: true
    },

    number: {
        type: Number,
        required: true
    },
    email: {
        type: String,
    }

})

const userschema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 300
    }

})


userschema.methods.generateAuthToken = function () {
const token = jwt.sign({_id: this.id, isAdmin: this.isAdmin}, 'JWTprivatekey')
    return token;
}


const contact = mongoose.model('contact', person);
const user = mongoose.model('user', userschema);


module.exports = { contact, user};

