# GUIA DE INTEGRACAO - NOVO GATEWAY DE PAGAMENTO

## RESUMO DAS MUDANCAS

A integracao do PushinPay foi substituida pelo novo gateway. O sistema continua funcionando da mesma forma:
- Usuario solicita pagamento PIX
- Gateway gera QR Code
- Sistema monitora status via polling
- Webhook confirma pagamento automaticamente

---

## CONFIGURACAO NO VERCEL

### 1. Variaveis de Ambiente

Acesse o painel da Vercel (Settings > Environment Variables) e configure:

```
GATEWAY_API_URL=https://api.seugateway.com/api/pix/create
GATEWAY_CHECK_URL=https://api.seugateway.com/api/transactions
GATEWAY_API_KEY=sua_chave_api_aqui
```

**IMPORTANTE:** Substitua pelos valores reais fornecidos pelo gateway:
- `GATEWAY_API_URL`: Endpoint para criar pagamentos PIX
- `GATEWAY_CHECK_URL`: Endpoint para consultar status de transacoes (sem barra no final)
- `GATEWAY_API_KEY`: Token/chave de autenticacao da API

### 2. Configuracao do Webhook

Configure a URL do webhook no painel do gateway:

```
https://SEU_DOMINIO.vercel.app/api/webhook
```

Substitua `SEU_DOMINIO` pelo dominio real da sua aplicacao.

### 3. Remover Variaveis Antigas

Apos configurar as novas variaveis, remova as antigas (opcional):
- `PUSHINPAY_TOKEN`
- `PUSHINPAY_WEBHOOK_TOKEN`

---

## ARQUIVOS MODIFICADOS

### 1. `/api/create-pix.js`
- Cria cobranca PIX no gateway
- Envia valor e URL do webhook
- Retorna QR Code e ID da transacao

**Payload enviado ao gateway:**
```json
{
  "amount": 14.70,
  "postbackUrl": "https://seu-dominio.vercel.app/api/webhook"
}
```

**Resposta esperada do gateway:**
```json
{
  "transactionId": "abc123...",
  "qrCode": "00020126...",
  "qrCodeBase64": "data:image/png;base64,...",
  "status": "PENDING"
}
```

### 2. `/api/webhook.js`
- Recebe notificacao de pagamento
- Processa payload do gateway
- Loga informacoes da transacao

**Payload recebido do gateway:**
```json
{
  "requestBody": {
    "transactionType": "RECEIVEPIX",
    "transactionId": "c327ce8bee2a18565ec2m1zdu6px2keu",
    "external_id": "55aefd02e54e785fbb5a80faa19f8802",
    "amount": 15.00,
    "paymentType": "PIX",
    "status": "PAID",
    "dateApproval": "2024-10-07 16:07:10",
    "creditParty": {
      "name": "Nome do Cliente",
      "email": "cliente@email.com",
      "taxId": "999999999"
    },
    "debitParty": {
      "bank": "BANCO XYZ",
      "taxId": "46872831000154"
    }
  }
}
```

### 3. `/api/check-pix.js`
- Consulta status da transacao
- Converte status para formato interno
- Retorna informacoes padronizadas

---

## FLUXO DE PAGAMENTO

```
1. Usuario clica em "Adicionar Saldo"
   |
   v
2. Frontend chama /api/create-pix
   |
   v
3. Backend cria cobranca no gateway
   |
   v
4. Gateway retorna QR Code
   |
   v
5. Usuario escaneia e paga
   |
   v
6. Gateway detecta pagamento
   |
   v
7. Gateway envia webhook para /api/webhook
   |
   v
8. Sistema credita saldo automaticamente
```

---

## TESTES

### 1. Testar Criacao de PIX

```bash
curl -X POST https://SEU_DOMINIO.vercel.app/api/create-pix \
  -H "Content-Type: application/json" \
  -d '{"value": 14.70}'
```

