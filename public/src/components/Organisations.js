import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Organisations extends Component {
    constructor() {
        super();
        this.state = {
            orgs: [],
            orgNames: [],
            jsonVersion: [],
            presentOrgs: []
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

        fetch('/orgs',{
            body: JSON.stringify(access_token),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            let jsonOrgs = JSON.parse(data);
            let newOrgs = this.state.orgs.slice();
            let newOrgNames = this.state.orgNames.slice();
            let newJsonVersion = this.state.jsonVersion.slice();

            for (let i = 0; i < jsonOrgs.length; i++) {
                newOrgNames.push(jsonOrgs[i].login);

                newOrgs.push(
                    <div id={jsonOrgs[i].login} className="org">
                        <Link to={"/organisations/" + jsonOrgs[i].login}>
                            <p>{jsonOrgs[i].login}</p> 
                            <img src={jsonOrgs[i].avatar_url} alt="profile of org" />
                        </Link> 
                    </div>
                )

                newJsonVersion.push({
                    login: jsonOrgs[i].login,
                    avatar_url: jsonOrgs[i].avatar_url
                })
            }
            this.setState({orgs: newOrgs});
            this.setState({orgNames: newOrgNames})
            this.setState({jsonVersion: newJsonVersion})
            this.hasUnreadOrgNotifications();
        })
    }

    hasUnreadOrgNotifications() {
        let data = {
            token: localStorage.getItem('token'),
            orgs: this.state.orgNames,
            login: localStorage.getItem('login')
        }

        fetch('/github/unread-org-events',{
            body: JSON.stringify(data),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((unreadNots) => {
            let counts = {};
            for (let i = 0; i < unreadNots.length; i++) {
                counts[unreadNots[i]] = 1 + (counts[unreadNots[i]] || 0);
            }

            for (let i = 0; i < this.state.jsonVersion.length; i++) {

                if (counts[this.state.jsonVersion[i].login]) {
                    let countNots = document.createElement('p');
                    countNots.setAttribute('title', 'Unread notifications')
                    countNots.setAttribute('class', 'count-notifications')
                    countNots.textContent = counts[this.state.jsonVersion[i].login];
                    let org = document.getElementById(this.state.jsonVersion[i].login)
                    org.appendChild(countNots);
                }
            }
        })
    }

    render() {
        return (
            <div className="Organisations">
                <h3>Choose an organization to be able to view notifications and subscribe</h3>

                {this.state.orgs}
            </div>
        );
    }
}

export default Organisations;
