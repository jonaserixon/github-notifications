import React, { Component } from 'react';

class AuthorizeUser extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    
    componentDidMount() {
        const callbackCode = {
            code: window.location.href.substring(36, window.location.href.length)
        }

        fetch('/api/github/auth',{
            body: JSON.stringify(callbackCode),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then(function(token) {
            localStorage.setItem('token', token)

            window.location.replace('http://localhost:3000/');
        })
        //ändra state här och rendera/redirecta användaren nånstans?
    }

    render() {
        return (
            <div className="AuthorizeUser">
                <h3>yolo</h3>
            </div>
        );
    }
}

export default AuthorizeUser;