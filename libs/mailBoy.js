'use strict';

const nodemailer = require('nodemailer');

module.exports = function(req, userMail) {
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
            console.log('Could not send email')
        }
    });
}
