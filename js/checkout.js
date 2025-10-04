// js/checkout.js

// Função para processar doação
async function processarDoacao(event) {
  event.preventDefault();
  
  console.log('Formulário enviado!');
  
  // Pegar dados do formulário
  const formData = {
    amount: document.getElementById('amount').value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    language: document.documentElement.lang || 'pt'
  };

  console.log('Dados do formulário:', formData);

  // Validações básicas
  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }

  if (!formData.name || !formData.email) {
    alert('Por favor, preencha todos os campos');
    return;
  }

  // Desabilitar botão e mostrar loading
  const btnDoar = document.getElementById('btnDoar');
  const btnTexto = btnDoar.querySelector('.btn-text');
  const btnLoading = btnDoar.querySelector('.btn-loading');
  
  btnDoar.disabled = true;
  btnTexto.classList.add('hidden');
  btnLoading.classList.remove('hidden');

  try {
    console.log('Chamando Netlify Function...');
    
    // Chamar Netlify Function
    const response = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API:', errorData);
      throw new Error(errorData.error || 'Erro ao processar pagamento');
    }

    const data = await response.json();
    console.log('Resposta da API:', data);

    // Redirecionar para checkout do Mercado Pago
    if (data.init_point) {
      console.log('Redirecionando para:', data.init_point);
      window.location.href = data.init_point;
    } else {
      throw new Error('Link de pagamento não recebido');
    }

  } catch (error) {
    console.error('Erro completo:', error);
    alert('Erro ao processar doação: ' + error.message);
    
    // Reabilitar botão
    btnDoar.disabled = false;
    btnTexto.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
}

// Função para selecionar valor predefinido
function selecionarValor(valor) {
  console.log('Valor selecionado:', valor);
  document.getElementById('amount').value = valor;
  
  // Remover classe 'active' de todos os botões
  document.querySelectorAll('.btn-valor').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-white', 'text-blue-600');
  });
  
  // Adicionar classe 'active' ao botão clicado
  event.target.classList.remove('bg-white', 'text-blue-600');
  event.target.classList.add('bg-blue-600', 'text-white');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado, configurando event listeners...');
  
  const form = document.getElementById('formDoacao');
  if (form) {
    console.log('Formulário encontrado!');
    form.addEventListener('submit', processarDoacao);
  } else {
    console.error('Formulário NÃO encontrado!');
  }

  // Botões de valor predefinido
  document.querySelectorAll('.btn-valor').forEach(btn => {
    btn.addEventListener('click', function() {
      selecionarValor(this.dataset.valor);
    });
  });
  
  console.log('Event listeners configurados com sucesso!');
});