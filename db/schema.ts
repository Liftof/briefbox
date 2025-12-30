import { pgTable, serial, text, timestamp, jsonb, boolean, integer, date } from 'drizzle-orm/pg-core';

// ============================================
// USERS & SUBSCRIPTIONS
// ============================================

// Plans disponibles
export type PlanType = 'free' | 'pro' | 'premium';

// Table des Utilisateurs (extension de Clerk)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(), // ID Clerk
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),

  // Subscription
  plan: text('plan').$type<PlanType>().default('free').notNull(),
  creditsRemaining: integer('credits_remaining').default(2).notNull(), // 2 pour free, 50 pro, 150 premium
  creditsResetAt: timestamp('credits_reset_at'), // Prochaine date de reset mensuel

  // Early Bird System (auto-gen for first 30 signups/day)
  isEarlyBird: boolean('is_early_bird').default(false),

  // Stripe
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),

  // Team (optionnel)
  teamId: integer('team_id'), // Sera une foreign key vers teams

  // Email preferences
  emailUnsubscribed: boolean('email_unsubscribed').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TEAMS (pour le plan Business)
// ============================================

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull(), // Clerk ID du propriétaire

  // Pool de crédits partagé pour l'équipe
  creditsPool: integer('credits_pool').default(150).notNull(),
  creditsResetAt: timestamp('credits_reset_at'),

  // Stripe (pour facturation de l'équipe)
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type TeamRole = 'owner' | 'admin' | 'member';

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  userId: text('user_id').notNull(), // Clerk ID
  role: text('role').$type<TeamRole>().default('member').notNull(),

  // Invitation
  invitedBy: text('invited_by'), // Clerk ID de l'inviteur
  invitedAt: timestamp('invited_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),

  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// BRANDS
// ============================================

// Table des Marques (Le profil identité)
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  userId: text('user_id'), // L'ID de l'utilisateur (via Clerk)
  teamId: integer('team_id').references(() => teams.id), // Optionnel: pour partager avec l'équipe

  // Infos de base
  name: text('name').notNull(),
  url: text('url').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  industry: text('industry'),
  detectedLanguage: text('detected_language').$type<'fr' | 'en'>(), // Language of the website
  targetAudience: text('target_audience'), // Who this brand targets
  uniqueValueProposition: text('unique_value_proposition'), // Main benefit
  brandStory: text('brand_story'), // Brand origin/mission story

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
  marketingAngles: jsonb('marketing_angles').$type<{ title: string, hook?: string, concept: string, emotionalTension?: string, platform?: string }[]>(),
  backgroundPrompts: jsonb('background_prompts').$type<string[]>(),

  // NOUVEAUX CHAMPS (Workflow V2)
  contentNuggets: jsonb('content_nuggets').$type<{
    realStats: string[],
    testimonials: { quote: string, author: string, company: string }[],
    achievements: string[],
    blogTopics: string[]
  }>(),

  industryInsights: jsonb('industry_insights').$type<{
    fact: string,
    didYouKnow: string,
    source: string
  }[]>(),

  suggestedPosts: jsonb('suggested_posts').$type<{
    templateId: string,
    headline: string,
    subheadline?: string,
    metric?: string,
    metricLabel?: string,
    source: string,
    intent: string
  }[]>(),

  // Editorial Intelligence (V2 Smart Agency)
  editorialAngles: jsonb('editorial_angles').$type<{
    angle: string,
    hook: string,
    targetEmotion: string
  }[]>(),
  editorialHooks: jsonb('editorial_hooks').$type<{
    hook: string,
    subtext: string,
    emotion: string
  }[]>(),
  painPoints: jsonb('pain_points').$type<string[]>(),
  vocabulary: jsonb('vocabulary').$type<string[]>(),

  // Assets (Images scrapées + Textures générées)
  // On stocke tout ici pour simplifier, ou on peut séparer
  labeledImages: jsonb('labeled_images').$type<{ url: string, category: string, description: string }[]>(),
  backgrounds: jsonb('backgrounds').$type<string[]>(), // URLs des textures générées

  // Visual Style (extracted from website screenshot) - Added 2025-12-27
  visualStyle: jsonb('visual_style').$type<{
    designSystem?: string,      // e.g. "Apple-like minimalism"
    backgroundStyle?: string,   // e.g. "Warm off-white/cream"
    heroElement?: string,       // e.g. "3D abstract brain shape"
    whitespace?: string,        // e.g. "Generous/airy"
    corners?: string,           // e.g. "Rounded/soft"
    shadows?: string,           // e.g. "Soft drop shadows"
    gradients?: string          // e.g. "Blue gradient on 3D shapes"
  }>(),

  // Scrape depth tracking (for cost control)
  // 'deep' = full 15-page scrape + socials, 'light' = homepage only
  scrapeDepth: text('scrape_depth').$type<'deep' | 'light'>().default('deep'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table des Campagnes (Projets)
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').references(() => brands.id),
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
  brandId: integer('brand_id').references(() => brands.id),
  campaignId: integer('campaign_id').references(() => campaigns.id), // Optionnel, lié à une campagne
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
  brandId: integer('brand_id').references(() => brands.id),
  campaignId: integer('campaign_id').references(() => campaigns.id), // Lien vers une campagne spécifique
  userId: text('user_id').notNull(), // Pour accès rapide

  type: text('type'), // 'teaser', 'boom', 'social_post', 'edit'
  prompt: text('prompt'), // Le prompt utilisé
  imageUrl: text('image_url').notNull(), // L'image finale

  // Métadonnées
  format: text('format'), // '1:1', '9:16'
  liked: boolean('liked').default(false),
  templateId: text('template_id'), // ID du template utilisé
  brandName: text('brand_name'), // Nom de la marque (dénormalisé pour affichage rapide)

  // Organisation
  folderId: text('folder_id'), // Dossier utilisateur (optionnel)

  // Feedback utilisateur
  feedback: jsonb('feedback').$type<{
    rating: 1 | 2 | 3;
    comment?: string;
    timestamp: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow(),
});

// Table des Dossiers utilisateur (pour organiser les générations)
export const folders = pgTable('folders', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull(), // ID client-side compatible (folder_xxx)
  userId: text('user_id').notNull(),
  brandId: integer('brand_id'), // Optional: link to specific brand
  name: text('name').notNull(),
  color: text('color').default('#6B7280'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// EARLY BIRD SYSTEM
// ============================================

// Daily signup counter for early bird detection (first 30/day get auto-gen)
export const dailySignupCounts = pgTable('daily_signup_counts', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  count: integer('count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Daily deep scrape counter (first 150/day get full scrape, rest get light)
export const dailyDeepScrapeCounts = pgTable('daily_deep_scrape_counts', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  count: integer('count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Batch generation queue (for 24h reactivation feature)
export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const batchGenerationQueue = pgTable('batch_generation_queue', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  brandId: integer('brand_id').references(() => brands.id),
  status: text('status').$type<BatchStatus>().default('pending').notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(), // signup + 24h
  prompt: text('prompt'),
  resultUrl: text('result_url'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

// ============================================
// EMAIL SYSTEM
// ============================================

export type EmailType = 'welcome' | 'engagement' | 'conversion';
export type EmailStatus = 'pending' | 'sent' | 'cancelled' | 'failed';

export const scheduledEmails = pgTable('scheduled_emails', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),

  emailType: text('email_type').$type<EmailType>().notNull(),
  status: text('status').$type<EmailStatus>().default('pending').notNull(),

  scheduledFor: timestamp('scheduled_for').notNull(),
  sentAt: timestamp('sent_at'),

  metadata: jsonb('metadata').$type<{
    generationId?: number;
    generationUrl?: string;
    brandName?: string;
    discountCode?: string;
  }>(),

  error: text('error'),
  attempts: integer('attempts').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
