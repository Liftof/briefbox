# Architecture Technique BriefBox (V2 - Workflow "Smart Agency")

Ce document détaille le fonctionnement de BriefBox. L'objectif est de simuler une agence créative : on analyse la matière, on propose des angles, on définit une DA via des inspirations, et on produit.

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
    *   **Fusionne** le tout dans un prompt technique pour Fal AI.
2.  **Génération (Fal AI)** :
    *   Utilise `nano-banana-pro` (Flux/SDXL).
    *   Injecte le logo client avec protection stricte (Inpainting/ControlNet logique).

---

## 2. Stack Technologique & Modèles

| Tâche | Modèle / Service | Rôle Spécifique |
| :--- | :--- | :--- |
| **Scraping Site** | **Firecrawl** | Structure, Markdown propre, Screenshot Home. |
| **Scraping News** | **Parallel AI** | "Latest news [Industry]", "Market trends 2024". |
| **Analyse Stratégique** | **GPT-4o** | Analyse visuelle + textuelle. Sortie : JSON `editorialAngles`. |
| **Directeur Artistique** | **Logique Code + Prompt** | Mapping "Inspi Image" -> Instructions de composition. |
| **Génération Visuelle** | **Fal AI (Nano Banana)** | Rendu final haute fidélité. |

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
- **Input** : Prompt DA + Images (Logo + **Références Visuelles choisies**).
- **Logique** : Les images de référence sont passées au modèle avec l'instruction "Use layout and vibe from Image X".

---

## 4. Base de Données (Persistance)

Les `brands` stockent désormais des structures riches :
- `marketing_angles` (JSONB) : Les angles éditoriaux détectés.
- `industry_insights` (JSONB) : Les vraies news récupérées.
- `labeled_images` (JSONB) : Les assets triés (Logo vs Produit vs Team).
