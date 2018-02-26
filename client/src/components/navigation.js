import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Link,
    Route,
    Switch,
  } from 'react-router-dom';

import Login from './login';
import Home from './home';


class Navigation extends Component {
    constructor() {
        super();
        this.state = {};

    }

    componentDidMount() {
       
    }

    render() {
        
        return (
            <Router>
                
                <div className="Navigation">
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>

                    <Switch>
                        {/* <Route exact path='/login' component={() => window.location = 'https://github.com/login/oauth/authorize?client_id=3d47ed6a79c582546a56&redirect_uri=http://localhost:3000/callback'}/> */}
                        <Route exact path="/" component={Home} />
                        <Route exact path="/login" component={Login} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

export default Navigation;

