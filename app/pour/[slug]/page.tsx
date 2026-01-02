import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getServerLocale } from '@/lib/i18n-server';
import { getTarget, getAllTargetSlugs } from '@/lib/seo/targets';
import TargetPage from '@/components/seo/TargetPage';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all target pages
export async function generateStaticParams() {
  const slugs = getAllTargetSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = getTarget(slug);

  if (!data) {
    return {
      title: 'Page not found',
    };
  }

  // Default to French for static generation, will be overridden client-side
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || 'fr';
  const locale = getServerLocale(acceptLanguage);
  const meta = data.meta[locale];

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      siteName: 'Palette',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `https://usepalette.app/pour/${slug}`,
    },
  };
}

// Generate JSON-LD structured data for FAQ
function generateFAQSchema(data: ReturnType<typeof getTarget>, locale: 'fr' | 'en') {
  if (!data) return null;

  const faq = data.faq[locale];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export default async function PourPage({ params }: Props) {
  const { slug } = await params;
  const data = getTarget(slug);

  if (!data) {
    notFound();
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || 'fr';
  const locale = getServerLocale(acceptLanguage);

  const faqSchema = generateFAQSchema(data, locale);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <TargetPage data={data} />
    </>
  );
}
