'use strict';

let mongoose = require('mongoose');

let userSchema = mongoose.Schema({

});

let User = mongoose.model('users-github', userSchema);

module.exports = User;