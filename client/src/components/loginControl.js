import React, { Component } from 'react';

import AuthorizeUser from './authorizeUser';

class LoginControl extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false
        }

        this.onSuccess = this.onSuccess.bind(this);
        this.onFailure = this.onFailure.bind(this);
    }

    onSuccess() {
        this.setState({isLoggedIn: true});
    }
    
    onFailure() {
        this.setState({isLoggedIn: false});
    }

    componentDidMount() {
        if (this.state.isLoggedIn) {

        } else {
            window.location = 'https://github.com/login/oauth/authorize?client_id=3d47ed6a79c582546a56&redirect_uri=http://localhost:3000/callback';

        }
    }

    

    render() {
        const isLoggedIn = this.state.isLoggedIn;

        if (isLoggedIn) {

        }
        
        return (
            <div className="Login">
                {/* <AuthorizeUser testa="yolo swag"/> */}
            </div>
        );
    }
}

export default LoginControl;