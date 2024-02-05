const request = require('supertest')
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config('.env.test')
}
const app = require('./app')
const { connectDatabase, closeDatabaseConnection } = require('./db')

describe('app.js', () => {
  beforeAll(async () => {
    await connectDatabase()
  })
  afterAll(async () => {
    await closeDatabaseConnection()
  })
  it('should test', async () => {

    console.log(process.env.DATABASE_URL)
    const res = await request(app)
      .get('/hello')

    expect(res.body).toMatchObject([
      {
        "id": 1,
        "limite": "100000",
        "saldo": "0"
      },
      {
        "id": 2,
        "limite": "80000",
        "saldo": "0"
      },
      {
        "id": 3,
        "limite": "1000000",
        "saldo": "0"
      },
      {
        "id": 4,
        "limite": "10000000",
        "saldo": "0"
      },
      {
        "id": 5,
        "limite": "500000",
        "saldo": "0"
      }
    ])

  })
})