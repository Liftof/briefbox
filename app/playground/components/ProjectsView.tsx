'use client';

import { useState } from 'react';

export default function ProjectsView() {
  const [filter, setFilter] = useState('all');
  
  const projects = [
    { id: 1, name: 'Campagne Été 2025', type: 'Campagne', date: 'Il y a 2h', status: 'active', thumbnails: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'] },
    { id: 2, name: 'Lancement Produit Bio', type: 'Social Media', date: 'Hier', status: 'completed', thumbnails: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'] },
    { id: 3, name: 'Black Friday', type: 'Ads', date: 'Il y a 3j', status: 'draft', thumbnails: [] },
  ];

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-bold mb-1">Mes Projets</h2>
           <p className="text-gray-500 text-sm">Gérez vos campagnes et créations.</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition">+ Nouveau Projet</button>
      </header>

      <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4">
         {['all', 'active', 'completed', 'draft'].map(f => (
            <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`text-sm font-medium capitalize ${filter === f ? 'text-black' : 'text-gray-400 hover:text-black'}`}
            >
               {f === 'all' ? 'Tous' : f}
            </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {projects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer group">
               <div className="flex justify-between items-start mb-4">
                  <div className="px-2 py-1 bg-gray-50 rounded-md text-[10px] font-bold uppercase text-gray-500">{project.type}</div>
                  <button className="text-gray-300 hover:text-black">•••</button>
               </div>
               
               <div className="aspect-video bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative">
                  {project.thumbnails.length > 0 ? (
                     <img src={project.thumbnails[0]} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                     <span className="text-2xl">📁</span>
                  )}
                  {project.thumbnails.length > 1 && (
                     <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur text-white text-xs rounded-full font-bold">
                        +{project.thumbnails.length - 1}
                     </div>
                  )}
               </div>

               <h3 className="font-bold text-lg mb-1">{project.name}</h3>
               <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Mis à jour : {project.date}</span>
                  <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500' : project.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}

