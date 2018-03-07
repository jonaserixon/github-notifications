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

const GIT_API_URL='https://api.github.com';


require('./config/database').initialize();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/github/auth', (req, res) => {
    let githubCode = req.body.code;
    console.log(req.body.code);

    let options = {
        uri: 'https://github.com/login/oauth/access_token?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&code=' + githubCode,
        method: 'POST',
        headers: {
            'User-Agent': 'jonne',
            "Content-Type": "application/json"
        }
    };

    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {

            let access_token = body.substring(13, 53);

            console.log(body);
            console.log(access_token);

            res.json(access_token);

            //user/repos?access_token=

            //Skicka tillbaks token till klienten och spara i typ localstorage elr nå
            //gör route i servern för att skicka ut t.ex. alla orgs till klienten
            //mappa ut alla json data i react klienten och presentera i vyn
        }
    });
})

app.post('/api/orgs', (req, res) => {
    let token = req.body.token;

    let options = {
        uri: GIT_API_URL + '/user/orgs?access_token=' + token,
        method: 'GET',
        headers: {
            'User-Agent': 'jonne',
            'Content-Type': 'application/json'
        }
    };

    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            console.log(JSON.stringify(body));

            res.json(body);
        }
    });
})

app.post('/api/github/hook', (req, res) => {
    let token = req.body.token;

    let jsonData = {
        name: 'web',
        active: true,
        events: [
            push,
            pull_request
        ],
        config: {
            url: 'http://localhost:8000',
            content_type: 'json'
        }
    }

    let options = {
        uri: GIT_API_URL + '/orgs/jonne-1dv612/hooks?access_token=' + token,
        data: jsonData,
        method: 'POST',
        headers: {
            'User-Agent': 'jonne',
            'Content-Type': 'application/json'
        }
    };

    request(options, (error, response, body) => {

    })
})

app.listen(port, () => {
    console.log("Express started on http://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});
