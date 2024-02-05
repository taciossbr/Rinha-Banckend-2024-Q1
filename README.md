
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
- [ ] POST /clientes/[id]/transacoes
- [ ] GET /clientes/[id]/extrato
- [ ] Validação
- [ ] Concorrência
- [ ] Testes com o Gatling

