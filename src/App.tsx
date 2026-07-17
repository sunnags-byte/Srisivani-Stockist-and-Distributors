import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Tag, 
  Sparkles, 
  Filter, 
  Calendar, 
  DollarSign, 
  Layers, 
  Store as StoreIcon, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Send,
  RefreshCw,
  User,
  ShoppingBag,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Store, VibeType, VibeConfig, CustomLeadInput } from './types';
import { KERALA_STORES } from './data/stores';
import glimyProductImg from './assets/images/glimy_m2_forte_box_1784264299552.jpg';

// Define the custom vibes available for selection
const VIBES: VibeConfig[] = [
  {
    id: 'warm_friendly',
    label: 'Warm & Friendly Check-In',
    description: 'Polite, neighborly outreach focused on stock checking.',
    emoji: '🌿'
  },
  {
    id: 'professional',
    label: 'Professional B2B Pitch',
    description: 'Clear profit calculations, manufacturing standards & formal.',
    emoji: '💼'
  },
  {
    id: 'value_focused',
    label: 'Value & Margin Focused',
    description: 'Emphasizes the incredible 50% discount and saving potential.',
    emoji: '💰'
  },
  {
    id: 'concise',
    label: 'Quick Bulletins (Direct)',
    description: 'Ultra-short and clear message for busy pharmacy desks.',
    emoji: '⚡'
  },
  {
    id: 'malayalam_english',
    label: 'Kerala Local Manglish Mix',
    description: 'Highly personal, polite local dialect (Malayalam written in English).',
    emoji: '🤝'
  }
];

