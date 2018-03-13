'use strict';

const router = require("express").Router();
const request = require('request');
const mongoose = require('mongoose');

const GIT_API_URL='https://api.github.com';


module.exports = function(CLIENT_ID, CLIENT_SECRET, UserModel, io) {

    router.post('/api/github/auth', (req, res) => {
        let githubCode = req.body.code;
    
        let options = {
            uri: 'https://github.com/login/oauth/access_token?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&code=' + githubCode,
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
                        "url": "http://45e10d00.ngrok.io/hook",
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
            //gå igenom alla hooks och sätt dom till active: false

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


    //Steg 1: resetta alla org hooks till active: false och sedan kolla selected org och gör den till active.
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

                            //hooksJson.config.hasOwnProperty("ydata");
                            
                            for (let j = 0; j < hooksJson.length; j++) {

                                if (hooksJson.length != undefined && hooksJson[j] != undefined) {
                                    console.log(hooksJson[j]);

                                    if (hooksJson[j].config.hasOwnProperty("user-subscription")) {
                                        //EN USER SUBSCRIPTION HOOK
                                        console.log('EN USER SUBSCRIPTION HOOK')
                                    } else {

                                        //GÖR ALLA HOOKS TILL ACTIVE: FALSE
                                        request.patch('http://localhost:8000/api/github/hook', { json: { selectedOrg: orgsJson[i].login, token: token, hook_id: hooksJson[j].id, shouldBeActive: false }},
                                            (error, res, body) => {

                                                let options = { uri: GIT_API_URL + '/orgs/' + req.body.selectedOrg + '/hooks?access_token=' + token, method: 'GET', headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }}

                                                //Göra den selectade organizationen aktiv för hooks
                                                request(options, (error, response, body) => {    
                                                    
                                                    if (!error && response.statusCode == 200 && JSON.parse(body)[0] != undefined) {
                                                                                                                                        //Enable notifications på organizationen genom active: true i patch
                                                                                                                                        //gör en patch request o ändra active till true
                                                        request.patch('http://localhost:8000/api/github/hook', { json: { selectedOrg: req.body.selectedOrg, token: token, hook_id: JSON.parse(body)[0].id, shouldBeActive: true }},
                                                            (error, res, body) => {
                                                                //console.log('nu är hooken active')
                                                            }
                                                        );

                                                        //res.json(body);

                                                    } else {
                                                        console.log('ett stort fel jao hehe');
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
        console.log('POST HOOKAH');
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
        });

        
        

        //Jämför org events created_at med användarens last_active för att avgöra vilka notifikationer som är "nya"
    
        
    })



    router.post('/api/update-user-last-active', (req, res) => {
        UserModel.findOne({login: req.body.login}, function(err, user) {
            if (err) return handleError(err);
        
            user.last_active = Date.now();

            user.save(function (err, updatedUser) {
                if (err) { 
                    return handleError(err) 
                }
                res.json({message: 'success'});
            });
        });
    })



    router.post('/api/subscribe-to-event', (req, res) => {
        let token = req.body.token;
        let selectedOrg = req.body.selectedOrg;
        let selectedEvent = req.body.selectedEvent;
        
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
                    "url": "http://45e10d00.ngrok.io/hook",
                    "content_type": "json",
                    "user-subscription": true
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

    return router;
};
