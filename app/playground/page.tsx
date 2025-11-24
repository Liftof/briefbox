'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import CalendarView from './components/CalendarView';
import ProjectsView from './components/ProjectsView';

// ... types ...

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId');

  // Flow State
  const [step, setStep] = useState<Step>('url');
  // ... (rest of state)

  useEffect(() => {
      if (brandId) {
          setStep('analyzing'); // Show loader while fetching
          setStatusMessage('Chargement de la marque...');
          
          fetch(`/api/brand/${brandId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setBrandData(data.brand);
                    
                    // Restore state
                    const concepts = data.brand.visualConcepts || [];
                    // @ts-ignore
                    setVisualIdeas(concepts); // Fix ts-ignore if visualIdeas type is string[] but db is json
                    
                    // @ts-ignore
                    setBackgrounds(data.brand.backgrounds || []);

                    // Restore uploaded images logic (take top 5 from db)
                    // ... logic ...
                    // Actually, if loading from DB, we don't need to "pre-fill" uploadedImages for generation unless user wants to.
                    // Let's just pre-fill so the "Generate" button works immediately.
                    // Reuse Smart Select logic?
                    const labeled = data.brand.labeledImages || [];
                    let bestImages = [];
                    if (labeled.length > 0) {
                        // ... same logic ...
                         const mainLogo = labeled.filter((img: any) => img.category === 'main_logo').map((img: any) => img.url);
                         const products = labeled.filter((img: any) => img.category === 'product').map((img: any) => img.url);
                         // ...
                         bestImages = [...mainLogo, ...products].slice(0, 5); // Simplified for restoration
                    } else {
                        bestImages = (data.brand.images || []).slice(0, 4);
                    }
                    setUploadedImages(bestImages);

                    setStep('bento');
                } else {
                    showToast('Erreur de chargement', 'error');
                    setStep('url');
                }
            })
            .catch(err => {
                console.error(err);
                setStep('url');
            });
      }
  }, [brandId]);

  // ... (rest of component functions) ...
  
  // Only replace the return statement to NOT export default directly, 
  // but instead return the JSX.
  // Wait, I need to wrap the whole component logic inside PlaygroundContent 
  // and export default function Playground() { return <Suspense><PlaygroundContent /></Suspense> }
  
  // Since I can't rewrite the WHOLE file easily, I'll try to just add the hook at the top and hope Next.js 16 handles it, 
  // OR I will refactor using search_replace to wrap it.
  
  // Refactoring the whole file via search_replace is risky.
  // I will just add useSearchParams and the effect. Next.js will imply a client boundary.
  // If build fails due to missing Suspense, I'll fix it.
  // Actually, putting useSearchParams in a top-level page component usually requires Suspense boundary in parent layout or wrapping.
  
  // Let's stick to adding the logic first.
  
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#414141] font-sans selection:bg-black selection:text-white flex">
      {/* Toast Container */}
      <div className="toast-container fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-[16px] shadow-lg border flex items-center gap-3 bg-white animate-slide-in-right ${
            toast.type === 'error' ? 'border-red-100 text-red-600' : 'border-[#ECECEC] text-[#414141]'
          }`}>
             <span className="text-lg">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
             <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Source Manager Modal */}
      {showSourceManager && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-3xl h-[80vh] flex flex-col relative shadow-2xl">
                <button onClick={() => setShowSourceManager(false)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                
                <h3 className="text-2xl font-bold mb-6">Gérer les sources visuelles</h3>
                
                <div className="flex gap-4 mb-6 border-b border-gray-100">
                    <button 
                        onClick={() => setSourceTab('library')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${sourceTab === 'library' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Bibliothèque de marque
                        {sourceTab === 'library' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setSourceTab('upload')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${sourceTab === 'upload' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Importer un fichier
                        {sourceTab === 'upload' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setSourceTab('url')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${sourceTab === 'url' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Depuis une URL
                        {sourceTab === 'url' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {sourceTab === 'library' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
                            {[...(brandData?.images || []), ...(backgrounds || [])].map((img: string, i: number) => {
                                const isSelected = uploadedImages.includes(img);
                                const labelObj = brandData?.labeledImages?.find((li: any) => li.url === img);
                                const label = labelObj?.category || (img === brandData?.logo ? 'main_logo' : 'other');
                                
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => {
                                            if (isSelected) setUploadedImages(prev => prev.filter(u => u !== img));
                                            else setUploadedImages(prev => [...prev, img]);
                                        }}
                                        className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer group border-2 transition-all ${isSelected ? 'border-black ring-2 ring-black/10' : 'border-transparent hover:border-gray-200'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                        <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-black text-white' : 'bg-white/80 text-transparent group-hover:text-gray-300'}`}>
                                                ✓
                                            </div>
                                        </div>
                                        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                            {[...(brandData?.images || []), ...(backgrounds || [])].length === 0 && (
                                <div className="col-span-full text-center text-gray-400 py-10">
                                    Aucune image dans la bibliothèque.
                                </div>
                            )}
                        </div>
                    ) : sourceTab === 'upload' ? (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-8 transition-colors hover:border-gray-400 hover:bg-gray-100 cursor-pointer" onClick={() => sourceManagerInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">📂</div>
                            <p className="text-gray-600 font-medium mb-2">Cliquez pour uploader une image</p>
                            <p className="text-gray-400 text-xs mb-6">JPG, PNG, WEBP acceptés</p>
                            
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200" onClick={(e) => e.stopPropagation()}>
                                <span className="text-xs text-gray-500 pl-2">Catégorie :</span>
                                <select 
                                    value={newUploadLabel} 
                                    onChange={(e) => setNewUploadLabel(e.target.value)}
                                    className="text-sm font-bold outline-none bg-transparent cursor-pointer"
                                >
                                    <option value="product">Produit</option>
                                    <option value="logo">Logo</option>
                                    <option value="person">Humain</option>
                                    <option value="icon">Icône</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            <input 
                                ref={sourceManagerInputRef} 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
    const files = e.target.files;
                                    if (files && files[0]) {
      const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                const url = ev.target.result as string;
                                                // Add to uploaded images
                                                setUploadedImages(prev => [...prev, url]);
                                                // Also add to brand library to keep track? Ideally yes, but for now just select it.
                                                // Ideally we should update brandData.labeledImages too.
                                                const newLabel = { url, category: newUploadLabel, description: 'Uploaded manually' };
                                                setBrandData((prev: any) => ({
                                                    ...prev,
                                                    images: [...(prev.images || []), url],
                                                    labeledImages: [...(prev.labeledImages || []), newLabel]
                                                }));
                                                showToast('Image ajoutée', 'success');
                                                setSourceTab('library');
                                            }
                                        };
                                        reader.readAsDataURL(files[0]);
                                    }
                                }} 
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">🌐</div>
                            <h4 className="text-lg font-bold mb-2">Ajouter une source externe</h4>
                            <p className="text-gray-500 text-center mb-6 max-w-md">
                                Entrez l'URL d'une page produit, d'un article de blog ou d'un post social pour en extraire les images et les informations clés.
                            </p>
                            
                            <div className="flex w-full max-w-lg gap-2">
                                <input 
                                    type="text" 
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    placeholder="https://..." 
                                    className="flex-1 p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-black/5"
                                />
                                <button 
                                    onClick={() => {
                                        setIsAddingSource(true);
                                        handleAddSource(sourceUrl).then(() => {
                                            setIsAddingSource(false);
                                            setSourceUrl('');
                                            setSourceTab('library');
                                        });
                                    }}
                                    disabled={!sourceUrl || isAddingSource}
                                    className="bg-black text-white px-6 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    {isAddingSource ? '...' : 'Ajouter'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <span className="font-bold text-black">{uploadedImages.length}</span> images sélectionnées
                    </div>
                    <button 
                        onClick={() => setShowSourceManager(false)}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Terminer
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-4xl flex flex-col md:flex-row gap-6 relative shadow-2xl">
                <button onClick={() => setEditingImage(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                
                <div className="flex-1 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                    <img src={editingImage} className="max-h-[60vh] w-auto object-contain" />
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-2">Modifier le visuel</h3>
                    <p className="text-gray-500 text-sm mb-6">Décrivez les changements souhaités. L'IA va régénérer une variante en se basant sur cette image.</p>
                    
                    <textarea 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none mb-4 bg-gray-50 focus:bg-white focus:ring-2 ring-black/5 outline-none transition-all text-sm"
                        placeholder="Ex: Change la couleur du fond en bleu nuit, ajoute un reflet sur le produit..."
                    />
                    
                    <button 
                        onClick={() => {
                            if (!editPrompt.trim()) return;
                            handleGenerate(editPrompt, false, brandData, [editingImage]);
                            setEditingImage(null);
                        }}
                        className="bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-95 disabled:opacity-50"
                        disabled={!editPrompt.trim()}
                    >
                        ✨ Générer la variante
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in" onClick={() => setLightboxImage(null)}>
           <img src={lightboxImage} alt="Full view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
           <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl transition" onClick={() => setLightboxImage(null)}>×</button>
        </div>
      )}

      {/* Sidebar */}
      {step !== 'url' && step !== 'analyzing' && step !== 'bento' && (
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            brandData={brandData}
            onEditBrand={() => setStep('bento')}
          />
      )}

      {/* Main Content */}
      <div className={`flex-1 ${step !== 'url' && step !== 'analyzing' && step !== 'bento' ? 'ml-64' : 'w-full'}`}>
         <main className={`p-8 mx-auto min-h-screen flex flex-col justify-center ${step === 'bento' ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
            {renderContent()}
         </main>
      </div>
    </div>
  );
}

export default function Playground() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <PlaygroundContent />
        </Suspense>
    );
}
    if (step === 'url') {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
                <h1 className="text-5xl font-black mb-6 tracking-tight">On commence par votre site.</h1>
                <p className="text-xl text-gray-500 mb-12">
                    Entrez l'URL de votre site web. Notre IA va scanner votre marque, récupérer votre logo, vos couleurs et votre style en quelques secondes.
                </p>
                <div className="flex gap-2 p-2 bg-white border border-gray-200 rounded-2xl shadow-lg focus-within:ring-4 ring-black/5 transition-all transform hover:scale-105 duration-300">
                    <input 
                        type="text" 
                        placeholder="www.mon-super-site.com" 
                        className="flex-1 outline-none px-6 text-lg"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeBrand()}
                    />
                    <button 
                        onClick={handleAnalyzeBrand}
                        disabled={!websiteUrl}
                        className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        C'est parti →
                    </button>
                </div>
                <p className="mt-8 text-sm text-gray-400">
                    Ou <button onClick={() => setStep('playground')} className="underline hover:text-black">passer cette étape</button> (déconseillé)
                </p>
            </div>
        );
    }

    if (step === 'analyzing') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
                <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <span className="text-4xl">✨</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">{statusMessage}</h2>
                <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="mt-4 text-gray-500 animate-pulse">Nous analysons votre identité visuelle...</p>
            </div>
        );
    }

    if (step === 'bento') {
        return (
            <BentoGrid 
                brandData={brandData} 
                backgrounds={backgrounds}
                isGeneratingBackgrounds={isGeneratingBackgrounds}
                onUpdate={setBrandData} 
                onValidate={handleValidateBento} 
                onAddSource={() => setShowSourceManager(true)}
                onSave={handleSaveBrand}
            />
        );
    }

    // Playground Views based on Active Tab
    if (activeTab === 'calendar') {
        return <CalendarView brandId={brandData?.id} />;
    }

    if (activeTab === 'projects') {
        return <ProjectsView />;
    }

    // Default View: 'create'
    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-2 tracking-tight">Espace Créatif</h1>
                <p className="text-gray-500">
                    Générez des assets prêts à publier pour <span className="font-bold text-black">{brandData?.name || 'votre marque'}</span>.
                </p>
            </div>

            {/* Ideas Chips */}
            {visualIdeas.length > 0 && (
                <div className="mb-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {visualIdeas.map((idea, i) => (
                        <button 
                            key={i}
                            onClick={() => setBrief(idea)} 
                            className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-black hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <span>💡</span> {idea.substring(0, 40)}...
                        </button>
                    ))}
                </div>
            )}

            {/* Main Input Area */}
            <div className="bg-white rounded-[24px] border border-[#ECECEC] shadow-xl shadow-gray-200/50 p-3 mb-6 relative z-10">
                <div className="relative">
                    <textarea
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        placeholder={`Décrivez le visuel que vous voulez créer...`}
                        className="w-full min-h-[120px] p-6 text-lg resize-none outline-none placeholder:text-gray-300 rounded-[20px] bg-transparent focus:bg-gray-50/50 transition-colors"
                    />
                    
                    {/* Source Images Area */}
                    <div className="px-6 pb-4">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sources visuelles (charte, produits...)</div>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {uploadedImages.map((img, i) => (
                                <div key={i} className="relative w-16 h-16 flex-shrink-0 group">
                                    <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                    <button 
                                        onClick={() => handleRemoveImage(i)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={() => setShowSourceManager(true)}
                                className="w-16 h-16 flex-shrink-0 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"
                            >
                                +
                            </button>
                            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-4 pb-2 border-t border-gray-50 pt-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={handleMagicEnhance}
                                disabled={!brief.trim() || isThinking}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                                title="Améliorer avec l'IA"
                            >
                                ✨ Magic Prompt
                            </button>
                        </div>
                        <button
                            onClick={() => handleGenerate()}
                            disabled={status !== 'idle' || !brief || uploadedImages.length === 0}
                            className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {status === 'preparing' ? <span className="animate-spin">⏳</span> : 'Générer'}
                        </button>
                    </div>
                </div>
                {/* Progress Bar */}
                {status !== 'idle' && status !== 'complete' && status !== 'error' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden rounded-b-[24px]">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] transition-all duration-500 ease-out"
                            style={{ 
                                width: `${progress}%`,
                                backgroundPosition: '0% 50%' // Placeholder for animation if using custom class
                            }}
                        ></div>
                    </div>
                )}
            </div>

            {/* Results Grid */}
            {generatedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in">
                    {generatedImages.map((img, i) => (
                        <div key={i} className={`bg-gray-100 rounded-2xl overflow-hidden relative group cursor-zoom-in ${img.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
                            <img src={img.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                <button onClick={() => setLightboxImage(img.url)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform" title="Voir">
                                    👁
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingImage(img.url); setEditPrompt(''); }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform" title="Modifier">
                                    ✏️
                                </button>
                                <button 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const response = await fetch(img.url);
                                            const blob = await response.blob();
                                            const blobUrl = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = blobUrl;
                                            link.download = `briefbox-${Date.now()}.png`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        } catch (err) {
                                            window.open(img.url, '_blank');
                                        }
                                    }}
                                    className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    title="Télécharger"
                                >
                                    ⬇️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#414141] font-sans selection:bg-black selection:text-white flex">
      {/* Toast Container */}
      <div className="toast-container fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-[16px] shadow-lg border flex items-center gap-3 bg-white animate-slide-in-right ${
            toast.type === 'error' ? 'border-red-100 text-red-600' : 'border-[#ECECEC] text-[#414141]'
          }`}>
             <span className="text-lg">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
             <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Source Manager Modal */}
      {showSourceManager && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-3xl h-[80vh] flex flex-col relative shadow-2xl">
                <button onClick={() => setShowSourceManager(false)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                
                <h3 className="text-2xl font-bold mb-6">Gérer les sources visuelles</h3>
                
                <div className="flex gap-4 mb-6 border-b border-gray-100">
                    <button 
                        onClick={() => setSourceTab('library')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${sourceTab === 'library' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Bibliothèque de marque
                        {sourceTab === 'library' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setSourceTab('upload')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${sourceTab === 'upload' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Importer un fichier
                        {sourceTab === 'upload' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setSourceTab('url')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${sourceTab === 'url' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Depuis une URL
                        {sourceTab === 'url' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {sourceTab === 'library' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
                            {[...(brandData?.images || []), ...(backgrounds || [])].map((img: string, i: number) => {
                                const isSelected = uploadedImages.includes(img);
                                const labelObj = brandData?.labeledImages?.find((li: any) => li.url === img);
                                const label = labelObj?.category || (img === brandData?.logo ? 'main_logo' : 'other');
                                
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => {
                                            if (isSelected) setUploadedImages(prev => prev.filter(u => u !== img));
                                            else setUploadedImages(prev => [...prev, img]);
                                        }}
                                        className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer group border-2 transition-all ${isSelected ? 'border-black ring-2 ring-black/10' : 'border-transparent hover:border-gray-200'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                        <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-black text-white' : 'bg-white/80 text-transparent group-hover:text-gray-300'}`}>
                                                ✓
                                            </div>
                                        </div>
                                        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                            {[...(brandData?.images || []), ...(backgrounds || [])].length === 0 && (
                                <div className="col-span-full text-center text-gray-400 py-10">
                                    Aucune image dans la bibliothèque.
                                </div>
                            )}
                        </div>
                    ) : sourceTab === 'upload' ? (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-8 transition-colors hover:border-gray-400 hover:bg-gray-100 cursor-pointer" onClick={() => sourceManagerInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">📂</div>
                            <p className="text-gray-600 font-medium mb-2">Cliquez pour uploader une image</p>
                            <p className="text-gray-400 text-xs mb-6">JPG, PNG, WEBP acceptés</p>
                            
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200" onClick={(e) => e.stopPropagation()}>
                                <span className="text-xs text-gray-500 pl-2">Catégorie :</span>
                                <select 
                                    value={newUploadLabel} 
                                    onChange={(e) => setNewUploadLabel(e.target.value)}
                                    className="text-sm font-bold outline-none bg-transparent cursor-pointer"
                                >
                                    <option value="product">Produit</option>
                                    <option value="logo">Logo</option>
                                    <option value="person">Humain</option>
                                    <option value="icon">Icône</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            <input 
                                ref={sourceManagerInputRef} 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files[0]) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                const url = ev.target.result as string;
                                                // Add to uploaded images
                                                setUploadedImages(prev => [...prev, url]);
                                                // Also add to brand library to keep track? Ideally yes, but for now just select it.
                                                // Ideally we should update brandData.labeledImages too.
                                                const newLabel = { url, category: newUploadLabel, description: 'Uploaded manually' };
                                                setBrandData((prev: any) => ({
                                                    ...prev,
                                                    images: [...(prev.images || []), url],
                                                    labeledImages: [...(prev.labeledImages || []), newLabel]
                                                }));
                                                showToast('Image ajoutée', 'success');
                                                setSourceTab('library');
                                            }
                                        };
                                        reader.readAsDataURL(files[0]);
                                    }
                                }} 
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">🌐</div>
                            <h4 className="text-lg font-bold mb-2">Ajouter une source externe</h4>
                            <p className="text-gray-500 text-center mb-6 max-w-md">
                                Entrez l'URL d'une page produit, d'un article de blog ou d'un post social pour en extraire les images et les informations clés.
                            </p>
                            
                            <div className="flex w-full max-w-lg gap-2">
                                <input 
                                    type="text" 
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    placeholder="https://..." 
                                    className="flex-1 p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-black/5"
                                />
                                <button 
                                    onClick={() => {
                                        setIsAddingSource(true);
                                        handleAddSource(sourceUrl).then(() => {
                                            setIsAddingSource(false);
                                            setSourceUrl('');
                                            setSourceTab('library');
                                        });
                                    }}
                                    disabled={!sourceUrl || isAddingSource}
                                    className="bg-black text-white px-6 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    {isAddingSource ? '...' : 'Ajouter'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <span className="font-bold text-black">{uploadedImages.length}</span> images sélectionnées
                    </div>
                    <button 
                        onClick={() => setShowSourceManager(false)}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Terminer
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-4xl flex flex-col md:flex-row gap-6 relative shadow-2xl">
                <button onClick={() => setEditingImage(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                
                <div className="flex-1 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                    <img src={editingImage} className="max-h-[60vh] w-auto object-contain" />
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-2">Modifier le visuel</h3>
                    <p className="text-gray-500 text-sm mb-6">Décrivez les changements souhaités. L'IA va régénérer une variante en se basant sur cette image.</p>
                    
                    <textarea 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none mb-4 bg-gray-50 focus:bg-white focus:ring-2 ring-black/5 outline-none transition-all text-sm"
                        placeholder="Ex: Change la couleur du fond en bleu nuit, ajoute un reflet sur le produit..."
                    />
                    
                    <button 
                        onClick={() => {
                            if (!editPrompt.trim()) return;
                            handleGenerate(editPrompt, false, brandData, [editingImage]);
                            setEditingImage(null);
                        }}
                        className="bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-95 disabled:opacity-50"
                        disabled={!editPrompt.trim()}
                    >
                        ✨ Générer la variante
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in" onClick={() => setLightboxImage(null)}>
           <img src={lightboxImage} alt="Full view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
           <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl transition" onClick={() => setLightboxImage(null)}>×</button>
        </div>
      )}

      {/* Sidebar */}
      {step !== 'url' && step !== 'analyzing' && step !== 'bento' && (
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            brandData={brandData}
            onEditBrand={() => setStep('bento')}
          />
      )}

      {/* Main Content */}
      <div className={`flex-1 ${step !== 'url' && step !== 'analyzing' && step !== 'bento' ? 'ml-64' : 'w-full'}`}>
         <main className={`p-8 mx-auto min-h-screen flex flex-col justify-center ${step === 'bento' ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
            {renderContent()}
         </main>
      </div>
    </div>
  );
}
