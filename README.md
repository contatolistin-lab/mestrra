# mestrra

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c8c3ebb0-79e5-44f3-8500-cfcae189c9d5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Integrações reais

Copie `.env.example` para `.env` e preencha apenas as variáveis públicas `VITE_*` no repositório. As demais devem ficar em Secrets do Lovable/Supabase, nunca versionadas.

- Supabase: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Mercado Pago (plataforma): `MP_ACCESS_TOKEN` ou `MP_PLATFORM_ACCESS_TOKEN` para a assinatura mensal.
- Mercado Pago (conexão do vendedor): `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_REDIRECT_URI`.
- Webhooks: `MP_WEBHOOK_SECRET` para vendas e `MP_SUBSCRIPTION_WEBHOOK_SECRET` para assinaturas (se o mesmo segredo for usado no painel do MP, configure o mesmo valor nas duas variáveis).
- `SITE_URL` ou `APP_URL` define o domínio usado nos retornos de checkout.

Cada usuário conecta apenas a própria conta Mercado Pago em Configurações. O fluxo usa um `state` único por tentativa, associado ao usuário autenticado e válido por 10 minutos; iniciar uma nova tentativa cancela a anterior. Após a autorização, access token e refresh token ficam em `payment_connections`, isolados por `user_id`, e a conta identificada é exibida na tela. Trocar ou desconectar a conta nunca afeta outros usuários.

No aplicativo do Mercado Pago, cadastre como Redirect URL exatamente o valor de `MP_REDIRECT_URI`, apontando para `/mp-callback`. As URLs de notificação são:

- Vendas: `<SUPABASE_URL>/functions/v1/mp-webhook?user_id=<uuid>`
- Assinaturas: `<SUPABASE_URL>/functions/v1/subscription-webhook`

Antes de publicar, aplique no banco as tabelas `platform_subscriptions`, `admin_allowlist` e `platform_admin_inputs` e publique as Edge Functions `mp-oauth-start`, `mp-oauth-exchange`, `create-order`, `create-mp-preference`, `mp-webhook` e `subscription-webhook`.