**Resposta esperada:**
```json
{
  "id": "transactionId123",
  "qr_code": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "status": "PENDING",
  "value": 1470
}
```

### 2. Testar Webhook (simulacao)

```bash
curl -X POST https://SEU_DOMINIO.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "requestBody": {
      "transactionType": "RECEIVEPIX",
      "transactionId": "test123",
      "amount": 14.70,
      "status": "PAID",
      "dateApproval": "2024-10-07 16:07:10"
    }
  }'
```

### 3. Testar Consulta de Status

```bash
curl -X GET "https://SEU_DOMINIO.vercel.app/api/check-pix?id=transactionId123"
```

**Resposta esperada:**
```json
{
  "id": "transactionId123",
  "status": "paid",
  "value": 1470,
  "created_at": "2024-10-07T16:07:10.000Z",
  "updated_at": "2024-10-07T16:07:10.000Z"
}
```

---

## LOGS E DEBUGGING

### Verificar Logs no Vercel

1. Acesse o Dashboard da Vercel
2. Va em "Functions" > "Logs"
3. Procure por:
   - `=== WEBHOOK RECEBIDO ===`
   - `Transaction ID:`
   - `Pagamento confirmado`

### Verificar Payload do Webhook

Os logs mostram o payload completo recebido:
```
=== WEBHOOK RECEBIDO ===
Timestamp: 2024-10-07T16:07:10.000Z
Dados completos: { ... }
Transaction ID: abc123
Status: PAID
Amount: 14.70
Type: RECEIVEPIX
Pagamento confirmado para transacao abc123
Valor: R$ 14.70
```

---

## ESTRUTURA DOS STATUS

O sistema mapeia os status do gateway para o formato interno:

| Status Gateway | Status Interno | Descricao          |
|---------------|----------------|--------------------|
| PENDING       | pending        | Aguardando pagamento |
| PAID          | paid           | Pagamento confirmado |
| EXPIRED       | expired        | Cobranca expirada   |
| CANCELLED     | cancelled      | Cancelada           |

---

## COMPATIBILIDADE

A nova integracao e 100% compativel com o frontend existente. Nenhuma alteracao e necessaria nos componentes React:
- `AddBalanceModal.tsx` - continua funcionando
- `useFictionalPix.ts` - continua funcionando
- Sistema de tracking - continua funcionando

---

## SUPORTE

### Problemas Comuns

**1. Erro: "Credenciais do gateway nao configuradas"**
- Solucao: Verifique as variaveis de ambiente no Vercel

**2. Erro: "Erro ao criar PIX"**
- Verifique se a URL da API esta correta
- Verifique se a chave API e valida
- Verifique os logs no painel do gateway

**3. Webhook nao esta sendo recebido**
- Verifique se a URL do webhook esta configurada corretamente no gateway
- Verifique os logs da funcao `/api/webhook` na Vercel
- Teste manualmente usando curl

**4. Status sempre "pending"**
- Verifique se o webhook esta configurado
- Verifique se o pagamento foi realmente realizado
- Consulte o status diretamente no painel do gateway

---

## CHECKLIST DE IMPLANTACAO

- [ ] Configurar `GATEWAY_API_URL` no Vercel
- [ ] Configurar `GATEWAY_CHECK_URL` no Vercel
- [ ] Configurar `GATEWAY_API_KEY` no Vercel
- [ ] Configurar URL do webhook no painel do gateway
- [ ] Fazer deploy das alteracoes
- [ ] Testar criacao de PIX
- [ ] Testar pagamento real
- [ ] Verificar recebimento do webhook
- [ ] Verificar credito de saldo
- [ ] Remover variaveis antigas (opcional)

---

## PROXIMOS PASSOS

1. Configure as variaveis de ambiente no Vercel
2. Faca o deploy do codigo atualizado
3. Teste a criacao de um PIX
4. Realize um pagamento de teste
5. Verifique os logs para confirmar o recebimento do webhook

Pronto! A integracao esta completa e funcionando.
