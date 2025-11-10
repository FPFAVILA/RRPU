import fetch from 'node-fetch';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { value } = req.body;

    if (!value || typeof value !== 'number' || value <= 0) {
      return res.status(400)
        .setHeader('Access-Control-Allow-Origin', '*')
        .json({ error: 'Valor inválido. Informe um número maior que zero.' });
    }

    const apiUrl = process.env.GATEWAY_API_URL;
    const apiKey = process.env.GATEWAY_API_KEY;

    if (!apiUrl || !apiKey) {
      return res.status(500)
        .setHeader('Access-Control-Allow-Origin', '*')
        .json({ error: 'Credenciais do gateway não configuradas' });
    }

    const webhookUrl = `${req.headers.origin || 'https://' + req.headers.host}/api/webhook`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: value,
        postbackUrl: webhookUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro Gateway:', errorData);
      return res.status(response.status)
        .setHeader('Access-Control-Allow-Origin', '*')
        .json({ error: `Erro ao criar PIX: ${response.statusText}` });
    }

    const data = await response.json();

    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', 'application/json')
      .json({
        id: data.transactionId || data.id,
        qr_code: data.qrCode || data.qr_code || data.pixCode,
        qr_code_base64: data.qrCodeBase64 || data.qr_code_base64,
        status: data.status || 'PENDING',
        value: Math.round(value * 100),
      });

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ error: 'Erro interno ao criar PIX' });
  }
}
