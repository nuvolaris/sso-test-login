# Leonardo PSN · SSO Test Login

Applicazione React dimostrativa per verificare il login federato del progetto Leonardo–PSN sulla piattaforma Nuvolaris OpenServerless.

## Scopo

L'applicazione valida il flusso OIDC device authorization gestito dal backend OpenServerless:

1. la UI avvia il device flow tramite `system-api`;
2. l'utente completa l'accesso sul provider Keycloak;
3. il backend verifica token, gruppi e workspace binding;
4. la UI mostra namespace e login restituiti dal cluster.

Il token OIDC non viene conservato nel browser. In `sessionStorage` vengono mantenuti soltanto login e namespace della sessione applicativa.

## Sviluppo

```bash
bun install
bun run dev
```

Per usare un backend esplicito durante lo sviluppo:

```bash
VITE_ADMIN_API_BASE=http://psn.n7s.co bun run dev
```

## Build

```bash
bun run lint
bun run build
```

Gli asset statici sono generati nella directory `web/` dal workflow `ops ide deploy`.

## Test previsto su PSN

Il collaudo verrà eseguito con un utente Keycloak e namespace OpenServerless denominati `sso-test`, pubblicando la UI su:

```text
http://sso-test.psn.n7s.co
```

Flusso operativo:

```bash
ops ide login
ops ide deploy
```

## Branding

- logo Nuvolaris proveniente dagli asset ufficiali Nuvolaris;
- logo Leonardo proveniente dal sito ufficiale `leonardo.com`.
