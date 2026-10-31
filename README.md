# Leonardo PSN - Test SSO web

Demo React basata sul device flow di [trureact](https://github.com/miki3421/trureact),
collegata all'admin-api del cluster `http://test.psn.n7s.co`.
Keycloak gestisce le credenziali nella propria pagina; nessuna password o client
secret va inserita nel codice o nelle variabili `VITE_*`.

## Avvio locale

Da un clone del repository principale:

```bash
git submodule update --init sso-test-login
cd sso-test-login
npm ci
npm run dev
```

Aprire `http://localhost:5173`, premere **Accedi con SSO aziendale**, completare
il login nella finestra Keycloak e confermare l'autorizzazione del dispositivo.
Se il popup e' bloccato, usare **Apri login** e il codice mostrato nella pagina.
Al completamento vengono visualizzati il login e il namespace confermati dal
backend. **Riavvia** annulla il polling; errori, accesso negato e scadenza sono
mostrati nella pagina.

Utenti disponibili nel realm `openserverless-psn`: `ssotest` e `michelem`,
entrambi nel gruppo `openserverless-users`. Usare le password impostate in
Keycloak, mai le credenziali amministrative. Occorre raggiungere dalla propria
rete sia il cluster PSN sia l'URL HTTPS privato di Keycloak e fidarsi della sua CA.

## Configurazione

I default sono gia' impostati per PSN; `.env.example` documenta le opzioni.
Per cambiarle, creare `.env.local` (ignorato da Git):

```dotenv
PSN_API_TARGET=http://test.psn.n7s.co
VITE_ADMIN_API_BASE=http://test.psn.n7s.co
```

`PSN_API_TARGET` e' il target del proxy locale; puo' essere anche l'indirizzo
interno del router OpenShift, per esempio `http://10.129.58.102` quando il DNS
pubblico non e' disponibile. Il proxy mantiene l'header Host dell'APIHOST.
`VITE_ADMIN_API_BASE` e' l'origine pubblica usata in produzione e il suffisso
per riconoscere i workspace. Entrambe sono configurazioni pubbliche, senza secret.
In locale il frontend chiama `/system/api/` sulla stessa origine e Vite inoltra
al cluster, evitando CORS. Anche `npm run preview` usa questo proxy.

## Cosa viene verificato

1. `POST /system/api/v1/auth/oidc/device/start` avvia il flusso sul backend.
2. Keycloak autentica l'utente e autorizza il dispositivo.
3. La UI interroga `/system/api/v1/auth/oidc/device/poll` rispettando intervallo,
   rallentamento, scadenza e annullamento.
4. Il backend controlla identita', gruppo e associazione del workspace.
5. La UI conserva in memoria solo `LOGIN` e `NAMESPACE`, scartando `AUTH` e
   qualsiasi token restituito. Non salva la sessione in local/sessionStorage.

Su localhost o sull'APIHOST non viene imposto un workspace. Pubblicata su
`ssotest.test.psn.n7s.co`, l'app richiede invece il namespace `ssotest`: un altro
utente non deve ottenere una falsa schermata di successo per quel workspace.
Il test di `michelem` va fatto in locale o sul suo workspace.
La schermata e' diagnostica, non sostituisce l'autorizzazione delle API protette.
**Esci dal test** cancella solo lo stato della demo: non chiude la sessione SSO
Keycloak. Per cambiare utente, uscire anche da Keycloak o usare una finestra privata.

## Verifica e build

Richiede Node.js 22.18+ (o Node.js 24+) e npm.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run preview
```

La build produce `web/`. I test automatici usano risposte simulate: non creano
utenti, non richiedono password e non sostituiscono il collaudo manuale SSO.

## Pubblicazione sul workspace

Dopo il login SSO da terminale, dalla cartella di questa applicazione:

```bash
SSO_ENABLED=true SSO_CLIENT_MODE=confidential OPS_SSO_LOGIN_FLOW=device \
  ops ide login ssotest http://test.psn.n7s.co
ops ide deploy
```

L'URL previsto e' `http://ssotest.test.psn.n7s.co`. Non pubblicare su un nome di
workspace diverso da quello dell'utente autenticato. La route wildcard OpenShift
deve essere ammessa e il DNS del client deve raggiungere il router.

Il client OPS sul Mac deve selezionare esplicitamente SSO: la configurazione
eseguita sul master non viene copiata sul Mac. Le tre variabili sopra possono
anche essere salvate nel `.env` letto da `ops ide login`; `.env.local` e'
usato da Vite ma non e' il profilo predefinito di questo task OPS.
Il client secret resta solo sul backend, anche in modalita' `confidential`.

L'errore `no user ssotest found` del login tradizionale non verifica Keycloak
e non attiva il provisioning SSO. Con device flow, completare il login su
Keycloak: se identita' e gruppo sono validi e il provisioning automatico e'
abilitato, il backend crea il workspace e ne attende la readiness. Omettendo
il nome posizionale si puo' lasciare al backend la scelta del namespace:

```bash
SSO_ENABLED=true SSO_CLIENT_MODE=confidential OPS_SSO_LOGIN_FLOW=device \
  ops ide login
```

In questo caso `OPS_APIHOST` deve essere impostato a `http://test.psn.n7s.co`.


## Cambiare account dopo un accesso negato

**Riavvia** interrompe il polling e chiude il popup del tentativo corrente, ma
non elimina i cookie della sessione Keycloak. Questo vale anche quando Keycloak
ha autenticato un utente e il backend ha rifiutato il workspace richiesto.

Usare **Cambia account Keycloak**, disponibile sia nella schermata di login sia
dopo un accesso riuscito. Si apre l'endpoint OIDC di logout: confermare l'uscita
su Keycloak, chiudere quella scheda e premere nuovamente **Accedi** nella demo.
Il logout puo' interessare anche altre app della stessa sessione del realm.
Non vengono revocate le API key OpenServerless o cancellati i workspace.

L'issuer e il client pubblico di riferimento sono configurabili con
`VITE_OIDC_ISSUER_URL` e `VITE_OIDC_CLIENT_ID` (vedere `.env.example`). Non serve
un client secret nel browser. Non viene usato un redirect post-logout, cosi'
non occorre aggiungere localhost o wildcard ai redirect ammessi del client.
Il backend verifica sempre l'identita' e il namespace richiesto: su
`ssotest.test.psn.n7s.co` bisogna autenticarsi come utente associato a `ssotest`,
non come `michelem`, anche se quest'ultimo e' un utente Keycloak valido.
