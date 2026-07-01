# FLMP Frontend

Smart Faculty Leave and Substitution Management System (frontend).

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from example and set API URL:

```bash
cp .env.example .env
```

3. Run the dev server:

```bash
npm run dev
```

## Deploy to Vercel

1. Import this repository in Vercel.
2. Set the project Root Directory to `flmp`.
3. Add environment variable `VITE_API_URL` with value:
	`https://<your-backend-service>.onrender.com/api`
4. Deploy.

`vercel.json` already includes SPA rewrite support for client-side routes.
