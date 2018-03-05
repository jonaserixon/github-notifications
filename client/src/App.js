import React, { Component } from 'react';
import './App.css';
import Navigation from './components/navigation';

class App extends Component {
    constructor() {
        super();
        this.state = {};
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
