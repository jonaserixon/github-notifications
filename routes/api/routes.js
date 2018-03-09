'use strict';

const router = require("express").Router();
const request = require('request');
const mongoose = require('mongoose');

const GIT_API_URL='https://api.github.com';


module.exports = function(CLIENT_ID, CLIENT_SECRET, UserModel) {

    router.post('/api/github/auth', (req, res) => {
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

                let options = {
                    uri: GIT_API_URL + '/user?access_token=' + access_token,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'jonne',
                        'Content-Type': 'application/json'
                    }
                };
            
                request(options, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        let data = JSON.parse(body)

                        let userData = {
                            login: data.login,
                            avatar_url: data.avatar_url,
                            email: data.email
                        }
            
                        UserModel.findOne({login: data.login}, function(err, doc) {
                            if (err) {
                                let registerNewUser = new UserModel(userData);
                                registerNewUser.save((err, doc) => {
                                    if (err) {
                                        res.status(500).json(error);
                                    }
                                })
                            }

                            res.json({access_token, userData});
                        })
                    }
                });
            }
        });
    })

    
    router.post('/api/orgs', (req, res) => {
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
                res.json(body);
            }
        });
    })
    
    
    router.post('/api/github/hook', (req, res) => {
        let token = req.body.token;
    
        let options = {
            uri: GIT_API_URL + '/orgs/jonne-1dv612/hooks?access_token=' + token,
            method: 'POST',
            headers: {
                'User-Agent': 'jonne',
                'Content-Type': 'application/json'
            },
            json: {
                "name": "web",
                "active": true,
                "events": [
                    "repository",
                ],
                "config": {
                    "url": "http://3683686c.ngrok.io/hookah",
                    "content_type": "json"
                }
            }
        };
    
        request(options, (error, response, body) => {    
            if (!error && response.statusCode == 200) {
                res.json(body);
            }
        })
    })
    

    
    router.get('/hookah', (req, res) => {
        console.log('GET HOOKAH');
    })
    
    router.post('/hookah', (req, res) => {
        console.log('POST HOOKAH');
        res.json(req.body)
    })

    return router;
};