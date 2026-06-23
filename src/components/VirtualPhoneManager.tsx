import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  Inbox, 
  Send, 
  CheckCircle,
  HelpCircle,
  Clock,
  Trash2,
  Lock,
  BadgeCheck,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, query, orderBy, limit, deleteDoc, getDocs } from 'firebase/firestore';

export interface VirtualNumber {
  id: string;
  country: string;
  flag: string;
  phone: string;
  region: 'Europe' | 'Amérique' | 'Asie';
  operator: string;
  status: 'ACTIF' | 'EN_COURS' | 'SAINT';
}

export interface VirtualMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  service?: string;
  code?: string;
}

export const VIRTUAL_NUMBERS: VirtualNumber[] = [
  { id: 'num-fr', country: 'France', flag: '🇫🇷', phone: '+33 6 44 63 92 10', region: 'Europe', operator: 'Orange S.A.', status: 'ACTIF' },
  { id: 'num-us', country: 'États-Unis', flag: '🇺🇸', phone: '+1 202 555 0142', region: 'Amérique', operator: 'T-Mobile US', status: 'ACTIF' },
  { id: 'num-gb', country: 'Royaume-Uni', flag: '🇬🇧', phone: '+44 7911 123456', region: 'Europe', operator: 'Vodafone UK', status: 'ACTIF' },
  { id: 'num-ca', country: 'Canada', flag: '🇨🇦', phone: '+1 416 555 0192', region: 'Amérique', operator: 'Rogers Wireless', status: 'ACTIF' },
  { id: 'num-de', country: 'Allemagne', flag: '🇩🇪', phone: '+49 170 555 1234', region: 'Europe', operator: 'Deutsche Telekom', status: 'ACTIF' },
  { id: 'num-jp', country: 'Japon', flag: '🇯🇵', phone: '+81 90 5555 1212', region: 'Asie', operator: 'NTT Docomo', status: 'ACTIF' },
  { id: 'num-sg', country: 'Singapour', flag: '🇸🇬', phone: '+65 9123 4567', region: 'Asie', operator: 'Singtel', status: 'ACTIF' }
];

