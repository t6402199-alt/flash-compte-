import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Zap, 
  ShieldAlert, 
  Copy, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  Search, 
  Edit, 
  Eye, 
  EyeOff, 
  Lock, 
  Check, 
  X, 
  User, 
  FileText, 
  ShieldCheck,
  Smartphone,
  Mail,
  Home,
  AlertTriangle,
  Globe,
  Settings,
  CreditCard
} from 'lucide-react';
import { SimulatedTransfer } from '../types';
import { saveTransferToDb, deleteTransferFromDb } from '../lib/firebase';

interface HistoryPanelProps {
  transfers: SimulatedTransfer[];
  onDeleteTransfer: (id: string) => void;
  onClearAllTransfers: () => void;
  onLaunchSimulation: (transfer: SimulatedTransfer) => void;
  onCreateToast: (msg: string) => void;
  onSetBlockedState?: (id: string, isBlocked: boolean) => void;
  onUpdatePercentages?: (id: string, start: number, stop: number, message: string) => void;
}

export default function HistoryPanel({
  transfers,
  onDeleteTransfer,
  onClearAllTransfers,
  onLaunchSimulation,
  onCreateToast,
  onSetBlockedState,
  onUpdatePercentages
}: HistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [versionFilter, setVersionFilter] = useState<'ALL' | 'V1' | 'V2'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [shownPins, setShownPins] = useState<{ [id: string]: boolean }>({});
  
  // Edit Modal State
  const [editingTx, setEditingTx] = useState<SimulatedTransfer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter transfers
  const filteredTransfers = transfers.filter(t => {
    const text = (
      t.recipientName + ' ' + 
      t.lastName + ' ' + 
      t.firstName + ' ' + 
      t.recipientBank + ' ' + 
      t.reference + ' ' + 
      t.email + ' ' + 
      t.phone + ' ' +
      t.id
    ).toLowerCase();
    
    const matchesText = text.includes(searchTerm.toLowerCase());
    
    const matchesVersion = 
      versionFilter === 'ALL' || 
      t.version === versionFilter;
      
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && !t.isBlocked) || 
      (statusFilter === 'BLOCKED' && t.isBlocked);

    return matchesText && matchesVersion && matchesStatus;
  });

  const togglePinVisibility = (id: string) => {
    setShownPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyUrl = (url: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
        onCreateToast('Lien d\'accès client copié dans votre presse-papiers !');
        return;
      }
    } catch (e) {
      console.warn("Navigator clipboard failed, using fallback:", e);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        onCreateToast('Lien d\'accès client copié !');
      } else {
        onCreateToast("Erreur lors de la copie.");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      onCreateToast("Veuillez sélectionner le texte manuellement.");
    }
  };

  const getCountryFlag = (countryStr: string) => {
    if (!countryStr) return '🌍';
    const lower = countryStr.toLowerCase();
    if (lower.includes('bénin') || lower.includes('benin')) return '🇧🇯';
    if (lower.includes("côte d'ivoire") || lower.includes("cote d'ivoire") || lower.includes('ci')) return '🇨🇮';
    if (lower.includes('sénégal') || lower.includes('senegal') || lower.includes('sn')) return '🇸🇳';
    if (lower.includes('france') || lower.includes('fr')) return '🇫🇷';
    if (lower.includes('guinée') || lower.includes('guinee') || lower.includes('gn')) return '🇬🇳';
    if (lower.includes('cameroun') || lower.includes('cm')) return '🇨🇲';
    if (lower.includes('togo') || lower.includes('tg')) return '🇹🇬';
    if (lower.includes('mali') || lower.includes('ml')) return '🇲🇱';
    if (lower.includes('burkina') || lower.includes('bf')) return '🇧🇫';
    if (lower.includes('gabon') || lower.includes('ga')) return '🇬🇦';
    if (lower.includes('béninois') || lower.includes('ivoirien')) return '🌍';
    return '🌍';
  };

  // Open Edit Dialog
  const handleOpenEdit = (tx: SimulatedTransfer) => {
    setEditingTx({ ...tx });
    setIsEditModalOpen(true);
  };

  // Save changes from Edit Dialog
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    try {
      // Direct Firestore persistence
      await saveTransferToDb(editingTx);
      onCreateToast('Dossier client "Flash Compte" mis à jour avec succès ✔️ !');
      setIsEditModalOpen(false);
      setEditingTx(null);
    } catch (err) {
      console.error("Failed to update transfer:", err);
      onCreateToast('Erreur lors de la modification du dossier.');
    }
  };

  // Quick toggle Block status
  const handleToggleBlock = async (t: SimulatedTransfer) => {
    const nextBlockedState = !t.isBlocked;
    if (onSetBlockedState) {
      onSetBlockedState(t.id, nextBlockedState);
    } else {
      try {
        const updated = { ...t, isBlocked: nextBlockedState };
        await saveTransferToDb(updated);
        onCreateToast(nextBlockedState ? 'Dossier client verrouillé' : 'Dossier client autorisé');
      } catch (err) {
        console.error("Block toggle failed:", err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Banner / Header Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 p-3.5 rounded-2xl text-amber-500 border border-amber-500/10">
            <History size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-sans">Suivi & Historique des Comptes Flash</h3>
            <p className="text-xs text-slate-400">Gérez, configurez, bloquez et testez l'ensemble des accès clients créés sur votre console KitsCms.</p>
          </div>
        </div>
        
        {transfers.length > 0 && (
          <button
            onClick={onClearAllTransfers}
            className="py-2.5 px-4 bg-red-650/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 font-bold rounded-2xl text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition shadow-sm self-start md:self-center"
          >
            <Trash2 size={13} /> Tout effacer
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 border-b border-slate-100 pb-5">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 transition focus:outline-none"
              placeholder="Rechercher par nom, email, téléphone, IBAN, référence ou PIN..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Version Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setVersionFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${versionFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Toutes versions
              </button>
              <button
                onClick={() => setVersionFilter('V1')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${versionFilter === 'V1' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                V1 classique
              </button>
              <button
                onClick={() => setVersionFilter('V2')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${versionFilter === 'V2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                V2 (Premium)
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Tous statuts
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${statusFilter === 'ACTIVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Actifs (Débloqués)
              </button>
              <button
                onClick={() => setStatusFilter('BLOCKED')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${statusFilter === 'BLOCKED' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Verrouillés (Bloqués)
              </button>
            </div>
          </div>

        </div>

        {/* List of generated transfers */}
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <History size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-bold">Aucun dossier client d'essai ne correspond à vos critères</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[340px] mx-auto">Configurez et provisionnez un virement depuis vos onglets Flash Compte V1 ou V2 pour commencer le monitoring à chaud.</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wide font-mono">
                    <th className="py-4 px-4">Dossier / Client</th>
                    <th className="py-4 px-4">Paramètres Virement</th>
                    <th className="py-4 px-4">Code PIN / Accès</th>
                    <th className="py-4 px-4">Montant Simulé</th>
                    <th className="py-4 px-4">Progression %</th>
                    <th className="py-4 px-4">Statut</th>
                    <th className="py-4 px-4 text-right">Actions de Contrôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredTransfers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      {/* Client information */}
                      <td className="py-4 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.version === 'V2' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-200/50' : 'bg-amber-500/15 text-amber-700 border border-amber-250/40'
                          }`}>
                            {t.version}
                          </span>
                          <span className="font-bold text-slate-900 hover:underline cursor-pointer" onClick={() => handleOpenEdit(t)}>
                            {t.recipientName || `${t.firstName} ${t.lastName}`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                          <span className="bg-slate-100 px-1 py-0.2 rounded font-semibold text-slate-600 select-none">{getCountryFlag(t.country)} {t.country}</span>
                          <span className="truncate max-w-[150px]">{t.email}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">Réf: {t.reference} • ID: {t.id}</div>
                      </td>

                      {/* Transfer parameters */}
                      <td className="py-4 px-4 max-w-[180px]">
                        <div className="font-semibold text-slate-800 truncate" title={t.recipientBank}>
                          Vers: {t.recipientBank}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={t.recipientAccount}>
                          Compte: {t.recipientAccount}
                        </div>
                        <div className="text-[9px] text-indigo-500 font-bold truncate" title={t.customMessage}>
                          Alerte block : "{t.customMessage ? t.customMessage : 'Standard alert message'}"
                        </div>
                      </td>

                      {/* Code PIN */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-bold tracking-widest text-[11px]">
                            {shownPins[t.id] ? t.codePin : '••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(t.id)}
                            className="p-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            title={shownPins[t.id] ? "Cacher le PIN" : "Afficher le PIN"}
                          >
                            {shownPins[t.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Identifiant : <span className="underline select-all">{t.email}</span></div>
                      </td>

                      {/* Amount and currency */}
                      <td className="py-4 px-4 font-bold text-slate-900 font-mono">
                        {t.amount.toLocaleString('fr-FR')} {t.currency.includes('FCFA') || t.currency.includes('XOF') ? '€' : '€'}
                      </td>

                      {/* Threshold / Percentages */}
                      <td className="py-4 px-4 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{t.startPercentage}%</span>
                          <span className="text-slate-400">➔</span>
                          <span className="text-red-500 font-bold">{t.stopPercentage}%</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Clé débloc : {t.otpCode || 'Intégrée'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleBlock(t)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer select-none transition ${
                            t.isBlocked
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${t.isBlocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {t.isBlocked ? 'Verrouillé' : 'Actif'}
                        </button>
                      </td>

                      {/* Right Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyUrl(t.generatedUrl)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-650 hover:text-slate-900 transition cursor-pointer"
                            title="Copier le lien d'accès client direct"
                          >
                            <Copy size={12} />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl transition cursor-pointer"
                            title="Modifier les détails de ce dossier"
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            onClick={() => onLaunchSimulation(t)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl transition font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="Tester / Lancer le virement maintenant"
                          >
                            <ExternalLink size={12} />
                          </button>

                          <button
                            onClick={() => onDeleteTransfer(t.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 hover:border-rose-200 transition cursor-pointer"
                            title="Supprimer ce dossier"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
              {filteredTransfers.map(t => (
                <div 
                  key={t.id} 
                  className={`bg-slate-50 border rounded-2xl p-4 space-y-3 relative overflow-hidden transition-all hover:shadow-md ${
                    t.isBlocked ? 'border-red-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          t.version === 'V2' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-105 text-amber-700'
                        }`}>
                          {t.version}
                        </span>
                        <strong className="text-slate-900 text-sm font-black cursor-pointer hover:underline" onClick={() => handleOpenEdit(t)}>
                          {t.recipientName || `${t.firstName} ${t.lastName}`}
                        </strong>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{t.recipientBank}</span>
                    </div>

                    <button
                      onClick={() => handleToggleBlock(t)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition ${
                        t.isBlocked ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {t.isBlocked ? 'Verrouillé' : 'Actif'}
                    </button>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Montant simulé:</span>
                      <strong className="text-slate-800">{t.amount.toLocaleString('fr-FR')} {t.currency}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Code PIN:</span>
                      <strong className="text-slate-800 bg-slate-100 px-1.5 rounded">{t.codePin}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email client:</span>
                      <span className="text-slate-800 select-all font-mono font-medium">{t.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seuils %:</span>
                      <span className="text-slate-800 font-bold">{t.startPercentage}% ➔ {t.stopPercentage}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => copyUrl(t.generatedUrl)}
                      className="py-1.5 px-3 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={11} /> Copier lien
                    </button>
                    
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="py-1.5 px-3 bg-blue-50 border border-blue-105 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Edit size={11} /> Configurer
                    </button>

                    <button
                      onClick={() => onLaunchSimulation(t)}
                      className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <ExternalLink size={11} /> Tester
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* DYNAMICS HELP BOX */}
      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex items-start gap-4">
        <Sparkles className="text-amber-400 shrink-0 mt-0.5 animate-pulse" size={18} />
        <div className="text-xs text-slate-400 leading-relaxed space-y-1">
          <strong className="text-slate-200 block text-sm font-semibold">Conseils d'Administration & Diagnostique :</strong>
          <p>Le système utilise une synchronisation en temps réel avec Firebase Firestore. Toute modification effectuée sur l'historique ou sur le statut de verrouillage d'un "Flash Compte" prendra effet de façon instantanée chez le client sans qu'il n'ait besoin de recharger sa page internet.</p>
        </div>
      </div>

      {/* EXQUISITE EDIT MODAL DIALOG (KITS-STYLE ADVANCED DUAL INPUT FORM) */}
      {isEditModalOpen && editingTx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-slate-800 rounded-3xl p-6 md:p-8 relative shadow-2xl animate-scale-up border border-slate-200 my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <Settings className="text-blue-600 animate-spin-slow" size={20} />
                <div>
                  <h3 className="font-sans font-black text-slate-900 text-base md:text-lg">Configurateur de Dossier Flash {editingTx.version}</h3>
                  <p className="text-[11px] text-slate-400">Modifier les accès sécurisés, l'adresse, la facturation et les seuils de simulation.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 px-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition font-bold rounded-xl text-lg select-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Recipient Fullname */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bénéficiaire / Titulaire</label>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 bg-slate-50/50">
                    <div className="px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-400"><User size={13} /></div>
                    <input
                      type="text"
                      required
                      value={editingTx.recipientName}
                      onChange={(e) => setEditingTx({ ...editingTx, recipientName: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Country info */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pays du Virement</label>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 bg-slate-50/50">
                    <div className="px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-400"><Globe size={13} /></div>
                    <input
                      type="text"
                      required
                      value={editingTx.country}
                      onChange={(e) => setEditingTx({ ...editingTx, country: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">E-mail de Connexion unique</label>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 bg-slate-50/50">
                    <div className="px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-400"><Mail size={13} /></div>
                    <input
                      type="email"
                      required
                      value={editingTx.email}
                      onChange={(e) => setEditingTx({ ...editingTx, email: e.target.value.toLowerCase().trim() })}
                      className="w-full bg-transparent px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone contact */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Téléphone d'Alerte</label>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 bg-slate-50/50">
                    <div className="px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-400"><Smartphone size={13} /></div>
                    <input
                      type="text"
                      required
                      value={editingTx.phone}
                      onChange={(e) => setEditingTx({ ...editingTx, phone: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sender Bank */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Banque Émettrice</label>
                  <input
                    type="text"
                    required
                    value={editingTx.senderBank}
                    onChange={(e) => setEditingTx({ ...editingTx, senderBank: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Recipient Bank */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Banque Réceptrice</label>
                  <input
                    type="text"
                    required
                    value={editingTx.recipientBank}
                    onChange={(e) => setEditingTx({ ...editingTx, recipientBank: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Amount / Devise */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Montant Évalué</label>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 bg-slate-50/50">
                    <div className="px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-400"><CreditCard size={13} /></div>
                    <input
                      type="number"
                      required
                      value={editingTx.amount}
                      onChange={(e) => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                      className="w-full bg-transparent px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Code Pin Access */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Code PIN d'Accès de Simulation</label>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 bg-slate-50/50">
                    <div className="px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-400"><Lock size={13} /></div>
                    <input
                      type="text"
                      required
                      value={editingTx.codePin}
                      onChange={(e) => setEditingTx({ ...editingTx, codePin: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Start threshold % */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pourcentage de démarrage (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={editingTx.startPercentage}
                    onChange={(e) => setEditingTx({ ...editingTx, startPercentage: Number(e.target.value) })}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                  />
                </div>

                {/* Stop threshold % */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Seuil de blocage (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={editingTx.stopPercentage}
                    onChange={(e) => setEditingTx({ ...editingTx, stopPercentage: Number(e.target.value) })}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                  />
                </div>

              </div>

              {/* Blocking Custom Message alerts overlay */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message d'Erreur lors du gel</label>
                <textarea
                  rows={2}
                  value={editingTx.customMessage}
                  onChange={(e) => setEditingTx({ ...editingTx, customMessage: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Recipient Account Number */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coordonnées du Dossier (IBAN / RIB de destination)</label>
                <input
                  type="text"
                  required
                  value={editingTx.recipientAccount}
                  onChange={(e) => setEditingTx({ ...editingTx, recipientAccount: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold font-mono focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-2 text-[10.5px] text-amber-800 leading-normal">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={14} />
                <span>
                  <strong>Note administrative :</strong> Toute modification sera propagée et écrite en direct dans la base de données. Le client s'il est actif sur sa plateforme verra ses pourcentages, ses PIN de déblocage ou ses coordonnés mis à jour instantanément de façon transparente.
                </span>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10 transition active:scale-95"
                >
                  Enregistrer les modifications
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
