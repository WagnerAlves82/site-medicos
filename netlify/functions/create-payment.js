// netlify/functions/create-payment.js
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔥 Function create-payment foi chamada!');
  console.log('Method:', event.httpMethod);
  
  // Aceitar apenas POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Configurar Mercado Pago (SDK v2)
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN 
    });
    const preference = new Preference(client);

    // Parse dos dados enviados do frontend
    const { amount, name, email, language = 'pt' } = JSON.parse(event.body);

    console.log('Dados recebidos:', { amount, name, email, language });

    // Validações básicas
    if (!amount || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados incompletos' })
      };
    }

    // Criar preferência de pagamento no Mercado Pago
    const externalReference = `donation_${Date.now()}`;
    
    const preferenceData = {
    items: [
        {
        title: 'Doação - Médicos por Israel',
        unit_price: parseFloat(amount),
        quantity: 1,
        currency_id: 'BRL'
        }
    ],
    payer: {
        name: name,
        email: email
    },
    back_urls: {
    success: `${process.env.SITE_URL}/obrigado.html`,
    failure: `${process.env.SITE_URL}/erro.html`,
    pending: `${process.env.SITE_URL}/pendente.html`
    },
    notification_url: `${process.env.SITE_URL}/.netlify/functions/webhook`,
    statement_descriptor: 'MEDICOS-ISRAEL',
    external_reference: externalReference
};

    console.log('Criando preferência no MP...');

    // Criar preferência no MP
    const response = await preference.create({ body: preferenceData });

    console.log('Preferência criada com sucesso:', response.id);

    // Conectar ao Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Salvar doação no banco de dados
    const { data, error } = await supabase
      .from('donations')
      .insert([
        {
          name: name,
          email: email,
          amount: parseFloat(amount),
          payment_id: response.id,
          external_reference: externalReference,
          status: 'pending',
          language: language,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
    } else {
      console.log('Doação salva no Supabase:', data);
    }

    // Retornar link de pagamento para o frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        init_point: response.init_point,
        preference_id: response.id
      })
    };

  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        details: error.message 
      })
    };
  }
};