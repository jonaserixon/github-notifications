'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;


require('./config/database').initialize();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
    console.log('najja')
    res.json([
        {
            frase: "hallåj",
            id: 1
        },
        {
            frase: "tjenixen",
            id: 2
        },
        {
            frase: "hejsan",
            id: 3
        }
    ]);
})

app.listen(port, function() {
    console.log("Express started on http://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});
