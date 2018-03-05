import React, { Component } from 'react';

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
        const client_id = '3d47ed6a79c582546a56';
        const redirect_uri = 'http://localhost:3000/callback';

        if (this.state.isLoggedIn) {

        } else {
            window.location = 'https://github.com/login/oauth/authorize?client_id=' + client_id + '&&redirect_uri=' + redirect_uri;

            //Skicka upp ett state till en parent component och tala om att man nu är inloggad och därefter hämta ner github data osv. därifrån
        }
    }

    

    render() {
        //console.log(this.props.)
        
        return (
            <div className="Login">
            </div>
        );
    }
}

export default LoginControl;