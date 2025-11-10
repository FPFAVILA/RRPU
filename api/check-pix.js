import fetch from 'node-fetch';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400)
        .setHeader('Access-Control-Allow-Origin', '*')
        .json({ error: 'ID da transação não fornecido' });
    }

    const checkUrl = process.env.GATEWAY_CHECK_URL;
    const apiKey = process.env.GATEWAY_API_KEY;

    if (!checkUrl || !apiKey) {
      return res.status(500)
        .setHeader('Access-Control-Allow-Origin', '*')
        .json({ error: 'Credenciais do gateway não configuradas' });
    }

    const response = await fetch(`${checkUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao consultar PIX:', errorData);
      return res.status(response.status)
        .setHeader('Access-Control-Allow-Origin', '*')
        .json({ error: `Erro ao consultar transação: ${response.statusText}` });
    }

    const data = await response.json();
    const requestBody = data.requestBody || data;

    const status = requestBody.status === 'PAID' ? 'paid' : requestBody.status?.toLowerCase() || 'pending';
    const amount = requestBody.amount || 0;

    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', 'application/json')
      .json({
        id: requestBody.transactionId || requestBody.id || id,
        status: status,
        value: Math.round(amount * 100),
        created_at: requestBody.dateApproval || new Date().toISOString(),
        updated_at: requestBody.dateApproval || new Date().toISOString(),
      });

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ error: 'Erro interno ao consultar PIX' });
  }
}
