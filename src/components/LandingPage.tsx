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
              <p className="text-[9px] text-slate-400 font-black leading-none tracking-widest uppercase font-mono">FINANCIAL SIMULATOR</p>
            </div>
          </div>

          {/* Desktop Desktop menu links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-350 tracking-wide uppercase">
            <a href="#features" className="hover:text-blue-400 transition">Fonctionnalités</a>
            <a href="#compare" className="hover:text-blue-400 transition">FlashCompte V1 / V2</a>
            <a href="#calculator" className="hover:text-blue-400 transition">Simulateur</a>
            <a href="#faq" className="hover:text-blue-400 transition">Support & FAQ</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuthGate('beneficiary')}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 transition shadow-sm cursor-pointer"
            >
              Suivi Dossier Client
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
          CONFORME REGLEMENTATION BCEAO & UMOA • VERSION V2.5 EN SERVICE
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
          Générez des dossiers de <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 font-extrabold pb-1">Flash-Comptes Clients</span> en 3 secondes.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          La plateforme d'évaluation et de démonstration de conformité bancaire la plus immersive du marché. Idéal pour former vos opérateurs et guider vos clients lors du déblocage de transferts fictifs simulés.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <button
            onClick={onEnterAdminDemo}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap size={15} className="fill-current" />
            Accès Démo Instantanée (Sans Login)
          </button>
          <button
            onClick={() => onOpenAuthGate('admin')}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white font-bold rounded-2xl text-xs sm:text-sm uppercase border border-slate-800 transition cursor-pointer flex items-center justify-center gap-2"
          >
            Se connecter à la Console
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Dynamic Counter / Real-Time Data strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-950/80 border border-slate-800 rounded-3xl max-w-4xl mx-auto text-left relative z-20 backdrop-blur">
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Scénarios Actifs</span>
            <strong className="text-2xl font-black text-white font-mono">{transfersCount > 0 ? transfersCount : 4} Dossiers</strong>
          </div>
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Latence Simulée</span>
            <strong className="text-2xl font-black text-emerald-400 font-mono">3 - 10 Sec</strong>
          </div>
          <div className="p-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Frais Applicables</span>
            <strong className="text-2xl font-black text-purple-400 font-mono">1.2% Fixe</strong>
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
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block mb-2">INFRASTRUCTURE EXCLUSIVE</span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Tout le nécessaire pour gérer la conformité mobile money
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto mt-2.5">
            KitsCms fournit les outils professionnels pour configurer, alerter et simuler les environnements de banque et terminaux mobiles ouest-africains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-slate-700/80 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-150">
              <Laptop size={18} />
            </div>
            <h3 className="text-base font-black text-white mb-2 font-sans">
              Génération d'accès Clients V1 & V2
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Créez des scénarios de dépôt ou transfert. Vos clients accèdent à un portail bancaire réaliste de déblocage avec code OTP, barre d'avancement et messages d'erreur personnalisés.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-slate-700/80 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-150">
              <Mail size={18} />
            </div>
            <h3 className="text-base font-black text-white mb-2 font-sans">
              Notifications Mail & SMS Pro
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Envoyez immédiatement par e-mail ou SMS les identifiants générés ou la clef de déblocage (OTP). Suivez l'historique complet des emails expédiés dans le module CRM.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-slate-700/80 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-150">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-base font-black text-white mb-2 font-sans">
              Contrôle de conformité et Blocages
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mettez à jour les statuts en direct. Suspendez instantanément un accès si le client ne respecte pas les conditions de virement ou débloquez l'avancement d'un clic.
            </p>
          </div>
        </div>
      </section>

      {/* THE INTEGRAL COMPARISON V1 vs V2 */}
      <section id="compare" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-widest block mb-2">CHOIX DU STANDARD</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Pourparlers techniques : FlashCompte V1 vs V2</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* V1 standard */}
          <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-black text-white">Formulaire FlashCompte V1</h3>
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Standard de base / Entrée rapide de dossier</span>
                </div>
                <div className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-extrabold rounded-md uppercase">V1 standard</div>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span>Formulaire unique ultra rapide avec renseignements bancaires essentiels</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span>Identifiant unique avec code PIN à 6 chiffres standard</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span>Génération automatique de l'URL du portail client de virement</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span>Alertes e-mail immédiates configurables</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenAuthGate('admin')}
              className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
            >
              Gérer/Créer Dossier V1
            </button>
          </div>

          {/* V2 Standard */}
          <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl opacity-70 pointer-events-none" />
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-black text-emerald-400">Formulaire FlashCompte V2</h3>
                  <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase">Avancé / Immersif avec pourcentage réglable</span>
                </div>
                <div className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold rounded-md uppercase">Recommandé</div>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span><strong>Tous les avantages de la V1</strong> avec plus de champs (pays, langue, devises)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span><strong>Indicateur d'avancement réglable</strong> (configurer le pourcentage de départ et d'avis d'erreur de blocage)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span>Changement et génération de la clef de déblocage avec dispatching par mail</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0">✔️</span>
                  <span>Interface client enrichie avec solde dynamique et coût de virement simulé</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenAuthGate('admin')}
              className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/10"
            >
              Gérer/Créer Dossier V2
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CALCULATOR ENGINE FOR PROSPECT ENGAGEMENT */}
      <section id="calculator" className="py-20 bg-slate-950/30 border-t border-b border-slate-900 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-mono tracking-wider font-semibold rounded uppercase mb-3">
                Calculateur en direct
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-sans">Convertisseur et barème KitsCms</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Simulez à l'avance les frais interbancaires appliqués fictivement pour les dossiers clients générés sous le barème strict de l'UMOA.
              </p>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Montant à transférer</label>
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
                <span>Frais fixes de conformité (1.2%) :</span>
                <strong className="text-slate-200 font-mono">
                  {estimatedFees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {calcCurrency}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-3">
                <span>Coût d'ouverture de flux :</span>
                <strong className="text-emerald-400 font-mono">Gratuit</strong>
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-white font-bold">Crédité net vers le client :</span>
                <strong className="text-base font-black text-emerald-400 font-mono">
                  {payoutAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {calcCurrency}
                </strong>
              </div>

              <div className="pt-2 bg-slate-900/50 p-3 rounded-xl text-[10px] text-slate-500 border border-slate-850">
                💡 <strong>Rappel :</strong> Les transferts générés via KitsCms sont purement simulés pour des besoins de démonstration technique ou d'évaluation conformité.
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
            <h4 className="text-xs sm:text-sm font-bold text-white mb-2">Comment fonctionne le virement fictif pour le client ?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Une fois le dossier généré en V1 ou V2, l'opérateur transmet un lien sécurisé avec un code PIN au client. En ouvrant ce lien, le client voit un panneau de transfert simulant l'avancement interbancaire avec un arrêt réglable pour valider les étapes de régularisation fiscale ou d'ouverture de crédit de dédouanement.
            </p>
          </div>

          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-2">Existe-t-il une liaison avec de vraies banques ?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Non. KitsCms est un simulateur autonome sécurisé (Sandbox) fonctionnant en environnement fermé, idéal pour l'apprentissage académique, les formations et l'explication didactique des flux réglementaires aux clients sans exposer de réels capitaux.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-center text-xs text-slate-500 font-mono">
        <p className="mb-2">KitsCms Platform • Tous droits réservés © 2026</p>
        <p className="text-[10px] text-slate-600">Simulateur conforme d'avancement de transaction de réseaux interbancaires d'Afrique de l'Ouest.</p>
      </footer>

    </div>
  );
}
