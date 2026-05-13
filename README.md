This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 Deploy com PM2

Para rodar o Dashboard em produção utilizando o PM2:

1. **Build do projeto:**
   ```bash
   npm run build
   ```

2. **Iniciar com PM2:**
   ```bash
   pm2 start npm --name "dashboard-pro" -- start -- -p 5020
   ```

3. **Comandos úteis:**
   ```bash
   pm2 status          # Ver status
   pm2 logs            # Ver logs
   pm2 restart dashboard-pro
   ```

## ⚙️ Configuração do Backend

O backend desta aplicação está configurado e online no seguinte endereço:

- **IP:** `http://192.168.10.10`
- **Porta:** `5010`
- **Status:** Online

> [!IMPORTANT]
> Certifique-se de que o frontend está apontando para o IP e porta corretos nas requisições da API.

