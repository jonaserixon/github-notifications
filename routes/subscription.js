'use strict';

const router = require("express").Router();

module.exports = function(UserModel) {

    router.post('/subscribe-to-event', (req, res) => {
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


    router.post('/unsubscribe-to-event', (req, res) => {
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

    return router;
}
