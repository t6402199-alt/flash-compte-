import React from 'react';
import { 
  History, 
  Trash2, 
  Zap, 
  ShieldAlert, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import { SimulatedTransfer } from '../types';

interface HistoryPanelProps {
  transfers: SimulatedTransfer[];
  onDeleteTransfer: (id: string) => void;
  onClearAllTransfers: () => void;
  onLaunchSimulation: (transfer: SimulatedTransfer) => void;
  onCreateToast: (msg: string) => void;
}

export default function HistoryPanel({
  transfers,
  onDeleteTransfer,
  onClearAllTransfers,
  onLaunchSimulation,
  onCreateToast
}: HistoryPanelProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTransfers = transfers.filter(t => 
    t.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.recipientBank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyUrl = (url: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
        onCreateToast('Copie du lien d\'essai dans votre presse-papiers !');
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
        onCreateToast('Copie du lien d\'essai dans votre presse-papiers !');
      } else {
        onCreateToast("Erreur lors de la copie du texte.");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      onCreateToast("Sélectionnez le texte manuellement pour copier.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Suivi des Liens & Essais générés</h3>
              <p className="text-xs text-slate-500">Consultez, administrez et déclenchez vos scénarios Flash V1 & V2</p>
            </div>
          </div>
          
          {transfers.length > 0 && (
            <button
              onClick={onClearAllTransfers}
              className="py-1.5 px-3 bg-red-650/10 hover:bg-red-650/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 size={13} /> Tout Nettoyer
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500"
            placeholder="Filtrer les essais par bénéficiaire, banque ou référence..."
          />
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="text-center py-20 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800/80">
            <History size={40} className="text-slate-800 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-semibold">Aucun lien d'essai enregistré dans l'historique</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">Générez un virement d'essai depuis les modules Flash Compte V1 ou V2 pour démarrer le monitoring.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredTransfers.map(t => (
              <div 
                key={t.id} 
                className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group"
              >
                {t.version === 'V2' && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                )}
                {t.version === 'V1' && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
                )}

                {/* Left Description metrics */}
                <div className="space-y-1 pl-1 md:pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      t.version === 'V2' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/15' : 'bg-amber-600/15 text-amber-500 border border-amber-500/15'
                    }`}>
                      FLASH {t.version}
                    </span>
                    <span className="text-xs font-bold text-white">{t.recipientName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({t.recipientBank})</span>
                  </div>

                  <div className="flex flex-wrap text-[11px] text-slate-400 gap-x-3 gap-y-1 font-mono pt-1">
                    <span>Montant : <strong className="text-slate-200">{t.amount.toLocaleString('fr-FR')} FCFA</strong></span>
                    <span>•</span>
                    <span>Type : <strong className="text-slate-350 select-none">{t.type}</strong></span>
                    <span>•</span>
                    <span>Statut : <strong className={t.isCompleted ? 'text-emerald-400' : 'text-amber-500'}>{t.isCompleted ? 'Complété' : 'Simulé en attente'}</strong></span>
                    {t.status !== 'SUCCESS' && (
                      <>
                        <span>•</span>
                        <span className="text-red-400 uppercase font-semibold">Comportement : {t.status}</span>
                      </>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 font-mono pt-0.5 flex flex-wrap gap-2">
                    <span>Créé le : {new Date(t.createdAt).toLocaleString('fr-FR')}</span>
                    <span>•</span>
                    <span>Réf : {t.reference}</span>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => copyUrl(t.generatedUrl)}
                    className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer transition"
                    title="Copier le lien"
                  >
                    <Copy size={12} /> <span className="hidden sm:inline font-semibold">Copier lien</span>
                  </button>

                  <button
                    onClick={() => onLaunchSimulation(t)}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-lg shadow-blue-500/10"
                  >
                    <ExternalLink size={12} /> Lancer simulacre
                  </button>

                  <button
                    onClick={() => onDeleteTransfer(t.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition cursor-pointer"
                    title="Supprimer essai"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic helper card */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
        <Sparkles className="text-amber-400 shrink-0 mt-0.5" size={16} />
        <div className="text-[11px] text-slate-400 leading-normal">
          <strong>Astuce Diagnostic :</strong> Le fonctionnement "V2" vous permet de tester la résilience et la validation auprès de vos clients et collaborateurs en simulant à la fois des flux sécuritaires et des authentifications interbancaires avec reçus finaux dynamiques.
        </div>
      </div>
    </div>
  );
}
