import React, { Component } from 'react';

class Notifications extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedOrg: ''
        }
    }

    componentDidMount() {
        this.setState({selectedOrg: window.location.href.substring(36, window.location.href.length)}, () => {
            console.log(this.state.selectedOrg)
        })
    }

    getNotifications() {
        //Skicka en request och ange den selectade organisationen för att antingen skapa en hook för den eller kolla om det redan finns en hook för den.
    }

    render() {
        
        return (
            <div className="Notifications">
                {this.state.selectedOrg}
            </div>
        );
    }
}

export default Notifications;
