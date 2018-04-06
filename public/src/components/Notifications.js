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
            value: '',
            org_avatar: '',
            subscription_flash: ''
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
            this.getSelectedOrgInfo();
        })
    }

    getSelectedOrgInfo() {
        let options = {
            token: localStorage.getItem('token'),
            selectedOrg: this.state.selectedOrg,
        }

        fetch('/selected-org',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            let json = JSON.parse(data);
            let orgAvatar = [<a href={json.html_url}>{this.state.selectedOrg}</a>, <img src={json.avatar_url} alt="profile of org" />]
            this.setState({org_avatar: orgAvatar})
        })
    }
    
    getOrgEvents() {
        let options = {
            token: localStorage.getItem('token'),
            selectedOrg: this.state.selectedOrg,
            login: localStorage.getItem('login')
        }

        fetch('/github/org-events',{
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

        fetch('/github/handlehook',{
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
        this.socket.emit('user-room', localStorage.getItem('login'))

        this.socket.on('user-room', (data) => {
            console.log(data);
            if (data.repository !== undefined) {
                newNotifications.push(
                    <div className="notis"> 
                        <img src={data.sender_avatar}/>
                        <p>New {data.event_type} from {data.sender} in {data.repository}</p>
                        <a href={data.html_url}>{data.html_url}</a>
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
        })
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubscribeClick() {
        if (!this.state.value.length) {
            return this.setState({subscription_flash: <p>You did not select any event!</p>});
        }

        let options = {
            username: localStorage.getItem('login'),
            selectedOrg: this.state.selectedOrg,
            selectedEvent: this.state.value,
        }

        fetch('/subscribe-to-event',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({subscription_flash: <p>You subscribed to {data.selectedEvent} in {data.selectedOrg}!</p>})
        })
        
    }

    handleUnsubscribeClick() {
        if (!this.state.value.length) {
            return this.setState({subscription_flash: <p>You did not select any event!</p>});
        }

        let options = {
            username: localStorage.getItem('login'),
            selectedOrg: this.state.selectedOrg,
            selectedEvent: this.state.value
        }

        fetch('/unsubscribe-to-event',{
            body: JSON.stringify(options),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({subscription_flash: <p>You unsubscribed from {data.selectedEvent} in {data.selectedOrg}!</p>})
        })
    }

    presentSubscriptionOptions() {
        let subscriptionOptions = 
            <div id='subscription-options'>
                <h3>Event Subscription</h3>

                    <div className='input-option'>
                    <label>
                        <input type="radio" name="subscription" value="issues" onChange={this.handleChange.bind(this)}/>
                        issues
                    </label>
                    </div>
                    
                    <div className='input-option'>
                        <label>
                            <input type="radio" name="subscription" value="issue_comment" onChange={this.handleChange.bind(this)}/>
                            issue_comment
                        </label>
                    </div>

                    <div className='input-option'>
                        <label>
                            <input type="radio" name="subscription" value="public" onChange={this.handleChange.bind(this)}/>
                            Public
                        </label>
                    </div>

                    <div className='input-option'>
                    <label>
                        <input type="radio" name="subscription" value="repository" onChange={this.handleChange.bind(this)}/>
                        repository
                    </label>
                    </div>

                    <button onClick={this.handleSubscribeClick.bind(this)}>Subscribe</button>
                    <button onClick={this.handleUnsubscribeClick.bind(this)}>Unsubscribe</button>
            </div>;

        this.setState({subscriptionList: subscriptionOptions});
    }

    render() {
        return (
            <div className="Notifications">
                <div className="org">{this.state.org_avatar}</div>

                <div id="notification-container">
                <p>Notification Flow</p>
                    <div>{this.state.notifications}</div>
                    <div id="unread-notis">{this.state.unreadNotifications}</div>
                </div>
                
                <div>{this.state.subscriptionList}</div>
                <div>{this.state.subscription_flash}</div>
            </div>
        );
    }
}

export default Notifications;
