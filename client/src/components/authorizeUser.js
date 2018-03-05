import React, { Component } from 'react';

class AuthorizeUser extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    updateURL() {
        window.history.pushState(null, null, '/');
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
        })
        //ändra state här och rendera/redirecta användaren nånstans?
        this.updateURL();
    }

    render() {
        return (
            <div className="AuthorizeUser">
            </div>
        );
    }
}

export default AuthorizeUser;
