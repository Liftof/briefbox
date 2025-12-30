# Email System - TODO

> Code implementé, reste la configuration externe.

## A faire avant mise en production

- [ ] Créer compte Resend : https://resend.com
- [ ] Obtenir API key et la mettre dans `.env.local` → `RESEND_API_KEY`
- [ ] Vérifier ton domaine dans Resend (DNS: SPF, DKIM, DMARC)
- [ ] Mettre à jour `EMAIL_FROM` avec ton vrai domaine
- [ ] Ajouter les variables sur Vercel (Settings > Environment Variables)
- [ ] Déployer

## Variables à configurer

```env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Palette <hello@ton-domaine.com>
EMAIL_REPLY_TO=support@ton-domaine.com
CRON_SECRET=un-secret-fort-et-unique
```

## Test local

```bash
# Déclencher le cron manuellement
curl -X POST http://localhost:3000/api/emails/process \
  -H "Authorization: Bearer local-dev-cron-secret-change-in-production"
```

## Emails configurés

| Email | Déclencheur | Délai |
|-------|-------------|-------|
| Welcome | Création compte | Immédiat |
| Engagement | 1ère génération | 30 min |
| Conversion | Signup free user | 3 jours |
