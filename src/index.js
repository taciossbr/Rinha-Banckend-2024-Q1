if (process.env.NODE_ENV != 'prod') {
  require('dotenv').config()
}

const { connectDatabase } = require('./db');

(async () => {
  await connectDatabase();
  const app = require('./app')

  const PORT = process.env.PORT || 8080
  app.listen(PORT, () => {
    console.log('Listening on ', PORT)
  })
})()
