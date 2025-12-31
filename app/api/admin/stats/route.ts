import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, brands, generations, dailySignupCounts, dailyDeepScrapeCounts } from '@/db/schema';
import { eq, sql, desc, gte, and, notInArray, asc } from 'drizzle-orm';

// Admin emails allowed to access this endpoint
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'pierrebaptiste.borges@gmail.com',
].filter(Boolean);

// Test accounts to exclude from stats
const TEST_EMAILS = [
  'pierrebaptiste.borges@gmail.com',
  'pb.borges@odace.media',
  'pb@odace.com',
];

// Cost constants (updated pricing)
const COSTS = {
  gemini: {
    perImage: 0.134,        // $0.134 per image (1K/2K output)
    perImage4K: 0.24,       // $0.24 per 4K image
  },
  firecrawl: {
    perScrape: 0.005,       // ~$0.005 per scrape (Hobby: $16/3000)
    perMap: 0.005,
    perExtract: 0.01,
    perDeepScrape: 0.05,    // ~10 credits per deep scrape
  },
  openrouter: {
    haikuPer1kTokens: 0.00125,   // Claude Haiku output
    sonnetPer1kTokens: 0.015,    // Claude Sonnet output (fallback)
    avgTokensPerAnalysis: 500,
  },
  vercel: {
    proMonthly: 20,
    blobPerGB: 0.15,
  },
  other: {
    upstashPerRequest: 0.000002,
    resendPerEmail: 0.0004,
    clerkPerMAU: 0.02,
    clerkFreeMAU: 10000,
  },
};

