const request = require('supertest')
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config('.env.test')
}
const app = require('./app')
const { connectDatabase, closeDatabaseConnection, dbClient } = require('./db')

describe('app.js', () => {
  beforeAll(async () => {
    await connectDatabase()
  })
  afterAll(async () => {
    await closeDatabaseConnection()
  })

  beforeEach(async () => {
    await dbClient.query('TRUNCATE transacoes')
    await dbClient.query('DELETE FROM clientes')
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('1', '100000', '0'),
      ('2', '80000', '0'),
      ('3', '1000000', '0'),
      ('4', '10000000', '0'),
      ('5', '500000', '0')`)
  })


  it('should test', async () => {

    console.log(process.env.DATABASE_URL)
    const res = await request(app)
      .get('/hello')

    expect(res.body).toMatchObject([
      {
        "id": 1,
        "limite": 100000,
        "saldo": 0
      },
      {
        "id": 2,
        "limite": 80000,
        "saldo": 0
      },
      {
        "id": 3,
        "limite": 1000000,
        "saldo": 0
      },
      {
        "id": 4,
        "limite": 10000000,
        "saldo": 0
      },
      {
        "id": 5,
        "limite": 500000,
        "saldo": 0
      }
    ])
  })

  it('should add credit', async () => {
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('78', '100000', '10')`)

    const res = await request(app)
      .post('/clientes/78/transacoes')
      .send({
        valor: 1000,
        tipo: "c",
        descricao: "descricao"
      })
      .expect(200)

    expect(res.body).toMatchObject({
      limite: 100000,
      saldo: 1010,
    })
  })
  it('should add debit', async () => {
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('78', '100000', '1000')`)

    const res = await request(app)
      .post('/clientes/78/transacoes')
      .send({
        valor: 10,
        tipo: "d",
        descricao: "descricao"
      })
      .expect(200)

    expect(res.body).toMatchObject({
      limite: 100000,
      saldo: 990,
    })
  })
  it('shouldnt allow debit beyond limit', async () => {
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('78', '1000', '0')`)

    const res = await request(app)
      .post('/clientes/78/transacoes')
      .send({
        valor: 1001,
        tipo: "d",
        descricao: "descricao"
      })
      .expect(422)

    expect(res.body).toMatchObject({
      error: 'saldo insuficiente'
    })
  })
  it('should 404 when not found', async () => {
    const res = await request(app)
      .post('/clientes/567/transacoes')
      .send({
        valor: 1001,
        tipo: "d",
        descricao: "descricao"
      })
      .expect(404)

    expect(res.body).toMatchObject({
      error: 'nao encontrado'
    })
  })
  it('should add transaction to extract', async () => {
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('78', '1000000', '98700')`)
    await request(app)
      .post('/clientes/78/transacoes')
      .send({
        valor: 10,
        tipo: "d",
        descricao: "descricao"
      })
      .expect(200)

    const res = await request(app)
      .get('/clientes/78/extrato')
      .expect(200)

    expect(res.body.ultimas_transacoes).toHaveLength(1)
    expect(res.body.ultimas_transacoes).toMatchObject([
      {
        valor: 10,
        tipo: "d",
        descricao: "descricao",
        // realizada_em: '2024-01-18T00:00:00.000Z',
      },
    ])
  })


  it('should return the extract', async () => {
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('78', '1000000', '98700')`)
    await dbClient.query(`
      INSERT INTO transacoes
      (valor, tipo, descricao, cliente_id, realizada_em)
      VALUES
      ('1050', 'd', '13th tr', '78', '2024-01-17T00:00:00.000Z'),
      ('1000', 'c', '12th tr', '78', '2024-01-18T00:00:00.000Z')`)

    const res = await request(app)
      .get('/clientes/78/extrato')
      .expect(200)

    expect(res.body.saldo).toMatchObject({
      total: 98700,
      data_extrato: expect.any(String),
      limite: 1000000
    })
    expect(res.body.ultimas_transacoes).toHaveLength(2)
    expect(res.body.ultimas_transacoes).toMatchObject([
      {
        valor: 1000,
        tipo: "c",
        descricao: "12th tr",
        // realizada_em: '2024-01-18T00:00:00.000Z',
      },
      {
        valor: 1050,
        tipo: "d",
        descricao: "13th tr",
        // realizada_em: '2024-01-17T00:00:00.000Z',
      },
    ])
  })
  it('should return the only the last 10 transactions', async () => {
    await dbClient.query(`
      INSERT INTO clientes VALUES
      ('78', '1000000', '98700')`)
    await dbClient.query(`
      INSERT INTO transacoes
      (valor, tipo, descricao, cliente_id, realizada_em)
      VALUES
      ('1050', 'c', '13th tr', '78', '2024-01-17T00:00:00.000Z'),
      ('1000', 'c', '12th tr', '78', '2024-01-16T00:00:00.000Z'),
      ('10000', 'd', '11th tr', '78', '2024-01-15T00:00:00.000Z'),
      ('1600', 'c', '10th tr', '78', '2024-01-14T00:00:00.000Z'),
      ('1000', 'c', '9th tr', '78', '2024-01-13T00:00:00.000Z'),
      ('1000', 'd', '8th tr', '78', '2024-01-12T00:00:00.000Z'),
      ('1000', 'c', '7th tr', '78', '2024-01-11T00:00:00.000Z'),
      ('1000', 'c', '6th tr', '78', '2024-01-10T00:00:00.000Z'),
      ('1080', 'c', '5th tr', '78', '2024-01-09T00:00:00.000Z'),
      ('10000', 'd', '4th tr', '78', '2024-01-08T00:00:00.000Z'),
      ('1000', 'c', '3th tr', '78', '2024-01-07T00:00:00.000Z'),
      ('1000', 'c', '2cn tr', '78', '2024-01-06T00:00:00.000Z'),
      ('1000', 'd', '1st tr', '78', '2024-01-05T00:00:00.000Z')`)
    // await dbClient.query(`
    //   INSERT INTO transacoes
    //   (valor, tipo, descricao, cliente_id, realizada_em)
    //   VALUES
    //   ('1050', 'd', '13th tr', '78', '2024-01-17T00:00:00.000Z'),
    //   ('1000', 'c', '12th tr', '78', '2024-01-18T00:00:00.000Z')`)

    const res = await request(app)
      .get('/clientes/78/extrato')
      .expect(200)

    expect(res.body.ultimas_transacoes).toHaveLength(10)
    const descricoes = res.body.ultimas_transacoes.map(e => e.descricao)
    expect(descricoes).not.toContain('3th tr')
    expect(descricoes).not.toContain('2cn tr')
    expect(descricoes).not.toContain('1st tr')
  })
  it('should return the only the last 10 transactions', async () => {
    const res = await request(app)
      .get('/clientes/78/extrato')
      .expect(404)
  })
  
})


// await dbClient.query(`
// INSERT INTO transacoes
// (valor, tipo, descricao, cliente_id)
// VALUES
// ('1050', 'c', '13th tr', '78'),
// ('1000', 'c', '12th tr', '78'),
// ('10000', 'd', '11th tr', '78'),
// ('1600', 'c', '10th tr', '78'),
// ('1000', 'c', '9th tr', '78'),
// ('1000', 'd', '8th tr', '78'),
// ('1000', 'c', '7th tr', '78'),
// ('1000', 'c', '6th tr', '78'),
// ('1080', 'c', '5th tr', '78'),
// ('10000', 'd', '4th tr', '78'),
// ('1000', 'c', '3th tr', '78'),
// ('1000', 'c', '2cn tr', '78'),
// ('1000', 'd', '1st tr', '78')`)