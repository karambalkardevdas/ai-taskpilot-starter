# Frontend Deployment Handover (AI TaskPilot)

## Done from code side

- Added Amplify build config: [amplify.yml](amplify.yml)
- Verified frontend production build succeeds locally (`npm ci` + `npm run build`)

## Amplify setup values

- Repository: `karambalkardevdas/ai-taskpilot-starter`
- Branch: `main`
- Build config file: uses repo root [amplify.yml](amplify.yml)
- App root: `frontend` (already configured in `amplify.yml`)

## Required Amplify environment variable

- Key: `VITE_API_BASE_URL`
- Temporary test value: `http://13.205.2.245:8000`
- Final production value (recommended): `https://api.yourdomain.com`

## Backend config required for frontend to work

Add Amplify domain to backend `CORS_ORIGINS` value (ECS env/secret), example:

`https://main.xxxxxx.amplifyapp.com,http://127.0.0.1:5173,http://127.0.0.1:5175`

Then force new ECS deployment.

## Validation checklist after deployment

1. Open Amplify URL.
2. Create task from UI.
3. Refresh and confirm task appears in list.
4. Run AI suggestion from UI.
5. Confirm backend health endpoint still responds.

## Known production note

If frontend is on HTTPS and API is HTTP, browsers may block requests (mixed content). Final API should be HTTPS behind ALB + ACM.
