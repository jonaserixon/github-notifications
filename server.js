'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');

const app = express();
const port = process.env.PORT || 8000;

//Gör till env variablar
const CLIENT_ID = '3d47ed6a79c582546a56';
const CLIENT_SECRET = '81028b61f7d1bc565eab1d43f59f345393d11cb6';

require('./config/database').initialize();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
    console.log('najja')
    res.json([
        {
            frase: "hallåj",
            id: 1
        },
        {
            frase: "tjenixen",
            id: 2
        },
        {
            frase: "hejsan",
            id: 3
        }
    ]);
})

app.post('/api/github/auth', (req, res) => {
    let githubCode = req.body.code;
    console.log(req.body.code);

    let headerType = {  
        "content-type": "application/json",
    };

    let options = {
        uri: 'https://github.com/login/oauth/access_token?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&code=' + githubCode,
        method: 'POST',
        header: headerType
    };
      
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            let access_token = body.substring(13, 53);
            
            console.log(body);
            console.log(access_token);
        }
    });

    res.json(req.body);
})

app.listen(port, function() {
    console.log("Express started on http://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});
