import React, { Component } from 'react';

class Home extends Component {
    constructor() {
        super();
        this.state = {
            orgs: [],
            notifications: [],
            isLoggedIn: false
        }

        
    }

    componentWillMount() {
        if (localStorage.getItem('token') !== null) {
            this.setState({isLoggedIn: true});
        }

        console.log('willmount')
    }

    render() {
        let isUserLoggedIn = 'Logged out'

        if (this.state.isLoggedIn) {
            isUserLoggedIn = 'Logged in as: ' + localStorage.getItem('login');
        }
        
        return (
          <div className="Home">
            <h2>Homepage</h2>
            <p>{isUserLoggedIn}</p>
          </div>
        );
    }
}

export default Home;
