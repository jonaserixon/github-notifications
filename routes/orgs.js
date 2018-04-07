'use strict';

const router = require("express").Router();
const request = require('request');
const requestPromise = require('request-promise');

module.exports = function(UserModel, GithubEventModel) {

    //Get user organization and set webhook
    router.post('/orgs', (req, res) => {
        let token = req.body.token;
        
        let options = {
            uri: process.env['GIT_API_URL'] + '/user/orgs?access_token=' + token,
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
                        uri: process.env['GIT_API_URL'] + '/orgs/' + jsonBody[i].login + '/hooks?access_token=' + token, 
                        method: 'GET', 
                        headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }
                    }

                    request(options, (error, response, body) => {    

                        //Kolla om arrayen med hooks är tom eller inte. Om inte så går det ej att sätta hooks (?)
                        if (body == '[]' || body.length <= 2 || JSON.parse(body).message == 'Not Found') {                                                     
                            request.post('http://localhost:8000/github/hook', { json: { selectedOrg: jsonBody[i].login, token: token }}, 
                                (error, res, body) => {
                                   //hooks är satta
                                   console.log('hooks e satta')
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

    //Get selected organization
    router.post('/selected-org', (req, res) => {
        let token = req.body.token;
        let selectedOrg = req.body.selectedOrg;
        
        let options = {
            uri: process.env['GIT_API_URL'] + '/orgs/' + selectedOrg + '?access_token=' + token,
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

    //Count how many unread notifications there are for the organization
    router.post('/github/unread-org-events', (req, res) => {
        
        let token = req.body.token;
        let username = req.body.login;

        let unreadNotifications = [];

        let numberOfUnreadNotifications = [];

        //Get number of unread notifications for each organization
        GithubEventModel.find({}, (err, events) => {
            if (err) { console.log(err) }

            if (events) { 
                //Har fått alla olästa hooks

                UserModel.findOne({login: username}, (err, user) => {
                    if (err) { console.log(err) }
        
                    if (user) {
                        //Kolla vilka events som användaren är subbad till

                        for (let i = 0; i < user.subscription_list.length; i++) {
                            //Alla användarens organizationer som han är subbad till

                            for (let j = 0; j < events.length; j++) {

                                if (!events[j].read_by.includes(username)) {
                                    if (user.subscription_list[i].org.includes(events[j].org) && user.subscription_list[i].events.includes(events[j].event_type)) {
                                        unreadNotifications.push(events[j].org)
                                    }
                                } 
                            }
                        }

                        return res.json(unreadNotifications);
                    }
                })
            }
        })
    })

    //Set webhook on github organization
    router.post(('/github/hook'), (req, res) => {
        let token = req.body.token;
        let selectedOrg = req.body.selectedOrg;
    
        let options = {
            uri: process.env['GIT_API_URL'] + '/orgs/' + selectedOrg + '/hooks?access_token=' + token,
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

    router.post(('/github/set-hooks-to-read'), (req, res) => {
        let username = req.body.login;
        let selectedOrg = req.body.selectedOrg;

        let unreadNotifications = [];

        GithubEventModel.find({org: selectedOrg}, (err, events) => {
            if (err) { console.log(err) }

            if (events) { 
                for (let i = 0; i < events.length; i++) {

                    if (!events[i].read_by.includes(username)) {
                        events[i].read_by.push(username);
                        events[i].save((err) => {
                            if (err) {console.log(err)} else {console.log(username + ' has read \'' + events[i].event_type + '\' in ' + events[i].org + '.')}
                        })
                    }
                    
                }
            }

        })
    })


    //Get all the unread notifications and sends them to client for presentation
    router.post(('/github/unread-notifications'), (req, res) => {
        let username = req.body.login;
        let selectedOrg = req.body.selectedOrg;

        let unreadNotifications = [];

        GithubEventModel.find({org: selectedOrg}, (err, events) => {
            if (err) { console.log(err) }

            if (events) { 

                //Har fått alla olästa hooks
                UserModel.findOne({login: username}, (err, user) => {
                    if (err) { console.log(err) }
        
                    if (user) {
                        //Kolla vilka events som användaren är subbad till

                        for (let i = 0; i < user.subscription_list.length; i++) {
                            //Alla användarens organizationer som han är subbad till

                            for (let j = 0; j < events.length; j++) {

                                if (!events[j].read_by.includes(username)) {
                                    if (user.subscription_list[i].org.includes(events[j].org) && user.subscription_list[i].events.includes(events[j].event_type)) {

                                        let unreadData = {
                                            event_type: events[j].event_type,
                                            url: events[j].url
                                        }

                                        if (events[i] !== undefined) {
                                            if (!events[i].read_by.includes(username)) {
                                                events[j].read_by.push(username);
                                                events[j].save((err) => {
                                                    if (err) {console.log(err)} else {console.log('jfhjdsfhdsjlkafhdjslahfdklshfdlsahfdskafhsdlahfdj')}
                                                })
                                            }
                                        } else if (events[i] === undefined) {
                                            console.log('undefined KAOS KAOS KAOS')
                                        }

                                        
    
                                        unreadNotifications.push(unreadData)
                                    }
                                } 
                            }
                        }

                        return res.json(unreadNotifications);
                    }
                })
            }
        })
    })

    return router;
}
