import React, { useState } from 'react';
import { 
  Home, 
  ChevronRight, 
  ShoppingBag, 
  Wallet, 
  Ticket, 
  CheckCircle2, 
  Smartphone, 
  Mail, 
  FileText, 
  ShieldAlert, 
  Lock, 
  HelpCircle,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Send,
  Zap,
  Phone,
  Link as LinkIcon,
  Globe,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { CampaignLog, SimulatedTransfer, PaymentTransaction } from '../types';

interface DashboardProps {
  balance: number;
  smsCount: number;
  emailCount: number;
  contactsCount: number;
  campaigns: CampaignLog[];
  transfers: SimulatedTransfer[];
  transactions: PaymentTransaction[];
  setActiveTab: (tab: string) => void;
  setQuickTrialModal: (show: boolean) => void;
  isAdmin?: boolean;
  onLaunchSimulation?: (transfer: SimulatedTransfer) => void;
  onAddBalance?: (amount: number, method: string) => void;
  clientTransfer?: SimulatedTransfer | null;
}

export default function Dashboard({ 
  balance, 
  campaigns, 
  transfers, 
  setActiveTab,
  setQuickTrialModal,
  isAdmin = true,
  onLaunchSimulation,
  onAddBalance,
  clientTransfer = null
}: DashboardProps) {
  
  // Local states for tools modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulators input states
  const [ibanInput, setIbanInput] = useState('');
  const [ibanChecking, setIbanChecking] = useState(false);
  const [ibanResult, setIbanResult] = useState<any>(null);

  const [mailInput, setMailInput] = useState('');
  const [mailChecking, setMailChecking] = useState(false);
  const [mailResult, setMailResult] = useState<any>(null);

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);

  const [urlInput, setUrlInput] = useState('');
  const [shortUrlResult, setShortUrlResult] = useState('');

  const [cryptoAmt, setCryptoAmt] = useState('100');
  const [virtualCardData, setVirtualCardData] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. IBAN Checking Simulator
  const handleIbanCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibanInput.trim()) return;
    setIbanChecking(true);
    setIbanResult(null);
    setTimeout(() => {
      setIbanChecking(false);
      const isIbanVal = ibanInput.length > 14;
      setIbanResult({
        valid: isIbanVal,
        country: ibanInput.toLowerCase().startsWith('fr') ? 'France (FR)' : 
                 ibanInput.toLowerCase().startsWith('be') ? 'Belgique (BE)' : 
                 ibanInput.toLowerCase().startsWith('de') ? 'Allemagne (DE)' : 'Zone SEPA / Europe',
        bankCode: 'MOCK-BANK-900',
        type: isIbanVal ? 'Standard SEPA/BCEAO Compliant' : 'Format non reconnu'
      });
    }, 1200);
  };

  // 2. Email Checker Simulator
  const handleMailCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailInput.trim()) return;
    setMailChecking(true);
    setMailResult(null);
    setTimeout(() => {
      setMailChecking(false);
      const isOk = mailInput.includes('@') && mailInput.includes('.');
      setMailResult({
        deliverable: isOk,
        smtpCode: isOk ? '250 OK' : '550 User Unknown',
        mxRecord: isOk ? 'mx.secureserver.net' : 'Aucun enregistrement trouvé',
        score: isOk ? '98%' : '0%'
      });
    }, 1000);
  };

  // 3. Coupon Simulator
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'SILLYFR' || code === 'KITS2026' || code === 'ADMIN100') {
      if (onAddBalance) {
        onAddBalance(500, 'COUPON RECHARGE');
        setCouponStatus('success');
        triggerToast('🎁 Félicitations ! +500 € ajoutés avec succès !');
      } else {
        setCouponStatus('success');
        triggerToast('🎁 Code de réduction validé en mode simulation !');
      }
    } else {
      setCouponStatus('error');
    }
  };

  // 4. URL Shortener Simulator
  const handleUrlShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const key = Math.random().toString(36).substring(2, 7);
    setShortUrlResult(`https://kits.ly/r?id=${key}`);
    triggerToast('🔗 Lien raccourci avec succès !');
  };

  // 5. Virtual Card simulator
  const generateVirtualCard = () => {
    const num = Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000).toString()).join(' ');
    const cvv = Math.floor(100 + Math.random() * 899).toString();
    const exp = `08/${26 + Math.floor(Math.random() * 5)}`;
    setVirtualCardData({ num, cvv, exp, holder: isAdmin ? 'ADMIN SAAS' : 'CLIENT CONFORMITE' });
    triggerToast('💳 Nouvelle carte virtuelle générée !');
  };

  const handleToolClick = (toolId: string) => {
    // Unrestricted direct access to all professional tools and panels
    if (toolId === 'sms') setActiveTab('sms');
    else if (toolId === 'mail-flash') setActiveTab('email');
    else if (toolId === 'flash-v1') setActiveTab('flash-v1');
    else if (toolId === 'flash-v2') setActiveTab('flash-v2');
    else if (toolId === 'recharge') setActiveTab('billing');
    else setActiveModal(toolId);
  };

  // Interactive indicators for Client status
  const clientV1Active = clientTransfer && clientTransfer.version === 'V1';
  const clientV2Active = clientTransfer && clientTransfer.version === 'V2';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans">
      
      {/* KitsCms Breadcrumb styled box */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-700 select-none">
        <div className="flex items-center gap-2">
          <Home className="text-slate-400 cursor-pointer hover:text-slate-600" size={14} onClick={() => setActiveTab('dashboard')} />
          <ChevronRight className="text-slate-300" size={12} />
          <ShoppingBag className="text-slate-400" size={14} />
          <span className="text-slate-500">Liste des outils</span>
          <ChevronRight className="text-slate-300" size={12} />
          <span className="text-slate-900 font-bold">Catalogue d'applications</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[10px] text-slate-500 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {isAdmin ? "PANEL OPT GESTIONNAIRE" : "ESPACE CONFORMITÉ CLIENT"}
        </div>
      </div>

      {/* PAID ACCESS TOOLS SECTION */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="text-slate-500" size={16} />
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">Outils à accès payant</h3>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('billing')}
              className="text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-all font-semibold"
            >
              💼 Approvisionner {balance.toLocaleString('fr-FR')} €
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* Card: SMS Pro */}
          <div 
            onClick={() => handleToolClick('sms')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="22" y="10" width="20" height="38" rx="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
                <rect x="25" y="19" width="14" height="15" rx="2" fill="#E0F2FE" />
                <rect x="29" y="24" width="6" height="5" rx="1" fill="#3B82F6" />
                <circle cx="32" cy="43" r="1.5" fill="#3B82F6" />
                <circle cx="42" cy="18" r="4.5" fill="#EF4444" />
                <text x="42" y="21" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle">1</text>
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">SMS Pro</span>
          </div>

          {/* Card: Mail Flash Pro */}
          <div 
            onClick={() => handleToolClick('mail-flash')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="20" width="36" height="24" rx="3" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                <path d="M14 20L32 31L50 20" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                <path d="M28 34L48 24L41 40L36 36L28 34Z" fill="#3B82F6" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Mail Flash Pro</span>
          </div>

          {/* Card: Mail Pro Privé */}
          <div 
            onClick={() => handleToolClick('mail-prive')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="16" width="32" height="32" rx="4" fill="white" stroke="#10B981" strokeWidth="2" />
                <rect x="16" y="16" width="32" height="6" fill="#A7F3D0" />
                <path d="M20 28H44" stroke="#D1FAE5" strokeWidth="2" />
                <rect x="24" y="32" width="16" height="10" rx="1.5" fill="#10B981" />
                <path d="M24 32L32 38L40 32" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Mail Pro Privé</span>
          </div>

          {/* Card: Collecte de code coupon */}
          <div 
            onClick={() => handleToolClick('coupon')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="22" width="36" height="24" rx="3" fill="#FFE4E6" stroke="#E11D48" strokeWidth="2" />
                <path d="M14 26L32 35L50 26" stroke="#E11D48" strokeWidth="2" />
                <rect x="22" y="12" width="20" height="15" rx="1.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
                <text x="32" y="21" fill="#CA8A04" fontSize="7" fontWeight="black" textAnchor="middle">%</text>
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Collecte de code coupon</span>
          </div>

          {/* Card: Vérification IBAN / CB */}
          <div 
            onClick={() => handleToolClick('iban-cb')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="22" width="32" height="20" rx="3" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
                <rect x="12" y="26" width="32" height="4" fill="#2563EB" />
                <circle cx="44" cy="18" r="4.5" fill="#3B82F6" />
                <path d="M40 28C40 25 43 24 45 24C47 24 50 25 50 28" fill="#3B82F6" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Vérification IBAN / CB</span>
          </div>

          {/* Card: Vérification e-mail */}
          <div 
            onClick={() => handleToolClick('email-check')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="20" width="36" height="24" rx="3" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
                <circle cx="44" cy="38" r="6" fill="#10B981" />
                <path d="M41 38L43 40L47 36" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Vérification d'un e-mail</span>
          </div>

          {/* Card: Vérification numéro de téléphone */}
          <div 
            onClick={() => handleToolClick('phone-check')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="22" y="10" width="20" height="42" rx="4" fill="white" stroke="#D97706" strokeWidth="2" />
                <rect x="16" y="18" width="32" height="6" rx="2.5" fill="#EF4444" />
                <text x="32" y="23" fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle">123-456</text>
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Vérification de téléphone</span>
          </div>

        </div>
      </div>

      {/* FREE ACCESS TOOLS SECTION */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-slate-200 pb-2.5 flex items-center gap-2">
          <Globe className="text-slate-500" size={16} />
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">Outils à accès libre</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* Card: Mail Extractor */}
          <div 
            onClick={() => handleToolClick('extractor')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="24" width="36" height="24" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
                <path d="M14 24L32 34L50 24" stroke="#0284C7" strokeWidth="1.5" />
                <path d="M32 10V22M32 10L27 15M32 10L37 15" stroke="#0284C7" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Mail Extractor</span>
          </div>

          {/* Card: Verification site web */}
          <div 
            onClick={() => handleToolClick('website')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="24" r="14" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
                <rect x="18" y="34" width="28" height="7" rx="1.5" fill="#1D4ED8" />
                <text x="32" y="39" fill="white" fontSize="5" fontWeight="bold" textAnchor="middle">https://</text>
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Vérification de site web</span>
          </div>

          {/* Card: Shortner URL */}
          <div 
            onClick={() => handleToolClick('shortener')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="20" width="36" height="26" fill="white" stroke="#F59E0B" strokeWidth="1.5" />
                <rect x="14" y="20" width="36" height="5" fill="#FEF3C7" />
                <path d="M22 34L40 34" stroke="#3B82F6" strokeWidth="2" />
                <path d="M40 34L35 30M40 34L35 38" stroke="#3B82F6" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Raccourcissement d'URL</span>
          </div>

          {/* Card: Crypto USDT */}
          <div 
            onClick={() => handleToolClick('crypto')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer relative select-none"
          >
            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded absolute top-3 left-3 uppercase">
              NEW
            </span>
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="32,10 40,14 40,22 32,26 24,22 24,14" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
                <circle cx="32" cy="18" r="3" fill="#D97706" />
                <path d="M26 36H44L48 41L44 46H26V36Z" fill="#10B981" />
                <text x="35" y="43" fill="white" fontSize="6.5" fontWeight="bold">SELL</text>
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Vente de Crypto USDT</span>
          </div>

          {/* Card: Virtual Phone */}
          <div 
            onClick={() => handleToolClick('virtual-phone')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded absolute top-3 left-3 uppercase">
              NEW
            </span>
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 16C18 12 28 14 30 20C32 26 24 28 26 34C28 40 38 34 44 42C48 48 42 48 38 48C24 48 18 36 18 16Z" fill="#10B981" />
                <path d="M38 18C44 20 48 26 48 32" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Numéros virtuelles</span>
          </div>

          {/* Card: Virtual Card */}
          <div 
            onClick={() => handleToolClick('virtual-card')}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer relative select-none animate-scale-up"
          >
            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded absolute top-3 left-3 uppercase">
              NEW
            </span>
            <div className="h-16 flex items-center justify-center mb-2">
              <svg className="w-14 h-14 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="34" height="22" rx="3" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5" />
                <rect x="20" y="24" width="34" height="4" fill="#1E40AF" />
                <rect x="24" y="32" width="6" height="4" fill="#FBBF24" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800">Cartes virtuelles</span>
          </div>

        </div>
      </div>

      {/* INTERACTIVE MODALS AND PORTLET SIMULATORS */}

      {/* 1. UPGRADE REQUIRED FOR CLIENTS */}
      {activeModal === 'upgrade' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-red-600 mb-2 flex items-center gap-2">
              <AlertCircle size={20} /> Accès Limité
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Votre abonnement actuel ne comprend pas l'accès direct aux outils optionnels de marketing avancés.
            </p>
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 font-medium">
              Veuillez contacter le gestionnaire ou l'administrateur de votre compte d'opérateur pour modifier vos privilèges d'accès.
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all"
            >
              Fermer la fenêtre
            </button>
          </div>
        </div>
      )}

      {/* 2. IBAN VALIDATOR MODAL */}
      {activeModal === 'iban-cb' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              🔍 Validation Référence IBAN / CB
            </h3>
            <form onSubmit={handleIbanCheck} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">NUMÉRO IBAN / COMPTE OU NUMÉRO DE CARTE</label>
                <input 
                  type="text"
                  required
                  value={ibanInput}
                  onChange={(e) => setIbanInput(e.target.value)}
                  placeholder="Saisissez votre IBAN ou de carte bancaire de test..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                />
              </div>
              <button 
                type="submit"
                disabled={ibanChecking}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-semibold"
              >
                {ibanChecking ? "Interrogation de la base..." : "Interroger le registre bancaire"}
              </button>
            </form>

            {ibanResult && (
              <div className="mt-4 p-4 rounded-2xl border text-xs bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Statut Conformité:</span>
                  <span className={`font-bold ${ibanResult.valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ibanResult.valid ? '✅ VALIDE / COMPLIANT' : '❌ CHIP / NON-RECONNU'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Territoire d'Émission:</span>
                  <span className="font-bold text-slate-800">{ibanResult.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protocole utilisé:</span>
                  <span className="font-mono font-semibold text-slate-600">{ibanResult.type}</span>
                </div>
              </div>
            )}

            <button 
              onClick={() => { setActiveModal(null); setIbanResult(null); setIbanInput(''); }}
              className="mt-4 w-full py-2 border text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* 3. EMAIL SMTP VERIFIER MODAL */}
      {activeModal === 'email-check' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              📧 Vérificateur SMTP / MX Réseau d'Emails
            </h3>
            <form onSubmit={handleMailCheck} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">EMAIL À AUDITER</label>
                <input 
                  type="email"
                  required
                  value={mailInput}
                  onChange={(e) => setMailInput(e.target.value)}
                  placeholder="client@domaine.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button 
                type="submit"
                disabled={mailChecking}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-semibold"
              >
                {mailChecking ? "Handshake SMTP en cours..." : "Lancer le diagnostic MX / DNS"}
              </button>
            </form>

            {mailResult && (
              <div className="mt-4 p-4 rounded-2xl border text-xs bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Serveur MX Référent:</span>
                  <span className="font-mono text-slate-700 font-bold">{mailResult.mxRecord}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Handshake du Serveur:</span>
                  <span className="font-mono text-slate-600">{mailResult.smtpCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Délivrabilité Estimée:</span>
                  <span className={`font-black ${mailResult.deliverable ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {mailResult.score} ({mailResult.deliverable ? 'EXCELLENTE' : 'ÉCHEC CONNECTEUR'})
                  </span>
                </div>
              </div>
            )}

            <button 
              onClick={() => { setActiveModal(null); setMailResult(null); setMailInput(''); }}
              className="mt-4 w-full py-2 border text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Quitter
            </button>
          </div>
        </div>
      )}

      {/* 4. COUPON VALIDATION MODAL */}
      {activeModal === 'coupon' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-rose-600 mb-2 flex items-center gap-2">
              🎁 Collecte de Code Coupon KitsCms
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Saisissez un coupon d'évaluation pour approvisionner instantanément votre solde en mode Simulation d'Essai.
            </p>
            <form onSubmit={handleCouponSubmit} className="space-y-3">
              <input 
                type="text"
                required
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value); setCouponStatus(null); }}
                placeholder="Ex: SILLYFR , KITS2026, ADMIN100"
                className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-center tracking-widest uppercase focus:outline-none"
              />
              <button 
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Appliquer le coupon d'évaluation
              </button>
            </form>

            {couponStatus === 'success' && (
              <p className="mt-3 text-xs font-semibold text-emerald-600 text-center">
                ✅ Code appliqué avec succès ! +500 € injectés.
              </p>
            )}
            {couponStatus === 'error' && (
              <p className="mt-3 text-xs font-semibold text-rose-600 text-center">
                ❌ Code erroné ou campagne de coupon inactive.
              </p>
            )}

            <button 
              onClick={() => { setActiveModal(null); setCouponStatus(null); setCouponInput(''); }}
              className="mt-4 w-full py-2 border text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Fermer la fenêtre
            </button>
          </div>
        </div>
      )}

      {/* 5. URL SHORTENER LINK MODAL */}
      {activeModal === 'shortener' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              🔗 Raccourcisseur de Liens Sécurisés KitsCms
            </h3>
            <form onSubmit={handleUrlShorten} className="space-y-3">
              <input 
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://votre-compte-bancaire-simulation.com/virement/185..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 font-medium"
              />
              <button 
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs font-semibold"
              >
                Générer un lien court d'évaluation Kits
              </button>
            </form>

            {shortUrlResult && (
              <div className="mt-4 p-3 rounded-xl border bg-slate-50 flex items-center justify-between text-xs font-mono font-bold text-blue-600">
                <span>{shortUrlResult}</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(shortUrlResult); triggerToast('📋 Lien court copié dans le presse-papiers !'); }}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-sans hover:bg-blue-700"
                >
                  Copier
                </button>
              </div>
            )}

            <button 
              onClick={() => { setActiveModal(null); setShortUrlResult(''); setUrlInput(''); }}
              className="mt-4 w-full py-2 border text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* 6. USDT GATES RATES CALCULATOR */}
      {activeModal === 'crypto' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              🪙 Convertisseur Vente Crypto USDT en CFA
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">MONTANT USDT À RETIRER</label>
                <input 
                  type="number"
                  value={cryptoAmt}
                  onChange={(e) => setCryptoAmt(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none"
                  placeholder="Ex: 100"
                />
              </div>
              <div className="p-4 rounded-xl border bg-slate-50 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Taux de conversion d'essai:</span>
                  <span className="font-bold">0.92 € / USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de passerelle kits (1.2%):</span>
                  <span className="font-bold">{(parseFloat(cryptoAmt || '0') * 0.92 * 0.012).toLocaleString()} €</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-bold text-slate-800 text-sm">
                  <span>Net versé total:</span>
                  <span className="text-emerald-600 font-mono">
                    {(parseFloat(cryptoAmt || '0') * 0.92 * 0.988).toLocaleString('fr-FR')} €
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2 border text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Fermer la passerelle
            </button>
          </div>
        </div>
      )}

      {/* 7. VIRTUAL CARD GENERATOR */}
      {activeModal === 'virtual-card' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              💳 Générateur Interactif de Cartes Virtuelles
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Idéal pour injecter et simuler des paiements et des raccordements d'API de checkout.
            </p>

            {virtualCardData ? (
              <div className="w-full bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xl space-y-6 relative overflow-hidden font-mono selection:bg-none">
                <div className="text-xs font-bold text-blue-400">TRANSFERWIRE COMPLIANT</div>
                <div className="text-lg tracking-widest text-center py-2">{virtualCardData.num}</div>
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">CARD HOLDER</span>
                    <span>{virtualCardData.holder}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">EXPIRES</span>
                      <span>{virtualCardData.exp}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">CVC</span>
                      <span>{virtualCardData.cvv}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={generateVirtualCard}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase transition shadow-md"
              >
                Générer ma carte virtuelle
              </button>
            )}

            <button 
              onClick={() => { setActiveModal(null); setVirtualCardData(null); }}
              className="mt-4 w-full py-2 border text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Fermer et Retourner
            </button>
          </div>
        </div>
      )}

      {/* 8. VIRTUAL NUMBERS WORKSPACE */}
      {activeModal === 'virtual-phone' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              🟢 Numéros Virtuels SMS OTP (Mode Simulation)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Pour réaliser des audits de flux d'OTP, voici des canaux d'interceptions d'essai actifs :
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 border p-3 rounded-xl text-xs font-medium">
                <div>
                  <span className="text-[10px] block text-slate-400">Côte d'Ivoire (Canal Moov)</span>
                  <span className="font-mono text-slate-800 font-bold">+225 01 02 89 44 23</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded text-[10px] font-bold">ECOUTE ACTIVE</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border p-3 rounded-xl text-xs font-medium">
                <div>
                  <span className="text-[10px] block text-slate-400">Sénégal (Canal Wave S.A.)</span>
                  <span className="font-mono text-slate-800 font-bold">+221 77 654 32 10</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded text-[10px] font-bold">ECOUTE ACTIVE</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Retourner aux outils
            </button>
          </div>
        </div>
      )}

      {/* 9. EMAIL PRO PRIVÉ DETAILS */}
      {activeModal === 'mail-prive' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
              🔒 Comptes Webs d'Emails Pro Privés
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Permet de configurer des filtres SPF/DKIM avancés pour simuler de hauts indices de délivrabilité d'alertes bancaires vis-à-vis des filtres antispam de Gmail et Outlook.
            </p>
            <div className="mt-4 p-4 rounded-xl border bg-slate-50 text-[11px] font-mono space-y-1.5 text-slate-600">
              <div className="text-slate-800 font-bold">Hébergeurs Compliants:</div>
              <div>• BCEAO Secure Hub Inter-mailing</div>
              <div>• CFA-Connect SMTP Relay</div>
              <div>• Inbound d'évaluation d'alerte</div>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MOCK ADS INTERACTIVE BADGE */}
      {(activeModal === 'website' || activeModal === 'extractor') && (
        // Simple mock feedback triggers
        <div className="hidden">{(() => { triggerToast('Simulation lancée...'); setActiveModal(null); })()}</div>
      )}

      {/* FIXED TOAST NOTIFICATION CONTAINER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-slate-100 py-3 px-5 rounded-2xl flex items-center gap-2 shadow-2xl animate-fade-in select-none max-w-sm">
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold font-mono leading-tight">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
