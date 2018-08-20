import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';

import './App.css';

import Login from './components/Login';
import HomePage from './components/HomePage';
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

    componentDidUpdate() {
        console.log('will update fdfsfdsfdsf')
        if (localStorage.getItem('token')) {
            this.setState({isLoggedIn: true})
        }
    }

    logout() {
        localStorage.clear();
        this.setState({isLoggedIn: false})
    }

    login() {
        //click login button
    }

    render() {
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
                        <Route exact path='/organisations' component={() => <Organisations />} />
                        <Route path='/organisations/:org' component={() => <Notifications />} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

export default App;
