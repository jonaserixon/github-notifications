import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route, Switch, Redirect } from 'react-router-dom';

import './App.css';

import Login from './components/Login';
import HomePage from './components/HomePage';
import Hook from './components/Hook';
import Organisations from './components/Organisations';

import Notifications from './components/Notifications';


class App extends Component {
    constructor() {
        super();
        this.state = {
            redirect: false,
            isLoggedIn: false,
        };
    }

    componentDidMount() {
        
    }

    logout() {
        this.setState({redirect: true, isLoggedIn: false}, () => {
            this.updateUserLastActive();
            localStorage.clear();
        });
    }

    login() {
        this.setState({isLoggedIn: true})
    }

    updateUserLastActive() {
        let options = {
            login: localStorage.getItem('login')
        }
        fetch('/api/update-user-last-active',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
    }

    render() {
        if (this.state.redirect) {
            this.setState({redirect: false}, () => {
                
            });
        }

        return (
        <Router>
            <div className="App">

                <div className="Navigation">
                    <Link to="/" >Home</Link>
                    <Link to="/login" onClick={this.login} >Login</Link>
                    <Link to="#" onClick={this.logout.bind(this)} >Logout</Link>
                    <Link to="/organisations" >Organisations</Link>
                </div>

                <Switch>
                    <Route exact path='/' component={() => <HomePage />} />
                    <Route path='/login' component={() => <Login wantsToLogin={true} />} />
                    <Route path='/callback' component={() => <Login githubCallback={true} />} />
                    <Route exact path='/hook' component={() => <Hook />} />
                    <Route exact path='/organisations' component={() => <Organisations />} />

                    <Route path='/organisations/:org' component={() => <Notifications />} />
                </Switch>
            </div>
        </Router>
        );
    }
}

export default App;
