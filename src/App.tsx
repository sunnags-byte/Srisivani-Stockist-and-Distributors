import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
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
  CheckCircle2,
  Download
} from 'lucide-react';
import { Store, VibeType, VibeConfig, CustomLeadInput } from './types';
import { KERALA_STORES } from './data/stores';
import glimyFrontImg from './assets/images/glimy_m2_forte_front_box_1784265739747.jpg';
import glimyBackImg from './assets/images/glimy_m2_forte_back_box_1784265756828.jpg';

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
  const [selectedStoreId, setSelectedStoreId] = useLocalStorage<string>('app_selectedStoreId', '');
  const [vibe, setVibe] = useLocalStorage<VibeType>('app_vibe', 'warm_friendly');
  const [extraNotes, setExtraNotes] = useLocalStorage<string>('app_extraNotes', '');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useLocalStorage<string>('app_searchQuery', '');
  const [filterType, setFilterType] = useLocalStorage<'all' | 'mobile' | 'landline'>('app_filterType', 'mobile');
  const [filterCrm, setFilterCrm] = useLocalStorage<string>('app_filterCrm', 'All');
  
  // Custom lead fields
  const [isAddingLead, setIsAddingLead] = useState<boolean>(false);
  const [newLead, setNewLead] = useState<CustomLeadInput>({
    name: '',
    phone: '',
    address: '',
    hours: 'Closes 21:00',
    notes: ''
  });

  const [imageSide, setImageSide] = useState<'front' | 'back'>('front');
  const [mobileTab, setMobileTab] = useLocalStorage<'stores' | 'composer' | 'product'>('app_mobileTab', 'stores');
  const [viewMode, setViewMode] = useLocalStorage<'interactive' | 'all-in-one'>('app_viewMode', 'all-in-one');
  const [generatingStoreId, setGeneratingStoreId] = useState<string | null>(null);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [geminiAvailable, setGeminiAvailable] = useState<boolean | null>(null);
  const [isUsingGemini, setIsUsingGemini] = useLocalStorage<boolean>('app_isUsingGemini', false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);

  // --- Initial Data Load ---
  useEffect(() => {
    // Check if there is data in localStorage, else populate with default list
    const saved = localStorage.getItem('whatsapp_pharma_stores');
    let loadedStores = KERALA_STORES;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Store[];
        const customLeads = parsed.filter(s => s.isCustom);
        
        // Deduplicate custom leads by phone number to fix repeating numbers issue
        const uniqueCustomLeadsMap = new Map<string, Store>();
        const keralaStorePhones = new Set(KERALA_STORES.map(s => s.phone));
        
        for (const lead of customLeads) {
          if (!uniqueCustomLeadsMap.has(lead.phone) && !keralaStorePhones.has(lead.phone)) {
            uniqueCustomLeadsMap.set(lead.phone, lead);
          }
        }
        const uniqueCustomLeads = Array.from(uniqueCustomLeadsMap.values());
        
        loadedStores = KERALA_STORES.map(ks => {
          const matchingOld = parsed.find(ps => ps.id === ks.id || ps.phone === ks.phone);
          if (matchingOld) {
            return {
              ...ks,
              crmStatus: matchingOld.crmStatus === 'None' ? ks.crmStatus : matchingOld.crmStatus,
              customMessage: matchingOld.customMessage,
              lastMessagedAt: matchingOld.lastMessagedAt
            };
          }
          return ks;
        });
        
        loadedStores = [...uniqueCustomLeads, ...loadedStores];
      } catch (e) {
        console.error('Failed to parse stores', e);
      }
    }
    
    setStores(loadedStores);
    localStorage.setItem('whatsapp_pharma_stores', JSON.stringify(loadedStores));
    
    if (loadedStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(loadedStores[0].id);
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
        return `Hello from SS Pharma, Nedumangad, Trivandrum! 🌿

Hope this message finds you well at ${storeName}. We are checking in with local pharmacies regarding Dr. Reddy's premium Glimy M2 Forte tablets (Metformin 1000mg + Glimepiride 2mg).

We currently have a special price of Rs. 98 per box of 30 tablets (MRP is Rs. 194.25, giving you nearly 50% margin to support your customers). The expiry is far out in June 2027.

No pressure at all, sir—just thought of checking if you would like to secure some boxes for your regular diabetic patients at this rate.${cleanNotes}

Have a blessed day! Let us know if you have any questions or when you would prefer us to drop by. 🙏

Warm regards,
SS Pharma, Nedumangad
📞 9446452812`;

      case 'professional':
        return `Dear Purchase Manager,
${storeName} (${address})

Subject: Wholesale Product Offer - Glimy M2 Forte (Dr. Reddy's) - SS Pharma

We are pleased to offer Glimy M2 Forte 1000mg/2mg tablets from Dr. Reddy's Laboratories at highly competitive wholesale pricing:

• Product: Glimy M2 Forte
• Offer Price: Rs. 98 / box (30 Tablets, tax incl.)
• Retail MRP: Rs. 194.25 per box
• Expiry Date: June 2027
• Supplier: SS Pharma, Nedumangad, Trivandrum

This is high-grade, shelf-stable stock from an authorized distribution channel. If you wish to purchase or require further documentation, please reply to this chat.${cleanNotes}

Thank you for your valuable time.

Best regards,
Purchase & Distribution Team
SS Pharma, Nedumangad
Trivandrum, Kerala`;

      case 'value_focused':
        return `Attention ${storeName}! Wholesale profit booster deal from SS Pharma 💊

Stock up on Glimy M2 Forte from Dr. Reddy's and double your margin with this premium offer:

💰 Buy Price: Rs. 98 only per box (30 Tablets)!
📈 Retail MRP: Rs. 194.25
📅 Expiry: June 2027

Help your budget-conscious diabetic patients save nearly 50% on their monthly bills while keeping your pharmacy margins high.${cleanNotes}

Get in touch today to order for your regular patients. Let us know your requirement!

Best regards,
SS Pharma, Nedumangad
Trivandrum`;

      case 'concise':
        return `Namaste ${storeName}, Glimy M2 Forte product offer from SS Pharma (Nedumangad):

• Product: Glimy M2 Forte (Metformin 1000mg + Glimepiride 2mg)
• Brand: Dr. Reddy's
• Rate: Rs. 98 per box of 30s (MRP 194.25)
• Expiry: June 2027${cleanNotes}

Polite note: Highly discounted price for local pharmacies. Please let us know if you need any boxes for your counter stock. Thank you! 🙏`;

      case 'malayalam_english':
        return `Namaskaram Chetta, ${storeName} list-il kandumitt vilichathaane. SS Pharma Nedumangad-il ninnum aanu. 😊

Nammude kayyil Glimy M2 Forte (Dr. Reddy's) stock und. Metformin 1000mg + Glimepiride 2mg combination aanu. 

• Price: Rs. 98/box (30 Tablets)
• MRP: Rs. 194.25 (Nalla margin labhikkaam)
• Expiry: June 2027 (Long expiry)

Kooduthal patients-um chodhikkunna fast moving medicine aanallo. Nirbhandham onnumilla chetta, customere sahajikkanum nalla margin kittanum nalla oru chance aanu.${cleanNotes ? `\n\nNote: ${cleanNotes}` : ''}

Venamenkil parayane, nammal deliver cheyyam. Thank you, nalla oru divasam aashamsikkunnu! 🙏`;

      default:
        return `Hello from SS Pharma (Nedumangad, Trivandrum). Glimy M2 Forte Dr. Reddy's is available at Rs. 98 per box (MRP 194.25). Expiry June 2027. Please let us know if you need any boxes.`;
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

  // --- Copy / Download Product Image for Easy WhatsApp Sharing ---
  const handleCopyImageToClipboard = async () => {
    const activeImg = imageSide === 'front' ? glimyFrontImg : glimyBackImg;
    const activeName = imageSide === 'front' ? 'Glimy_M2_Forte_Front.jpg' : 'Glimy_M2_Forte_Composition_Back.jpg';
    try {
      const response = await fetch(activeImg);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      triggerToast(`Product ${imageSide} photo copied to clipboard! Paste it directly into WhatsApp (Ctrl+V / Cmd+V).`, 'success');
    } catch (err) {
      // Fallback: trigger quick download
      const link = document.createElement('a');
      link.href = activeImg;
      link.download = activeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Downloaded product ${imageSide} image! You can drag and drop it into WhatsApp.`, 'info');
    }
  };

  const handleDownloadImage = () => {
    const activeImg = imageSide === 'front' ? glimyFrontImg : glimyBackImg;
    const activeName = imageSide === 'front' ? 'Glimy_M2_Forte_Front.jpg' : 'Glimy_M2_Forte_Composition_Back.jpg';
    const link = document.createElement('a');
    link.href = activeImg;
    link.download = activeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Product ${imageSide} image downloaded successfully!`, 'success');
  };

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

  // --- All-In-One Hub: Generate Gemini for Single Store ---
  const handleGenerateGeminiForStore = async (store: Store) => {
    if (!isUsingGemini) {
      triggerToast('Please turn on Gemini AI first.', 'error');
      return;
    }
    setGeneratingStoreId(store.id);
    try {
      const res = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeName: store.name,
          address: store.address,
          vibe,
          extraNotes: extraNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.message) {
        const updated = stores.map(s => s.id === store.id ? { ...s, customMessage: data.message } : s);
        saveStoresToLocal(updated);
        triggerToast(`Gemini AI message generated for ${store.name}!`, 'success');
      } else {
        const localMsg = generateLocalTemplate(store, vibe, extraNotes);
        const updated = stores.map(s => s.id === store.id ? { ...s, customMessage: localMsg } : s);
        saveStoresToLocal(updated);
        triggerToast('AI was busy, fell back to local template.', 'info');
      }
    } catch (error) {
      const localMsg = generateLocalTemplate(store, vibe, extraNotes);
      const updated = stores.map(s => s.id === store.id ? { ...s, customMessage: localMsg } : s);
      saveStoresToLocal(updated);
      triggerToast('Offline, generated local template.', 'info');
    } finally {
      setGeneratingStoreId(null);
    }
  };

  // --- All-In-One Hub: Copy Single Message ---
  const handleCopyStoreMessageToClipboard = (storeId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStoreId(storeId);
    triggerToast('Store custom message copied to clipboard!', 'success');
    setTimeout(() => {
      setCopiedStoreId(null);
    }, 2000);
  };

  // --- All-In-One Hub: Send Single WhatsApp ---
  const handleSendStoreWhatsApp = (store: Store, text: string) => {
    let cleanPhone = store.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');

    // Auto update status to Messaged if None
    if (!store.crmStatus || store.crmStatus === 'None') {
      handleUpdateCrmStatus(store.id, 'Messaged');
    } else {
      triggerToast('Redirecting to WhatsApp chat...', 'info');
    }
  };

  // --- All-In-One Hub: Reset All Statuses ---
  const handleResetAllCrmStatuses = () => {
    if (window.confirm('Are you sure you want to reset all CRM statuses and last messaged dates? This clears your progress checklist.')) {
      const updated = stores.map(s => ({
        ...s,
        crmStatus: 'None' as const,
        lastMessagedAt: undefined,
        customMessage: undefined // clear custom edits too if requested
      }));
      saveStoresToLocal(updated);
      triggerToast('All store statuses and custom message edits have been reset.', 'success');
    }
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
      {/* Primary View Mode Switcher (Desktop & Mobile) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          
          {/* --- Summary Pipeline Statistics Bar --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <div className="text-center md:text-left border-r border-slate-100/60 last:border-0 pr-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Pipeline</span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono mt-0.5">
                {filteredStores.length} <span className="text-xs font-normal text-slate-400">Leads</span>
              </div>
            </div>
            <div className="text-center md:text-left border-r border-slate-100/60 last:border-0 pr-2 md:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">Messaged</span>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-600 font-mono mt-0.5">
                {stores.filter(s => s.crmStatus === 'Messaged').length}
              </div>
            </div>
            <div className="text-center md:text-left border-r border-slate-100/60 last:border-0 pr-2 md:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Interested</span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
                {stores.filter(s => s.crmStatus === 'Interested').length}
              </div>
            </div>
            <div className="text-center md:text-left md:pl-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Orders Secured</span>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-800 font-mono mt-0.5">
                  {stores.filter(s => s.crmStatus === 'Completed').length}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ================= LEFT BATCH CONTROLLER PANEL (SPAN 4) ================= */}
            <aside className="col-span-1 lg:col-span-4 space-y-6">
              
              {/* --- Filter & Quick Search Controls --- */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 font-display">
                    <Search className="w-4 h-4 text-emerald-700" />
                    <span>Search & Filters</span>
                  </h3>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterCrm('All');
                    }}
                    className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Search Query */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search store name, address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-medium"
                    />
                  </div>

                  {/* Filter by Mobile Type */}
                  <div>
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1.5">
                      Phone Channel Type
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {['all', 'mobile', 'landline'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setFilterType(t as any)}
                          className={`py-1 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                            filterType === t 
                              ? 'bg-white text-emerald-855 shadow-2xs border border-slate-200/50' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by CRM Status */}
                  <div>
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1.5">
                      Pipeline Status
                    </label>
                    <select
                      value={filterCrm}
                      onChange={(e) => setFilterCrm(e.target.value as any)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 cursor-pointer"
                    >
                      <option value="All">All Pipeline Stages</option>
                      <option value="None">New (Not Contacted)</option>
                      <option value="Messaged">Messaged</option>
                      <option value="Interested">Interested</option>
                      <option value="Completed">Completed (Ordered)</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                    <button
                      onClick={() => setIsAddingLead(true)}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200/50 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Pharmacy Lead</span>
                    </button>
                    <button
                      onClick={handleResetAllCrmStatuses}
                      className="w-full py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 hover:border-red-100 border border-slate-200 rounded-xl text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      Reset All Send Statuses
                    </button>
                  </div>
                </div>
              </div>

              {/* --- Global Vibe & Special Notes Controller --- */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 font-display mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Global Message Customizer</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Changing these settings instantly updates all templates in real-time below!
                  </p>
                </div>

                {/* Vibe Tone Select */}
                <div>
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1.5">
                    Select Voice Vibe / Tone
                  </label>
                  <div className="space-y-1 font-sans">
                    {VIBES.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setVibe(v.id);
                          triggerToast(`Vibe switched to ${v.label}. All templates updated!`, 'info');
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                          vibe === v.id
                            ? 'bg-emerald-850 text-white border-emerald-850 shadow-xs font-semibold'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-base">{v.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold leading-tight">{v.label}</div>
                          <div className={`text-[9px] truncate leading-tight mt-0.5 ${vibe === v.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {v.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Global Custom Notes */}
                <div>
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1.5">
                    Global Special Note (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Free doorstep delivery on orders of 10+ boxes. Long June 2027 Expiry."
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-medium leading-relaxed font-sans"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1 leading-tight">
                    This note is appended dynamically inside all 20 store templates.
                  </span>
                </div>
              </div>
            </aside>

            {/* ================= RIGHT MESSAGE FEED LIST (SPAN 8) ================= */}
            <section className="col-span-1 lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Bulk Outreach Feed ({filteredStores.length} matched)
                </div>
                <div className="text-[11px] text-emerald-850 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200/50">
                  ⚡ Each box contains 30 Tablets (3x10s)
                </div>
              </div>

              {filteredStores.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-2xs">
                  <span className="text-4xl block mb-2">🏪</span>
                  <h4 className="font-bold text-slate-800 text-sm">No Medical Stores Match Filter</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Try clearing the search box or changing the pipeline filters on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStores.map((s) => {
                    // Compute message for this store
                    const isCustomEdited = s.customMessage !== undefined;
                    const activeMessageText = isCustomEdited 
                      ? s.customMessage! 
                      : generateLocalTemplate(s, vibe, extraNotes);

                    const isCopied = copiedStoreId === s.id;
                    const isGeneratingThis = generatingStoreId === s.id;

                    // CRM Badge helper
                    let badgeClass = 'bg-slate-50 text-slate-500 border-slate-200';
                    if (s.crmStatus === 'Messaged') badgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';
                    else if (s.crmStatus === 'Interested') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/60';
                    else if (s.crmStatus === 'Completed') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                    else if (s.crmStatus === 'Not Interested') badgeClass = 'bg-red-50 text-red-700 border-red-200/60';

                    return (
                      <div 
                        key={s.id}
                        className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all relative ${
                          s.crmStatus === 'Completed' 
                            ? 'border-emerald-300 bg-emerald-50/5' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {/* Card Header Info */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight font-display">
                                {s.name}
                              </span>
                              {s.isCustom && (
                                <span className="text-[8px] bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 px-1.5 py-0.5 rounded uppercase font-mono">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1 font-medium font-sans">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                {s.address}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                {s.hours}
                              </span>
                            </div>
                          </div>

                          {/* Quick CRM status switcher inside list card */}
                          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center font-sans">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Status:
                            </span>
                            <select
                              value={s.crmStatus || 'None'}
                              onChange={(e) => handleUpdateCrmStatus(s.id, e.target.value as any)}
                              className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${badgeClass}`}
                            >
                              <option value="None">New (Unsent)</option>
                              <option value="Messaged">Messaged</option>
                              <option value="Interested">Interested</option>
                              <option value="Completed">Ordered (Completed)</option>
                              <option value="Not Interested">Not Interested</option>
                            </select>
                          </div>
                        </div>

                        {/* Suspension Warning Box */}
                        {s.flagSuspicious && (
                          <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 leading-relaxed">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="font-sans">
                              <span className="font-bold">Phone Number Alert: </span>
                              {s.notes || "This number has invalid formatting or is not a mobile number."}
                            </div>
                          </div>
                        )}

                        {/* Interactive Message Edit Textbox */}
                        <div className="mt-4 relative font-sans">
                          <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1.5 flex justify-between items-center">
                            <span>Draft Message for WhatsApp</span>
                            {isCustomEdited ? (
                              <button 
                                onClick={() => {
                                  const updated = stores.map(item => item.id === s.id ? { ...item, customMessage: undefined } : item);
                                  saveStoresToLocal(updated);
                                  triggerToast(`Restored message for ${s.name} to template default.`, 'info');
                                }}
                                className="text-emerald-700 hover:underline cursor-pointer flex items-center gap-0.5 font-bold"
                              >
                                ↺ Reset to Default Template
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">✨ Instant Template (Auto-Generated)</span>
                            )}
                          </label>

                          <textarea
                            rows={6}
                            value={activeMessageText}
                            onChange={(e) => {
                              const updated = stores.map(item => item.id === s.id ? { ...item, customMessage: e.target.value } : item);
                              saveStoresToLocal(updated);
                            }}
                            className={`w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-800/25 focus:border-emerald-800 transition-all font-mono leading-relaxed text-slate-700`}
                          />
                        </div>

                        {/* Action Toolbar */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 font-sans">
                          
                          {/* Left actions: AI enhancements */}
                          <div>
                            {isUsingGemini && (
                              <button
                                onClick={() => handleGenerateGeminiForStore(s)}
                                disabled={isGeneratingThis}
                                className={`py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50`}
                                title="Use Gemini AI to custom write a warm, bespoke draft just for this specific pharmacy"
                              >
                                {isGeneratingThis ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                <span>{isGeneratingThis ? 'Writing...' : '🪄 Personalized Gemini Draft'}</span>
                              </button>
                            )}
                          </div>

                          {/* Right actions: Copy & Send WhatsApp */}
                          <div className="flex items-center gap-2">
                            {s.isCustom && (
                              <button
                                onClick={(e) => {
                                  if (window.confirm(`Delete Custom Lead ${s.name}?`)) {
                                    handleDeleteLead(s.id, e);
                                  }
                                }}
                                className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer mr-1"
                                title="Delete Custom Lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyStoreMessageToClipboard(s.id, activeMessageText)}
                              className={`py-2 px-3.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                                isCopied 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Message</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleSendStoreWhatsApp(s, activeMessageText)}
                              className="py-2 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5 fill-white" />
                              <span>Open WhatsApp ({s.phone})</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

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
