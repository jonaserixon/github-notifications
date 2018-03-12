'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const socket = require('socket.io');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

var server = require('http').createServer(app);
var io = require('socket.io')(server);

const mongoose = require('mongoose');
let User = require('./models/User');
let UserModel = mongoose.model('users-github');
let Event = require('./models/Event');
let EventModel = mongoose.model('event-github');


//Gör till env variablar
const CLIENT_ID = '3d47ed6a79c582546a56';
const CLIENT_SECRET = '81028b61f7d1bc565eab1d43f59f345393d11cb6';


require('./config/database').initialize();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', require('./routes/api/routes')(CLIENT_ID, CLIENT_SECRET, UserModel, EventModel, io));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


io.on('connection', function(socket){
    console.log('ws connected');

    socket.on('disconnect', function(){
        console.log('ws disconnected');
    });
});


server.listen(port, () => {
    console.log("Express started on http://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});
