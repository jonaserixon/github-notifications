import React, { Component } from 'react';

class Home extends Component {
    constructor() {
        super();
        this.state = {
            orgs: [],
            isLoggedIn: false
        }
    }

    componentWillMount() {
        if (localStorage.getItem('token') !== null) {
            this.setState({isLoggedIn: true});
            this.getOrgs();
        }

        console.log('willmount')
    }

    // componentWillUpdate() {
    //     if (localStorage.getItem('token') === null) {

    //     }
    // }

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

            if (this.state.isLoggedIn) {
                const renObjData = jsonOrgs.map(function(data, idx) {
                    return <p key={idx}>{data}</p>;
                });
        
                if (renObjData[0] != null) {
                    for (let i = 0; i < renObjData.length; i++) {
                        newOrgs.push(<div className="org"> <a href="#"><p>{renObjData[i].props.children.login}</p> <img src={renObjData[i].props.children.avatar_url} /></a> </div>);
                    }
                }

                this.setState({orgs: newOrgs});
            }
        }.bind(this))
    }

    render() {
        let isUserLoggedIn = 'Logged out'

        if (this.state.isLoggedIn) {
            isUserLoggedIn = 'Logged in as: ' //usernamn från github
        }
        
        return (
          <div className="Home">
            <h2>Homepage</h2>
            <p>{isUserLoggedIn}</p>
            <div className="Organisations">
                {this.state.orgs}
            </div>
          </div>
        );
    }
}

export default Home;
