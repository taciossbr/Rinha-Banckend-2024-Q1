const request = require('supertest')
const app = require('./app')

describe('app.js', () => {
  it('should test', async () => {
    const res = await request(app)
      .get('/hello')

    expect(res.text).toBe('hello, world')

  })
})