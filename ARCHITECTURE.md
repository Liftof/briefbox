# Architecture Technique Palette (V4 - Production Ready)

Ce document détaille le fonctionnement de Palette. L'objectif est de simuler une agence créative : on analyse la matière, on propose des angles, on définit une DA via des inspirations, et on produit.

## 1. Vue d'ensemble du Workflow

### Phase 1 : Intelligence & Matière (`/api/brand/analyze`)
Plus de regex bête. On utilise des agents pour "comprendre" le business.
1.  **Extraction Hybride** : Firecrawl V2 (Site + Deep Crawl 15 pages) + Parallel AI (Recherche Web/Actus).
2.  **Détection de langue** : L'IA détecte si le site est en français ou anglais (`detectedLanguage: 'fr' | 'en'`).
3.  **Agent "Brand Analyst" (Claude 3.5 Sonnet)** : Analyse le contenu pour extraire :
    - **8 Pain Points** : Hooks concrets liés au produit/service, dans la langue du site.
    - **Ton adapté à l'industrie** : Formel (M&A, Finance) vs Casual (Fashion, Lifestyle).
    - **Angles Éditoriaux** : "Focus Produit", "Storytelling Fondateur", "Pain Point", etc.

### Phase 2 : Direction Artistique (Frontend - Bento)
L'utilisateur ne remplit pas un template, il construit une vision.
1.  **Validation Bento** : Vérification rapide des assets (logos, couleurs) et des pain points.
2.  **Galerie d'Inspiration** : L'utilisateur sélectionne 1 à 3 visuels "références" (layout, vibe).
3.  **Sélection de l'Angle** : L'utilisateur choisit *quoi raconter* parmi les 8 pain points détectés.

### Phase 3 : Production (`/api/creative-director` & `/api/generate`)
1.  **Le Directeur Artistique (IA)** :
    *   Prend l'**Angle** (le fond) + les **Inspirations** (la forme) + la **Brand Identity** (les codes).
    *   Utilise les **fonts** et **visualMotifs** de la marque.
    *   Applique des guidelines anti-stock/anti-IA (textures réelles, imperfections artistiques).
2.  **Génération (Google Gemini 3 Pro Image)** :
    *   Modèle : `gemini-3-pro-image-preview` ("Nano Banana Pro").
    *   Supporte jusqu'à 8 images de référence (logo prioritaire).
    *   Résolutions : 2K (défaut), 4K (Pro/Premium uniquement).
    *   **1 crédit = 1 image générée**.

---

## 2. Stack Technologique & Modèles

| Tâche | Modèle / Service | Rôle Spécifique |
| :--- | :--- | :--- |
| **Scraping Site** | **Firecrawl V2** | Deep crawl 15 pages, Markdown, Screenshot, Map API. |
| **Scraping News** | **Parallel AI** | Recherche web contextuelle, actualités. |
| **Analyse Stratégique** | **Claude 3.5 Sonnet** (OpenRouter) | 200K contexte. Extraction JSON, pain points, détection langue. |
| **Transformation Insights** | **Claude 3 Haiku** (OpenRouter) | Fast & cheap. Transforme données brutes en angles éditoriaux. |
| **Fallback Analyse** | **GPT-4o-mini** (OpenRouter) | Si Claude refuse (rare). |
| **Directeur Artistique** | **Claude 3 Haiku** | Prompt enhancement, sélection d'images. |
| **Génération Visuelle** | **Google Gemini 3 Pro Image** | Rendu final haute fidélité. |
| **Authentification** | **Clerk** | Gestion des utilisateurs et sessions. |
| **Base de données** | **Neon PostgreSQL + Drizzle** | Persistence des données. |
| **Paiements** | **Stripe** | Checkout, Webhooks, Customer Portal. |
| **Stockage Images** | **Vercel Blob** | Upload et hébergement des images générées. |
| **Cron Jobs** | **Vercel Cron** | Daily visuals pour Pro/Premium (batch API). |

---

## 3. Détails des Agents

### Agent Analyse (`api/brand/analyze`)
**Objectif** : Sortir de la donnée exploitable pour des posts, pas des métriques froides.

- **Input** : URL du site.
- **Process** :
  1. Firecrawl Map API pour découvrir les pages importantes.
  2. Deep Crawl de 15 pages (About, Blog, Press, Services).
  3. Parallel AI pour contextualiser dans le marché.
  4. Claude 3.5 Sonnet pour extraction structurée.
  
- **Output** :
  - `detectedLanguage`: 'fr' | 'en' (langue du site).
  - `targetAudience`: Description spécifique de la cible.
  - `uniqueValueProposition`: Promesse principale.
  - `editorialHooks`: 8 pain points concrets, adaptés au ton de l'industrie.
  - `visualMotifs`: Éléments récurrents visuels.
  - `labeledImages`: Assets catégorisés (main_logo, product, app_ui, person, texture).

### Pain Points Generation Rules
Les pain points doivent être :
1. **Produit-spécifiques** : Directement liés à ce que la marque vend.
2. **Dans la langue du site** : FR ou EN selon `detectedLanguage`.
3. **Ton adapté** :
   - **Formel** (M&A, Finance, Law, Consulting) : Data-driven, ROI-focused.
   - **Casual** (Fashion, Lifestyle, Consumer) : Punchy, émotionnel.
4. **Jamais de market stats** : Pas de "Le marché atteindra X milliards".

### Agent Génération (`api/generate`)
- **Input** : Prompt DA + Images (Logo PREMIER + Références Visuelles).
- **Logique** : 
  - Logo toujours en position 1.
  - Conversion SVG → PNG automatique pour compatibilité.
  - Guidelines anti-stock intégrées au prompt.
