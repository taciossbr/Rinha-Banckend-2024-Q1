const express = require('express')

const app = express()

app.get('/hello', (req, res) => {
  return res.send('hello, world');
});

module.exports = app
