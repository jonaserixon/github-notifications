'use strict';

let mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    login: {type: String},
    avatar_url: {type: String},
    email: {type: String}
    //+ Lite settings som användaren gör
});

let User = mongoose.model('users-github', userSchema);

module.exports = User;
