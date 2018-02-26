import React, { Component } from 'react';
import './App.css';
import Navigation from './components/navigation';

class App extends Component {
    constructor() {
        super();
        this.state = { isAuthenticated: false, user: null, token: ''};
    }

    render() {
        return (
          <div className="App">
            <Navigation />
          </div>
        );
    }
}

export default App;
