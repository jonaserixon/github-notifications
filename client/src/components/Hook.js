import React, { Component } from 'react';

class Hook extends Component {
    constructor() {
        super();
        this.state = {

        }
    }

    componentDidMount() {
        fetch('/api/github/repo',{
            body: localStorage.getItem('token'),
            method: 'POST',
            headers: {
                // 'Accept': 'application/json',
                // 'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then(function(hook) {

        })
    }

    render() {
        return (
            <div className="Hook">
            </div>
        );
    }
}

export default Hook;
