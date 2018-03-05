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

    componentWillUpdate() {
        console.log('componentwillupdate');

        if (localStorage.getItem('token') === null) {

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
            this.setState({orgs: jsonOrgs})
        }.bind(this))
    }

    render() {
        let orgz = []

        if (this.state.isLoggedIn) {
            const renObjData = this.state.orgs.map(function(data, idx) {
                return <p key={idx}>{data}</p>;
            });
    
            if (renObjData[0] != null) {
                for (let i = 0; i < renObjData.length; i++) {
                    orgz.push(<p>{renObjData[i].props.children.login}</p>);
                    orgz.push(<img src={renObjData[i].props.children.avatar_url} />);
                }
            }
        }
        
        return (
          <div className="Home">
            <h2>Homepage</h2>
            <div className="Organisations">
                {orgz}
            </div>
            
          </div>
        );
    }
}

export default Home;
