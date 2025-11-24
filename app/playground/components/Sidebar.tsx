'use client';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  brandData, 
  onEditBrand 
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  brandData?: any,
  onEditBrand?: () => void
}) {
  const menuItems = [
    { id: 'create', icon: '✨', label: 'Créer', disabled: false },
    { id: 'projects', icon: '📂', label: 'Projets', disabled: false },
    { id: 'calendar', icon: '📅', label: 'Calendrier', disabled: false },
    { id: 'stats', icon: '📊', label: 'Statistiques', disabled: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#ECECEC] h-screen fixed left-0 top-0 z-40 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-12 px-2">
           <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
           </div>
           <span className="font-bold text-xl tracking-tight">QuitteTonAgence</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.disabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : activeTab === item.id 
                      ? 'bg-black text-white shadow-lg shadow-black/20 scale-105' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
              
              {item.disabled && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Bientôt dispo
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Brand Card / Mini Bento */}
      {brandData ? (
        <div 
          className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-black transition-colors group"
          onClick={onEditBrand}
        >
           <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ma Marque</span>
              <span className="text-xs text-gray-300 group-hover:text-black">✎</span>
           </div>
           <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-100">
                 {brandData.logo ? (
                   <img src={brandData.logo} className="w-full h-full object-contain" />
                 ) : (
                   <span className="text-lg">🏢</span>
                 )}
              </div>
              <div className="overflow-hidden">
                 <div className="font-bold text-sm truncate">{brandData.name}</div>
                 <div className="text-[10px] text-gray-500 truncate">{brandData.tagline}</div>
              </div>
           </div>
           <div className="flex gap-1">
              {brandData.colors?.slice(0, 4).map((c: string, i: number) => (
                 <div key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c }}></div>
              ))}
           </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
              <div>
                 <div className="text-xs font-bold">Mon Espace</div>
                 <div className="text-[10px] text-gray-500">Free Plan</div>
              </div>
           </div>
           <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-black w-[75%] rounded-full"></div>
           </div>
           <div className="text-[10px] text-gray-400">75/100 crédits utilisés</div>
        </div>
      )}
    </aside>
  );
}
