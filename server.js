'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const socket = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

var server = require('http').createServer(app);
var io = require('socket.io')(server);

const mongoose = require('mongoose');
let User = require('./models/User');
let UserModel = mongoose.model('users-github');

require('./config/database').initialize();

io.on('connection', (socket) => {
    socket.on('user-room', function(room) {
        socket.join(room);
        console.log('user joined room: ' + room)
    });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public/build')));

app.use(cors());

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "script-src 'self' https://api.github.com");
    return next();
});

//Routes
app.use('/', require('./routes/routes')(UserModel, io));
app.use('/', require('./routes/auth')(UserModel));
app.use('/', require('./routes/orgs')(UserModel));
app.use('/', require('./routes/subscription')(UserModel));


server.listen(port, () => {
    console.log("Express started on http://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});
