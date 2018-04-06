'use strict';

const router = require("express").Router();
const crypto = require('crypto');
const mailBoy = require('../libs/mailBoy');

module.exports = function(UserModel, io) {

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

    //UPDATE USERS LAST_ACTIVE PROPERTY
    router.post('/update-user-last-active', (req, res) => {
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
    
    return router;
};
