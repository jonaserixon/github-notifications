import React, { Component } from 'react';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    componentDidMount() {
        if (this.props.wantsToLogin) {
            this.userWantsToLogin();
        }

        if (this.props.githubCallback) {
            this.getAccessToken();
        }
    }

    userWantsToLogin() {
        const client_id = '3d47ed6a79c582546a56';
        const redirect_uri = 'http://localhost:3000/callback';

        window.location = 'https://github.com/login/oauth/authorize?client_id=' + client_id + '&&redirect_uri=' + redirect_uri;
        //Skicka upp ett state till en parent component och tala om att man nu är inloggad och därefter hämta ner github data osv. därifrån
    }

    getAccessToken() {
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
        
        window.history.pushState(null, null, '/login');
    }

    render() {        
        return (
            <div className="Login">
            </div>
        );
    }
}

export default Login;