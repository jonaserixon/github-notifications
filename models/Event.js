'use strict';

let mongoose = require('mongoose');

let eventSchema = mongoose.Schema({
    event_type: String,
    org: String,
    created_at: Date,
    url: String,
    read_by: Array
});

let GithubEvent = mongoose.model('github-event', eventSchema);

module.exports = GithubEvent;
