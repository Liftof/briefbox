# 🔧 Configuration Stripe en Mode Test

Ce guide te permet de configurer Stripe en mode test pour tester les paiements **sans affecter la production**.

## ✅ Sécurité
- Les clés de test (dans `.env.local`) ne sont **jamais commitées** (fichier dans `.gitignore`)
- La production utilise les variables d'environnement Vercel (séparées)
- Aucun risque de conflit entre test et prod

---

## 📝 Étapes à suivre

### 1️⃣ Active le mode Test dans Stripe

1. Va sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Clique sur le **toggle "Test mode"** en haut à droite (il devient violet)

### 2️⃣ Récupère les clés API de test

1. Va dans **Developers** → **API keys**
2. Copie les deux clés :
   - **Secret key** : commence par `sk_test_...`
   - **Publishable key** : commence par `pk_test_...`

### 3️⃣ Crée les produits et prix

1. Va dans **Products** → **Create product**
2. Crée le plan **Pro** :
   - Nom : `Pro`
   - Prix : `19 EUR` / mois (recurring)
   - Clique sur **Save product**
   - ⚠️ **COPIE le Price ID** (commence par `price_...`)

3. Crée le plan **Premium** :
   - Nom : `Premium`
   - Prix : `49 EUR` / mois (recurring)
   - Clique sur **Save product**
   - ⚠️ **COPIE le Price ID** (commence par `price_...`)

### 4️⃣ Configure le Webhook local

#### Option A : Avec Stripe CLI (recommandé)

```bash
# Installe Stripe CLI
brew install stripe/stripe-cli/stripe

# Login avec ton compte Stripe
stripe login

# Lance le webhook forwarding (garde ce terminal ouvert)
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Tu verras un message comme :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

⚠️ **COPIE ce webhook secret** (commence par `whsec_...`)

#### Option B : Sans Stripe CLI (pour tester en prod seulement)

Skip cette étape pour le moment. Les webhooks ne fonctionneront qu'en prod.

### 5️⃣ Remplis le fichier .env.local

Ouvre le fichier `.env.local` et remplace les placeholders :

```bash
# STRIPE (TEST MODE - Local Development)
STRIPE_SECRET_KEY="sk_test_COLLE_ICI_TA_SECRET_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_COLLE_ICI_TA_PUBLISHABLE_KEY"

STRIPE_PRICE_PRO_MONTHLY="price_COLLE_ICI_PRICE_ID_PRO"
STRIPE_PRICE_PREMIUM_MONTHLY="price_COLLE_ICI_PRICE_ID_PREMIUM"

STRIPE_WEBHOOK_SECRET="whsec_COLLE_ICI_TON_WEBHOOK_SECRET"
```

### 6️⃣ Redémarre le serveur

```bash
# Arrête npm run dev (Ctrl+C)
# Relance
npm run dev
```

---

## 🧪 Tester un paiement

### Cartes de test Stripe

Utilise ces numéros de carte (en mode test) :

| Type | Numéro | Résultat |
|------|--------|----------|
| ✅ Succès | `4242 4242 4242 4242` | Paiement accepté |
| 🔐 3D Secure | `4000 0025 0000 3155` | Demande authentification |
| ❌ Décliné | `4000 0000 0000 0002` | Paiement refusé |

**Autres infos** (peuvent être aléatoires) :
- CVV : n'importe quel chiffre (ex: `123`)
- Date d'expiration : n'importe quelle date future (ex: `12/25`)
- Code postal : n'importe quoi (ex: `12345`)

### Workflow de test

1. Va sur `http://localhost:3000/playground`
2. Clique sur le widget de crédits (en bas de la sidebar)
3. Choisis "Pro" ou "Premium"
4. Utilise une carte de test
5. Vérifie que :
   - ✅ Le paiement passe
   - ✅ Ton plan est upgradé dans l'app
   - ✅ Tu reçois les crédits correspondants

---

## 🔍 Vérifier que ça marche

### Dashboard Stripe

Dans [dashboard.stripe.com](https://dashboard.stripe.com) (mode Test) :
- **Payments** : tu devrais voir tes paiements de test
- **Customers** : tes comptes de test
- **Subscriptions** : les abonnements actifs

### Webhooks (si Stripe CLI actif)

Dans le terminal où tourne `stripe listen`, tu verras les events :
```
<- checkout.session.completed [evt_xxx]
<- customer.subscription.created [evt_xxx]
```

### Base de données

Vérifie que ton compte est bien upgradé :
```sql
SELECT email, plan, credits_remaining
FROM users
WHERE email = 'ton_email@example.com';
```

---

## ⚠️ Important

- ✅ Les paiements de test **ne débitent jamais de vraie carte**
- ✅ Les données de test sont **séparées de la production**
- ✅ Tu peux tester autant que tu veux sans risque
- ❌ N'utilise **jamais les clés de test en production**
- ❌ N'utilise **jamais les clés de prod en local**

---

## 🚀 Passer en production

Quand tu seras prêt :

1. Active le **mode Live** dans Stripe
2. Crée les mêmes produits (Pro 19€, Premium 49€)
3. Configure les clés de **prod** dans **Vercel** :
   - `STRIPE_SECRET_KEY` (commence par `sk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (commence par `pk_live_...`)
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `STRIPE_PRICE_PREMIUM_MONTHLY`
4. Configure le webhook prod :
   - URL : `https://thepalette.app/api/webhook/stripe`
   - Events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## ❓ Besoin d'aide ?

Si quelque chose ne fonctionne pas :
1. Vérifie les logs dans la console
2. Vérifie le terminal où tourne `stripe listen`
3. Vérifie les logs Stripe dans le dashboard

Bon test ! 🎉
