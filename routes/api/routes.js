'use strict';

const router = require("express").Router();
const request = require('request');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const GIT_API_URL='https://api.github.com';

module.exports = function(UserModel, io) {

    router.post('/api/github/auth', (req, res) => {
        let githubCode = req.body.code;
        
        
        let options = {
            uri: 'https://github.com/login/oauth/access_token?client_id=' + process.env['CLIENT_ID'] + '&client_secret=' + process.env['CLIENT_SECRET'] + '&code=' + githubCode,
            method: 'POST',
            headers: {
                'User-Agent': 'jonne',
                "Content-Type": "application/json"
            }
        };
        
        //Get access token
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
                
                //Store auth user in database
                request(options, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        let data = JSON.parse(body)

                        let userData = {
                            login: data.login,
                            avatar_url: data.avatar_url,
                            email: data.email,
                            last_active: Date.now()
                        }
            
                        UserModel.findOne({login: data.login}, function(err, doc) {
                            if (doc == null) {
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

    //Hämtar organizationer och sätter hooks på dom
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

                let jsonBody = JSON.parse(body);

                for (let i = 0; i < jsonBody.length; i++) {
                
                    let options = { uri: GIT_API_URL + '/orgs/' + jsonBody[i].login + '/hooks?access_token=' + token, method: 'GET', headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }}

                    request(options, (error, response, body) => {    

                        //Kolla om arrayen med hooks är tom eller inte
                        if (body == '[]' || body.length <= 2 || JSON.parse(body).message == 'Not Found') {                                                     
                            request.post('http://localhost:8000/api/github/hook', { json: { selectedOrg: jsonBody[i].login, token: token }}, 
                                (error, res, body) => {

                                }
                            );
                        }
                    })
                }

                res.json(body);
            } else {
                res.json({message: 'error'})
            }
        });
    })



    router.route('/api/github/hook') 
        .post((req, res) => {
            let token = req.body.token;
            let selectedOrg = req.body.selectedOrg;
        
            let options = {
                uri: GIT_API_URL + '/orgs/' + selectedOrg + '/hooks?access_token=' + token,
                method: 'POST',
                headers: {
                    'User-Agent': 'jonne',
                    'Content-Type': 'application/json'
                },
                json: {
                    "name": "web",
                    "active": false,
                    "events": [
                        "*",
                    ],
                    "config": {
                        "url": process.env['NGROK_URL'] + "/hook",
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


    router.route('/api/github/hook') 
        .patch((req, res) => {
            let token = req.body.token;
            let selectedOrg = req.body.selectedOrg;
            let hook_id = req.body.hook_id;
            let shouldBeActive = req.body.shouldBeActive;

            let options = {
                uri: GIT_API_URL + '/orgs/' + selectedOrg + '/hooks/' + hook_id + '?access_token=' + token,
                method: 'PATCH',
                headers: {
                    'User-Agent': 'jonne',
                    'Content-Type': 'application/json'
                },
                json: {
                    "name": "web",
                    "active": shouldBeActive,
                    "events": [
                        "*",
                    ]
                }
            };

            request(options, (error, response, body) => {    
                if (error) {
                    res.json({message: 'error typ'})
                } else {
                    res.json(body);
                }
            })
        })


    //resetta alla org hooks till active: false och sedan kolla selected org och gör den till active.
    router.route('/api/github/handlehook') 
        .post((req, res) => {
            let token = req.body.token;
            let options = { uri: GIT_API_URL + '/user/orgs?access_token=' + token, method: 'GET', headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }};
        
            //Hämta användarens alla organizationer
            request(options, (error, response, body) => {

                if (!error && response.statusCode == 200) {    
                    let orgsJson = JSON.parse(body);                    
                    
                    for (let i = 0; i < orgsJson.length; i++) {

                        let options = {uri: GIT_API_URL + '/orgs/' + orgsJson[i].login + '/hooks?access_token=' + token, method: 'GET', headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }};
    
                        //Hämta alla hooks tillhörande organizationerna
                        request(options, (error, response, body) => {    
                            let hooksJson = JSON.parse(body);
                            
                            for (let j = 0; j < hooksJson.length; j++) {

                                if (hooksJson.length != undefined && hooksJson[j] != undefined) {

                                    if (!hooksJson[j].config.hasOwnProperty("user-subscription")) {
                                    

                                        //GÖR ALLA HOOKS TILL ACTIVE: FALSE
                                        request.patch('http://localhost:8000/api/github/hook', { json: { selectedOrg: orgsJson[i].login, token: token, hook_id: hooksJson[j].id, shouldBeActive: false }},
                                            (error, response, body) => {

                                                let options = { uri: GIT_API_URL + '/orgs/' + req.body.selectedOrg + '/hooks?access_token=' + token, method: 'GET', headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }}

                                                //Göra den selectade organizationen aktiv för hooks
                                                request(options, (error, response, body) => {    
                                                    
                                                    if (!error && response.statusCode == 200 && JSON.parse(body)[0] != undefined) {
                                                        //Enable notifications på organizationen genom active: true i patch
                                                        //gör en patch request o ändra active till true
                                                        request.patch('http://localhost:8000/api/github/hook', { json: { selectedOrg: req.body.selectedOrg, token: token, hook_id: JSON.parse(body)[0].id, shouldBeActive: true }},
                                                            (error, response, body) => {
                                                                if (!error) {}
                                                            }
                                                        );
                                                    } 
                                                })
                                            }
                                        );
                                    }
                                }
                            }
                        })
                    }
                }
            });

            res.json({message: 'hej'});
        })
 


    router.post('/hook', (req, res) => {
        let json = JSON.stringify(req.body);

        let event_id = req.headers['x-github-delivery'];
        let event_type = req.headers['x-github-event'];

        if (req.body.repository != undefined) {
            io.emit('notiser',
                {
                    event_type: req.headers['x-github-event'],
                    sender: req.body.sender.login,
                    repository: req.body.repository.name,
                    html_url: req.body.repository.html_url
                }
            )
        } else {
            io.emit('notiser',
                {
                    event_type: req.headers['x-github-event'],
                    sender: req.body.sender.login,
                }
            )
        }
        res.json({message: 'här är din lille hook typ'});
    })


    //Check if unread or read notification
    router.post('/api/github/org-events', (req, res) => {

        let token = req.body.token;
        let username = req.body.login;
        let selectedOrg = req.body.selectedOrg;

        let unreadNotifications = [];

        let options = {
            uri: GIT_API_URL + '/users/' + username + '/events/orgs/' + selectedOrg + '?access_token=' + token,
            method: 'GET',
            headers: {
                'User-Agent': 'jonne',
                'Content-Type': 'application/json'
            }
        };

        UserModel.findOne({login: username}, function(err, user) {
            if (err) { console.log(err); }

            if (user) {
                let userLastActive = new Date(user.last_active.toISOString().substring(0,19)+'Z');

                request(options, (error, response, body) => {
                    if (!error && response.statusCode == 200) {    
                        let jsonBody = JSON.parse(body);
        
                        for(let i = 0; i < jsonBody.length; i++) {
                            let event_created_date = new Date(jsonBody[i].created_at);
    
                            if (userLastActive < event_created_date) {
                                let eventData = {
                                    event_type: jsonBody[i].type.replace('Event', ''),
                                    event_repo: jsonBody[i].repo.name,
                                    event_id: jsonBody[i].id
                                }
    
                                unreadNotifications.push(eventData);
                            }
                        }
    
                        res.json(unreadNotifications);
                    }
        
                    if (error) {
                        res.json({message: error})
                    }
                })
            }
        });
    })



    router.post('/api/update-user-last-active', (req, res) => {
        UserModel.findOne({login: req.body.login}, function(err, user) {
            if (err) console.log(err);

            if (user) {
                user.last_active = Date.now();

                user.save(function (err, updatedUser) {
                    if (err) { 
                        console.log(err) 
                    }
                    res.json({message: 'success'});
                });
            }
        });
    })

    router.post('/api/subscribe-to-event', (req, res) => {
        let token = req.body.token;
        let selectedOrg = req.body.selectedOrg;
        let selectedEvent = req.body.selectedEvent;

        //hämta alla orgs
        let options = {
            uri: GIT_API_URL + '/orgs/' + selectedOrg + '/hooks?access_token=' + token,
            method: 'GET',
            headers: {
                'User-Agent': 'jonne',
                'Content-Type': 'application/json'
            }
        };
    
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {   
                let hooksJson = JSON.parse(body);

                    let options = {
                        uri: GIT_API_URL + '/orgs/' + selectedOrg + '/hooks?access_token=' + token,
                        method: 'POST',
                        headers: {
                            'User-Agent': 'jonne',
                            'Content-Type': 'application/json'
                        },
                        json: {
                            "name": "web",
                            "active": true,
                            "events": [
                                selectedEvent,
                            ],
                            "config": {
                                "url": process.env['NGROK_URL'] + "/user-subscription-email/" + req.body.user_email,
                                "content_type": "json",
                                "user-subscription": true
                            }
                        }
                    };
                
                    request(options, (error, response, body) => {    
                        if (!error) {
                            res.json(body);
                        } else {
                            res.json({message: 'error typ'})
                        }
                    })
            } else {
                res.json({message: 'error typ'})
            }
        })
    })


    router.post('/api/unsubscribe-to-event', (req, res) => {
        let token = req.body.token;
        let selectedOrg = req.body.selectedOrg;
        let selectedEvent = req.body.selectedEvent;

        let options = {
            uri: GIT_API_URL + '/orgs/' + selectedOrg + '/hooks?access_token=' + token,
            method: 'GET',
            headers: {
                'User-Agent': 'jonne',
                'Content-Type': 'application/json'
            }
        };
    
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {   
                let hooksJson = JSON.parse(body);

                for (let i = 0; i < hooksJson.length; i++) {

                    if (hooksJson[i].config.hasOwnProperty("user-subscription")) {
                        let options = {
                            uri: GIT_API_URL + '/orgs/' + selectedOrg + '/hooks/' + hooksJson[i].id + '?access_token=' + token,
                            method: 'DELETE',
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
                        })
                    }
                }
            }
        })
    })

    //Email user subscription notifications
    router.post('/user-subscription-email/:email', (req, res) => {
        let message = '';

        if (req.body.repository != undefined) {
            message = 'You have a new ' + req.headers['x-github-event'] + '-event in ' + req.body.organization.login + '/' + req.body.repository.name + ' from ' + req.body.sender.login + '!\n' + req.body.repository.html_url;
        } else {
            message = 'You have a new ' + req.headers['x-github-event'] + '-event from ' + req.body.sender.login + '.';
        }

        var smtpTransport = nodemailer.createTransport({
            service: "Gmail",  
            auth: {
                user: "killen1dv612@gmail.com",
                pass: "norrliden"
            }
        });
         
        let options = {
            from: "killen1dv612@gmail.com", 
            to: req.params.email,
            subject: "New Github Notification", 
            text: message 
        }

        smtpTransport.sendMail(options, (error, response) => {  
            if (error){
                res.json({message: error})
            } else {
                res.json({message: 'success'})
            }        
        });
        res.json({message: 'success'})
    })

    return router;
};
