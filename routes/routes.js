'use strict';

const router = require("express").Router();
const crypto = require('crypto');
const mailBoy = require('../libs/mailBoy');

module.exports = function(UserModel, io, GithubEventModel) {

    //Webhook from github
    router.post('/hook', (req, res) => {
        console.log('___________________________________________--------------')
        let event_id = req.headers['x-github-delivery'];
        let event_type = req.headers['x-github-event'];
        let hook_signature = req.headers['x-hub-signature'];
        let hook_org = req.body.organization.login;

        //Validate hook 
        let signature = "sha1=" + crypto.createHmac('sha1', process.env['CLIENT_SECRET']).update(JSON.stringify(req.body)).digest('hex')
        if (hook_signature !== signature) {  console.log('bad hook'); return res.json({message: 'Bad hook'}) } 

        if (event_type == 'ping') {
            return res.json();
        }

        UserModel.find({}, (err, users) => {
            console.log(event_type)
            let hook_event = event_type;
            if (event_type == 'issues' || event_type == 'issue_comment') { hook_event = 'issue' }

            let saveHookInDB = new GithubEventModel({
                event_type: event_type,
                org: hook_org,
                created_at: req.body[hook_event].created_at,
                url: req.body[hook_event].url,
            })

            for (let i = 0; i < users.length; i++) {

                    for (let j = 0; j < users[i].subscription_list.length; j++) {

                        //Jämför användarens prenumerationer med hook organisationen och sedan kolla om hook eventet matchar med användarens valda events
                        if (users[i].subscription_list[j].org === hook_org) {
                            console.log('SKICKA UT EVENT HÄR')

                            if (users[i].subscription_list[j].events.includes(event_type)) {

                                if (req.body.repository != undefined) {
                                    io.to(users[i].login).emit('user-room',
                                        {
                                            event_type: req.headers['x-github-event'],
                                            sender: req.body.sender.login,
                                            sender_avatar: req.body.sender.avatar_url,
                                            repository: req.body.repository.name,
                                            html_url: req.body.repository.html_url,
                                            hook_org: hook_org
                                        }
                                    )
                                } 
    
                                mailBoy(req, users[i].email);
                            }
                        }
                    }

            }

            saveHookInDB.save((err, savedHook) => {
                console.log('Hook saved in DB!')
                console.log(savedHook)
            })

        })
        

        res.json({message: 'Success'});
    })
    
    return router;
};
