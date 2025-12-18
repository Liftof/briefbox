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
   const hasCredits = (creditsInfo?.creditsRemaining || 0) > 0;


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

   return (
      <div className="animate-fade-in h-full flex flex-col">
         <header className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-2xl font-bold mb-1">Calendrier Éditorial</h2>
               <p className="text-gray-500 text-sm">Planifiez vos publications pour {monthName}.</p>
            </div>
            <div className="flex gap-2 items-center">
               {/* GENERATE BUTTON */}
               <button
                  onClick={() => {
                     if (!hasCredits && !isPremium) {
                        alert('Crédits insuffisants. Passez à Pro !');
                        return;
                     }
                     generateCalendar();
                  }}
                  disabled={loading || (!hasCredits && !isPremium)}
                  className={`px-4 py-2 font-medium rounded-lg shadow-lg transition-all flex items-center gap-2 ${loading || (!hasCredits && !isPremium)
                     ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                     : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-indigo-500/30'
                     }`}
               >
                  {loading ? (
                     <>
                        <span className="animate-spin">⏳</span> Recherche...
                     </>
                  ) : (
                     <>
                        <span>✨</span> Générer {isPremium ? '(2 gratuits)' : '(1 crédit)'}
                     </>
                  )}
               </button>

               <div className="flex gap-2 ml-4 border-l pl-4 border-gray-200">
                  <button onClick={() => changeMonth(-1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">←</button>
                  <span className="px-4 py-2 font-bold capitalize min-w-[140px] text-center bg-white border border-gray-200 rounded-lg text-sm flex items-center justify-center">{monthName}</span>
                  <button onClick={() => changeMonth(1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">→</button>
               </div>
            </div>
         </header>

         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
            {/* ... Rest of existing code ... */}
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

                  // Filter posts for this day
                  const dayPosts = isCurrentMonth ? posts.filter(p => {
                     const d = new Date(p.scheduledDate);
                     return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
                  }) : [];

                  return (
                     <div key={i} className={`border-b border-r border-gray-50 p-2 relative group hover:bg-gray-50/30 transition min-h-[120px] ${!isCurrentMonth ? 'bg-gray-50/20 text-gray-300' : 'bg-white'}`}>
                        <div className={`text-xs font-medium mb-2 ${isCurrentMonth ? 'text-gray-400' : 'text-gray-200'}`}>
                           {isCurrentMonth ? dayNum : ''}
                        </div>

                        {isCurrentMonth && (
                           <div className="space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                              {dayPosts.map((post, idx) => (
                                 <div key={idx} className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-700 hover:scale-105 transition cursor-pointer shadow-sm group/post">
                                    <div className="flex items-center justify-between mb-0.5">
                                       <span>{new Date(post.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                       <span>{post.platform === 'instagram' ? '📸' : post.platform === 'linkedin' ? '💼' : '📱'}</span>
                                    </div>
                                    <div className="truncate opacity-80 group-hover/post:opacity-100">{post.content || 'Sans titre'}</div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {isCurrentMonth && (
                           <button
                              className="absolute bottom-2 right-2 w-6 h-6 bg-black text-white rounded-full items-center justify-center text-lg hidden group-hover:flex shadow-lg hover:scale-110 transition z-10"
                              title="Ajouter un post"
                           >
                              +
                           </button>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
}

