const express = require('express')
const { dbClient } = require('./db')

const app = express()

app.get('/hello', async (req, res) => {
  const data = await dbClient.query('SELECT * FROM clientes')
  return res.json(data.rows)
})

module.exports = app
