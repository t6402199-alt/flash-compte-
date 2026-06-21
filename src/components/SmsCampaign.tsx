import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Users, 
  Check, 
  Calculator, 
  Sparkles,
  Terminal
} from 'lucide-react';
import { Contact, CampaignLog } from '../types';

interface SmsCampaignProps {
  balance: number;
  contacts: Contact[];
  onSendSms: (campaign: Omit<CampaignLog, 'id' | 'createdAt'>) => boolean;
  deductBalance: (amount: number) => void;
}

export default function SmsCampaign({ balance, contacts, onSendSms, deductBalance }: SmsCampaignProps) {
  const [smsText, setSmsText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [senderName, setSenderName] = useState('FLASH_PREM');
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const COST_PER_SMS = 1; // 1 € per SMS segment per recipient

  // Character calculator helpers
  const charCount = smsText.length;
  const smsSegments = charCount === 0 ? 0 : Math.ceil(charCount / 160);
  const totalCost = smsSegments * selectedContacts.length * COST_PER_SMS;

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handleToggleContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cid => cid !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const templates = [
    { name: 'Solde Alerte', text: 'FLASHCONNECT: Alerte Sécurité. Un essai de transfert bancaire de [Montant] € est en cours vers votre compte. Veuillez cliquer sur le lien pour valider.' },
    { name: 'Fête Flash', text: 'Félicitations! Votre compte FlashConnect Pro a été crédité de [Montant] €. Offre réservée aux membres VIP. Retrait immédiat via SEPA.' },
    { name: 'Urgent Promo', text: 'FlashConnect Pro: Activez vos transferts test intelligents V1/V2 dès aujourd\'hui et multipliez vos conversions marketing par 5x.' }
  ];

  const applyTemplate = (text: string) => {
    setSmsText(text);
  };

  const handleSend = () => {
    if (charCount === 0) {
      alert('Veuillez écrire un message.');
      return;
    }
    if (selectedContacts.length === 0) {
      alert('Veuillez sélectionner au moins un destinataire.');
      return;
    }
    if (balance < totalCost) {
      alert('Solde insuffisant pour couvrir les coûts de cette campagne. Veuillez recharger votre solde d\'abord.');
      return;
    }

    // Start simulated console sending animation
    setIsSending(true);
    setSendingLogs([]);
    setProgress(0);
    
    let currentLog: string[] = [];
    const recipientDetails = contacts.filter(c => selectedContacts.includes(c.id));
    
    recipientDetails.forEach((contact, idx) => {
      setTimeout(() => {
        currentLog = [
          ...currentLog,
          `[${new Date().toLocaleTimeString()}] Connexion à l'antenne SMS locale...`,
          `[${new Date().toLocaleTimeString()}] Émission SMS vers ${contact.name} (${contact.phone}) - Réussite. Cost: ${smsSegments * COST_PER_SMS} €`
        ];
        setSendingLogs([...currentLog]);
        setProgress(Math.round(((idx + 1) / recipientDetails.length) * 100));
        
        if (idx === recipientDetails.length - 1) {
          setTimeout(() => {
            // Deduct balance and create Campaign Log
            deductBalance(totalCost);
            onSendSms({
              type: 'SMS',
              title: `Campagne SMS: ${smsText.slice(0, 25)}...`,
              content: smsText,
              recipientsCount: selectedContacts.length,
              cost: totalCost,
              status: 'Envoyé'
            });
            setIsSending(false);
            setSmsText('');
            setSelectedContacts([]);
            currentLog = [...currentLog, `[${new Date().toLocaleTimeString()}] Campagne marketing SMS envoyée avec succès.`];
            setSendingLogs([...currentLog]);
            alert('Campagne SMS diffusée avec succès (simulation)');
          }, 800);
        }
      }, (idx + 1) * 800);
    });
  };

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 animate-fade-in">
      {/* Configuration & Composition Panel (Left elements) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
            <div className="bg-blue-600/10 p-2.5 rounded-xl text-blue-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Émetteur de Campagne SMS</h3>
              <p className="text-xs text-slate-500">Diffusez des SMS instantanés en Côte d'Ivoire, Sénégal, Mali et international</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sender alphanumeric ID */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">ID EXPÉDITEUR SÉCURISE (Sender ID)</label>
              <input
                type="text"
                maxLength={11}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Ex. FLASH_PREM"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Maximum 11 caractères alphanumériques. Exemples: FLASHCONNECT, PAY_NOTICE, ALERT.</span>
            </div>

            {/* Template Selector shortcuts */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">MODÈLES PRÉDÉFINIS RAPIDES</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl.text)}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-left hover:border-blue-500/40 transition-all text-xs cursor-pointer group"
                  >
                    <div className="font-semibold text-blue-400 flex items-center justify-between">
                      {tpl.name} <Sparkles size={11} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-slate-400 truncate mt-1">{tpl.text}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Core input and calculations */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-400">CORPS DU MESSAGE SMS</label>
                <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                  <span>Caractères: <strong className={charCount > 160 ? 'text-amber-400' : 'text-slate-200'}>{charCount}</strong></span>
                  <span>|</span>
                  <span>Segments: <strong className="text-blue-400">{smsSegments}</strong></span>
                </div>
              </div>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 leading-relaxed"
                placeholder="Entrez le texte de votre SMS d'essai ou campagne ici..."
              />
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 flex items-center justify-between text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Calculator size={13} className="text-blue-400" /> Tarif calculé:</span>
                <span className="font-mono text-white font-bold">{totalCost.toLocaleString('fr-FR')} €</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSend}
              disabled={isSending || charCount === 0 || selectedContacts.length === 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-md cursor-pointer ${
                isSending || charCount === 0 || selectedContacts.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15'
              }`}
            >
              <Send size={15} /> 
              {isSending ? `Diffusion en cours (${progress}%)` : `Diffuser auprès de ${selectedContacts.length} contact(s)`}
            </button>
          </div>
        </div>

        {/* Live Broadcast Feed */}
        {sendingLogs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Terminal size={14} /> CONSOLE DE BROADCAST SMS
              </span>
              <span className="text-[10px] text-slate-500">Protocole: SMPP API v4</span>
            </div>
            {/* Progress bar */}
            {isSending && (
              <div className="w-full h-1.5 bg-slate-900 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="space-y-1.5 text-[11px] text-slate-300 max-h-48 overflow-y-auto">
              {sendingLogs.map((log, idx) => (
                <div key={idx} className={log.includes('Réussite') ? 'text-emerald-400' : 'text-slate-400'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipient Contacts Manager (Right elements) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">DESTINATAIRES</span>
            </div>
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
            >
              {selectedContacts.length === contacts.length ? 'Décocher Tout' : 'Tout Sélectionner'}
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 italic">Aucun contact disponible dans votre carnet.</p>
              <p className="text-[10px] text-slate-500 mt-1">Créez des contacts pour simuler votre émission.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
              {contacts.map(c => {
                const isSelected = selectedContacts.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleContact(c.id)}
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-600/50' 
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white leading-tight">{c.name}</h4>
                      <p className="text-[10px] text-slate-500 tracking-tight font-mono mt-0.5">{c.phone}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 bg-slate-950'
                    }`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-850 mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Cible sélectionnée :</span>
            <span className="text-white font-bold">{selectedContacts.length} / {contacts.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 text-center italic">
            Coût déduit de votre solde marketing à la validation.
          </div>
        </div>
      </div>
    </div>
  );
}
