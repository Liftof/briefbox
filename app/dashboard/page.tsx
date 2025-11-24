import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <p>Veuillez vous connecter pour accéder à vos marques.</p>
      </div>
    );
  }

  const userBrands = await db.query.brands.findMany({
    where: eq(brands.userId, userId),
    orderBy: [desc(brands.createdAt)],
  });

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#414141]">
      <Navigation />
      
      <main className="max-w-6xl mx-auto pt-32 px-6">
        <div className="flex items-center justify-between mb-12">
            <h1 className="text-4xl font-black tracking-tight">Mes Marques</h1>
            <Link 
                href="/playground" 
                className="bg-black text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
            >
                + Nouvelle Analyse
            </Link>
        </div>

        {userBrands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {userBrands.map((brand) => (
                    <Link 
                        key={brand.id} 
                        href={`/playground?brandId=${brand.id}`}
                        className="group bg-white rounded-[24px] border border-gray-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1 block"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                {brand.logo ? (
                                    <img src={brand.logo} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-xl">🏢</span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{new Date(brand.createdAt!).toLocaleDateString()}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">{brand.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{brand.description || 'Aucune description'}</p>
                        
                        <div className="flex gap-2">
                            {/* @ts-ignore */}
                            {brand.colors?.slice(0, 4).map((c, i) => (
                                <div key={i} className="w-6 h-6 rounded-full ring-1 ring-black/5" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-300">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-2">C'est un peu vide ici</h3>
                <p className="text-gray-500 mb-8">Commencez par analyser votre première marque.</p>
                <Link 
                    href="/playground" 
                    className="bg-black text-white px-8 py-4 rounded-full font-bold"
                >
                    Lancer une analyse
                </Link>
            </div>
        )}
      </main>
    </div>
  );
}

