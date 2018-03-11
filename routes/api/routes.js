'use strict';

const router = require("express").Router();
const request = require('request');
const mongoose = require('mongoose');

const GIT_API_URL='https://api.github.com';


module.exports = function(CLIENT_ID, CLIENT_SECRET, UserModel, io) {

    router.post('/api/github/auth', (req, res) => {
        
        let githubCode = req.body.code;
        console.log('auth baby ' + req.body.code);
    
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
        
        console.log('/api/orgs bror')
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
            } else {
                res.json({message: 'error typ'})
            }
        });
    })






    
    router.route('/api/github/hook') 
        .post((req, res) => {
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
                        "*",
                    ],
                    "config": {
                        "url": "http://a9c9cc68.ngrok.io/hook",
                        "content_type": "json"
                    }
                }
            };
        
            request(options, (error, response, body) => {    
                if (!error && response.statusCode == 200) {
                    res.json(body);
                } else {
                    res.json({message: 'error typ'})
                }
            })
        })

    router.route('/api/github/hooklist') 
        .post((req, res) => {
            let token = req.body.token;
        
            let options = {
                uri: GIT_API_URL + '/orgs/jonne-1dv612/hooks?access_token=' + token,
                method: 'GET',
                headers: {
                    'User-Agent': 'jonne',
                    'Content-Type': 'application/json'
                }
            }

            request(options, (error, response, body) => {    
                if (!error && response.statusCode == 200) {
                    console.log(body)
                    res.json(body);
                } else {
                    res.json({message: 'error typ'})
                }
            })
        })



    router.post('/hook', (req, res) => {
        console.log('POST HOOKAH');
        console.log(req.body)

        //emitta socket event här
        res.json({message: 'här är din lille hook typ'});

        io.emit('notiser',
            {data: req.body}
        )
    })

    return router;
};