- **Crédits** : **1 crédit = 1 image**.

---

## 4. Base de Données (Persistance)

### Tables principales :

**`brands`** : Identité de marque complète.
```typescript
{
  // Infos de base
  name, url, tagline, description, industry,
  detectedLanguage,      // 'fr' | 'en'
  targetAudience,        // "Marketing managers in SMBs"
  uniqueValueProposition, // "Saves 10h/week"
  brandStory,            // Origin story
  
  // Identité Visuelle
  logo, colors, fonts, aesthetic, toneVoice,
  
  // Intelligence Créative
  visualMotifs, marketingAngles, backgroundPrompts,
  editorialHooks,        // 8 pain points JSONB
  industryInsights,      // Insights transformés
  painPoints, vocabulary,
  
  // Assets
  labeledImages,         // {url, category, description}[]
  
  // Metadata
  teamId, userId, createdAt, updatedAt
}
```

**`users`** : Profils et abonnements.
```typescript
{
  clerkId, email, name, avatarUrl,
  plan,                  // 'free' | 'pro' | 'premium'
  creditsRemaining,      // Crédits disponibles
  creditsResetAt,        // Reset mensuel
  isEarlyBird,           // First 30 signups/day
  stripeCustomerId, stripeSubscriptionId, stripePriceId,
  teamId
}
```

**`dailySignupCounts`** : Tracking Early Bird.
```typescript
{
  date,   // Date unique
  count   // Nombre d'inscriptions ce jour
}
```

**`batchGenerationQueue`** : Queue pour daily visuals.
```typescript
{
  userId, brandId,
  status,        // 'pending' | 'processing' | 'completed' | 'failed'
  scheduledFor,  // Heure de génération
  prompt, resultUrl, error
}
```

**`generations`** : Historique des créations.
**`folders`** : Organisation des visuels.
**`teams`** : Équipes (Premium).

---

## 5. Plans & Crédits

| Plan | Prix | Crédits/mois | Marques | Résolution | Daily Visual |
|------|------|--------------|---------|------------|--------------|
| **Free** | Gratuit | 1-2 (one-time)* | 1 | 2K | Non |
| **Pro** | 19€/mois | 50 | 5 | 4K | Oui (1/jour) |
| **Premium** | 49€/mois | 150 | 20 | 4K | Oui (1/jour) |

### Logique de crédits :
- **1 crédit = 1 image** générée.
- **Early Bird** (30 premiers signups/jour) : 2 crédits offerts (1 auto-gen + 1 manuel).
- **Autres signups** : 1 crédit offert (auto-gen uniquement).
- **Daily Visual** (Pro/Premium) : 1 visuel automatique chaque matin, consomme 1 crédit.
- Reset mensuel pour Pro/Premium.

### URL déjà scrappée :
Si un utilisateur entre une URL déjà analysée, on retourne les données existantes sans re-scraper (économie d'API).

---

## 6. API Routes

### Brand Management
- `GET /api/brands` : Liste des marques de l'utilisateur.
- `POST /api/brands` : Check permissions (add/rescrape).
- `DELETE /api/brands` : Supprimer une marque.
- `GET /api/brand/[id]` : Détails d'une marque.
- `POST /api/brand/analyze` : Analyser un site (retourne existing si déjà scrappé).
- `POST /api/brand/save` : Sauvegarder une marque.

### Generation
- `POST /api/generate` : Générer 1 visuel (consomme 1 crédit).
- `POST /api/creative-director` : Enhancement de prompt.
- `GET/POST/PATCH/DELETE /api/generations` : CRUD générations.
- `GET/POST/DELETE /api/folders` : Gestion des dossiers.

### User & Credits
- `GET/PATCH /api/user` : Profil utilisateur (crée si n'existe pas).
- `GET/POST/PUT /api/user/credits` : Gestion des crédits (crée user si n'existe pas).

### Stripe
- `POST /api/stripe/checkout` : Créer une session de paiement.
- `POST /api/stripe/webhook` : Recevoir les événements Stripe.
- `POST /api/stripe/portal` : Accéder au portail client.

### Batch (Cron)
- `POST /api/batch/process` : Traite la queue de daily visuals (appelé par Vercel Cron).

---

## 7. Sécurité & Rate Limiting

### Authentification
- Clerk pour toutes les routes protégées.
- Vérification `userId` sur chaque requête.

### Rate Limiting
```typescript
import { rateLimitByUser } from '@/lib/rateLimit';

const result = rateLimitByUser(userId, 'analyze');
if (!result.success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### Protection contre les abus
1. **Crédits** : Limite naturelle par plan.
2. **Rate limiting** : Limite de requêtes par minute.
3. **Early Bird cap** : Max 30 signups gratuits par jour.
4. **URL dedup** : Pas de re-scrape inutile.
5. **Validation** : Vérification des inputs côté serveur.

---

## 8. Déploiement

### Vercel
- Next.js 16 App Router (Turbopack).
- Edge Functions pour les API routes.
- Vercel Blob pour le stockage d'images.
- Vercel Cron pour daily visuals (Pro/Premium).

### Variables d'environnement requises
```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# AI (OpenRouter pour LLMs)
GOOGLE_AI_API_KEY=
OPENROUTER_API_KEY=
FIRECRAWL_API_KEY=
PARALLEL_API_KEY=

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

---

## 9. Migrations récentes

### 0006_brand_extended_fields.sql
```sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS detected_language TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS unique_value_proposition TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_story TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS editorial_hooks JSONB;
```

### 0005_early_bird_system.sql
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_early_bird BOOLEAN DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS daily_signup_counts (...);
CREATE TABLE IF NOT EXISTS batch_generation_queue (...);
```
