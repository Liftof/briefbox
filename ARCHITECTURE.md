# Architecture Technique Palette (V3 - Production Ready)

Ce document détaille le fonctionnement de Palette. L'objectif est de simuler une agence créative : on analyse la matière, on propose des angles, on définit une DA via des inspirations, et on produit.

## 1. Vue d'ensemble du Workflow

### Phase 1 : Intelligence & Matière (`/api/brand/analyze`)
Plus de regex bête. On utilise des agents pour "comprendre" le business.
1.  **Extraction Hybride** : Firecrawl (Site) + Parallel AI (Recherche Web/Actus).
2.  **Agent "News & Trends"** : Cherche des actualités récentes et des chiffres *datés* dans la presse pour nourrir la stratégie.
3.  **Agent "Brand Analyst"** : Analyse le contenu pour en extraire des **Angles Éditoriaux** (pas juste des stats).
    *   *Exemples d'angles détectés* : "Focus Produit", "Storytelling Fondateur", "Réponse Pain Point", "Preuve Sociale (Logos)".

### Phase 2 : Direction Artistique (Frontend)
L'utilisateur ne remplit pas un template, il construit une vision.
1.  **Validation Bento** : Vérification rapide des assets (logos, couleurs) et des faits marquants.
2.  **Galerie d'Inspiration** : L'utilisateur sélectionne 1 à 3 visuels "références" (layout, vibe) dans une galerie curée.
3.  **Sélection de l'Angle** : L'utilisateur choisit *quoi raconter* parmi les angles détectés (ex: "Infographie sur le gain de temps").

### Phase 3 : Production (`/api/creative-director` & `/api/generate`)
1.  **Le Directeur Artistique (IA)** :
    *   Prend l'**Angle** (le fond).
    *   Prend les **Inspirations** (la forme).
    *   Prend la **Brand Identity** (les codes).
    *   **Fusionne** le tout dans un prompt technique pour Google AI.
2.  **Génération (Google Gemini 3 Pro Image)** :
    *   Utilise `gemini-3-pro-image-preview` ("Nano Banana Pro").
    *   Supporte jusqu'à 14 images de référence.
    *   Résolutions : 1K, 2K, 4K.
    *   Le logo est TOUJOURS en position 1 dans les images pour garantir sa reproduction.

---

## 2. Stack Technologique & Modèles

| Tâche | Modèle / Service | Rôle Spécifique |
| :--- | :--- | :--- |
| **Scraping Site** | **Firecrawl** | Structure, Markdown propre, Screenshot Home. |
| **Scraping News** | **Parallel AI** | "Latest news [Industry]", "Market trends 2024". |
| **Analyse Stratégique** | **GPT-4o** | Analyse visuelle + textuelle. Sortie : JSON `editorialAngles`. |
| **Directeur Artistique** | **Logique Code + Prompt** | Mapping "Inspi Image" -> Instructions de composition. |
| **Génération Visuelle** | **Google Gemini 3 Pro Image** | Rendu final haute fidélité (remplace Fal AI). |
| **Authentification** | **Clerk** | Gestion des utilisateurs et sessions. |
| **Base de données** | **Neon PostgreSQL + Drizzle** | Persistence des données. |
| **Paiements** | **Stripe** | Checkout, Webhooks, Customer Portal. |
| **Stockage Images** | **Vercel Blob** | Upload et hébergement des images générées. |

---

## 3. Détails des Agents

### Agent Analyse (`api/brand/analyze`)
**Objectif** : Sortir de la donnée exploitable pour des posts, pas des métriques froides.
- **Input** : URL.
- **Process** :
  - Deep Crawl (About, Blog, Press).
  - Recherche externe (Parallel) pour contextualiser la marque dans son marché.
- **Output** :
  - `editorialAngles`: Liste d'objets `{ type: 'founder_story', content: '...', visual_idea: 'Portrait N&B' }`.
  - `visualMotifs`: Éléments récurrents (ex: "Formes rondes", "Dégradés").

