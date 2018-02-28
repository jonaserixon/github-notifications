import React, { Component } from 'react';

class Home extends Component {
    constructor() {
        super();
        this.state = {
            
        }
    }

    componentDidMount() {
        if (localStorage.getItem('token') !== null) {

            let access_token = {
                token: localStorage.getItem('token')
            }

            console.log(typeof token);
            fetch('/api/orgs',{
                body: JSON.stringify(access_token),
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            })
            .then(res => res.json())
            .then(function(data) {
                let orgs = JSON.stringify(data);

                //presentera datat
            })
        }
    }

    render() {
        return (
          <div className="Home">
            <h2>Homepage</h2>
          </div>
        );
    }
}

export default Home;