'use client';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  brandData, 
  onEditBrand,
  isCollapsed,
  toggleCollapse
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  brandData?: any,
  onEditBrand?: () => void,
  isCollapsed: boolean,
  toggleCollapse: () => void
}) {
  const menuItems = [
    { id: 'create', icon: '✨', label: 'Créer', disabled: false },
    { id: 'projects', icon: '📂', label: 'Projets', disabled: false },
    { id: 'calendar', icon: '📅', label: 'Calendrier', disabled: false },
    { id: 'stats', icon: '📊', label: 'Statistiques', disabled: true },
  ];

  return (
    <aside 
      className={`fixed left-4 top-4 bottom-4 bg-white rounded-[32px] border border-[#ECECEC] shadow-2xl z-40 flex flex-col justify-between transition-all duration-300 ease-out ${
        isCollapsed ? 'w-[88px] p-4' : 'w-[280px] p-6'
      }`}
    >
      {/* Collapse Toggle */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 w-6 h-6 bg-white border border-[#ECECEC] rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:scale-110 transition-all shadow-sm z-50"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      <div>
        <div className={`flex items-center gap-3 mb-10 transition-all ${isCollapsed ? 'justify-center' : 'px-2'}`}>
           <div className="w-10 h-10 bg-black rounded-full flex-shrink-0 flex items-center justify-center shadow-md shadow-black/20">
              <span className="text-white text-sm font-bold">Q</span>
           </div>
           <span className={`font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
             QuitteTonAgence
           </span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isCollapsed 
                    ? 'w-14 h-14 justify-center p-0 mx-auto' 
                    : 'w-full px-4 py-3.5'
                } ${
                  item.disabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : activeTab === item.id 
                      ? 'bg-black text-white shadow-lg shadow-black/20' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </button>
              
              {item.disabled && !isCollapsed && (
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
          className={`bg-white rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-black hover:shadow-md transition-all group overflow-hidden ${
            isCollapsed ? 'p-2 aspect-square flex flex-col items-center justify-center gap-1' : 'p-4'
          }`}
          onClick={onEditBrand}
        >
           {!isCollapsed && (
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ma Marque</span>
                <span className="text-xs text-gray-300 group-hover:text-black transition-colors">✎</span>
             </div>
           )}
           
           <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : 'mb-3'}`}>
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center p-1 border border-gray-100 flex-shrink-0">
                 {brandData.logo ? (
                   <img src={brandData.logo} className="w-full h-full object-contain" />
                 ) : (
                   <span className="text-lg">🏢</span>
                 )}
              </div>
              
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                 <div className="font-bold text-sm truncate">{brandData.name}</div>
                 <div className="text-[10px] text-gray-500 truncate">{brandData.tagline || 'Aucun slogan'}</div>
              </div>
           </div>

           {!isCollapsed && (
             <div className="flex gap-1.5">
                {brandData.colors?.slice(0, 5).map((c: string, i: number) => (
                   <div key={i} className="w-5 h-5 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: c }}></div>
                ))}
             </div>
           )}
        </div>
      ) : (
        <div className={`bg-gray-50 rounded-2xl border border-gray-100 transition-all ${isCollapsed ? 'p-3 flex flex-col items-center' : 'p-4'}`}>
           <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'mb-3'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/20 flex-shrink-0"></div>
              <div className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                 <div className="text-xs font-bold">Free Plan</div>
                 <div className="text-[10px] text-gray-500">75/100 crédits</div>
              </div>
           </div>
           
           {!isCollapsed && (
             <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-black w-[75%] rounded-full"></div>
             </div>
           )}
        </div>
      )}
    </aside>
  );
}