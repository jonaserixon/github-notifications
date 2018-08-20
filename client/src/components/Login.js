import React, { Component } from 'react';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedInYet: false
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
        // const redirect_uri = 'http://localhost:3000/callback';
        window.location = 'https://github.com/login/oauth/authorize?client_id=' + client_id + '&scope=admin:org_hook%20user%20read:org%20repo'
        
        //&&redirect_uri=' + redirect_uri;
    }

    getAccessToken() {
        const callbackCode = {
            code: window.location.href.substring(window.location.href.indexOf("=") + 1, window.location.href.length)
        }

        fetch('/github/auth',{
            body: JSON.stringify(callbackCode),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            //användaren e inloggad
            localStorage.clear();
            localStorage.setItem('token', data.access_token)
            localStorage.setItem('login', data.userData.login)
            localStorage.setItem('avatar_url', data.userData.avatar_url)
            this.setState({isLoggedInYet: true});
        })
    }

    render() {     
        let welcomeMessage = '';

        if (this.state.isLoggedInYet) {
            welcomeMessage = 'Welcome, ' + localStorage.getItem('login') + '.';
        }

        return (
            <div className="Login">
                <p>{welcomeMessage}</p>
            </div>
        );
    }
}

export default Login;
