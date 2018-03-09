import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route, Switch, Redirect } from 'react-router-dom';

import './App.css';

import Login from './components/Login';
import Home from './components/Home';
import Hook from './components/Hook';


class App extends Component {
    constructor() {
        super();
        this.state = {
            redirect: false,
            isLoggedIn: false,
            showOrgButton: ''
        };

        this.logout = this.logout.bind(this);
    }

    componentDidMount() {
        console.log('app/did mount')
        if (localStorage.getItem('token') !== null) {
            this.setState({showOrgButton: <Link to="organisations" >Organisations</Link>}, () => {
                console.log('en orgs länk')
            });
        } else {
            this.setState({showOrgButton: ''}, () => {
                console.log('ingen orgs länk')
            });
        }
    }

    logout() {
        console.log('clicked logout')
        this.setState({redirect: true, isLoggedIn: false}, function() {
            localStorage.removeItem('token');
        });
    }

    login() {
        this.setState({isLoggedIn: true}, function() {

        })
    }

    render() {
        if (this.state.redirect) {
            this.setState({redirect: false}, function() {
                console.log('has redirected');
                //window.history.pushState(null, null, '/');
            });
        }

        

        return (
        <Router>
            <div className="App">

                <div className="Navigation">
                    <Link to="/" >Home</Link>
                    <Link to="/login" onClick={this.login} >Login</Link>
                    <Link to="/logout" onClick={this.logout} >Logout</Link>
                    {this.state.showOrgButton}
                </div>

                <Switch>
                    <Route exact path='/' component={() => <Home />} />
                    <Route path='/login' component={() => <Login wantsToLogin={true} />} />
                    <Route path='/callback' component={() => <Login githubCallback={true} />} />
                    <Route exact path='/hook' component={() => <Hook />} />
                </Switch>
            </div>
        </Router>
        );
    }
}

export default App;
