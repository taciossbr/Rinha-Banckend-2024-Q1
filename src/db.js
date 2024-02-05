
const { Client } = require('pg')

const dbClient = new Client(process.env.DATABASE_URL)

async function connectDatabase() {
  await dbClient.connect()
}

async function closeDatabaseConnection() {
  await dbClient.end()
}

module.exports = {
  connectDatabase,
  dbClient,
  closeDatabaseConnection,
}