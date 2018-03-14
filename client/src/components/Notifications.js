import React, { Component } from 'react';
import io from 'socket.io-client';

class Notifications extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedOrg: '',
            notifications: [],
            unreadNotifications: [],
            subscriptionList: '',
            value: ''
        }
    }

    componentWillMount() {
        if (localStorage.getItem('token') !== null) {
            this.getNotifications();
        }
    }

    componentDidMount() {
        this.setState({selectedOrg: window.location.href.substring(36, window.location.href.length)}, () => {
            this.enableNotifications();
            this.getOrgEvents();
            this.presentSubscriptionOptions();
        })
    }

    

    getOrgEvents() {
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
            let newNots = this.state.unreadNotifications.slice();
            for (let i = 0; i < data.length; i++) {
                
                newNots.push(
                    <div className="unread-notification">
                        <p>Unread</p>
                        <p>Type: {data[i].event_type}</p>
                        <p>Repo: {data[i].event_repo}</p>
                        {/* <p>{data[i].event_id}</p> */}
                    </div>
                )
            }

            this.setState({unreadNotifications: newNots})
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
        })
    }


    getNotifications() {
        let newNotifications = this.state.notifications.slice();

        this.socket = io('http://localhost:8000');

        this.socket.on('notiser', function(data){
            if (data.repository !== undefined) {
                newNotifications.push(
                    <div className="notis"> 
                        <p>New</p>
                        <p>{data.event_type}</p>
                        <p>{data.sender}</p>
                        <p>{data.repository}</p>
                        <a href={data.html_url}>Link to event</a>
                    </div>
                )
            } else {
                newNotifications.push(
                    <div className="notis"> 
                        <p>New</p>
                        <p>{data.event_type}</p>
                        <p>{data.sender}</p>
                    </div>
                )
            }
            this.setState({notifications: newNotifications});
        }.bind(this));
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubscribeClick() {
        //Skicka request till servern och skapa en hook för det valda eventet.

        let options = {
            token: localStorage.getItem('token'),
            selectedOrg: this.state.selectedOrg,
            selectedEvent: this.state.value,
            user_email: localStorage.getItem('email')
        }

        fetch('/api/subscribe-to-event',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {

        })

    }

    handleUnsubscribeClick() {
        let options = {
            token: localStorage.getItem('token'),
            selectedOrg: this.state.selectedOrg,
            selectedEvent: this.state.value
        }

        fetch('/api/unsubscribe-to-event',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {

        })
    }

    presentSubscriptionOptions() {
        let subscriptionOptions = 
            <div id='subscription-options'>
                <h3>Subscribe to event</h3>

                    <div className='input-option'>
                        <p>Issues:</p>
                        <input type="radio" name="subscription" value="issues" onChange={this.handleChange.bind(this)}/>
                    </div>
                    
                    <div className='input-option'>
                        <p>Issue_comment:</p>
                        <input type="radio" name="subscription" value="issue_comment" onChange={this.handleChange.bind(this)}/>
                    </div>

                    <div className='input-option'>
                        <p>Public:</p>
                        <input type="radio" name="subscription" value="public" onChange={this.handleChange.bind(this)}/>
                    </div>

                    <div className='input-option'>
                        <p>Repository:</p>
                        <input type="radio" name="subscription" value="repository" onChange={this.handleChange.bind(this)}/>
                    </div>

                    <button onClick={this.handleSubscribeClick.bind(this)}>Subscribe</button>
                    <button onClick={this.handleUnsubscribeClick.bind(this)}>Unsubscribe</button>
            </div>;

        this.setState({subscriptionList: subscriptionOptions});
    }

    render() {
        return (
            <div className="Notifications">
                <div>{this.state.selectedOrg}</div>
                <div>{this.state.notifications}</div>
                <div id="unread-notis">
                    {this.state.unreadNotifications}
                </div>

                <div>{this.state.subscriptionList}</div>
            </div>
        );
    }
}

export default Notifications;
