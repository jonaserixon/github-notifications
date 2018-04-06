'use strict';

const router = require("express").Router();
const request = require('request');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const GIT_API_URL='https://api.github.com';

module.exports = function(UserModel, io) {

    //AUTHORIZE GITHUB USER AND STORE IN DB
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
        
        //Get access token and send to client
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let access_token = body.substring(13, 53);
                storeUserInDatabaseThenSendDataToClient(access_token, res);
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
                
                    let options = { 
                        uri: GIT_API_URL + '/orgs/' + jsonBody[i].login + '/hooks?access_token=' + token, 
                        method: 'GET', 
                        headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }
                    }

                    request(options, (error, response, body) => {    

                        //Kolla om arrayen med hooks är tom eller inte. Om inte så går det ej att sätta hooks (?)
                        if (body == '[]' || body.length <= 2 || JSON.parse(body).message == 'Not Found') {                                                     
                            request.post('http://localhost:8000/api/github/hook', { json: { selectedOrg: jsonBody[i].login, token: token }}, 
                                (error, res, body) => {
                                   //hooks är satta
                                }
                            );
                        }
                    })
                }

                return res.json(body);
            } else if (error) {
                return res.json({message: 'error'})
            }
        });
    })


    router.post('/api/selected-org', (req, res) => {
        let token = req.body.token;
        let selectedOrg = req.body.selectedOrg;
        
        let options = {
            uri: GIT_API_URL + '/orgs/' + selectedOrg + '?access_token=' + token,
            method: 'GET',
            headers: {
                'User-Agent': 'jonne',
                'Content-Type': 'application/json'
            }
        };
    
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {   
                return res.json(body);
            }
        })
    })


    //Skapa en webhook på den valda organizationen
    router.post(('/api/github/hook'), (req, res) => {
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
                    "content_type": "json",
                    "secret": process.env['CLIENT_SECRET']
                }
            }
        };
    
        request(options, (error, response, body) => {    
            if (!error && response.statusCode == 200) {
                return res.json(body);
            } else if (error) {
                return res.json({message: error})
            } else if (response.statusCode == 404) {
                return res.json({message: 'Not allowed to set hooks on specified organization.'});
            }
        })
    })


    //Webhook from github
    router.post('/hook', (req, res) => {

        let event_id = req.headers['x-github-delivery'];
        let event_type = req.headers['x-github-event'];
        let hook_signature = req.headers['x-hub-signature'];

        let signature = "sha1=" + crypto.createHmac('sha1', process.env['CLIENT_SECRET']).update(JSON.stringify(req.body)).digest('hex')

        if (hook_signature !== signature) {
            return res.json({message: 'Bad hook'})
        } else {
            let hook_org = req.body.organization.login;

            UserModel.find({}, (err, users) => {
                for (let i = 0; i < users.length; i++) {
                    for (let j = 0; j < users[i].subscription_list.length; j++) {

                        //Jämför användarens prenumerationer med hook organisationen och sedan kolla om hook eventet matchar med användarens valda events
                        if (users[i].subscription_list[j].org === hook_org) {
                            if (users[i].subscription_list[j].events.includes(event_type)) {
                                if (req.body.repository != undefined) {
                                    io.to(users[i].login).emit('user-room',
                                        {
                                            event_type: req.headers['x-github-event'],
                                            sender: req.body.sender.login,
                                            sender_avatar: req.body.sender.avatar_url,
                                            repository: req.body.repository.name,
                                            html_url: req.body.repository.html_url
                                        }
                                    )
                                } else {
                                    io.to(users[i].login).emit('user-room',
                                        {
                                            event_type: req.headers['x-github-event'],
                                            sender: req.body.sender.login,
                                        }
                                    )
                                }

                                //mailBoy(req, users[i].email);
                            }
                        }
                    }
                }
            })
        }

        res.json({message: 'Success'});
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


    //UPDATE USERS LAST_ACTIVE PROPERTY
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
        let username = req.body.username;
        let selectedOrg = req.body.selectedOrg;
        let selectedEvent = req.body.selectedEvent;

        UserModel.findOne({login: username}, (err, user) => {
            if (err) console.log(err);
            if (user) {
                //Om användaren inte har någon subscription alls
                if (!user.subscription_list.length) { user.subscription_list.push({org: selectedOrg, events: selectedEvent}) }

                let userOrgs = []

                for (let i = 0; i < user.subscription_list.length; i++) {
                    userOrgs.push(user.subscription_list[i].org);
                    
                    if (user.subscription_list[i].org === selectedOrg) {

                        if (!user.subscription_list[i].events.length) {
                            console.log('Subscribed to ' + selectedEvent + ' in ' + selectedOrg)
                            user.subscription_list[i].events.push(selectedEvent)
                        }
                        //Kolla vilka events användaren redan är prenumererad på
                        for (let j = 0; j < user.subscription_list[i].events.length; j++) {

                            if (!user.subscription_list[i].events.includes(selectedEvent)) {
                                console.log('Subscribed to ' + selectedEvent + ' in ' + selectedOrg)
                                user.subscription_list[i].events.push(selectedEvent)
                            }
                        }
                    } 
                }

                if (!userOrgs.includes(selectedOrg)) {
                    console.log('(New) Subscribed to ' + selectedEvent + ' in ' + selectedOrg)
                    user.subscription_list.push({org: selectedOrg, events: selectedEvent})
                }

                user.save((err, updatedUser) => {
                    res.json({selectedEvent, selectedOrg});
                })
            }
        })
    })


    router.post('/api/unsubscribe-to-event', (req, res) => {
        let username = req.body.username;
        let selectedOrg = req.body.selectedOrg;
        let selectedEvent = req.body.selectedEvent;

        UserModel.findOne({login: username}, (err, user) => {
            if (err) console.log(err);
            if (user) {
                for (let i = 0; i < user.subscription_list.length; i++) {
                    if (user.subscription_list[i].org === selectedOrg) {
                        //Kolla vilka events användaren redan är prenumererad på
                        for (let j = 0; j < user.subscription_list[i].events.length; j++) {

                            if (user.subscription_list[i].events.includes(selectedEvent)) {
                                let indexOfSelectedEvent = user.subscription_list[i].events.indexOf(selectedEvent)

                                if (indexOfSelectedEvent > -1) {
                                    user.subscription_list[i].events.splice(indexOfSelectedEvent, 1);
                                    console.log('Unsubscribed from ' + selectedEvent + ' in ' + selectedOrg)

                                    user.save((err, updatedUser) => {
                                        return res.json({selectedEvent, selectedOrg});
                                    })
                                } 
                            }
                        }
                    } 
                }
            }
        })
    })


    function storeUserInDatabaseThenSendDataToClient(access_token, res) {
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
                    email: data.email,
                    last_active: Date.now()
                }

                UserModel.findOne({login: data.login}, (err, doc) => {
                    if (doc == null) {
                        let registerNewUser = new UserModel(userData);
                        registerNewUser.save((err, doc) => {
                            if (err) {
                                console.log(err);
                            }

                            
                        })
                    }
                })

                res.json({access_token, userData});
            }
        });
    }


    //Email user subscription notifications
    function mailBoy(req, userMail) {
        let message = '';

        if (req.body.repository != undefined) {
            message = 'You have a new ' + req.headers['x-github-event'] + '-event in ' + req.body.organization.login + '/' + req.body.repository.name + ' from ' + req.body.sender.login + '!\n' + req.body.repository.html_url;
        } else {
            message = 'You have a new ' + req.headers['x-github-event'] + '-event from ' + req.body.sender.login + '.';
        }

        var smtpTransport = nodemailer.createTransport({
            service: "Gmail",  
            auth: {
                user: process.env['EMAIL_ADDRESS'],
                pass: process.env['EMAIL_PASSWORD']
            }
        });
         
        let options = {
            from: process.env['EMAIL_ADDRESS'], 
            to: userMail,
            subject: "New Github Notification", 
            text: message 
        }

        smtpTransport.sendMail(options, (error, response) => {  
            if (error){

            }
                 
        });
    }
    
    return router;
};
