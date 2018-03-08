import React, { Component } from 'react';

class Hook extends Component {
    constructor() {
        super();
        this.state = {

        }
    }

    componentDidMount() {
        let access_token = {
            token: localStorage.getItem('token')
        }

        console.log(access_token);

        fetch('/api/github/hook',{
            body: JSON.stringify(access_token),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json());
    }

    render() {
        return (
            <div className="Hook">
            </div>
        );
    }
}

export default Hook;
