# Médicos por Israel

Site de doações para missões médicas em Israel.

## Tecnologias

- HTML/CSS/JavaScript
- Tailwind CSS
- Netlify Functions
- Mercado Pago API
- Supabase

## Instalação Local

```bash
npm install
npm run dev
```

## Variáveis de Ambiente

Criar arquivo `.env`:

```
MP_ACCESS_TOKEN=seu-token
MP_PUBLIC_KEY=sua-chave
SUPABASE_URL=sua-url
SUPABASE_KEY=sua-key
SITE_URL=http://localhost:8888
```

## Deploy

Configurar as mesmas variáveis de ambiente no Netlify.

Atualizar URLs em `create-payment.js` para o domínio de produção.