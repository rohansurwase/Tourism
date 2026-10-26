# Submission checklist

1. Configure a real Geoapify key in `src/backend/.dev.vars` for local use. For deployment, provision `GEOAPIFY_API_KEY` as a backend secret using your hyperDart-supported environment/secret mechanism. Verify the deployed worker's `/api/health` reports configured. Never commit the key or inject it into frontend environment variables.
2. Run `npm test` and `npm run build`.
3. Test the example queries from the brief with live Geoapify and the actual hyperDart sandbox. Check sidebar/mainline and light/dark. Inspect `docs/VERIFICATION.md` for remaining checks.
4. Create a public GitHub repository and commit this source folder, including `.gitignore` and both lockfiles. Do not commit `node_modules`, `.env`, `.dev.vars`, `.wrangler`, `dist` or credentials.
5. Record and upload a 2–3 minute YouTube video. `docs/DEMO_SCRIPT.md` is a ready walkthrough.
6. Fill the existing `github` and `demovideo` fields in `hyperdart.config.js` with the real repository-root and YouTube links. Commit this change.
7. In hyperDart Partner Portal, create your package and use the token/setup command supplied by the portal. Ensure the scoped name `@hyperdart/tourismexplorer` is available/assigned to your account; resolve naming with the organiser if necessary.
8. Run `npm run validate`. With real links and built files it should pass. Run plain `npm publish` from the project root. Do not use `--ignore-scripts`, remove validation, or publish fabricated links.
9. Verify the published component receives platform entities, renders live results, uses the injected backend URL and has working CORS for the platform's injected domains.

External completion status: repository publication, YouTube recording/upload, API credentials and hyperDart registration/publication have not been performed by this implementation. The original validator currently reports exactly the two missing submission-link fields after a successful build.
