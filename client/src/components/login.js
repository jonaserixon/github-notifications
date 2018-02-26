import React, { Component } from 'react';
import { Redirect } from 'react-router'

class Login extends Component {
    constructor() {
        super();
        this.state = {
            isLoggedIn: false
        }


    }

    componentDidMount() {
        window.location = 'https://github.com/login/oauth/authorize?client_id=3d47ed6a79c582546a56&redirect_uri=http://localhost:3000/callback';

        
   }

    render() {
        return (
          <div className="Login">
            
          </div>
        );
    }
}

export default Login;