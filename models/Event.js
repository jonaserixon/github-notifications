'use strict';

let mongoose = require('mongoose');

let eventSchema = mongoose.Schema({
    event_id: {type: String},
    event_type: {type: String},
    // body: {type: String},
    createdAt: { type: Date, required: true, default: Date.now },

});

let Event = mongoose.model('event-github', eventSchema);

module.exports = Event;
