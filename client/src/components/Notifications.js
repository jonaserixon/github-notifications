import React, { Component } from 'react';
import io from 'socket.io-client';

class Notifications extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedOrg: '',
            notifications: []
        }

    }

    componentWillMount() {
        if (localStorage.getItem('token') !== null) {
            this.getNotifications();
            
        }
    }

    componentDidMount() {
        this.setState({selectedOrg: window.location.href.substring(36, window.location.href.length)}, () => {
            console.log(this.state.selectedOrg)
            this.enableNotifications();
            this.getOrgEvents();
        })
    }

    

    getOrgEvents() {
        ///api/github/org-events

        let options = {
            token: localStorage.getItem('token'),
            selectedOrg: this.state.selectedOrg,
            login: localStorage.getItem('login')
        }

        fetch('/api/github/org-events',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            //console.log(data)
        })
    }

    enableNotifications() {
        //Skicka en request och ange den selectade organisationen för att antingen skapa en hook för den eller kolla om det redan finns en hook för den.

        //Skriv ut alla events från repots historik. presentera dom som "older" notifications.

        let options = {
            token: localStorage.getItem('token'),
            selectedOrg: this.state.selectedOrg
        }

        fetch('/api/github/handlehook',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            console.log('enablenots(): ' + data)
        })
    }

    getNotifications() {
        console.log(this.state.notifications);
        let newNotifications = this.state.notifications.slice();

        this.socket = io('http://localhost:8000');

        this.socket.on('notiser', function(data){
            console.log(data.data)

            // newNotifications.push(
            //     <div className="notis"> 
            //         <p>{data.data.action}</p>
            //         <p>{data.data.issue.title}</p>
            //         <p>{data.data.issue.body}</p>
            //         <p>{data.data.sender.login}</p>
            //     </div>
            // )

            this.setState({notifications: newNotifications});
        }.bind(this));
    }

    render() {
        return (
            <div className="Notifications">
                <div>{this.state.selectedOrg}</div>
                <div>{this.state.notifications}</div>
            </div>
        );
    }
}

export default Notifications;
