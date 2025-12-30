import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, brands, generations, dailySignupCounts, dailyDeepScrapeCounts } from '@/db/schema';
import { eq, sql, desc, gte } from 'drizzle-orm';

// Admin emails allowed to access this endpoint
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'pierrebaptiste.borges@gmail.com',
].filter(Boolean);

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

    // Get date for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all stats in parallel
    const [
      totalUsers,
      usersByPlan,
      totalBrands,
      totalGenerations,
      generationsLast30Days,
      recentSignups,
      recentDeepScrapes,
      dailySignupsData,
      dailyGenerationsData,
    ] = await Promise.all([
      // Total users
      db.select({ count: sql<number>`count(*)` }).from(users),

      // Users by plan
      db.select({
        plan: users.plan,
        count: sql<number>`count(*)`,
      }).from(users).groupBy(users.plan),

      // Total brands
      db.select({ count: sql<number>`count(*)` }).from(brands),

      // Total generations
      db.select({ count: sql<number>`count(*)` }).from(generations),

      // Generations last 30 days
      db.select({ count: sql<number>`count(*)` })
        .from(generations)
        .where(gte(generations.createdAt, thirtyDaysAgo)),

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
    ]);

    // Calculate costs
    const totalGens = Number(totalGenerations[0]?.count || 0);
    const gensLast30 = Number(generationsLast30Days[0]?.count || 0);
    const totalDeepScrapes = recentDeepScrapes.reduce((sum, d) => sum + d.count, 0);

    // Cost estimates
    const GEMINI_COST_PER_IMAGE = 0.134;
    const FIRECRAWL_COST_PER_SCRAPE = 0.05; // Rough estimate

    const estimatedCosts = {
      geminiLast30Days: gensLast30 * GEMINI_COST_PER_IMAGE,
      geminiTotal: totalGens * GEMINI_COST_PER_IMAGE,
      firecrawlLast7Days: totalDeepScrapes * FIRECRAWL_COST_PER_SCRAPE,
    };

    // Format response
    const stats = {
      users: {
        total: Number(totalUsers[0]?.count || 0),
        byPlan: {
          free: Number(usersByPlan.find(p => p.plan === 'free')?.count || 0),
          pro: Number(usersByPlan.find(p => p.plan === 'pro')?.count || 0),
          premium: Number(usersByPlan.find(p => p.plan === 'premium')?.count || 0),
        },
      },
      brands: {
        total: Number(totalBrands[0]?.count || 0),
      },
      generations: {
        total: totalGens,
        last30Days: gensLast30,
      },
      signups: {
        today: recentSignups.find(s => s.date === new Date().toISOString().split('T')[0])?.count || 0,
        last7Days: recentSignups.reduce((sum, d) => sum + d.count, 0),
      },
      deepScrapes: {
        today: recentDeepScrapes.find(s => s.date === new Date().toISOString().split('T')[0])?.count || 0,
        last7Days: totalDeepScrapes,
      },
      costs: {
        estimatedLast30Days: estimatedCosts.geminiLast30Days + estimatedCosts.firecrawlLast7Days * 4,
        breakdown: estimatedCosts,
      },
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
      },
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
