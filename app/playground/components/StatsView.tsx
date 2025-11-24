'use client';

export default function StatsView() {
  return (
    <div className="animate-fade-in">
      <header className="mb-8">
         <h2 className="text-2xl font-bold mb-1">Performances</h2>
         <p className="text-gray-500 text-sm">Suivez l'impact de vos créations générées par IA.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-black text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
            <h3 className="text-white/60 font-medium mb-2">Engagement Total</h3>
            <div className="text-4xl font-bold mb-2">24.5k</div>
            <div className="text-sm text-green-400 flex items-center gap-1">
               <span>↗</span> +12% ce mois-ci
            </div>
         </div>
         <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
            <h3 className="text-gray-400 font-medium mb-2">Posts Générés</h3>
            <div className="text-4xl font-bold mb-2">142</div>
            <div className="text-sm text-gray-400">
               Dont 85% publiés
            </div>
         </div>
         <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
            <h3 className="text-gray-400 font-medium mb-2">Temps Économisé</h3>
            <div className="text-4xl font-bold mb-2 text-blue-600">120h</div>
            <div className="text-sm text-gray-400">
               ~ 6000€ d'économie agence
            </div>
         </div>
      </div>

      {/* Chart Mockup */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
         <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold">Évolution de l'audience</h3>
            <select className="bg-gray-50 border-none text-sm font-medium rounded-lg p-2 outline-none">
               <option>30 derniers jours</option>
               <option>Cette année</option>
            </select>
         </div>
         
         {/* Fake Chart using CSS */}
         <div className="flex-1 flex items-end gap-4 px-4">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 100].map((h, i) => (
               <div key={i} className="flex-1 bg-gray-50 hover:bg-blue-50 rounded-t-lg relative group transition-colors h-full flex items-end">
                  <div 
                     className="w-full bg-black rounded-t-md transition-all duration-1000 ease-out group-hover:bg-blue-600"
                     style={{ height: `${h}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                     {h * 100} vues
                  </div>
               </div>
            ))}
         </div>
         <div className="flex justify-between text-xs text-gray-400 mt-4 px-2">
            <span>1 Nov</span>
            <span>15 Nov</span>
            <span>30 Nov</span>
         </div>
      </div>
    </div>
  );
}

