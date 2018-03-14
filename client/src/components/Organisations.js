import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Organisations extends Component {
    constructor() {
        super();
        this.state = {
            orgs: []
        }
    }

    componentWillMount() {
        if (localStorage.getItem('token') !== null) {
            this.getOrgs();
        }
    }

    getOrgs() {
        let access_token = {
            token: localStorage.getItem('token')
        }

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
            let jsonOrgs = JSON.parse(data);
            let newOrgs = this.state.orgs.slice();

            for (let i = 0; i < jsonOrgs.length; i++) {
                newOrgs.push(
                    <div className="org">
                        <Link to={"/organisations/" + jsonOrgs[i].login}>
                            <p>{jsonOrgs[i].login}</p> 
                            <img src={jsonOrgs[i].avatar_url} alt="profile of org" />
                        </Link> 
                    </div>
                )
            }

            this.setState({orgs: newOrgs});
        }.bind(this))
    }

    render() {
        return (
            <div className="Organisations">
                {this.state.orgs}
            </div>
        );
    }
}

export default Organisations;
