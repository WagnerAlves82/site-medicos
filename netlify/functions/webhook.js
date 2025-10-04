// netlify/functions/webhook.js
const mercadopago = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Aceitar apenas POST (webhooks do MP)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Configurar Mercado Pago
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKENs
    });

    // Parse da notificação do Mercado Pago
    const notification = JSON.parse(event.body);
    
    console.log('Webhook recebido:', notification);

    // Verificar se é notificação de pagamento
    if (notification.type === 'payment') {
      const paymentId = notification.data.id;

      // Buscar informações completas do pagamento
      const payment = await mercadopago.payment.findById(paymentId);
      
      console.log('Detalhes do pagamento:', payment.body);

      // Conectar ao Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
      );

      // Atualizar status da doação no banco
      const { data, error } = await supabase
        .from('donations')
        .update({
          status: payment.body.status, // approved, rejected, pending, etc.
          mp_payment_id: paymentId,
          payment_method: payment.body.payment_method_id,
          transaction_amount: payment.body.transaction_amount,
          updated_at: new Date().toISOString()
        })
        .eq('external_reference', payment.body.external_reference)
        .select();

      if (error) {
        console.error('Erro ao atualizar Supabase:', error);
      } else {
        console.log('Doação atualizada com sucesso:', data);
      }

      // Aqui você pode adicionar lógica adicional:
      // - Enviar email de confirmação se status = approved
      // - Enviar email de falha se status = rejected
      // - Atualizar dashboard de doações, etc.

      if (payment.body.status === 'approved') {
        console.log(`✅ Doação aprovada: R$ ${payment.body.transaction_amount}`);
        // TODO: Enviar email de agradecimento
      }
    }

    // Sempre retornar 200 para o MP saber que recebemos
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Erro no webhook:', error);
    
    // Retornar 200 mesmo com erro para evitar retry infinito do MP
    return {
      statusCode: 200,
      body: JSON.stringify({ error: error.message })
    };
  }
};