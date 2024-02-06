const express = require('express')
const { dbClient } = require('./db')

const app = express()

app.use(express.json())

// TODO remover
app.get('/hello', async (req, res) => {
  const data = await dbClient.query('SELECT * FROM clientes')
  return res.json(data.rows)
})

app.post('/clientes/:clientId/transacoes', async (req, res) => {
  const { clientId } = req.params
  const data = req.body
  // console.log(data)
  try {
    await dbClient.query('BEGIN')

    // const clientrResult = await dbClient.query(
    //   'SELECT * FROM clientes WHERE id = $1',
    //   [clientId])
    // const cliente = clientrResult.rows[0]

    let result;
    if (data.tipo === 'c') {
      result = await dbClient.query(`
      UPDATE clientes
      SET saldo = saldo + $1
      WHERE id = $2
      RETURNING saldo, limite
    `, [data.valor, clientId])
    } else if (data.tipo === 'd') {
      result = await dbClient.query(`
      UPDATE clientes
      SET saldo = saldo - $1
      WHERE id = $2
      RETURNING saldo, limite
    `, [data.valor, clientId])
    }
    // TODO sem um elsse isso pode quebrar


    if (result.rowCount === 0) {
      await dbClient.query('ROLLBACK')
      return res.status(404).json({ error: 'nao encontrado' })
    }

    const { saldo, limite } = result.rows[0]
    if (saldo < -limite) {
      await dbClient.query('ROLLBACK')
      return res.status(422).json({ error: 'saldo insuficiente' })
    }

    await dbClient.query(`
      INSERT INTO transacoes
      (valor, tipo, descricao, cliente_id)
      VALUES
      ($1, $2, $3, $4)
    `, [data.valor, data.tipo, data.descricao, clientId])

    // TODO validar rouCount ?
    await dbClient.query('COMMIT')

    return res.json({
      saldo, limite
    })
  } catch (err) {
    console.error(err)
    await dbClient.query('ROLLBACK')
    return res.status(500).json({ error: 'internal server error' })
  }

})

app.get('/clientes/:clienteId/extrato', async (req, res) => {
  try {
    const { clienteId } = req.params

    // TODO confirmar esse isolation level
    await dbClient.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ')

    const saldoResult = await dbClient.query(
      'SELECT limite, saldo AS total, NOW() as data_extrato FROM clientes WHERE id = $1 FOR SHARE',
      [clienteId])
    if (saldoResult.rowCount === 0) {
      await dbClient.query('END TRANSACTION')
      return res.status(404).json({ error: 'nao encontrado' })
    }
    const saldo = saldoResult.rows[0]

    const transacoesResult = await dbClient.query(`
      SELECT valor, tipo, descricao, realizada_em FROM transacoes
      WHERE cliente_id = $1
      ORDER BY realizada_em DESC
      LIMIT 10`, [clienteId])
    const ultimas_transacoes = transacoesResult.rows

    await dbClient.query('END TRANSACTION')
    return res.json({
      saldo, ultimas_transacoes
    })
  } catch (err) {
    console.error(err)
    await dbClient.query('END TRANSACTION')
    return res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = app


// TODO ver esse tal de union all no sql