export default function VirtualPhoneManager({ onClose }: { onClose: () => void }) {
  const [selectedNum, setSelectedNum] = useState<VirtualNumber>(VIRTUAL_NUMBERS[0]);
  const [messages, setMessages] = useState<VirtualMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'simple' (one-click simulator) or 'mockup' (interactive portal simulator)
  const [activeTab, setActiveTab] = useState<'simple' | 'mockup'>('mockup');

  // Simple Mode form
  const [otpService, setOtpService] = useState('Google');
  const [customService, setCustomService] = useState('');
  const [triggering, setTriggering] = useState(false);
  
  // Interactive Mode state
  const [mockService, setMockService] = useState<'Google' | 'PayPal' | 'Stripe' | 'WhatsApp' | 'Telegram' | 'Binance'>('Google');
  const [mockStep, setMockStep] = useState<1 | 2 | 3>(1);
  const [mockLoading, setMockLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState('');

  const services = ['Google', 'PayPal', 'Stripe', 'Facebook', 'WhatsApp', 'Amazon', 'Telegram', 'Netflix', 'Binance', 'Autre (Saisir...)'];

  // Subscribe to real-time virtual messages from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'virtual_messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: VirtualMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as VirtualMessage);
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      // Fallback local storage
      const local = localStorage.getItem('local_virtual_messages');
      if (local) {
        setMessages(JSON.parse(local));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // When active phone number changes, reset the interactive form for consistency
  useEffect(() => {
    setMockStep(1);
    setGeneratedCode('');
    setUserInputCode('');
    setVerificationError(null);
  }, [selectedNum]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Helper to save virtual message
  const handleAddMessage = async (msg: Omit<VirtualMessage, 'id'>) => {
    try {
      await addDoc(collection(db, 'virtual_messages'), msg);
      // Also update backup local storage
      const currentLocal = localStorage.getItem('local_virtual_messages');
      const parsed = currentLocal ? JSON.parse(currentLocal) : [];
      const updated = [{ id: `local-${Date.now()}`, ...msg }, ...parsed].slice(0, 50);
      localStorage.setItem('local_virtual_messages', JSON.stringify(updated));
    } catch (e) {
      console.error("Could not write message to Firestore, using local backup:", e);
      // Use local backup fallback
      const currentLocal = localStorage.getItem('local_virtual_messages');
      const parsed = currentLocal ? JSON.parse(currentLocal) : [];
      const updated = [{ id: `local-${Date.now()}`, ...msg }, ...parsed].slice(0, 50);
      localStorage.setItem('local_virtual_messages', JSON.stringify(updated));
      setMessages(updated);
    }
  };

  // 1-Click OTP Generation
  const handleSimulateOTP = () => {
    const finalService = otpService === 'Autre (Saisir...)' ? (customService || 'Service Externe') : otpService;
    setTriggering(true);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    let content = '';
    switch (finalService.toLowerCase()) {
      case 'google':
        content = `G-${otpCode} est votre code de validation Google. Ne le partagez avec personne.`;
        break;
      case 'paypal':
        content = `PayPal: Votre code de sécurité temporaire est ${otpCode}. Ce code expire dans 10 minutes.`;
        break;
      case 'stripe':
        content = `Stripe verification code: ${otpCode}. Never share this code with anyone.`;
        break;
      case 'whatsapp':
        content = `Votre code de confirmation WhatsApp : ${otpCode.slice(0, 3)}-${otpCode.slice(3)}. Ne partagez pas ce code.`;
        break;
      case 'telegram':
        content = `Telegram code: ${otpCode}. Do not give this code to anyone, even if they say they are from Telegram.`;
        break;
      default:
        content = `Votre code de confirmation pour ${finalService} est : ${otpCode}. Référence d'évaluation ID-${Math.floor(Math.random() * 10000)}.`;
        break;
    }

    setTimeout(async () => {
      await handleAddMessage({
        sender: finalService.toUpperCase(),
        recipient: selectedNum.phone,
        content,
        timestamp: new Date().toISOString(),
        service: finalService,
        code: otpCode
      });
      setTriggering(false);
      triggerToast(`🔔 Nouvel OTP reçu avec succès de la part de ${finalService} !`);
    }, 1800);
  };

  // Interactive Double Validation SMS Flow
  const handleSendInteractiveCode = () => {
    setMockLoading(true);
    setVerificationError(null);

    // Create realistic 6-digit confirmation code
    const otpCode = Math.floor(111111 + Math.random() * 888888).toString();
    setGeneratedCode(otpCode);

    let content = '';
    switch (mockService.toLowerCase()) {
      case 'google':
        content = `G-${otpCode} est votre code de validation Google de création d'espace.`;
        break;
      case 'paypal':
        content = `PayPal: Votre de code de validation temporaire est ${otpCode}. Ne le communiquez pas.`;
        break;
      case 'stripe':
        content = `Stripe verification code: ${otpCode}. Entrez ce code pour associer votre numéro virtuel.`;
        break;
      case 'whatsapp':
        content = `Votre code de confirmation WhatsApp : ${otpCode.slice(0, 3)}-${otpCode.slice(3)}`;
        break;
      case 'telegram':
        content = `Telegram authentication code: ${otpCode}. Expire dans 2 mins.`;
        break;
      case 'binance':
        content = `Binance: Code d'authentification de liaison téléphonique [${otpCode}]. Ne transférez ce code à personne.`;
        break;
      default:
        content = `Votre code de confirmation pour l'enregistrement est : ${otpCode}`;
        break;
    }

    setTimeout(async () => {
      await handleAddMessage({
        sender: mockService.toUpperCase(),
        recipient: selectedNum.phone,
        content,
        timestamp: new Date().toISOString(),
        service: mockService,
        code: otpCode
      });
      setMockLoading(false);
      setMockStep(2);
      triggerToast(`📬 Code envoyé ! Consultez le flux SMS de ${selectedNum.phone} à gauche.`);
    }, 1500);
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanInput = userInputCode.trim();
    if (!cleanInput) {
      setVerificationError("Veuillez saisir le code reçu par SMS.");
      return;
    }

    // Direct check or bypass codes inside sandbox setup
    if (cleanInput === generatedCode || cleanInput === '000000' || cleanInput === '111111') {
      setMockLoading(true);
      setTimeout(() => {
        setMockLoading(false);
        setMockStep(3);
        triggerToast(`🎉 Validation réussie pour ${mockService} !`);
      }, 1200);
    } else {
      setVerificationError("Code de validation incorrect. Assurez-vous de recopier fidèlement le code reçu à gauche.");
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Voulez-vous vider tous les messages de ce numéro virtuel ?")) return;
    try {
      const q = query(collection(db, 'virtual_messages'));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (d) => {
        await deleteDoc(d.ref);
      });
      localStorage.setItem('local_virtual_messages', '[]');
      setMessages([]);
      triggerToast("🗑️ Tous les messages ont été supprimés.");
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMessages = messages.filter(
    m => m.recipient.replace(/\s+/g, '') === selectedNum.phone.replace(/\s+/g, '')
  );

  return (
    <div id="virtual_phone_manager" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 text-slate-100 font-sans">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] max-h-[750px] relative">
        
        {/* Toast Notification inside container */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg z-50 animate-bounce flex items-center gap-2 border border-emerald-400">
            <CheckCircle size={14} />
            {toastMsg}
          </div>
        )}

        {/* Sidebar: Phone numbers selection */}
        <div className="w-full md:w-1/3 bg-slate-950 border-r border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4 font-sans">
              <Globe size={18} className="text-emerald-400" />
              <span className="font-extrabold text-xs tracking-wider uppercase text-slate-300">NUMÉROS PHYSIQUES ACTIFS</span>
            </div>

            <div className="space-y-2 max-h-[140px] md:max-h-[460px] overflow-y-auto pr-1">
              {VIRTUAL_NUMBERS.map((num) => {
                const isSelected = selectedNum.id === num.id;
                return (
                  <button
                    id={`btn-virtual-num-${num.id}`}
                    key={num.id}
                    onClick={() => setSelectedNum(num)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 text-white ring-1 ring-blue-500/20' 
                        : 'bg-slate-900/50 border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{num.flag}</span>
                      <div>
                        <span className="block font-bold text-slate-200">{num.country}</span>
                        <span className="font-mono text-[10.5px] block tracking-wide mt-0.5">{num.phone}</span>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {num.region}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 hidden md:block">
            <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono block font-bold">STATUT DE L'ANTENNE</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">RÉSEAU GSM OK</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1 lines-2 leading-relaxed">
                Audits et multiplexage OTP conformes aux réglementations de routage pour la double validation.
              </p>
            </div>
          </div>
        </div>

        {/* Main Interface: SMS monitoring and OTP simulation */}
        <div className="flex-1 flex flex-col h-full bg-slate-900">
          
          {/* Header */}
          <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="text-2xl leading-none">{selectedNum.flag}</div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-sans">SMS Réceptionneur Virtuel</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono text-xs md:text-sm text-white font-extrabold tracking-wide">{selectedNum.phone}</span>
                  <span className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight">MUTUALISÉ</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                id="btn-clear-sms-history"
                onClick={handleClearHistory}
                title="Vider l'historique"
                className="p-2 border border-slate-800 bg-slate-950 hover:bg-red-950/30 hover:border-red-900 text-slate-400 hover:text-red-400 rounded-xl transition duration-150 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
              <button 
                id="btn-close-virtual-phone"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Column: Log of incoming SMS messages */}
            <div className="flex-1 p-4 flex flex-col h-full overflow-hidden border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide flex items-center gap-1 font-sans">
                  <Inbox size={12} className="text-blue-500" /> Flux d'Écoute (Codes SMS Reçus)
                </span>
                <span className="bg-slate-950 border border-slate-850 text-slate-400 font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                  Messages : {filteredMessages.length}
                </span>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs italic">
                    <RefreshCw size={20} className="animate-spin text-blue-500" />
                    Chargement du flux SMS...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                    <MessageSquare size={32} className="text-slate-800 mb-2" />
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Aucun SMS détecté</span>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[240px] leading-relaxed">
                      Associez ce numéro sur le simulateur interactif à droite pour recevoir le code de confirmation en direct !
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="bg-slate-950/60 border border-slate-850/80 rounded-2xl p-3.5 space-y-1.5 transition-all hover:bg-slate-950 hover:border-slate-800"
                    >
                      <div className="flex justify-between items-start">
                        <span className="bg-slate-900 border border-slate-800 text-slate-300 px-20 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight uppercase">
                          PROVENANCE : {msg.sender}
                        </span>
                        <span className="text-[9px] text-slate-550 flex items-center gap-1 font-mono">
                          <Clock size={10} />
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {msg.content}
                      </p>

                      {msg.code && (
                        <div className="flex items-center gap-1.5 bg-blue-950/40 border border-blue-900/50 p-2 rounded-xl text-xs mt-2">
                          <ShieldCheck size={14} className="text-blue-400" />
                          <span className="text-[10px] font-medium text-blue-300">Code de validation :</span>
                          <strong className="font-mono text-white text-[13px] select-all font-black tracking-widest bg-blue-900/40 px-2 py-0.5 rounded">
                            {msg.code}
                          </strong>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Interaction Hub (Simple Simulator vs Full Sites Integration) */}
            <div className="w-full md:w-85 p-4 bg-slate-950/25 flex flex-col justify-start h-full overflow-y-auto">
              
              {/* Tab Selector Buttons */}
              <div className="flex bg-slate-950/80 p-1 rounded-xl mb-4 border border-slate-850">
                <button
                  id="tab-interactive-mock"
                  onClick={() => setActiveTab('mockup')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                    activeTab === 'mockup'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌐 Inscriptions de Site
                </button>
                <button
                  id="tab-simple-otp"
                  onClick={() => setActiveTab('simple')}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                    activeTab === 'simple'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Envoi Rapide
                </button>
              </div>

              {/* TAB 1: ONE-CLICK QUICK OTP GENERATOR */}
              {activeTab === 'simple' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h5 className="text-[10.5px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                      <Smartphone size={13} className="text-blue-450" /> SIMULATEUR EXPRESS DE CODE
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Saisissez simplement un nom de service pour déclencher l'envoi d'un message direct dans le flux Sms.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9.5px] font-mono font-bold text-slate-450 block mb-1 uppercase">PLATEFORME / SERVICE</label>
                      <select
                        value={otpService}
                        onChange={(e) => setOtpService(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {services.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {otpService === 'Autre (Saisir...)' && (
                      <div className="animate-scale-up">
                        <label className="text-[9.5px] font-mono font-bold text-slate-450 block mb-1 uppercase">SOCIÉTÉ EXPÉDITRICE</label>
                        <input
                          type="text"
                          value={customService}
                          onChange={(e) => setCustomService(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans font-bold"
                          placeholder="Ex: Binance Pro, TikTok, Uber"
                        />
                      </div>
                    )}

                    <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5 leading-tight text-[10px]">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase font-bold">INFO CANAL</span>
                      <div className="flex justify-between">
                        <span className="text-slate-450">Canal National :</span>
                        <strong className="font-mono text-slate-350">{selectedNum.country} ({selectedNum.flag})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450">Opérateur Cellulaire :</span>
                        <strong className="text-emerald-405 font-mono">{selectedNum.operator}</strong>
                      </div>
                    </div>

                    <button
                      id="btn-trigger-simple-otp"
                      onClick={handleSimulateOTP}
                      disabled={triggering || (otpService === 'Autre (Saisir...)' && !customService.trim())}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white uppercase tracking-wider ${
                        triggering 
                          ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                          : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/10'
                      }`}
                    >
                      {triggering ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Ajustement GSM...
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Envoyer l'OTP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE PORTAL SIMULATION (DOUBLE VALIDATION WITH CODE INPUT MATCHING IN THE WEBSITE MOCKUP) */}
              {activeTab === 'mockup' && (
                <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-[10.5px] uppercase font-black text-white tracking-wider flex items-center gap-1">
                        <Laptop size={13} className="text-blue-400" /> SIMULATION DE S-INSCRIPTION
                      </h5>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Entrez le numéro virtuel sur le site simulé ci-dessous. Le site enverra le code réel de confirmation à gauche !
                      </p>
                    </div>

                    {/* Choose interactive platform */}
                    {mockStep === 1 && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-450 block mb-1 uppercase tracking-wide">Étape 01 : Choisir le site d'accueil</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Google', 'PayPal', 'Stripe', 'WhatsApp', 'Telegram', 'Binance'] as const).map((s) => {
                            const isSel = mockService === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setMockService(s)}
                                className={`py-1.5 text-[9.5px] font-bold rounded-lg transition-colors border cursor-pointer ${
                                  isSel
                                    ? 'bg-blue-600/20 border-blue-500 text-white font-black'
                                    : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400'
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HIGH FIDELITY SIMULATED PLATFORM COMPONENT BOX */}
                  <div className="mt-2 border border-slate-800 rounded-2xl overflow-hidden bg-white text-slate-800 flex flex-col h-[320px] shadow-lg">
                    
                    {/* Mockup Top Address Line */}
                    <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 font-mono text-[9px] text-slate-450">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <div className="bg-white border rounded px-2 py-0.5 ml-2 mr-1 truncate max-w-[210px] flex items-center gap-1 text-[8.5px] text-slate-500">
                        <Lock size={8} className="text-emerald-500" />
                        https://auth.{mockService.toLowerCase()}.com/secure/phone-validation
                      </div>
                    </div>

                    {/* Interactive portal frame render depending on platform theme */}
                    <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto font-sans">
                      
                      {/* STEP 1: Phone submission mockup */}
                      {mockStep === 1 && (
                        <div className="space-y-4 text-center my-auto">
                          {/* Platform customized Header Logos */}
                          {mockService === 'Google' && (
                            <div className="space-y-1.5">
                              <span className="text-[20px] font-bold tracking-tight">
                                <span className="text-blue-600">G</span>
                                <span className="text-rose-500">o</span>
                                <span className="text-amber-500">o</span>
                                <span className="text-blue-600">g</span>
                                <span className="text-emerald-500">l</span>
                                <span className="text-rose-500">e</span>
                              </span>
                              <h4 className="text-xs font-bold text-slate-800">Associer un numéro de sécurité</h4>
                              <p className="text-[10px] text-slate-500 leading-tight">Google utilisera ce numéro de téléphone uniquement pour valider votre compte.</p>
                            </div>
                          )}

                          {mockService === 'PayPal' && (
                            <div className="space-y-1">
                              <span className="text-blue-900 font-extrabold text-base italic tracking-tighter">Pay<span className="text-sky-500">Pal</span></span>
                              <h4 className="text-xs font-bold text-slate-800">Lier votre mobile sécurisé</h4>
                              <p className="text-[10px] text-slate-500 leading-tight">Recevez un code de validation de solde par SMS.</p>
                            </div>
                          )}

                          {mockService === 'Stripe' && (
                            <div className="space-y-1 text-center">
                              <span className="text-[#635bff] font-black text-lg tracking-tight">stripe</span>
                              <h4 className="text-xs font-bold text-slate-800">Évaluation KYC Flash</h4>
                              <p className="text-[10px] text-slate-500 leading-tight">Un code SMS est nécessaire pour libérer l'accès aux paiements.</p>
                            </div>
                          )}

                          {mockService === 'WhatsApp' && (
                            <div className="space-y-1 text-center">
                              <span className="text-[#25D366] font-bold text-base">WhatsApp Messenger</span>
                              <h4 className="text-xs font-bold text-slate-800">Validation de votre numéro</h4>
                              <p className="text-[10px] text-slate-500 leading-tight">Saisissez votre numéro pour initialiser WhatsApp Web.</p>
                            </div>
                          )}

                          {mockService === 'Telegram' && (
                            <div className="space-y-1 text-center">
                              <span className="text-[#0088cc] font-extrabold text-base">Telegram Web</span>
                              <h4 className="text-xs font-bold text-slate-800">Votre numéro de mobile</h4>
                              <p className="text-[10px] text-slate-500 leading-tight">Saisissez l'adresse de raccordement téléphonique.</p>
                            </div>
                          )}

                          {mockService === 'Binance' && (
                            <div className="space-y-1 text-center">
                              <span className="text-amber-500 bg-slate-900 px-3 py-1 font-mono font-black text-xs inline-block rounded-md tracking-wider">BINANCE SECURE</span>
                              <h4 className="text-xs font-bold text-slate-800 mt-1">Liaison API de Référence</h4>
                              <p className="text-[10px] text-slate-550 leading-tight">Vérification de sécurité 2FA pour la création d'adresse.</p>
                            </div>
                          )}

                          {/* Field Prefilled styled input */}
                          <div className="space-y-1.5 pt-2">
                            <label className="text-[8.5px] font-bold text-slate-400 block text-left uppercase">Numéro Téléphonique :</label>
                            <div className="flex border border-slate-250 rounded-lg overflow-hidden bg-slate-50 select-none">
                              <span className="bg-slate-150 px-2.5 py-1.5 text-xs text-slate-500 font-bold flex items-center border-r border-slate-250">
                                {selectedNum.flag} Country
                              </span>
                              <input
                                type="text"
                                readOnly
                                value={selectedNum.phone}
                                className="w-full bg-transparent px-3 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white"
                              />
                            </div>
                          </div>

                          <button
                            id="btn-dv-get-otp"
                            onClick={handleSendInteractiveCode}
                            disabled={mockLoading}
                            className={`w-full py-2 rounded-lg text-[10.5px] font-sans font-bold uppercase transition duration-150 text-white cursor-pointer ${
                              mockLoading
                                ? 'bg-slate-400 cursor-not-allowed'
                                : mockService === 'Google'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : mockService === 'PayPal'
                                ? 'bg-blue-900 hover:bg-blue-950'
                                : mockService === 'Stripe'
                                ? 'bg-[#635bff] hover:bg-[#534be5]'
                                : mockService === 'WhatsApp'
                                ? 'bg-[#25D366] hover:bg-[#20b858]'
                                : mockService === 'Telegram'
                                ? 'bg-[#0088cc] hover:bg-[#0077b3]'
                                : 'bg-slate-900 hover:bg-black text-[#F0B90B]'
                            }`}
                          >
                            {mockLoading ? 'Envoi en cours...' : "Obtenir le code de confirmation"}
                          </button>
                        </div>
                      )}

                      {/* STEP 2: Code verification mockup */}
                      {mockStep === 2 && (
                        <form onSubmit={handleVerifyCodeSubmit} className="space-y-3.5 my-auto">
                          <div className="text-center space-y-1">
                            <h4 className="text-xs font-bold text-slate-800">Double authentification {mockService}</h4>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Nous venons d'envoyer un code de confirmation de session à 6 chiffres par SMS au numéro : <br />
                              <strong className="font-mono text-slate-700 font-bold">{selectedNum.phone}</strong>
                            </p>
                          </div>

                          {verificationError && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-lg p-2 text-[9.5px] leading-snug text-center font-bold">
                              {verificationError}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-[8.5px] font-mono font-bold text-slate-400 block text-center uppercase tracking-wide">
                              Code de confirmation reçu :
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              placeholder="------"
                              value={userInputCode}
                              onChange={(e) => {
                                setVerificationError(null);
                                setUserInputCode(e.target.value.replace(/[^0-9]/g, ''));
                              }}
                              className="w-full border border-slate-250 bg-slate-50 rounded-xl py-2.5 text-center text-lg font-black font-mono tracking-widest text-slate-950 focus:outline-none focus:border-blue-500 focus:bg-white select-all"
                            />
                            <span className="text-[9px] text-slate-400 block text-center italic mt-0.5">
                              Recopiez le code à 6 chiffres depuis l'inbox Sms à gauche.
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMockStep(1);
                                setUserInputCode('');
                                setVerificationError(null);
                              }}
                              className="flex-1 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Retour
                            </button>
                            <button
                              id="btn-dv-verify-otp"
                              type="submit"
                              disabled={mockLoading || userInputCode.length < 5}
                              className={`flex-1 py-2 text-white rounded-lg text-[10px] font-bold uppercase transition cursor-pointer flex items-center justify-center gap-1 ${
                                mockLoading || userInputCode.length < 5
                                  ? 'bg-slate-300 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                            >
                              {mockLoading && <RefreshCw size={10} className="animate-spin" />}
                              Vérifier le code
                            </button>
                          </div>
                        </form>
                      )}

                      {/* STEP 3: Verification success mockup */}
                      {mockStep === 3 && (
                        <div className="text-center space-y-4 my-auto animate-scale-up">
                          <div className="inline-flex h-12 w-12 bg-emerald-100 rounded-full items-center justify-center text-emerald-600 mx-auto">
                            <BadgeCheck size={28} />
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900">Connexion Approuvée !</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed px-2">
                              Le code de confirmation <strong className="font-mono text-emerald-600">{generatedCode}</strong> fourni par le portail <strong>{mockService}</strong> a été associé et validé avec succès sur le numéro virtuel unique :
                              <br />
                              <strong className="font-mono text-slate-800">{selectedNum.phone}</strong>
                            </p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mx-auto font-mono">
                            <ExternalLink size={11} className="text-slate-400" /> token: fc_virt_auth_77926
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setMockStep(1);
                              setGeneratedCode('');
                              setUserInputCode('');
                              setVerificationError(null);
                            }}
                            className="w-full py-2 bg-slate-900 text-white hover:bg-black rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Associer un autre service
                          </button>
                        </div>
                      )}

                    </div>

                  </div>

                  <div className="pt-3 border-t border-slate-800/80 mt-3">
                    <div className="flex items-start gap-1.5 text-[9.5px] text-slate-500 leading-normal font-sans">
                      <HelpCircle size={12} className="shrink-0 text-slate-405 mt-0.5" />
                      <span>
                        Simule un portail d'inscription d'un site tiers. Vous connectez votre mobile, lisez l'OTP réel reçu à gauche et le validez dans le formulaire.
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