export default function App() {
  // --- States ---
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [vibe, setVibe] = useState<VibeType>('warm_friendly');
  const [extraNotes, setExtraNotes] = useState<string>('');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'mobile' | 'landline'>('mobile');
  const [filterCrm, setFilterCrm] = useState<string>('All');
  
  // Custom lead fields
  const [isAddingLead, setIsAddingLead] = useState<boolean>(false);
  const [newLead, setNewLead] = useState<CustomLeadInput>({
    name: '',
    phone: '',
    address: '',
    hours: 'Closes 21:00',
    notes: ''
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [geminiAvailable, setGeminiAvailable] = useState<boolean | null>(null);
  const [isUsingGemini, setIsUsingGemini] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);

  // --- Initial Data Load ---
  useEffect(() => {
    // Check if there is data in localStorage, else populate with default list
    const saved = localStorage.getItem('whatsapp_pharma_stores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStores(parsed);
        if (parsed.length > 0) {
          setSelectedStoreId(parsed[0].id);
        }
      } catch (e) {
        setStores(KERALA_STORES);
        if (KERALA_STORES.length > 0) {
          setSelectedStoreId(KERALA_STORES[0].id);
        }
      }
    } else {
      setStores(KERALA_STORES);
      if (KERALA_STORES.length > 0) {
        setSelectedStoreId(KERALA_STORES[0].id);
      }
    }

    // Check backend health and Gemini availability
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setGeminiAvailable(data.geminiAvailable);
        setIsUsingGemini(data.geminiAvailable); // Default to Gemini if available
      })
      .catch(() => {
        setGeminiAvailable(false);
        setIsUsingGemini(false);
      });
  }, []);

  // --- Persistence Handlers ---
  const saveStoresToLocal = (updatedStores: Store[]) => {
    setStores(updatedStores);
    localStorage.setItem('whatsapp_pharma_stores', JSON.stringify(updatedStores));
  };

  // --- Toast Trigger helper ---
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  // --- Get currently selected store ---
  const selectedStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  // --- Rule-Based Local Template Engine (Safe Offline Fallback) ---
  const generateLocalTemplate = (store: Store, vibeType: VibeType, notes: string) => {
    const storeName = store.name;
    const address = store.address;
    const cleanNotes = notes.trim() ? `\n\n📌 Special Note:\n${notes.trim()}` : '';

    switch (vibeType) {
      case 'warm_friendly':
        return `Hello from Glimy Distribution Kerala! 🌿

Hope this message finds you well at ${storeName}. We are checking in with local pharmacies regarding Dr. Reddy's premium Glimy M2 Forte tablets (Metformin 1000mg + Glimepiride 2mg).

We currently have a special price of Rs. 98 per strip (MRP is Rs. 194.25, giving you nearly 50% margin to support your customers). The expiry is far out in June 2027.

No pressure at all, sir—just thought of checking if you would like to secure some strips for your regular diabetic patients at this rate.${cleanNotes}

Have a blessed day! Let us know if you have any questions or when you would prefer us to drop by. 🙏`;

      case 'professional':
        return `Dear Purchase Manager,
${storeName} (${address})

Subject: Wholesale Product Offer - Glimy M2 Forte (Dr. Reddy's)

We are pleased to offer Glimy M2 Forte 1000mg/2mg tablets from Dr. Reddy's Laboratories at highly competitive wholesale pricing:

• Product: Glimy M2 Forte
• Offer Price: Rs. 98 / strip (tax incl.)
• Retail MRP: Rs. 194.25
• Expiry Date: June 2027

This is high-grade, shelf-stable stock from an authorized distribution channel. If you wish to purchase or require further documentation, please reply to this chat.${cleanNotes}

Thank you for your valuable time.

Best regards,
Pharma Distribution Team`;

      case 'value_focused':
        return `Attention ${storeName}! Wholesale profit booster deal 💊

Stock up on Glimy M2 Forte from Dr. Reddy's and double your margin with this premium offer:

💰 Buy Price: Rs. 98 only!
📈 Retail MRP: Rs. 194.25
📅 Expiry: June 2027

Help your budget-conscious diabetic patients save nearly 50% on their monthly bills while keeping your pharmacy margins high.${cleanNotes}

Get in touch today to order for your regular patients. Let us know your requirement!`;

      case 'concise':
        return `Namaste ${storeName}, Glimy M2 Forte product offer:

• Product: Glimy M2 Forte (Metformin 1000mg + Glimepiride 2mg)
• Brand: Dr. Reddy's
• Rate: Rs. 98 (MRP 194.25)
• Expiry: June 2027${cleanNotes}

Polite note: Highly discounted price for local pharmacies. Please let us know if you need any strips for your counter stock. Thank you! 🙏`;

      case 'malayalam_english':
        return `Namaskaram Chetta, ${storeName} list-il kandumitt vilichathaane. 😊

Nammude kayyil Glimy M2 Forte (Dr. Reddy's) stock und. Metformin 1000mg + Glimepiride 2mg combination aanu. 

• Price: Rs. 98/strip
• MRP: Rs. 194.25 (Nalla margin labhikkaam)
• Expiry: June 2027 (Long expiry)

Kooduthal patients-um chodhikkunna fast moving medicine aanallo. Nirbhandham onnumilla chetta, customere sahajikkanum nalla margin kittanum nalla oru chance aanu.${cleanNotes ? `\n\nNote: ${cleanNotes}` : ''}

Venamenkil parayane, nammal deliver cheyyam. Thank you, nalla oru divasam aashamsikkunnu! 🙏`;

      default:
        return `Hello from Glimy Distribution, Glimy M2 Forte Dr. Reddy's is available at Rs. 98 (MRP 194.25). Expiry June 2027. Please let us know if you need any strips.`;
    }
  };

  // --- Auto Generate Message when selections change or custom generation triggered ---
  const handleGenerateMessage = async (forceGeminiCall: boolean = false) => {
    if (!selectedStore) {
      triggerToast('Please select a medical store from the directory first.', 'error');
      return;
    }

    setIsGenerating(true);

    // If using local templates
    if (!isUsingGemini && !forceGeminiCall) {
      const msg = generateLocalTemplate(selectedStore, vibe, extraNotes);
      setGeneratedMessage(msg);
      setIsGenerating(false);
      triggerToast('Polite template generated instantly!', 'success');
      return;
    }

    // Else trigger full-stack Gemini API endpoint
    try {
      const res = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeName: selectedStore.name,
          address: selectedStore.address,
          vibe,
          extraNotes: extraNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setGeneratedMessage(data.message);
        triggerToast('AI custom message generated!', 'success');
      } else {
        // Fallback if server throws error or says fallback
        const msg = generateLocalTemplate(selectedStore, vibe, extraNotes);
        setGeneratedMessage(msg);
        triggerToast('AI generated a warning, fallback template applied.', 'info');
      }
    } catch (error) {
      const msg = generateLocalTemplate(selectedStore, vibe, extraNotes);
      setGeneratedMessage(msg);
      triggerToast('Backend connection failed, offline template used.', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate message on load or initial store select
  useEffect(() => {
    if (selectedStore) {
      // Re-trigger generation with local template as high speed preview
      const msg = generateLocalTemplate(selectedStore, vibe, extraNotes);
      setGeneratedMessage(msg);
    }
  }, [selectedStoreId, vibe, extraNotes]);

  // --- Add Custom Pharmacy Lead ---
  const handleAddCustomLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) {
      triggerToast('Pharmacy name and phone number are required.', 'error');
      return;
    }

    // Check phone formats for India: if 10 digits
    const cleaned = newLead.phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      triggerToast('Please enter a valid 10-digit mobile or standard landline number.', 'error');
      return;
    }

    // Determine if mobile (in India, mobiles start with 9, 8, 7, 6)
    const firstDigit = cleaned.charAt(0);
    const isMobile = ['9', '8', '7', '6'].includes(firstDigit) && cleaned.length >= 10;

    const addedStore: Store = {
      id: `custom-${Date.now()}`,
      name: newLead.name,
      address: newLead.address || 'Kerala, India',
      phone: cleaned,
      isMobile,
      hours: newLead.hours || '—',
      notes: newLead.notes || '',
      crmStatus: 'None',
      isCustom: true
    };

    const updated = [addedStore, ...stores];
    saveStoresToLocal(updated);
    setSelectedStoreId(addedStore.id);
    setIsAddingLead(false);
    setNewLead({ name: '', phone: '', address: '', hours: 'Closes 21:00', notes: '' });
    triggerToast(`Added custom lead: ${addedStore.name}!`, 'success');
  };

  // --- Delete Custom Lead ---
  const handleDeleteLead = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent select store
    const updated = stores.filter(s => s.id !== idToDelete);
    saveStoresToLocal(updated);
    if (selectedStoreId === idToDelete && updated.length > 0) {
      setSelectedStoreId(updated[0].id);
    }
    triggerToast('Lead removed from database.', 'info');
  };

  // --- CRM Status updates ---
  const handleUpdateCrmStatus = (storeId: string, status: Store['crmStatus']) => {
    const updated = stores.map(s => {
      if (s.id === storeId) {
        return {
          ...s,
          crmStatus: status,
          lastMessagedAt: status === 'Messaged' || status === 'Completed' ? new Date().toLocaleDateString() : s.lastMessagedAt
        };
      }
      return s;
    });

    saveStoresToLocal(updated);
    triggerToast(`CRM status updated to ${status}!`, 'success');
  };

  // --- Copy Message To Clipboard ---
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    triggerToast('Message copied to clipboard! Ready to paste.', 'success');
  };

  // --- WhatsApp Redirection Helper ---
  const handleLaunchWhatsApp = () => {
    if (!selectedStore) return;
    
    // Clean phone number: remove non-numeric
    let cleanPhone = selectedStore.phone.replace(/\D/g, '');
    
    // Check if it has India prefix 91, otherwise prepend if it's 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(generatedMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');

    // Update CRM to 'Messaged' automatically as feedback
    if (selectedStore.crmStatus === 'None') {
      handleUpdateCrmStatus(selectedStore.id, 'Messaged');
    } else {
      triggerToast('Redirecting you to WhatsApp...', 'info');
    }
  };

  // --- Filtering & Searching Stores Directory ---
  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      // Search matches
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      // Mobile/WhatsApp type filter
      const matchesType = 
        filterType === 'all' ||
        (filterType === 'mobile' && s.isMobile) ||
        (filterType === 'landline' && !s.isMobile);

      // CRM Status filter
      const matchesCrm = 
        filterCrm === 'All' ||
        (filterCrm === 'None' && (!s.crmStatus || s.crmStatus === 'None')) ||
        s.crmStatus === filterCrm;

      return matchesSearch && matchesType && matchesCrm;
    });
  }, [stores, searchQuery, filterType, filterCrm]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased pb-12">
      {/* --- Elegant App Header --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-800 text-white p-2.5 rounded-xl flex items-center justify-center shadow-md">
              <MessageSquare className="w-6 h-6" id="logo-icon" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
                WhatsApp Pharma Broadcaster
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Automatic Soft-Sell B2B WhatsApp Communication Engine for Kerala Pharmacies
              </p>
            </div>
          </div>

          {/* AI Connection state indicators */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-100 p-2 rounded-xl">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-600">Local DB Loaded ({stores.length} Leads)</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsUsingGemini(!isUsingGemini)}
                disabled={geminiAvailable === false}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-semibold ${
                  isUsingGemini 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                } ${geminiAvailable === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isUsingGemini ? 'text-purple-600 animate-pulse' : ''}`} />
                <span>{isUsingGemini ? 'Gemini AI On' : 'Local Templates'}</span>
              </button>
              {geminiAvailable === false && (
                <div className="text-[10px] text-amber-600 font-medium max-w-[120px] leading-tight">
                  Gemini Key unconfigured, running in high-speed local mode.
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Dashboard Container --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT GRID: THE PRODUCT & ACTIVE BATCH VISUALIZER ================= */}
        <section className="col-span-1 lg:col-span-4 flex flex-col gap-6" id="product-section">
          
          {/* --- Glimy M2 Forte Interactive Physical Medicine Box --- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            {/* Pharmacy Brand Label */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold border border-red-100">
                  Rx Prescription Only
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono block">Mfr Code: DR.REDDY</span>
              </div>
            </div>

            {/* Real Product Image from Upload Photo & Detailes */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-slate-50 shadow-inner group relative">
              <img 
                src={glimyProductImg} 
                alt="Glimy M2 Forte Dr. Reddy's Pack" 
                referrerPolicy="no-referrer"
                className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-100">
                    Active Verified Batch
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                    June 2027 Expiry
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-800 leading-tight">
                  Glimy M2 Forte (1000mg/2mg)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dr. Reddy's Metformin & Glimepiride Tablets IP
                </p>
              </div>
            </div>

            {/* Deal Math Visualizer (Nearly 50% Off!) */}
            <div className="bg-[#fffbeb] border border-amber-100 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> High Margin B2B Deal
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Save 49.5%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 divide-x divide-amber-200/50 mt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Your Deal Price</span>
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    Rs. 98 <span className="text-xs font-normal text-slate-500">/ strip</span>
                  </div>
                </div>
                <div className="pl-4">
                  <span className="text-[10px] text-slate-500 block">Retail MRP</span>
                  <div className="text-lg font-bold text-slate-400 line-through font-mono">
                    Rs. 194.25
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-amber-900 leading-relaxed pt-2.5 border-t border-amber-200/30">
                You offer the highest-grade diabetic strip for <span className="font-bold text-emerald-800">Rs. 98</span>. Gives Keralite pharmacists substantial retail margins to promote to their regular walk-in customers!
              </div>
            </div>
          </div>

          {/* --- Soft-Sell B2B Guide --- */}
          <div className="bg-teal-950 text-teal-100 rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute bottom-0 right-0 translate-y-6 translate-x-6 opacity-10">
              <Info className="w-32 h-32" />
            </div>
            <h4 className="font-semibold text-white text-sm flex items-center gap-2 mb-2 font-display">
              💡 Sales Etiquette (The "No Pressure" Philosophy)
            </h4>
            <p className="text-xs text-teal-200 leading-relaxed mb-3">
              Pharmacists in Kerala receive countless aggressive sales calls. This application generates messages that:
            </p>
            <ul className="text-xs space-y-1.5 text-teal-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Check stock <strong>first</strong> before offering anything.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Highlight the high margin naturally (MRP vs Rs.98).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Refer to <strong>Dr. Reddy's</strong> to immediately establish brand authority.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Invite questions rather than demanding a direct purchase.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ================= CENTER GRID: MASS CUSTOMIZER & LIVE MESSAGE PREVIEW ================= */}
        <section className="col-span-1 lg:col-span-5 flex flex-col gap-6" id="composer-section">
          
          {/* --- Vibe Tone Selector --- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
            <h3 className="text-base font-bold font-display tracking-tight text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-800" /> Step 1: Select Message Vibe
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {VIBES.map((v) => {
                const isSelected = vibe === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-3xs' 
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-base">{v.emoji}</span> {v.label}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-normal pl-5">
                      {v.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- Custom Delivery/Distributor Notes --- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
            <h3 className="text-base font-bold font-display tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-800" /> Step 2: Add Custom Notes (Optional)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Add details like delivery timings, specific discount limits, or free delivery options.
            </p>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="e.g. Can deliver by tomorrow evening. Minimum order is 5 strips. Free shipping in Kollam/Trivandrum."
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none bg-slate-50"
            />
          </div>

          {/* --- Live Preview & Action Terminal --- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col flex-1 relative min-h-[300px]">
            
            {/* Header with quick indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Outbox Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isEditingMessage ? (
                  <button 
                    onClick={() => setIsEditingMessage(false)}
                    className="text-xs text-emerald-800 hover:underline font-bold cursor-pointer"
                  >
                    Done Editing
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditingMessage(true)}
                    className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-semibold cursor-pointer"
                  >
                    Edit Message
                  </button>
                )}
              </div>
            </div>

            {/* Recipient summary */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Pharmacy</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedStore ? selectedStore.name : 'No pharmacy selected'}
                </span>
                <span className="text-[10px] text-slate-500 ml-2">
                  ({selectedStore ? selectedStore.address : '—'})
                </span>
              </div>
              <div>
                <span className="text-xs font-mono bg-slate-200/60 px-2 py-0.5 rounded text-slate-600">
                  {selectedStore ? selectedStore.phone : '—'}
                </span>
              </div>
            </div>

            {/* Textarea or formatted preview */}
            <div className="flex-1 flex flex-col min-h-[160px] bg-emerald-50/20 rounded-xl border border-emerald-100/50 p-4">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800 mb-3"></div>
                  <p className="text-xs text-slate-500 font-medium animate-pulse">
                    {isUsingGemini ? 'Gemini is custom-tailoring your message...' : 'Generating perfect template...'}
                  </p>
                </div>
              ) : isEditingMessage ? (
                <textarea
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  className="flex-1 w-full bg-transparent border-0 outline-hidden focus:ring-0 text-xs leading-relaxed text-slate-700 font-sans resize-none"
                  rows={8}
                />
              ) : (
                <div className="flex-1 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap select-text font-sans scrollbar-thin overflow-y-auto">
                  {generatedMessage || "Select a store to preview output message..."}
                </div>
              )}
            </div>

            {/* Generate & send CTA buttons */}
            <div className="mt-4 flex flex-col gap-2.5">
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateMessage(false)}
                  disabled={isGenerating}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Vibe
                </button>

                {isUsingGemini && (
                  <button
                    onClick={() => handleGenerateMessage(true)}
                    disabled={isGenerating}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    title="Force custom AI compilation"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Smart Tweak
                  </button>
                )}
              </div>

              {/* Action grid: Copy & Send WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-1">
                <button
                  onClick={handleCopyToClipboard}
                  disabled={!generatedMessage}
                  className="sm:col-span-4 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-xs py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </button>

                <button
                  onClick={handleLaunchWhatsApp}
                  disabled={!generatedMessage || !selectedStore}
                  className="sm:col-span-8 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/10 hover:shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Launch WhatsApp 💬
                </button>
              </div>

              {/* Post message Quick status marker */}
              {selectedStore && (
                <div className="mt-2 border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick CRM Logger:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => handleUpdateCrmStatus(selectedStore.id, 'Messaged')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        selectedStore.crmStatus === 'Messaged' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                      }`}
                    >
                      Messaged
                    </button>
                    <button
                      onClick={() => handleUpdateCrmStatus(selectedStore.id, 'Interested')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        selectedStore.crmStatus === 'Interested' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                      }`}
                    >
                      Interested
                    </button>
                    <button
                      onClick={() => handleUpdateCrmStatus(selectedStore.id, 'Completed')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        selectedStore.crmStatus === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                      }`}
                    >
                      Sold ✅
                    </button>
                    <button
                      onClick={() => handleUpdateCrmStatus(selectedStore.id, 'Not Interested')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        selectedStore.crmStatus === 'Not Interested' 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= RIGHT GRID: SEARCHABLE PHARMACIES & CRM MANAGEMENT ================= */}
        <section className="col-span-1 lg:col-span-3 lg:col-start-10 flex flex-col gap-6" id="leads-section">
          
          {/* --- Custom Lead Adder Form --- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
            <button
              onClick={() => setIsAddingLead(!isAddingLead)}
              className="w-full flex items-center justify-between font-bold font-display text-slate-900 text-sm hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" /> Add Custom Pharmacy Lead
              </span>
              <span className="text-xs text-slate-400">
                {isAddingLead ? 'Collapse ━' : 'Expand ✚'}
              </span>
            </button>

            <AnimatePresence>
              {isAddingLead && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3"
                  onSubmit={handleAddCustomLead}
                >
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Pharmacy Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Wellness Pharmacy"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Phone Number (WhatsApp Preferable) *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 9847753444 or landline"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      City / Area (Kerala)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Trivandrum, KL"
                      value={newLead.address}
                      onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Opening / Closing Hours
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Closes 21:00"
                      value={newLead.hours}
                      onChange={(e) => setNewLead({ ...newLead, hours: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs py-2 rounded-lg transition-colors mt-2 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Save New Lead
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* --- Leads Directory Main Container --- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col max-h-[560px]">
            
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold font-display tracking-tight text-slate-900 flex items-center gap-1.5">
                <StoreIcon className="w-4 h-4 text-emerald-800" /> Kerala Pharmacy List
              </h3>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">
                {filteredStores.length} shown
              </span>
            </div>

            {/* Directory search input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search name, phone, or town..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
              />
            </div>

            {/* Quick Filters tab block */}
            <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px]">
              
              {/* Type filter */}
              <div className="flex items-center justify-between gap-1 border-b border-slate-200/50 pb-1.5 mb-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Device Type:</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setFilterType('all')} 
                    className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${filterType === 'all' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterType('mobile')} 
                    className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${filterType === 'mobile' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    title="Mobiles only (WhatsApp compatible)"
                  >
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => setFilterType('landline')} 
                    className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${filterType === 'landline' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                  >
                    Landline
                  </button>
                </div>
              </div>

              {/* CRM filter */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <Filter className="w-2.5 h-2.5" /> status:
                </span>
                <select 
                  value={filterCrm} 
                  onChange={(e) => setFilterCrm(e.target.value)}
                  className="rounded-sm bg-white border border-slate-200 text-slate-600 py-0.5 px-1 font-semibold focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="None">Not Messaged</option>
                  <option value="Messaged">Messaged</option>
                  <option value="Interested">Interested</option>
                  <option value="Completed">Purchased</option>
                  <option value="Not Interested">Rejected</option>
                </select>
              </div>
            </div>

            {/* Scrollable list card list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredStores.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">No medical stores match this filter query.</p>
                </div>
              ) : (
                filteredStores.map((s) => {
                  const isSelected = selectedStoreId === s.id;
                  
                  // Get CRM styling
                  let crmBadge = null;
                  if (s.crmStatus === 'Messaged') crmBadge = 'bg-blue-50 text-blue-700 border-blue-100';
                  else if (s.crmStatus === 'Interested') crmBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                  else if (s.crmStatus === 'Completed') crmBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  else if (s.crmStatus === 'Not Interested') crmBadge = 'bg-red-50 text-red-700 border-red-100';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStoreId(s.id)}
                      className={`p-3 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer relative ${
                        isSelected 
                          ? 'bg-emerald-50/20 border-emerald-400 ring-1 ring-emerald-400/20 shadow-2xs' 
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      {/* Store name & CRM Badge */}
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-xs font-bold text-slate-800 leading-tight block truncate pr-3" title={s.name}>
                          {s.name}
                        </span>
                        
                        {/* Custom Lead vs Standard Lead badge */}
                        {s.isCustom && (
                          <span className="text-[8px] bg-indigo-50 text-indigo-600 font-mono font-bold px-1 py-0.5 rounded border border-indigo-100 uppercase">
                            Custom
                          </span>
                        )}
                      </div>

                      {/* Store Address & Hour */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                        <MapPin className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <span>{s.address}</span>
                        {s.hours && s.hours !== '—' && (
                          <>
                            <span className="text-slate-300">•</span>
                            <Clock className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <span>{s.hours}</span>
                          </>
                        )}
                      </div>

                      {/* Phone, suspicious indicator & Action footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1.5">
                        <span className="text-[10px] font-mono font-medium text-slate-500 flex items-center gap-1">
                          {s.isMobile ? (
                            <span className="text-emerald-600 bg-emerald-50 px-1 rounded text-[8px] font-bold uppercase border border-emerald-100 flex items-center gap-0.5">
                              WhatsApp
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-1 rounded text-[8px] font-bold uppercase border border-slate-200">
                              Landline
                            </span>
                          )}
                          <span>{s.phone}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {s.crmStatus && s.crmStatus !== 'None' && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${crmBadge}`}>
                              {s.crmStatus}
                            </span>
                          )}

                          {s.flagSuspicious && (
                            <span 
                              className="text-amber-500 bg-amber-50 p-1 rounded-md border border-amber-200 cursor-help"
                              title={s.notes || "Wrong area code format detected."}
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerToast(s.notes || "Wrong phone area code detected.", 'info');
                              }}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {s.isCustom && (
                            <button
                              onClick={(e) => handleDeleteLead(s.id, e)}
                              className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-md transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                              title="Delete custom lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

      </main>

      {/* --- Beautiful Dynamic Toasts --- */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold max-w-sm"
          >
            {showToast.type === 'success' && (
              <span className="text-emerald-400 bg-emerald-500/10 p-1 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
            {showToast.type === 'info' && (
              <span className="text-teal-300 bg-teal-500/10 p-1 rounded-lg">
                <Info className="w-4 h-4" />
              </span>
            )}
            {showToast.type === 'error' && (
              <span className="text-red-400 bg-red-500/10 p-1 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </span>
            )}
            <span className="flex-1 leading-tight">{showToast.message}</span>
            <button 
              onClick={() => setShowToast(null)} 
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs ml-2 font-mono"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
