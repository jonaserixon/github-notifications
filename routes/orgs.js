'use strict';

const router = require("express").Router();
const request = require('request');
const requestPromise = require('request-promise');

module.exports = function(UserModel) {

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

    //Check if event is unread or read
    router.post('/github/org-events', (req, res) => {
        
        let token = req.body.token;
        let username = req.body.login;
        let selectedOrg = req.body.selectedOrg;

        let unreadNotifications = [];

        let numberOfUnreadNotifications = [];

        if (req.body.orgs) { 

            let ps = [];

            for (let i = 0; i < req.body.orgs.length; i++) {
                let options = {
                    method: 'GET',
                    uri: process.env['GIT_API_URL'] + '/users/' + username + '/events/orgs/' + req.body.orgs[i] + '?access_token=' + token,
                    headers: {
                        'User-Agent': 'jonne',
                        'Content-Type': 'application/json'
                    },
                    json: true 
                }

                ps.push(requestPromise(options))
            }

            Promise.all(ps)
            .then((results) => {
                UserModel.findOne({login: username}, function(err, user) {
                    if (err) { console.log(err); }
                    if (user) {
                        let userLastActive = new Date(user.last_active.toISOString().substring(0,19)+'Z');
                        for (let i = 0; i < results.length; i++) {                            
                            for (let j = 0; j < results[i].length; j++) {

                                let event_created_date = new Date(results[i][j].created_at);

                                if (userLastActive < event_created_date) {
                                    numberOfUnreadNotifications.push(
                                        results[i][i].org.login
                                    )

                                }
                            }
                        }

                        return res.json(numberOfUnreadNotifications);
                    }
                })
            })
            .catch((err) => {
                res.json({message: err})
            });  

        } else {

            let options = {
                uri: process.env['GIT_API_URL'] + '/users/' + username + '/events/orgs/' + selectedOrg + '?access_token=' + token,
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
                                for (let i = 0; i < user.subscription_list.length; i++) {
                                    for (let j = 0; j < jsonBody.length; j++) {

                                        if (jsonBody[j].org.login == user.subscription_list[i].org) {

                                            let event_type = '';

                                            switch (jsonBody[j].type) {
                                                case 'IssuesEvent':
                                                    event_type = 'issues'
                                                    break;
                                                case 'IssueCommentEvent':
                                                    event_type = 'issue_comment'
                                                    break;
                                                case 'PublicEvent':
                                                    event_type = 'public'
                                                    break;
                                                case 'RepositoryEvent':
                                                    event_type = 'repository'
                                                    break;
                                                default:
                                                    break;
                                            }

                                            if (user.subscription_list[i].events.includes(event_type)) {
                                                let event_created_date = new Date(jsonBody[j].created_at);
                            
                                                if (userLastActive < event_created_date) {
                                                    let eventData = {
                                                        event_type: jsonBody[i].type.replace('Event', ''),
                                                        event_repo: jsonBody[i].repo.name,
                                                        event_id: jsonBody[i].id
                                                    }
                        
                                                    unreadNotifications.push(eventData);
                                                }
                                            }
                                        }
                                    }
                                }

                            return res.json(unreadNotifications);
                        }
            
                        if (error) {
                            res.json({message: error})
                        }
                    })
                } 
            });
        }

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

    return router;
}
