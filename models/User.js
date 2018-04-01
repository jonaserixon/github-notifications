'use strict';

let mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    login: {type: String},
    avatar_url: {type: String},
    email: {type: String},
    last_active: {type: Date} ,
    subscription_list: [
        {
            org: String,
            events: []
        }
    ]
});

let User = mongoose.model('users-github', userSchema);

module.exports = User;