export async function GET() {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Date calculations
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all stats in parallel
    const [
      totalUsers,
      usersByPlan,
      totalBrands,
      totalGenerations,
      generationsThisMonth,
      generationsToday,
      generationsLast7Days,
      recentSignups,
      recentDeepScrapes,
      allSignups,
      allDeepScrapes,
      dailySignupsData,
      dailyGenerationsData,
      // New queries
      userList,
      earlyBirdCount,
      deepScrapesBrands,
      lightScrapesBrands,
      signupsTodayCount,
    ] = await Promise.all([
      // Total users (excluding test accounts)
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(notInArray(users.email, TEST_EMAILS)),

      // Users by plan (excluding test accounts)
      db.select({
        plan: users.plan,
        count: sql<number>`count(*)`,
      })
        .from(users)
        .where(notInArray(users.email, TEST_EMAILS))
        .groupBy(users.plan),

      // Total brands (excluding test accounts)
      db.select({ count: sql<number>`count(*)` })
        .from(brands)
        .where(notInArray(brands.userId,
          db.select({ clerkId: users.clerkId }).from(users).where(sql`${users.email} IN (${TEST_EMAILS.map(e => `'${e}'`).join(',')})`)
        )),

      // Total generations (all time)
      db.select({ count: sql<number>`count(*)` }).from(generations),

      // Generations this month
      db.select({ count: sql<number>`count(*)` })
        .from(generations)
        .where(gte(generations.createdAt, startOfMonth)),

      // Generations today
      db.select({ count: sql<number>`count(*)` })
        .from(generations)
        .where(sql`DATE(${generations.createdAt}) = ${today}`),

      // Generations last 7 days
      db.select({ count: sql<number>`count(*)` })
        .from(generations)
        .where(gte(generations.createdAt, sevenDaysAgo)),

      // Recent signups (last 7 days)
      db.select()
        .from(dailySignupCounts)
        .orderBy(desc(dailySignupCounts.date))
        .limit(7),

      // Recent deep scrapes (last 7 days)
      db.select()
        .from(dailyDeepScrapeCounts)
        .orderBy(desc(dailyDeepScrapeCounts.date))
        .limit(7),

      // All signups (for total)
      db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
        .from(dailySignupCounts),

      // All deep scrapes (for total)
      db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
        .from(dailyDeepScrapeCounts),

      // Daily signups for chart (last 30 days)
      db.select()
        .from(dailySignupCounts)
        .orderBy(desc(dailySignupCounts.date))
        .limit(30),

      // Daily generations for chart (last 30 days)
      db.select({
        date: sql<string>`DATE(${generations.createdAt})`,
        count: sql<number>`count(*)`,
      })
        .from(generations)
        .where(gte(generations.createdAt, thirtyDaysAgo))
        .groupBy(sql`DATE(${generations.createdAt})`)
        .orderBy(desc(sql`DATE(${generations.createdAt})`)),

      // User list (excluding test accounts, ordered by signup date desc)
      db.select({
        email: users.email,
        name: users.name,
        plan: users.plan,
        isEarlyBird: users.isEarlyBird,
        createdAt: users.createdAt,
      })
        .from(users)
        .where(notInArray(users.email, TEST_EMAILS))
        .orderBy(desc(users.createdAt))
        .limit(100),

      // Early bird count (excluding test accounts)
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.isEarlyBird, true),
          notInArray(users.email, TEST_EMAILS)
        )),

      // Deep scrapes count from brands
      db.select({ count: sql<number>`count(*)` })
        .from(brands)
        .where(eq(brands.scrapeDepth, 'deep')),

      // Light scrapes count from brands
      db.select({ count: sql<number>`count(*)` })
        .from(brands)
        .where(eq(brands.scrapeDepth, 'light')),

      // Today's signup count from daily counter
      db.select()
        .from(dailySignupCounts)
        .where(eq(dailySignupCounts.date, today))
        .limit(1),
    ]);

    // Extract counts
    const totalGens = Number(totalGenerations[0]?.count || 0);
    const gensThisMonth = Number(generationsThisMonth[0]?.count || 0);
    const gensToday = Number(generationsToday[0]?.count || 0);
    const gensLast7Days = Number(generationsLast7Days[0]?.count || 0);
    const totalUserCount = Number(totalUsers[0]?.count || 0);
    const totalBrandCount = Number(totalBrands[0]?.count || 0);

    const signupsToday = recentSignups.find(s => s.date === today)?.count || 0;
    const signupsLast7Days = recentSignups.reduce((sum, d) => sum + d.count, 0);
    const signupsThisMonth = Number(allSignups[0]?.total || 0);

    const deepScrapesToday = recentDeepScrapes.find(s => s.date === today)?.count || 0;
    const deepScrapesLast7Days = recentDeepScrapes.reduce((sum, d) => sum + d.count, 0);
    const deepScrapesTotal = Number(allDeepScrapes[0]?.total || 0);

    // Calculate detailed costs
    const costs = {
      // Gemini costs
      gemini: {
        today: gensToday * COSTS.gemini.perImage,
        last7Days: gensLast7Days * COSTS.gemini.perImage,
        thisMonth: gensThisMonth * COSTS.gemini.perImage,
        allTime: totalGens * COSTS.gemini.perImage,
        perImage: COSTS.gemini.perImage,
      },
      // Firecrawl costs
      firecrawl: {
        today: deepScrapesToday * COSTS.firecrawl.perDeepScrape,
        last7Days: deepScrapesLast7Days * COSTS.firecrawl.perDeepScrape,
        thisMonth: deepScrapesTotal * COSTS.firecrawl.perDeepScrape, // Approximation
        perDeepScrape: COSTS.firecrawl.perDeepScrape,
      },
      // OpenRouter costs (estimated based on brand analyses)
      openrouter: {
        // Assume ~1 analysis per brand with Haiku for editorial angles
        estimated: totalBrandCount * COSTS.openrouter.avgTokensPerAnalysis * COSTS.openrouter.haikuPer1kTokens / 1000,
        perAnalysis: COSTS.openrouter.avgTokensPerAnalysis * COSTS.openrouter.haikuPer1kTokens / 1000,
      },
      // Fixed costs
      fixed: {
        vercelPro: COSTS.vercel.proMonthly,
        upstash: 0, // Free tier likely sufficient
        resend: Math.max(0, (signupsThisMonth - 3000) * COSTS.other.resendPerEmail),
        clerk: Math.max(0, (totalUserCount - COSTS.other.clerkFreeMAU) * COSTS.other.clerkPerMAU),
      },
      // Totals
      totals: {
        today: 0,
        last7Days: 0,
        thisMonth: 0,
        allTime: 0,
        projectedMonth: 0,
      },
    };

    // Calculate totals
    costs.totals.today = costs.gemini.today + costs.firecrawl.today;
    costs.totals.last7Days = costs.gemini.last7Days + costs.firecrawl.last7Days;
    costs.totals.thisMonth = costs.gemini.thisMonth + costs.firecrawl.thisMonth +
                              costs.fixed.vercelPro + costs.fixed.resend + costs.fixed.clerk;
    costs.totals.allTime = costs.gemini.allTime + costs.openrouter.estimated;

    // Project monthly cost based on current rate
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    costs.totals.projectedMonth = (costs.totals.thisMonth / dayOfMonth) * daysInMonth;

    // Format response
    const stats = {
      timestamp: now.toISOString(),
      users: {
        total: totalUserCount,
        byPlan: {
          free: Number(usersByPlan.find(p => p.plan === 'free')?.count || 0),
          pro: Number(usersByPlan.find(p => p.plan === 'pro')?.count || 0),
          premium: Number(usersByPlan.find(p => p.plan === 'premium')?.count || 0),
        },
      },
      brands: {
        total: totalBrandCount,
      },
      generations: {
        total: totalGens,
        thisMonth: gensThisMonth,
        last7Days: gensLast7Days,
        today: gensToday,
      },
      signups: {
        today: signupsToday,
        last7Days: signupsLast7Days,
        thisMonth: signupsThisMonth,
      },
      deepScrapes: {
        today: deepScrapesToday,
        last7Days: deepScrapesLast7Days,
        total: deepScrapesTotal,
      },
      costs,
      charts: {
        dailySignups: dailySignupsData.reverse().map(d => ({
          date: d.date,
          count: d.count,
        })),
        dailyGenerations: dailyGenerationsData.reverse().map(d => ({
          date: d.date,
          count: Number(d.count),
        })),
      },
      limits: {
        capacityLimit: 300,
        deepScrapeLimit: 150,
        earlyBirdLimit: 30,
        // Current usage
        signupsTodayFromCounter: signupsTodayCount[0]?.count || 0,
        deepScrapesTodayFromCounter: deepScrapesToday,
        earlyBirdsTotal: Number(earlyBirdCount[0]?.count || 0),
        // Scrape breakdown
        deepScrapesAllTime: Number(deepScrapesBrands[0]?.count || 0),
        lightScrapesAllTime: Number(lightScrapesBrands[0]?.count || 0),
        // Time until reset (midnight UTC)
        resetIn: (() => {
          const nowUTC = new Date();
          const midnightUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate() + 1, 0, 0, 0));
          const msUntilReset = midnightUTC.getTime() - nowUTC.getTime();
          const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
          const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
          return { hours, minutes, ms: msUntilReset };
        })(),
      },
      // User list (last 100)
      userList: userList.map(u => ({
        email: u.email,
        name: u.name,
        plan: u.plan,
        isEarlyBird: u.isEarlyBird,
        createdAt: u.createdAt?.toISOString(),
      })),
      pricing: COSTS,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
