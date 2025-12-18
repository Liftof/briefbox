'use client';

import { useState, useEffect } from 'react';
import { CreditsInfo } from '@/lib/useCredits';

interface CalendarViewProps {
   brandId?: number;
   creditsInfo?: CreditsInfo | null;
}

export default function CalendarView({ brandId, creditsInfo }: CalendarViewProps) {
   const [currentDate, setCurrentDate] = useState(new Date());
   const [posts, setPosts] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

   const isPremium = creditsInfo?.plan === 'premium';
   const isPro = creditsInfo?.plan === 'pro';
   const hasCredits = (creditsInfo?.remaining || 0) > 0;


   const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

      return { daysInMonth, startingDay, year, month };
   };

   useEffect(() => {
      if (brandId) {
         fetchPosts();
      }
   }, [brandId, currentDate]);

   const fetchPosts = async () => {
      setLoading(true);
      try {
         const { year, month } = getDaysInMonth(currentDate);
         const start = new Date(year, month, 1).toISOString();
         const end = new Date(year, month + 1, 0).toISOString();

         const res = await fetch(`/api/calendar?brandId=${brandId}&start=${start}&end=${end}`);
         const data = await res.json();
         if (data.success) {
            setPosts(data.posts);
         }
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const changeMonth = (delta: number) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
   };

   const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate);
   const totalSlots = Math.ceil((daysInMonth + startingDay) / 7) * 7;


   const generateCalendar = async () => {
      if (!brandId) return;
      setLoading(true);
      try {
         // Simulate long polling/background job for now (wait for Agent)
         // In prod, this would likely be immediate return + polling
         const res = await fetch('/api/brand/calendar/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               brandId,
               month: currentDate.getMonth(),
               year: currentDate.getFullYear(),
               userPlan: creditsInfo?.plan || 'free' // Pass user plan for Premium logic
            })
         });

         const data = await res.json();
         if (data.success) {
            setPosts(data.data.plan.posts || []); // Update with generated posts
            // Notify user
            alert('Calendar generated! (Check console for raw insights)');
            console.log('Insights:', data.data.research);
         }
      } catch (e) {
         console.error(e);
         alert('Generation failed');
      } finally {
         setLoading(false);
      }
   };

   const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

   const handleGeneratePost = (post: any) => {
      // Stub for generating a single post from an idea
      // In real implementation, this would call the generation API
      // For now, we'll mark it as generated locally to simulate
      const updatedPosts = posts.map(p => {
         if (p === post) {
            return {
               ...p,
               status: 'generated',
               imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
            };
         }
         return p;
      });
      setPosts(updatedPosts);
   };

   return (
      <div className="animate-fade-in h-full flex flex-col relative">
         <header className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-2xl font-bold mb-1">Calendrier Éditorial</h2>
               <p className="text-gray-500 text-sm">Planifiez vos publications pour {monthName}.</p>
            </div>
            <div className="flex gap-2 items-center">
               <div className="flex gap-2 ml-4 border-l pl-4 border-gray-200">
                  <button onClick={() => changeMonth(-1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">←</button>
                  <span className="px-4 py-2 font-bold capitalize min-w-[140px] text-center bg-white border border-gray-200 rounded-lg text-sm flex items-center justify-center">{monthName}</span>
                  <button onClick={() => changeMonth(1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">→</button>
               </div>
            </div>
         </header>

         {/* Empty State Overlay if no posts & not loading */}
         {posts.length === 0 && !loading && (
            <div className="absolute inset-0 top-24 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
               <div className="text-center p-8 bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-md">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🗓️</div>
                  <h3 className="text-xl font-bold mb-2">Votre calendrier est vide</h3>
                  <p className="text-gray-500 mb-6 text-sm">
                     {isPro || isPremium
                        ? "Laissez l'IA générer votre planning éditorial pour ce mois."
                        : "Passez à Pro pour générer un planning éditorial automatique."}
                  </p>
                  <button
                     onClick={() => {
                        if (!hasCredits && !isPremium) {
                           alert("Passez à Pro !");
                           return;
                        }
                        generateCalendar();
                     }}
                     className={`w-full py-3 rounded-xl font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${!hasCredits && !isPremium ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        }`}
                  >
                     {loading ? 'Génération...' : '✨ Créer mon planning'}
                  </button>
               </div>
            </div>
         )}

         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
            {/* Header Days */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
               {days.map((day, i) => (
                  <div key={i} className="py-4 text-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                     {day}
                  </div>
               ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1 overflow-y-auto">
               {Array.from({ length: totalSlots }).map((_, i) => {
                  const dayNum = i - startingDay + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const cellDate = new Date(year, month, dayNum);
                  const isToday = isCurrentMonth && new Date().toDateString() === cellDate.toDateString();

                  // Filter posts for this day
                  const dayPosts = isCurrentMonth ? posts.filter(p => {
                     const d = new Date(p.scheduledDate);
                     return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
                  }) : [];

                  return (
                     <div key={i} className={`border-b border-r border-gray-50 p-2 relative group transition min-h-[140px] flex flex-col gap-2
                        ${!isCurrentMonth ? 'bg-gray-50/20 text-gray-300' : 'bg-white hover:bg-gray-50/30'}
                        ${isToday ? 'bg-blue-50/30 ring-inset ring-2 ring-blue-100' : ''}
                     `}>
                        <div className="flex justify-between items-start">
                           <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : (isCurrentMonth ? 'text-gray-400' : 'text-gray-200')}`}>
                              {isCurrentMonth ? dayNum : ''}
                           </span>
                           {isToday && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-1">Aujourd'hui</span>}
                        </div>

                        {isCurrentMonth && (
                           <div className="space-y-2 overflow-y-auto flex-1 no-scrollbar">
                              {dayPosts.map((post, idx) => {
                                 const isIdea = post.status === 'idea';
                                 return (
                                    <div
                                       key={idx}
                                       className={`p-2 rounded-lg text-xs transition cursor-pointer relative group/card
                                          ${isIdea
                                             ? 'bg-white border-2 border-dashed border-gray-200 hover:border-blue-300 text-gray-500'
                                             : 'bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-700'
                                          }
                                       `}
                                       onClick={() => {
                                          if ((!isPro && !isPremium)) return; // Free users locked
                                          if (isIdea) handleGeneratePost(post);
                                          else alert('Ouvrir preview (TODO)'); // Trigger preview
                                       }}
                                    >
                                       {/* Lock icon for free users */}
                                       {(!isPro && !isPremium) && (
                                          <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                                             🔒
                                          </div>
                                       )}

                                       <div className="flex items-center justify-between mb-1">
                                          <span className="font-bold opacity-70">
                                             {post.platform === 'linkedin' ? 'LI' : post.platform === 'instagram' ? 'IG' : 'X'}
                                          </span>
                                          {/* Status Indicator */}
                                          {isIdea ? (
                                             <span className="w-2 h-2 rounded-full bg-amber-400" />
                                          ) : (
                                             <span className="w-2 h-2 rounded-full bg-green-500" />
                                          )}
                                       </div>

                                       <div className="line-clamp-2 leading-snug">
                                          {isIdea ? (
                                             <span className="italic">"{post.idea}"</span>
                                          ) : (
                                             post.content
                                          )}
                                       </div>

                                       {/* Hover Action (Idea -> Generate) */}
                                       {isIdea && (isPro || isPremium) && (
                                          <div className="absolute inset-0 bg-blue-600/90 text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity rounded-lg font-bold">
                                             ✨ Générer
                                          </div>
                                       )}

                                       {/* Thumbnail for Generated */}
                                       {!isIdea && post.imageUrl && (
                                          <div className="mt-2 h-20 bg-gray-100 rounded overflow-hidden">
                                             <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
                                          </div>
                                       )}
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
}

