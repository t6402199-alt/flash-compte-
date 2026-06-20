import React, { useEffect, useState } from 'react';
import { 
  User, 
  CreditCard, 
  Shield, 
  Zap, 
  LogOut, 
  Lock, 
  FileText, 
  TrendingUp, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Flame,
  Globe,
  Coins
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Client, SimulatedTransfer } from '../types';

interface ClientPortalProps {
  clientUser: Client;
  transfers: SimulatedTransfer[];
  onLaunchSimulation: (tx: SimulatedTransfer) => void;
  onLogout: () => void;
}

export default function ClientPortal({ 
  clientUser, 
  transfers,
  onLaunchSimulation, 
  onLogout 
}: ClientPortalProps) {
  const [liveClient, setLiveClient] = useState<Client>(clientUser);
  const [clientTransfers, setClientTransfers] = useState<SimulatedTransfer[]>([]);

  // 1. Synchronize the client user's status, balance, etc., in absolute real-time
  useEffect(() => {
    if (!clientUser.uid) return;
    
    const unsub = onSnapshot(doc(db, 'clients', clientUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Client;
        setLiveClient(data);
        
        // Safety constraint block: If client status is blocked, log out immediately
        if (data.statut !== 'actif') {
          alert("Votre compte FLASHCOMPTE PRO a été bloqué par un administrateur.");
          signOut(auth);
          onLogout();
        }
      }
    });

    return () => unsub();
  }, [clientUser.uid, onLogout]);

  // 2. Synchronize client transfers by email matching
  useEffect(() => {
    const userEmail = liveClient.email.toLowerCase().trim();
    const filtered = transfers.filter(t => t.email.toLowerCase().trim() === userEmail);
    setClientTransfers(filtered);
  }, [transfers, liveClient.email]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Client Space Premium Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl shadow-md">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-sans uppercase">
                Flash<span className="text-emerald-400">Compte</span> Pro
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                Espace Client
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase leading-none">Unified Instant Banking SaaS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-white font-semibold font-mono">{liveClient.email}</span>
            <span className="text-[10px] text-slate-400">Code: {liveClient.codeClient}</span>
          </div>
          
          <button 
            onClick={onLogout}
            title="Se déconnecter"
            className="p-2.5 bg-slate-800 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-900/40 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main client dashboard content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-10 space-y-8">
        
        {/* Banner Announcement */}
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-950/20 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Shield size={13} strokeWidth={2.5} /> Double Sécurité Active (Token + UID)
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Bienvenue dans votre Espace Bancaire Sécurisé</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Consultez vos opérations en attente de validation, gérez vos virements reçus et accédez aux simulateurs interconnectés Flash Compte V1 & V2.
            </p>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 p-0.5 shadow-lg shadow-emerald-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center p-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">PLAN ACTIVE</span>
                <span className="text-sm font-black text-emerald-400 font-mono tracking-wider uppercase mt-1">
                  {liveClient.plan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Metrics Grid (amount, client code, status, plan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Metric 1: Solde Disponible */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between h-36">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold tracking-wider uppercase font-mono">Solde Disponible</span>
              <Coins className="text-emerald-400" size={20} />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {liveClient.montant.toLocaleString('fr-FR')} <span className="text-sm text-slate-300 font-sans font-normal">FCFA</span>
              </div>
              <p className="text-[10px] text-slate-400">Fonds actuellement raccordés</p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Metric 2: ID Code Client */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between h-36">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold tracking-wider uppercase font-mono">Code Client Unique</span>
              <User className="text-blue-400" size={20} />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-white font-mono tracking-wider">
                {liveClient.codeClient}
              </div>
              <p className="text-[10px] text-slate-400">Identifiant de sécurité unique</p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Metric 3: Statut du Compte */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between h-36">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold tracking-wider uppercase font-mono">Statut du Compte</span>
              <Shield className="text-emerald-400" size={20} />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-black uppercase font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {liveClient.statut}
              </div>
              <p className="text-[10px] text-slate-400 block mt-1">Vérification de sécurité OK</p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Metric 4: Formule d'Abonnement */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between h-36">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold tracking-wider uppercase font-mono">Formule d'Abonnement</span>
              <Zap className="text-amber-400 fill-amber-400/10" size={20} />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-black uppercase font-mono">
                💥 Flash {liveClient.plan}
              </div>
              <p className="text-[10px] text-slate-400 block mt-1">Restrictions globales adaptées</p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

        </div>

        {/* Transfers and Simulation Control Section */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-display">Vos Dossiers et Simulations Actives</h3>
              <p className="text-xs text-slate-400">Cliquez sur un transfert pour lancer le portail de réception en direct.</p>
            </div>
            <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700/60 font-medium">
              {clientTransfers.length} dossier(s) trouvé(s) pour votre email
            </div>
          </div>

          {clientTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
              <FileText size={48} className="text-slate-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Aucun dossier de virement associé</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Contactez votre administrateur de plateforme pour qu'il crée ou qu'il rattache un virement à votre adresse email <span className="font-mono text-slate-300">{liveClient.email}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {clientTransfers.map((tx) => {
                const badgeColor = tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' :
                                   tx.status === 'BLOCKED_OTP' ? 'text-amber-400 bg-amber-500/10' :
                                   tx.status === 'FRAUD_ALERT' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 bg-slate-800';

                return (
                  <div 
                    key={tx.id}
                    onClick={() => onLaunchSimulation(tx)}
                    className="p-5 sm:p-6 hover:bg-slate-800/40 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 font-mono font-medium">{tx.id}</span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-xs font-semibold text-white">Réf: {tx.reference}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold font-mono text-[9px] bg-slate-800 border border-slate-700 text-slate-400">
                          {tx.version}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono ${badgeColor}`}>
                          {tx.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Expéditeur Sûr</p>
                          <p className="text-xs text-slate-200 mt-0.5">{tx.senderName || tx.senderBank}</p>
                        </div>
                        <div className="h-6 w-[1px] bg-slate-800" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Banque d'Envoi</p>
                          <p className="text-xs text-slate-200 mt-0.5">{tx.senderBank}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Montant Reçu</p>
                        <p className="text-lg font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                          {tx.amount.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-300 font-sans">{tx.currency}</span>
                        </p>
                      </div>

                      <button 
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 group-hover:scale-105"
                      >
                        Valider Réception
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security & Token Sandbox Disclaimer */}
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-start gap-3">
          <Shield className="text-blue-500 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 font-display">Règles de conformité de l'Espace Client</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Cet espace est cryptographie-encadré. En conformité avec vos instructions, vos accès sont doublement validés à chaque rafraîchissement d'état. Tout blocage manuel d'un administrateur révoquera immédiatement vos accès bancaires.
            </p>
          </div>
        </div>

      </main>

      {/* Global client portal footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono">
        FLASHCOMPTE PRO PLATFORM BANCAIRE AUTOMATIQUE • SILLYFR CONSOLE v2.5 © 2026
      </footer>

    </div>
  );
}
