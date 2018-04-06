'use strict';

const router = require("express").Router();
const request = require('request');

module.exports = function(UserModel) {

    //AUTHORIZE GITHUB USER AND STORE IN DB
    router.post('/github/auth', (req, res) => {
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

    function storeUserInDatabaseThenSendDataToClient(access_token, res) {
        let options = {
            uri: process.env['GIT_API_URL'] + '/user?access_token=' + access_token,
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

    return router;
}