### Agent Génération (`api/generate`)
**Objectif** : Respecter la DA choisie par l'user.
- **Input** : Prompt DA + Images (Logo PREMIER + Références Visuelles choisies).
- **Logique** : 
  - Logo toujours en position 1 pour maximiser la fidélité.
  - Style refs en positions 2-N.
  - Prompt explicite sur la protection du logo.
- **Crédits** : 1 crédit = 1 image (2 images par génération = 2 crédits).

---

## 4. Base de Données (Persistance)

### Tables principales :
- **`brands`** : Identité de marque, assets, angles éditoriaux.
  - `marketing_angles` (JSONB) : Les angles éditoriaux détectés.
  - `industry_insights` (JSONB) : Les vraies news récupérées.
  - `labeled_images` (JSONB) : Les assets triés (Logo vs Produit vs Team).
  - `teamId` : Lien vers équipe (multi-brand).

- **`users`** : Profils utilisateurs et abonnements.
  - `plan` : 'free' | 'pro' | 'premium'.
  - `creditsRemaining` : Crédits disponibles.
  - `stripeCustomerId`, `stripeSubscriptionId` : Liaison Stripe.

- **`teams`** : Équipes (plan Premium).
  - `creditsPool` : Crédits partagés.
  - `ownerId` : Propriétaire de l'équipe.

- **`generations`** : Historique des créations.
  - `feedback` (JSONB) : `{ rating: 1|2|3 }` (3 = favori).
  - `folderId` : Organisation en dossiers.

- **`folders`** : Dossiers utilisateur.

---

## 5. Plans & Crédits

| Plan | Prix | Crédits/mois | Marques | Équipe |
|------|------|--------------|---------|--------|
| **Free** | Gratuit | 3 (one-time) | 1 | Non |
| **Pro** | 19€/mois | 50 | 5 | Non |
| **Premium** | 49€/mois | 150 | 20 | 3 membres |

### Logique de crédits :
- 1 image = 1 crédit.
- Chaque génération produit 2 images = 2 crédits.
- Free : 3 crédits offerts (1 génération + 1 image seule possible).
- Reset mensuel pour Pro/Premium.

---

## 6. API Routes

### Brand Management
- `GET /api/brands` : Liste des marques de l'utilisateur.
- `POST /api/brands` : Check permissions (add/rescrape).
- `DELETE /api/brands` : Supprimer une marque.
- `GET /api/brand/[id]` : Détails d'une marque.
- `POST /api/brand/analyze` : Analyser un site.
- `POST /api/brand/save` : Sauvegarder une marque.

### Generation
- `POST /api/generate` : Générer des visuels.
- `GET/POST/PATCH/DELETE /api/generations` : CRUD générations.
- `GET/POST/DELETE /api/folders` : Gestion des dossiers.

### User & Credits
- `GET/PATCH /api/user` : Profil utilisateur.
- `GET/POST/PUT /api/user/credits` : Gestion des crédits.

### Stripe
- `POST /api/stripe/checkout` : Créer une session de paiement.
- `POST /api/stripe/webhook` : Recevoir les événements Stripe.
- `POST /api/stripe/portal` : Accéder au portail client.

### Teams
- `GET/POST/PATCH/DELETE /api/teams` : Gestion des équipes.
- `POST/PATCH/DELETE /api/teams/members` : Gestion des membres.

---

## 7. Sécurité & Rate Limiting

### Authentification
- Clerk pour toutes les routes protégées.
- Vérification `userId` sur chaque requête.

### Rate Limiting (à implémenter)
```typescript
// Exemple avec Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

// Dans la route
const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### Protection contre les abus
1. **Crédits** : Limite naturelle par plan.
2. **Rate limiting** : Limite de requêtes par minute.
3. **Validation** : Vérification des inputs côté serveur.
4. **CORS** : Headers appropriés.

---

## 8. Déploiement

### Vercel
- Next.js App Router.
- Edge Functions pour les API routes.
- Vercel Blob pour le stockage d'images.

### Variables d'environnement requises
```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# AI
GOOGLE_AI_API_KEY=
OPENAI_API_KEY=
FIRECRAWL_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PREMIUM_MONTHLY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Blob Storage
BLOB_READ_WRITE_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
INTERNAL_API_KEY=
```
