import React, { Component } from 'react';
import io from 'socket.io-client';
import { BrowserRouter as Router, Link, Route, Switch, Redirect } from 'react-router-dom';
import Notifications from './Notifications';


class Organisations extends Component {
    constructor() {
        super();
        this.state = {
            orgs: [],
            notifications: []
        }
    }

    componentWillMount() {
        console.log('hej hej orgs')
        if (localStorage.getItem('token') !== null) {
            this.getOrgs();
            //this.getNotifications();
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

    getNotifications() {
        let newNotifications = this.state.notifications.slice();

        this.socket = io('http://localhost:8000');

        this.socket.on('notiser', function(data){
            console.log(data.data)

            newNotifications.push(
                <div className="notis"> 
                    <p>{data.data.action}</p>
                    <p>{data.data.issue.title}</p>
                    <p>{data.data.issue.body}</p>
                    <p>{data.data.sender.login}</p>
                </div>
            )

            this.setState({notifications: newNotifications});
        }.bind(this));
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
