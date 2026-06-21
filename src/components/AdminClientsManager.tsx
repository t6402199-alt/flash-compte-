import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Key, 
  DollarSign, 
  ShieldAlert, 
  Shield, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Coins,
  Link,
  Sliders,
  Send
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Client } from '../types';
import { saveClientToDb, deleteClientFromDb } from '../lib/firebase';

interface AdminClientsManagerProps {
  onCreateToast: (msg: string) => void;
}

export default function AdminClientsManager({ onCreateToast }: AdminClientsManagerProps) {
  // Client state list
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states to create client
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [montant, setMontant] = useState<string>('0');
  const [plan, setPlan] = useState<'free' | 'pro' | 'vip'>('free');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Copy click helpers
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // 1. Subscribe to clients collection in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const items: Client[] = [];
      snapshot.forEach((doc) => {
        items.push({ uid: doc.id, ...doc.data() } as Client);
      });
      // Sort by creation date descending
      setClients(items.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (err) => {
      console.error("Firestore clients snapshot error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Helper to construct secure link URLs
  const getClientLink = (token: string) => {
    // Follows the spec format perfectly
    return `${window.location.origin}/espace-client?token=${token}`;
  };

  // Helper to handle copying URLs
  const handleCopyLink = (token: string, clientId: string) => {
    const link = getClientLink(token);
    navigator.clipboard.writeText(link);
    setCopiedTokenId(clientId);
    onCreateToast("Lien d'accès unique copié !");
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Helper to generate security parameters
  const generateRandomCode = () => {
    return 'C' + Math.floor(100000 + Math.random() * 900000);
  };

  const generateRandomToken = () => {
    return 'tk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Create client submission handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    if (!email.trim() || !password || password.length < 6) {
      setErrorMsg("Veuillez saisir un e-mail valide et un mot de passe d'au moins 6 caractères.");
      setSubmitting(false);
      return;
    }

    try {
      // 1. Create client Auth credentials on a SECONDARY Firebase Auth instance to avoid snapping the current Admin user out of session
      const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const uid = userCredential.user.uid;
      
      // Instantly sign out of the secondary app and discard reference
      await signOut(secondaryAuth);

      // 2. Setup user details
      const clientCode = password.trim();
      const clientToken = generateRandomToken();

      const newClient: Client = {
        uid,
        email: email.trim().toLowerCase(),
        codeClient: clientCode,
        pin: clientCode,
        token: clientToken,
        role: 'client',
        montant: parseFloat(montant) || 0,
        statut: 'actif',
        plan: plan,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        dateExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
      };

      // 3. Save into our clients collection with zero latency
      await saveClientToDb(newClient);

      onCreateToast(`Compte client ${email} créé et provisionné !`);
      
      // Cleanup inputs
      setEmail('');
      setPassword('');
      setMontant('0');
      setPlan('free');
    } catch (err: any) {
      console.error("Failed creating customer account:", err);
      let message = "Erreur lors du raccordement bancaire.";
      if (err.code === 'auth/email-already-in-use') {
        message = "Cette adresse e-mail est déjà associée à un compte actif.";
      } else {
        message = err.message || message;
      }
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user status (active/blocked)
  const handleToggleStatus = async (client: Client) => {
    try {
      const nextStatus = client.statut === 'actif' ? 'bloqué' : 'actif';
      const updatedClient = {
        ...client,
        statut: nextStatus as 'actif' | 'bloqué'
      };
      await saveClientToDb(updatedClient);
      onCreateToast(`Compte de ${client.email} est désormais ${nextStatus === 'actif' ? 'Actif' : 'Bloqué'} !`);
    } catch (err: any) {
      console.error("Failed toggling status:", err);
      onCreateToast("Défaut de synchronisation de statut.");
    }
  };

  // Update customer balance/montant
  const handleUpdateAmount = async (client: Client, newAmountStr: string) => {
    try {
      const parsedAmount = parseFloat(newAmountStr);
      if (isNaN(parsedAmount)) return;

      const updatedClient = {
        ...client,
        montant: parsedAmount
      };
      await saveClientToDb(updatedClient);
      onCreateToast(`Solde de ${client.email} mis à jour à ${parsedAmount.toLocaleString('fr-FR')} FCFA !`);
    } catch (err: any) {
      console.error("Failed updating client balance:", err);
    }
  };

  // Update customer subscription plan
  const handleUpdatePlan = async (client: Client, nextPlan: 'free' | 'pro' | 'vip') => {
    try {
      const updatedClient = {
        ...client,
        plan: nextPlan
      };
      await saveClientToDb(updatedClient);
      onCreateToast(`Formule d'abonnement changée vers ${nextPlan.toUpperCase()} !`);
    } catch (err: any) {
      console.error("Failed updating subscription plan:", err);
    }
  };

  // Delete customer configuration safely from table (Firestore only)
  const handleDeleteClient = async (uid: string, clientEmail: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement le profil Client de ${clientEmail} ? (Cela ne supprime pas l'Auth du compte, seulement la fiche client)`)) {
      return;
    }

    try {
      await deleteClientFromDb(uid);
      onCreateToast(`Fiche client supprimée de Firestore !`);
    } catch (err: any) {
      onCreateToast("Impossible de supprimer la fiche.");
    }
  };

  const filteredClients = clients.filter(c => 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.codeClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.plan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* SaaS Admin Section Banner */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1f2a41] rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 z-10">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="text-emerald-500" /> FlashCompte Pro Client Control Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gérez les accès client, générez de nouveaux profils avec codes et tokens sécurisés, réglez les montants disponibles et changez les formules d'abonnements.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#161d2d] border border-slate-200 dark:border-[#1f2a41] rounded-2xl px-4 py-2 text-xs shrink-0 font-medium text-slate-600 dark:text-slate-300">
            <Coins className="text-amber-500" size={15} /> Multi-utilisateur connecté : <span className="font-mono font-bold text-slate-900 dark:text-emerald-400">{clients.length} clients</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Create panel and Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Creation Panel LEFT side */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1f2a41] rounded-3xl p-5 sm:p-6 shadow-sm self-start space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1f2a41] pb-3">
            <UserPlus className="text-blue-500" size={18} />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Créer un Compte Client</h3>
          </div>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">E-MAIL CLIENT *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@flashcompte.com"
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">MOT DE PASSE INITIAL *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">MONTANT (FCFA)</label>
                <input
                  type="number"
                  required
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-mono font-bold text-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block mb-1">PLAN D'ABONNEMENT</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as any)}
                  className="w-full text-xs"
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 dark:from-emerald-600 dark:dark-to-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Opération de création..." : "Créer le Profil Client & Auth ✓"}
            </button>
          </form>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
            <p className="text-[10px] text-blue-600/90 dark:text-blue-400 leading-relaxed font-sans">
              ℹ️ <strong>Note de session :</strong> L'algorithme prépare un code client unique (ex: <em>C289123</em>) et un token sécurisé d'authentification uniques pour lier le compte sans déconnecter votre session admin.
            </p>
          </div>
        </div>

        {/* Client List table RIGHT side */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1f2a41] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-[#1f2a41] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="text-blue-500" size={18} /> Comptes Clients Enregistrés
            </h3>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-600" size={14} />
              <input
                type="text"
                placeholder="Rechercher email, code, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 font-mono">
              <RefreshCw className="animate-spin inline-block mr-2 text-blue-500" size={14} />
              Chargement des profils d'utilisateurs depuis Firestore...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              Aucun profil client trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1f2a41] text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                    <th className="py-3 px-2">E-mail / UID</th>
                    <th className="py-3 px-2 text-center">Code Client</th>
                    <th className="py-3 px-2">Solde (FCFA)</th>
                    <th className="py-3 px-2 text-center">Plan</th>
                    <th className="py-3 px-2 text-center">Statut</th>
                    <th className="py-3 px-2">Lien Spécifique</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/40 dark:divide-[#1f2a41]/50 text-xs text-slate-700 dark:text-slate-300">
                  {filteredClients.map((client) => {
                    const isBlocked = client.statut === 'bloqué';
                    const planBadgeColor = client.plan === 'vip' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                                            client.plan === 'pro' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                    return (
                      <tr key={client.uid} className="hover:bg-slate-50 dark:hover:bg-[#161d2d]/30 transition-all">
                        <td className="py-4 px-2 max-w-[150px]">
                          <p className="font-semibold text-slate-900 dark:text-white truncate" title={client.email}>{client.email}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-650 font-mono mt-0.5 truncate" title={client.uid}>{client.uid}</p>
                        </td>

                        <td className="py-4 px-2 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                          {client.codeClient}
                        </td>

                        <td className="py-4 px-2">
                          <input
                            type="number"
                            value={client.montant}
                            onChange={(e) => handleUpdateAmount(client, e.target.value)}
                            className="w-24 px-2 py-1 bg-slate-100 dark:bg-[#182032] border border-slate-200 dark:border-[#2e3e5c] rounded-lg font-mono font-bold text-emerald-500 text-xs"
                          />
                        </td>

                        <td className="py-4 px-2 text-center">
                          <select
                            value={client.plan}
                            onChange={(e) => handleUpdatePlan(client, e.target.value as any)}
                            className="bg-slate-100 dark:bg-[#182032] border border-slate-200 dark:border-[#2e3e5c] rounded-lg px-1.5 py-1 text-xs font-semibold"
                          >
                            <option value="free">FREE</option>
                            <option value="pro">PRO</option>
                            <option value="vip">VIP</option>
                          </select>
                        </td>

                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => handleToggleStatus(client)}
                            title={isBlocked ? "Débloquer le compte" : "Bloquer le compte"}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono border transition ${
                              isBlocked 
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900' 
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            {isBlocked ? <Lock size={10} /> : <Unlock size={10} />}
                            {client.statut}
                          </button>
                        </td>

                        <td className="py-4 px-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyLink(client.token, client.uid)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#182032] dark:hover:bg-[#202b3f] border border-slate-200 dark:border-[#2e3e5c] rounded-lg text-blue-500 hover:text-blue-600 shrink-0 transition"
                              title="Copier le lien unique"
                            >
                              {copiedTokenId === client.uid ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]" title={getClientLink(client.token)}>
                              {client.token}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => handleDeleteClient(client.uid, client.email)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 rounded-lg shrink-0 transition"
                            title="Supprimer la fiche client"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
