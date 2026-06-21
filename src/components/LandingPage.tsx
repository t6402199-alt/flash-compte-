import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  Smartphone, 
  Users, 
  Mail, 
  Lock, 
  Laptop, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  RotateCw,
  HelpCircle,
  FileText,
  MousePointerClick
} from 'lucide-react';
import { SimulatedTransfer } from '../types';

interface LandingPageProps {
  onEnterAdminDemo: () => void;
  onOpenAuthGate: (tab: 'beneficiary' | 'admin') => void;
  transfersCount: number;
}

export default function LandingPage({ 
  onEnterAdminDemo, 
  onOpenAuthGate,
  transfersCount 
}: LandingPageProps) {
  // Mini interactive calculator inside landing page to delight the user
  const [calcAmount, setCalcAmount] = useState<number>(15000);
  const [calcCurrency, setCalcCurrency] = useState<string>('EUR');
  
  const estimatedFees = calcAmount * 0.012; // 1.2% compliant simulation
  const payoutAmount = calcAmount - estimatedFees;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-blue-600 selection:text-white antialiased overflow-x-hidden">
      
      {/* GLOW BACKGROUND EFFECT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-blue-900/15 via-emerald-900/5 to-transparent blur-3xl pointer-events-none" />

      {/* HEADER / NAVIGATION BAR */}
      <header className="relative border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand exactly like original KitsCms */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L21 6.5L12 11L3 6.5L12 2Z" fill="#3B82F6" />
                <path d="M3 6.5L12 11V21L3 16.5V6.5Z" fill="#F97316" />
                <path d="M12 11L21 6.5V16.5L12 21V11Z" fill="#10B981" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                <span className="text-emerald-400 font-black">Kits</span>
                <span className="text-blue-500">Cms</span>
              </span>
              <p className="text-[9px] text-slate-400 font-black leading-none tracking-widest uppercase font-mono">CRM & MARKETING HUB</p>
            </div>
          </div>

          {/* Desktop Desktop menu links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-350 tracking-wide uppercase">
            <a href="#features" className="hover:text-blue-400 transition">Fonctionnalités</a>
            <a href="#calculator" className="hover:text-blue-400 transition">Convertisseur</a>
            <a href="#faq" className="hover:text-blue-400 transition">Support & FAQ</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuthGate('beneficiary')}
              className="px-4 py-2 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-xs rounded-xl hover:bg-slate-900/50 transition cursor-pointer"
            >
              Espace Client
            </button>
            <button
              onClick={() => onOpenAuthGate('admin')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition cursor-pointer"
            >
              Console Admin
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold font-mono text-[10px] rounded-full uppercase tracking-wider mb-8 animate-pulse">
          <Sparkles size={11} />
          PLATEFORME DE MARKETING & CRM • VERSION V2.5 EN SERVICE
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
          Propulsez vos campagnes avec <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 font-extrabold pb-1">KitsCms Marketing</span> en direct.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          La plateforme complète de communication digitale multicanale pour gérer vos SMS bulk, e-mails pro et bases de contacts clients avec facturation en temps réel.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-4xl mx-auto mb-16">
          <button
            onClick={() => onOpenAuthGate('beneficiary')}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap size={15} className="fill-current" />
            Créer un compte & Se connecter
          </button>
          <button
            onClick={onEnterAdminDemo}
            className="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white font-bold rounded-2xl text-xs sm:text-sm uppercase border border-slate-800 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Démo Console (Sans Login)
          </button>
          <button
            onClick={() => onOpenAuthGate('admin')}
            className="w-full md:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold rounded-2xl text-xs sm:text-sm uppercase border border-slate-800/80 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Accéder à la Console Admin
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Dynamic Counter / Real-Time Data strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-950/80 border border-slate-800 rounded-3xl max-w-4xl mx-auto text-left relative z-20 backdrop-blur">
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">SMS ENVOYÉS</span>
            <strong className="text-2xl font-black text-white font-mono">Bulk Actif</strong>
          </div>
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">CAMPAGNES MAIL</span>
            <strong className="text-2xl font-black text-emerald-400 font-mono">SMTP Pro</strong>
          </div>
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">CRM RACCORDÉ</span>
            <strong className="text-2xl font-black text-purple-400 font-mono">Multi-Client</strong>
          </div>
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Disponibilité API</span>
            <strong className="text-2xl font-black text-blue-400 font-mono">99.9%</strong>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURES SECTION */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/45 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block mb-2">PLATEFORME MULTICANAL</span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Tout le nécessaire pour vos compagnes de communication
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto mt-2.5">
            KitsCms fournit les outils professionnels pour concevoir, suivre et exécuter vos diffusions SMS et campagnes e-mail pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-slate-700/80 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-150">
              <Laptop size={18} />
            </div>
            <h3 className="text-base font-black text-white mb-2 font-sans">
              Diffusion SMS Bulk
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Planifiez des envois groupés à vos listes de diffusion de clients. Suivez le taux de délivrabilité, définissez les codes pays et optimisez vos taux de conversion.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-slate-700/80 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-150">
              <Mail size={18} />
            </div>
            <h3 className="text-base font-black text-white mb-2 font-sans">
              Campagnes Email Pro
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rédigez des newsletters et e-mails transactionnels sécurisés. Utilisez notre compositeur de modèles HTML interactifs et notre système d'alerte en temps réel.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-slate-700/80 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-150">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-base font-black text-white mb-2 font-sans">
              CRM & Gestion d'Abonnement
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gérez les fiches clients multi-utilisateurs. Contrôlez instantanément les limites de solde d'accès, attribuez des forfaits spécifiques et synchronisez les contacts.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CALCULATOR ENGINE FOR PROSPECT ENGAGEMENT */}
      <section id="calculator" className="py-20 bg-slate-950/30 border-t border-b border-slate-900 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-mono tracking-wider font-semibold rounded uppercase mb-3">
                Estimateur budgétaire
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-sans">Simulateur de crédits KitsCms</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Simulez les coûts en direct pour vos diffusions de SMS Bulk et d'e-mails professionnels selon votre volume de contacts et la devise choisie.
              </p>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Nombre de destinataires</label>
                  <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-blue-500">
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-transparent px-4 py-3 text-sm text-white font-mono focus:outline-none"
                    />
                    <select
                      value={calcCurrency}
                      onChange={(e) => setCalcCurrency(e.target.value)}
                      className="bg-slate-900 border-l border-slate-800 px-3 text-xs text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="XOF">XOF (CFAF)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl relative space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Coût de diffusion des E-mails :</span>
                <strong className="text-slate-200 font-mono">
                  {(calcAmount * (calcCurrency === 'XOF' ? 2 : 0.003)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {calcCurrency}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-3">
                <span>Coût de diffusion des SMS Bulk :</span>
                <strong className="text-emerald-400 font-mono">
                  {(calcAmount * (calcCurrency === 'XOF' ? 12 : 0.02)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {calcCurrency}
                </strong>
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-white font-bold">Budget global estimé :</span>
                <strong className="text-base font-black text-emerald-400 font-mono">
                  {(calcAmount * (calcCurrency === 'XOF' ? 14 : 0.023)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {calcCurrency}
                </strong>
              </div>

              <div className="pt-2 bg-slate-900/50 p-3 rounded-xl text-[10px] text-slate-500 border border-slate-850">
                💡 <strong>Astuce :</strong> Rechargez votre solde depuis votre console d'administration pour approvisionner vos campagnes marketing de façon instantanée.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACCORDION FAQ SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block mb-2">QUESTIONS FREQUENTES</span>
          <h2 className="text-2xl font-black text-white">Besoin d'éclaircissements ?</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-2">Comment fonctionne la distribution de campagnes ?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              KitsCms distribue vos notifications et newsletters via des passerelles SMTP et des passerelles SMS fiables configurables au sein de votre console d'administration multi-utilisateur.
            </p>
          </div>

          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-2">Qu'est-ce que la simulation de solde ?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              C'est une fonctionnalité autonome (Sandbox) vous permettant de simuler l'achat de paquets de crédits, le rechargement public ou privé, et l'évaluation budgétaire de vos compagnes de communication sans exposer de réels budgets.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-center text-xs text-slate-500 font-mono">
        <p className="mb-2">KitsCms Platform • Tous droits réservés © 2026</p>
        <p className="text-[10px] text-slate-600">Plateforme SaaS complète de routage marketing multicanal (SMS, Email, CRM).</p>
      </footer>

    </div>
  );
}
