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
                        console.log(body);

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
                res.json({message: 'error typ'})
            }
        });
    })



    router.route('/api/github/hook') 
        .post((req, res) => {
            console.log('skapa en liten hook här va')
            console.log(req.body.token);
            console.log(req.body.selectedOrg);

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
                        "issues",
                    ],
                    "config": {
                        "url": "http://f662ad7e.ngrok.io/hook",
                        "content_type": "json"
                    }
                }
            };
        
            request(options, (error, response, body) => {    
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    res.json(body);
                } else {
                    console.log(body);
                    res.json({message: 'error typ'})
                }
            })
        })


    router.route('/api/github/hook') 
        .patch((req, res) => {
            //gå igenom alla hooks och sätt dom till active: false
            console.log('patch route')

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
                        "issues",
                    ]
                }
            };

            request(options, (error, response, body) => {    
                if (error) {
                    console.log('errorlito');
                    res.json({message: 'error typ'})
                } else {
                    console.log('success patch:');
                    //console.log(body)
                    res.json(body);
                }
            })
        })





    function turnOffNotificationsAllOrgs(token) {

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
                console.log('turnoffNotifications()')
                //console.log(body);
                let orgsJson = JSON.parse(body);
                let orgs = [];

                for (let i = 0; i < orgsJson.length; i++) {
                    orgs.push(orgsJson[i].login);

                    let options = {
                        uri: GIT_API_URL + '/orgs/' + orgsJson[i].login + '/hooks?access_token=' + token,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'jonne',
                            'Content-Type': 'application/json'
                        }
                    };

                    request(options, (error, response, body) => {    
                        console.log(orgsJson[i].login);
                        let hooksJson = JSON.parse(body);

                        if (hooksJson.length != undefined) {
                            console.log(hooksJson[0].id)

                            //GÖR ALLA HOOKS TILL ACTIVE: FALSE
                            request.patch('http://localhost:8000/api/github/hook', { json: { selectedOrg: orgsJson[i].login, token: token, hook_id: hooksJson[0].id, shouldBeActive: false }},
                                function (error, res, body) {
                                    console.log(body);
                                }
                            );
                        }

                        //Har tillgång till alla hook_ids
                        //Nu kan jag patcha dom var och en
                    })
                }

                //Får ut alla hooks i varje organization
                //Gör en patch på varje hook för att sätta den till active: false

            } else {

            }
        });
    }

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
    
                            if (hooksJson.length != undefined && hooksJson[0] != undefined) {

                                //GÖR ALLA HOOKS TILL ACTIVE: FALSE
                                request.patch('http://localhost:8000/api/github/hook', { json: { selectedOrg: orgsJson[i].login, token: token, hook_id: hooksJson[0].id, shouldBeActive: false }},
                                    (error, res, body) => {
                                        console.log('första nestade loggen')

                                        let options = { uri: GIT_API_URL + '/orgs/' + req.body.selectedOrg + '/hooks?access_token=' + token, method: 'GET', headers: { 'User-Agent': 'jonne', 'Content-Type': 'application/json' }}

                                        //Göra den selectade organizationen aktiv för hooks
                                        request(options, (error, response, body) => {    
                                            console.log('andra request delen')
                                            
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
                            } else {
                                //hooks som inte existerar. skapa dom
                                console.log('lite problem va')
                                console.log(error)
                            }
                        })
                    }

                    //den här sätter den selectade till active: true
                    //Får ut alla hooks i varje organization
                    //Gör en patch på varje hook för att sätta den till active: false
                }
            });

            res.json({message: 'hej'});
        })
 


    router.post('/hook', (req, res) => {
        console.log('POST HOOKAH');

        if (req.body.issue == undefined) {

        } else {
            io.emit('notiser',
                {data: req.body}
            )
        }

        res.json({message: 'här är din lille hook typ'});
    })

    return router;
};
