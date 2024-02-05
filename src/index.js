if (process.env.NODE_ENV != 'prod') {
  require('dotenv').config()
}

const { connectDatabase } = require('./db');

(async () => {
  await connectDatabase();
  const app = require('./app')

  app.listen(9999, () => {
    console.log('Listening')
  })
})()
