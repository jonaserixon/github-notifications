import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Link,
    Route,
    Switch,
} from 'react-router-dom';

import LoginControl from './loginControl';
import Home from './home';
import AuthorizeUser from './authorizeUser';

class Navigation extends Component {
    constructor() {
        super();
        this.state = {

        }

    }

    componentDidMount() {
    }

    render() {
        return (
            <Router>
                <div className="Navigation">
                    <Link to="/" >Home</Link>
                    <Link to="/login" >Login</Link>

                    <Switch>
                        <Route exact path='/' component={() => <Home />} />
                        <Route path='/login' component={() => <LoginControl />} />
                        <Route path='/callback' component={() => <AuthorizeUser />} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

export default Navigation;

