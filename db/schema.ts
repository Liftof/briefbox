import { pgTable, serial, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

// Table des Marques (Le profil identité)
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  userId: text('user_id'), // L'ID de l'utilisateur (via Clerk)
  
  // Infos de base
  name: text('name').notNull(),
  url: text('url').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  industry: text('industry'),
  
  // Identité Visuelle
  logo: text('logo'), // URL du logo principal
  colors: jsonb('colors').$type<string[]>(), // ["#000", "#FFF"]
  fonts: jsonb('fonts').$type<string[]>(), // ["Inter", "Roboto"]
  aesthetic: jsonb('aesthetic').$type<string[]>(), // ["Minimalist", "Clean"]
  toneVoice: jsonb('tone_voice').$type<string[]>(), // ["Professional", "Friendly"]
  
  // Contenu Stratégique (IA)
  values: jsonb('values').$type<string[]>(),
  features: jsonb('features').$type<string[]>(),
  services: jsonb('services').$type<string[]>(),
  keyPoints: jsonb('key_points').$type<string[]>(),
  
  // Intelligence Créative
  visualMotifs: jsonb('visual_motifs').$type<string[]>(),
  marketingAngles: jsonb('marketing_angles').$type<{title: string, concept: string}[]>(),
  backgroundPrompts: jsonb('background_prompts').$type<string[]>(),
  
  // Assets (Images scrapées + Textures générées)
  // On stocke tout ici pour simplifier, ou on peut séparer
  labeledImages: jsonb('labeled_images').$type<{url: string, category: string, description: string}[]>(),
  backgrounds: jsonb('backgrounds').$type<string[]>(), // URLs des textures générées

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table des Campagnes (Projets)
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  brandId: serial('brand_id').references(() => brands.id),
  userId: text('user_id'), // Pour filtrage rapide
  
  name: text('name').notNull(), // ex: "Noël 2025", "Lancement Produit X"
  description: text('description'),
  status: text('status').default('active'), // 'active', 'archived', 'completed'
  
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table du Calendrier (Posts planifiés)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  brandId: serial('brand_id').references(() => brands.id),
  campaignId: serial('campaign_id').references(() => campaigns.id), // Optionnel, lié à une campagne
  userId: text('user_id'),
  
  content: text('content'), // La caption / légende
  mediaUrl: text('media_url').notNull(), // L'image ou vidéo (souvent issue de generations)
  platform: text('platform'), // 'instagram', 'linkedin', 'facebook', etc.
  
  scheduledDate: timestamp('scheduled_date'), // Date de publication prévue
  status: text('status').default('draft'), // 'draft', 'scheduled', 'published'
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table des Générations (L'historique des créations)
export const generations = pgTable('generations', {
  id: serial('id').primaryKey(),
  brandId: serial('brand_id').references(() => brands.id),
  campaignId: serial('campaign_id').references(() => campaigns.id), // Lien vers une campagne spécifique
  userId: text('user_id'), // Pour accès rapide
  
  type: text('type'), // 'teaser', 'boom', 'social_post', 'edit'
  prompt: text('prompt'), // Le prompt utilisé
  imageUrl: text('image_url').notNull(), // L'image finale
  
  // Métadonnées
  format: text('format'), // '1:1', '9:16'
  liked: boolean('liked').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
});
