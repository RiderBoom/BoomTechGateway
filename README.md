# BoomTech Gateway

BoomTech Gateway is a React/Vite sandbox for wallet connectivity, market data, shop flows, community moderation, and donations. `SANDBOX_MODE` is enabled by default: no real transfer should be promoted or accepted until payment verification is implemented server-side.

## Development

```bash
npm ci
npm run dev
npm run lint
npm run build
```

## Deployment configuration

Deploy the frontend and `/api` endpoints on Vercel. Create environment variables from `.env.example` in Vercel Project Settings:

- `FIREBASE_SERVICE_ACCOUNT`: complete Firebase service-account JSON, for server-side logging and admin claims.
- `FIREBASE_APP_ID`: the only permitted Firestore app namespace for `/api/log`.
- `PUBLIC_APP_ORIGIN`: canonical public origin used by the logging endpoint CORS policy.

Deploy Firestore rules separately with the Firebase CLI after reviewing them:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Never commit service-account credentials or production `.env` files.
