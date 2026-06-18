import React from 'react';
import { 
  TrendingUp, 
  MessageSquare, 
  Mail, 
  Send, 
  Zap, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  CreditCard
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
}

export default function Dashboard({ 
  balance, 
  smsCount, 
  emailCount, 
  contactsCount, 
  campaigns, 
  transfers, 
  transactions,
  setActiveTab,
  setQuickTrialModal
}: DashboardProps) {
  
  // Handlers
  const totalCampaigns = campaigns.length;
  const totalTransfers = transfers.length;
  const successfulTransfers = transfers.filter(t => t.isCompleted).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            Ravi de vous revoir, Admin <Sparkles className="text-amber-400 fill-amber-400/30 animate-pulse" size={20} />
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gérez vos campagnes marketing omnicanales et testez vos flux bancaires de transfert depuis une interface unique et ultra-sécurisée.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setQuickTrialModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/15"
          >
            <Zap size={16} className="fill-amber-300/20" /> Nom de code: Flash V1
          </button>
          <button
            onClick={() => setActiveTab('flash-v2')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-blue-400 hover:text-white font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-700 transition-all duration-200 cursor-pointer"
          >
            <ShieldAlert size={16} /> Essai Smart V2
          </button>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">SOLDE DISPONIBLE</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">Actif</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{balance.toLocaleString('fr-FR')}</span>
            <span className="text-xs text-slate-400">FCFA</span>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs pt-3 border-t border-slate-800/60">
            <span className="text-slate-500 font-medium">Recharges récentes</span>
            <button onClick={() => setActiveTab('billing')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
              Gérer <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: SMS sent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">SMS ENVOYÉS</span>
            <MessageSquare size={16} className="text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{smsCount}</span>
            <span className="text-xs text-slate-500">envois totaux</span>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs pt-3 border-t border-slate-800/60">
            <span className="text-slate-500 font-medium">Campagnes SMS</span>
            <button onClick={() => setActiveTab('sms')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
              Nouvel envoi <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Mail sent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">EMAILS ENVOYÉS</span>
            <Mail size={16} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{emailCount}</span>
            <span className="text-xs text-slate-500">destinataires</span>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs pt-3 border-t border-slate-800/60">
            <span className="text-slate-500 font-medium">Campagnes Email</span>
            <button onClick={() => setActiveTab('email')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
              Composer <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 4: Simulated transfers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">SIMULATIONS FLASH</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalTransfers}</span>
            <span className="text-xs text-slate-500">({successfulTransfers} complétés)</span>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs pt-3 border-t border-slate-800/60">
            <span className="text-slate-500 font-medium">Suivre les liens</span>
            <button onClick={() => setActiveTab('history')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
              Détails <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Marketing Performance Graphic */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Analyse des flux mensuels (Simulé)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Activité cumulée des campagnes et virements d'essai</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Marketing
                </span>
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Flash Compte V1/V2
                </span>
              </div>
            </div>

            {/* Custom SVG Area Graph representational layout */}
            <div className="h-48 w-full mt-6 flex items-end relative">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-slate-800/40" />
              <div className="absolute inset-x-0 top-1/3 h-[1px] bg-slate-800/40" />
              <div className="absolute inset-x-0 top-2/3 h-[1px] bg-slate-800/40" />
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-800" />

              {/* Graphic Plot area */}
              <svg className="w-full h-full absolute inset-0 text-blue-500/20" viewBox="0 0 100 40" preserveAspectRatio="none">
                {/* Marketing curve fill */}
                <path d="M 0 40 Q 20 20, 40 30 T 80 10 T 100 40 Z" fill="currentColor" opacity="0.3" />
                {/* Marketing line outline */}
                <path d="M 0 40 Q 20 20, 40 30 T 80 10 T 100 40" fill="none" stroke="#3b82f6" strokeWidth="1" />
                
                {/* V1/V2 Curve */}
                <path d="M 0 40 C 20 35, 30 25, 50 15 C 70 8, 85 4, 100 0 L 100 40 Z" fill="rgba(245,158,11,0.12)" />
                <path d="M 0 40 C 20 35, 30 25, 50 15 C 70 8, 85 4, 100 0" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1,0.5" />
              </svg>

              {/* Dynamic Overlay Markers */}
              <div className="absolute left-[39%] top-[65%] group">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 cursor-help" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] text-white py-1 px-2 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                  Échec de délivrabilité: 0.1%
                </div>
              </div>

              <div className="absolute left-[78%] top-[18%] group">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20 cursor-help" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] text-white py-1 px-2 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                  Génération de lien: Flash V2
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
              <span>Semaine 1</span>
              <span>Semaine 2</span>
              <span>Semaine 3</span>
              <span>Semaine 4</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <TrendingUp size={14} className="text-emerald-500" /> Approvisionnements instantanés par Mobile Money actifs.
            </span>
            <div className="text-[10px] bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/10 font-mono font-bold uppercase tracking-wider">
              Simulation Temps Réel
            </div>
          </div>
        </div>

        {/* Live Operations Feed & Activities */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Opérations Récentes</h4>
                <p className="text-xs text-slate-500">Flux marketing & essais de clés</p>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">Live</span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {campaigns.length === 0 && transfers.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  Aucune opération enregistrée. Créez un contact ou simulez un envoi pour démarrer.
                </div>
              )}

              {/* Merge and sort campaigns & transfers by dates (simulated) */}
              {[
                ...transfers.map(t => ({ id: t.id, type: 'TRANSFER', label: `Essai ${t.version} (${t.type})`, amount: `${t.amount.toLocaleString('fr-FR')} FCFA`, dest: t.recipientName, status: t.isCompleted ? 'Complété' : 'En attente', date: t.createdAt }),),
                ...campaigns.map(c => ({ id: c.id, type: 'CAMPAIGN', label: `${c.type} Campaign`, amount: `${c.recipientsCount} Destinataires`, dest: c.title, status: c.status, date: c.createdAt })),
                ...transactions.map(tr => ({ id: tr.id, type: 'BILLING', label: `Recharge ${tr.method}`, amount: `+${tr.amount.toLocaleString('fr-FR')} FCFA`, dest: 'Compte Principal', status: tr.status, date: tr.createdAt }))
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((op, idx) => (
                  <div key={op.id || idx} className="flex gap-3 justify-between items-center p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/40 rounded-xl transition-all duration-150">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${
                        op.type === 'TRANSFER' ? 'bg-amber-500/10 text-amber-400' :
                        op.type === 'CAMPAIGN' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {op.type === 'TRANSFER' ? <Zap size={13} /> :
                         op.type === 'CAMPAIGN' ? <Send size={13} /> : <CreditCard size={13} />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white leading-tight">{op.label}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5">{op.dest}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-slate-200">{op.amount}</div>
                      <div className="mt-0.5 flex items-center justify-end gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          op.status === 'Complété' || op.status === 'Envoyé' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <span className="text-[9px] text-slate-500 uppercase font-mono">{op.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              Consulter tout l'historique de simulation →
            </button>
          </div>
        </div>
      </div>
      
      {/* Informative Sandbox Explainer Banner */}
      <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-2xl flex items-start gap-3">
        <Clock className="text-blue-500 shrink-0 mt-0.5" size={16} />
        <div>
          <span className="text-xs font-semibold text-blue-400">Pourquoi utiliser le Sandbox Trial ?</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            FlashConnect Pro inclut les essais <strong>Flash Compte v1 et v2</strong> pour vous permettre de générer de faux portails de paiement hautement opérationnels (sans transfert de fonds réel) pour tester la réaction de vos APIs, former vos équipes ou simuler la réception de fonds de banques tierces ou de terminaux mobile money (Orange, Wave, Africell).
          </p>
        </div>
      </div>
    </div>
  );
}
