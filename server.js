'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const mongoose = require('mongoose');
let User = require('./models/User');
let UserModel = mongoose.model('users-github');

const app = express();
const port = process.env.PORT || 8000;

//Gör till env variablar
const CLIENT_ID = '3d47ed6a79c582546a56';
const CLIENT_SECRET = '81028b61f7d1bc565eab1d43f59f345393d11cb6';


require('./config/database').initialize();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/api/routes')(CLIENT_ID, CLIENT_SECRET, UserModel));


app.listen(port, () => {
    console.log("Express started on http://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});
