import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route, Switch, Redirect } from 'react-router-dom';

class Organisations extends Component {
    constructor() {
        super();
        this.state = {
            orgs: [],
            notifications: []
        }
    }

    componentWillMount() {
        if (localStorage.getItem('token') !== null) {
            this.getOrgs();
        }
    }

    componentDidMount() {
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

                const renObjData = jsonOrgs.map(function(data, idx) {
                    return <p key={idx}>{data}</p>;
                });
        
                if (renObjData[0] != null) {
                    for (let i = 0; i < renObjData.length; i++) {
                        newOrgs.push
                        (
                        <div className="org"> 
                            <Link to={"/organisations/" + renObjData[i].props.children.login}>
                                <p>{renObjData[i].props.children.login}</p> 
                                <img src={renObjData[i].props.children.avatar_url} />
                            </Link> 
                        </div>
                        )
                    }
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
