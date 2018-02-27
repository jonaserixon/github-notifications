import React, { Component } from 'react';

class AuthorizeUser extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    // componentDidMount() {
    //     if (this.state.isLoggedIn) {

    //     } else {
    //         window.location = 'https://github.com/login/oauth/authorize?client_id=3d47ed6a79c582546a56&redirect_uri=http://localhost:3000/callback';

    //         // fetch('/api/github/auth',

    //         // )
    //         // .then(res => res.json())
    //     }
    // }

    componentDidMount() {
        const callbackCode = {
            code: window.location.href.substring(36, window.location.href.length)
        }

        console.log(callbackCode);

        //gör en post till APIet
        fetch('/api/github/auth',{
            body: JSON.stringify(callbackCode),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
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