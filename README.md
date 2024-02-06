
## Run

Testes:
```
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d

npm test
```

Dev:
```
docker compose up -d

npm run start:dev
```

## TO-DO


- [x] Setup Banco + Seeds
- [x] POST /clientes/[id]/transacoes
    - 422 se saldo insuficiente
    - 200 caso certo
    - 404 se not found
- [x] GET /clientes/[id]/extrato
    - 404 se not found
    - ultimos 10 transacoes (descrescente)
    - head da conta
    - salvar a transacao
- [ ] Validação
- [ ] Concorrência
- [ ] Testes com o Gatling
- [x] Arquitetura Docker
- [ ] Indices
- [ ] Testes finais com as mesmas versoes do repo, docker e gatling
- [ ] Estudar Gatling
