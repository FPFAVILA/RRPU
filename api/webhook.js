const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const webhookData = req.body;
    const requestBody = webhookData.requestBody || webhookData;

    console.log('=== WEBHOOK RECEBIDO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Dados completos:', JSON.stringify(webhookData, null, 2));
    console.log('========================');

    const transactionId = requestBody.transactionId || requestBody.id;
    const status = requestBody.status;
    const amount = requestBody.amount;
    const transactionType = requestBody.transactionType;

    console.log('Transaction ID:', transactionId);
    console.log('Status:', status);
    console.log('Amount:', amount);
    console.log('Type:', transactionType);

    if (status === 'PAID' && transactionType === 'RECEIVEPIX') {
      console.log(`✓ Pagamento confirmado para transação ${transactionId}`);
      console.log(`✓ Valor: R$ ${amount}`);

      if (requestBody.creditParty) {
        console.log('Credor:', requestBody.creditParty.name);
        console.log('Email:', requestBody.creditParty.email);
      }

      if (requestBody.dateApproval) {
        console.log('Data de aprovação:', requestBody.dateApproval);
      }
    }

    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', 'application/json')
      .json({
        success: true,
        message: 'Webhook processado com sucesso',
        received_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({
        success: true,
        message: 'Webhook recebido'
      });
  }
}
