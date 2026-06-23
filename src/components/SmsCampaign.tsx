import React, { useState, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Users, 
  Check, 
  Calculator, 
  Sparkles,
  Terminal,
  Image,
  Upload,
  X,
  History,
  MapPin,
  Mail,
  Smartphone,
  BookOpen,
  Eye
} from 'lucide-react';
import { Contact, CampaignLog, SimulatedTransfer, SimulatedEmail } from '../types';
import { NON_AFRICAN_COUNTRIES } from '../lib/constants';
import { db, saveTransferToDb } from '../lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

interface SmsCampaignProps {
  balance: number;
  contacts: Contact[];
  onSendSms: (campaign: Omit<CampaignLog, 'id' | 'createdAt'>) => boolean;
  deductBalance: (amount: number) => void;
  campaigns: CampaignLog[];
  transfers: SimulatedTransfer[];
}

export default function SmsCampaign({ 
  balance, 
  contacts, 
  onSendSms, 
  deductBalance, 
  campaigns, 
  transfers 
}: SmsCampaignProps) {
  // Main SMS campaign inputs
  const [smsText, setSmsText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [senderName, setSenderName] = useState('FLASH_PREM');
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  // Optional direct routing inputs (non-obligatoires)
  const [directRecipient, setDirectRecipient] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('France (+33)');
  const [customSubject, setCustomSubject] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // File drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COST_PER_SMS = 1; // 1 € per SMS segment

  // Calculate recipients count and cost
  const isDirectMode = directRecipient.trim().length > 0;
  const targetRecipientsCount = isDirectMode ? 1 : selectedContacts.length;
  
  const charCount = smsText.length;
  const smsSegments = charCount === 0 ? 0 : Math.ceil(charCount / 160);
  const totalCost = smsSegments * targetRecipientsCount * COST_PER_SMS;

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handleToggleContact = (id: string) => {
    // If in direct routing mode, selected contacts are disabled/not used
    if (isDirectMode) return;
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cid => cid !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const templates = [
    { name: 'Solde Alerte 🔔', text: 'FLASHCONNECT: Alerte Sécurité. Un transfert de [Montant] € est en cours d\'acheminement vers votre compte. Veuillez finaliser la validation maintenant.' },
    { name: 'Crédit Reçu 💸', text: 'Félicitations! Votre compte bancaire a été crédité en mode test d\'un montant de [Montant] EUR. Connectez-vous à la passerelle pour débloquer votre solde.' },
    { name: 'Sécurisation 🔒', text: 'ALERTE BANCAIRE : Votre espace client nécessite une confirmation instantanée de sécurité OTP pour libérer les fonds en attente.' }
  ];

  const applyTemplate = (text: string) => {
    setSmsText(text);
  };

  // Image upload handlers
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAttachedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert("Format d'image non valide (seules les images de type PNG, JPG ou GIF sont supportées).");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Triggering authentic routing to target
  const handleSend = () => {
    if (charCount === 0) {
      alert('Veuillez écrire un message.');
      return;
    }
    if (!isDirectMode && selectedContacts.length === 0) {
      alert('Veuillez sélectionner au moins un destinataire dans le carnet OU saisir un destinataire direct.');
      return;
    }
    if (balance < totalCost) {
      alert('Solde insuffisant pour courir les frais de cette campagne. Veuillez recharger votre solde d\'abord.');
      return;
    }

    setIsSending(true);
    setSendingLogs([]);
    setProgress(0);
    
    let currentLog: string[] = [];
    
    // Determine recipients details list
    const recipientsList: { name: string; phone: string; email: string }[] = [];
    if (isDirectMode) {
      const cleanedNum = directRecipient.trim();
      recipientsList.push({
        name: cleanedNum.includes('@') ? 'Client Direct (Email)' : 'Client Direct (Phone)',
        phone: cleanedNum.includes('@') ? '' : cleanedNum,
        email: cleanedNum.includes('@') ? cleanedNum : ''
      });
    } else {
      contacts.filter(c => selectedContacts.includes(c.id)).forEach(c => {
        recipientsList.push({ name: c.name, phone: c.phone, email: c.email });
      });
    }

    recipientsList.forEach((recipient, idx) => {
      setTimeout(async () => {
        const destLabel = recipient.phone || recipient.email;
        currentLog = [
          ...currentLog,
          `[${new Date().toLocaleTimeString()}] Connexion aux antennes SMPP directes pour la route : ${recipientCountry}...`,
          `[${new Date().toLocaleTimeString()}] Acheminement SMS vers ${recipient.name} (${destLabel}) - Réussite immédiate.`
        ];
        
        // INTERACTIVE REAL-TIME ROUTING FOR COHESIVE SIMULATION:
        // A) If targeted to one of our active Virtual Numbers, route into 'virtual_messages' collection
        const cleanDest = destLabel.replace(/\s+/g, '').replace(/[^a-zA-Z0-9+]/g, '');
        
        const VIRTUAL_PHONE_NUMS = [
          '+33644639210', // France
          '+12025550142', // USA
          '+447911123456', // UK
          '+14165550192', // Canada
          '+491705551234', // Germany
          '+819055551212', // Japan
          '+6591234567'    // Singapore
        ];

        const isVirtual = VIRTUAL_PHONE_NUMS.some(vpn => cleanDest.includes(vpn) || vpn.includes(cleanDest));
        if (isVirtual) {
          try {
            const vpnMatch = VIRTUAL_PHONE_NUMS.find(vpn => cleanDest.includes(vpn) || vpn.includes(cleanDest)) || cleanDest;
            // Format phone number to match indeed
            let formattedVpn = '';
            if (vpnMatch === '+33644639210') formattedVpn = '+33 6 44 63 92 10';
            else if (vpnMatch === '+12025550142') formattedVpn = '+1 202 555 0142';
            else if (vpnMatch === '+447911123456') formattedVpn = '+44 7911 123456';
            else if (vpnMatch === '+14165550192') formattedVpn = '+1 416 555 0192';
            else if (vpnMatch === '+491705551234') formattedVpn = '+49 170 555 1234';
            else if (vpnMatch === '+819055551212') formattedVpn = '+81 90 5555 1212';
            else if (vpnMatch === '+6591234567') formattedVpn = '+65 9123 4567';
            else formattedVpn = recipient.phone || destLabel;

            // Extract numeric verification code from SMS if any exists to populate code card trigger
            const codeMatch = smsText.match(/\d{4,6}/);
            const extractedCode = codeMatch ? codeMatch[0] : undefined;

            await addDoc(collection(db, 'virtual_messages'), {
              sender: senderName || 'SMS SECURE',
              recipient: formattedVpn,
              content: customSubject ? `[SUJET : ${customSubject}] ${smsText}` : smsText,
              timestamp: new Date().toISOString(),
              code: extractedCode
            });
            currentLog = [...currentLog, `[${new Date().toLocaleTimeString()}] Info : Filtré & acheminé vers le panneau des flux virtuels actifs.`];
          } catch (e) {
            console.error("Error creating virtual SMS:", e);
          }
        }

        // B) If is client in standard active transfers database, route directly inside active transfer object Simulated Inboxes
        const emailToMatch = recipient.email?.trim().toLowerCase();
        const phoneToMatch = recipient.phone?.replace(/\s+/g, '').replace(/[^0-9]/g, '');

        if (emailToMatch || phoneToMatch) {
          const clientTx = transfers.find(t => {
            const txEmail = t.email?.trim().toLowerCase();
            const txPhone = t.phone?.replace(/\s+/g, '').replace(/[^0-9]/g, '');
            return (emailToMatch && txEmail === emailToMatch) || (phoneToMatch && txPhone && cleanDest.includes(txPhone));
          });

          if (clientTx) {
            const simulatedInboxEmail: SimulatedEmail = {
              id: `mail-${Math.floor(Math.random() * 90000 + 10000)}`,
              sender: `${senderName || 'INFO_BANK'} <support@serveur.com>`,
              recipient: clientTx.email,
              subject: customSubject || `Message SMS de sécurité urgent`,
              body: `<div style="font-family: sans-serif; padding:16px;">
                <p><strong>Expéditeur SMS :</strong> <code>${senderName}</code></p>
                <div style="background:#f1f5f9; padding:12px; border-radius:8px; border-left:4px solid #3b82f6; margin:12px 0;">
                  ${attachedImage ? `<img src="${attachedImage}" style="max-width:100%; height:auto; max-height:120px; border-radius:4px; margin-bottom:8px; display:block;" />` : ''}
                  ${smsText}
                </div>
                <p style="font-size:10px; color:#64748b;">Notification transactionnelle instantanée.</p>
              </div>`,
              timestamp: new Date().toISOString(),
              status: 'SUCCESS'
            };
            const currentEmails = clientTx.emails || [];
            clientTx.emails = [simulatedInboxEmail, ...currentEmails];
            await saveTransferToDb(clientTx);
            currentLog = [...currentLog, `[${new Date().toLocaleTimeString()}] Réceptionneur connecté : Donnée transactionnelle mise à jour pour ${clientTx.firstName} ${clientTx.lastName}.`];
          }
        }

        setSendingLogs([...currentLog]);
        setProgress(Math.round(((idx + 1) / recipientsList.length) * 100));
        
        if (idx === recipientsList.length - 1) {
          setTimeout(() => {
            deductBalance(totalCost);
            onSendSms({
              type: 'SMS',
              title: customSubject ? `[${customSubject}] ${smsText.slice(0, 18)}...` : `SMS: ${smsText.slice(0, 22)}...`,
              content: smsText,
              recipientsCount: targetRecipientsCount,
              cost: totalCost,
              status: 'Envoyé',
              recipientEmailOrPhone: isDirectMode ? directRecipient : `${targetRecipientsCount} contacts du carnet`,
              recipientCountry,
              subject: customSubject || undefined,
              image: attachedImage || undefined
            });
            setIsSending(false);
            setSmsText('');
            setDirectRecipient('');
            setCustomSubject('');
            setAttachedImage(null);
            setSelectedContacts([]);
            currentLog = [...currentLog, `[${new Date().toLocaleTimeString()}] Campagne de SMS Banking finalisée.`];
            setSendingLogs([...currentLog]);
            alert('SMS Banking acheminé vers vos destinations de tests.');
          }, 800);
        }
      }, (idx + 1) * 850);
    });
  };

  // Filter local SMS campaigns
  const smsCampaigns = campaigns.filter(c => c.type === 'SMS');

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 animate-fade-in">
      
      {/* Design and inputs (Col 1-2) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
            <div className="bg-blue-600/10 p-2.5 rounded-xl text-blue-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Émetteur de SMS Banking</h3>
              <p className="text-xs text-slate-500">
                Acheminez des simulations d'alertes instantanées vers des cibles ou numéros virtuels actifs
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* SENDER ID */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">ID EXPÉDITEUR ALPHANUMÉRIQUE (Sender ID)</label>
              <input
                type="text"
                maxLength={11}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Ex. SECURE_BANK"
              />
              <span className="text-[9.5px] text-slate-500 mt-1 block">Maximum 11 caractères alphanumériques (Ex: ALERT_SMS, PAY_INFO, BANQUE).</span>
            </div>

            {/* OPTIONAL DIRECT FIELDS ACCORDION BAR */}
            <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5 uppercase">
                    <Sparkles size={13} className="text-amber-400" /> Options de destination directes (Non obligatoires)
                  </h4>
                  <p className="text-[9.5px] text-slate-500 leading-tight mt-0.5">Saisissez un numéro ou courriel direct hors carnet</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DIRECT FIELD : DESTINATAIRE */}
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">DESTINATAIRE UNIQUE DIRECT</label>
                    <input
                      type="text"
                      value={directRecipient}
                      onChange={(e) => setDirectRecipient(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="N° de téléphone ou E-mail (Ex: +33644639210)"
                    />
                    <span className="text-[9.5px] text-slate-500 mt-1 block">Si renseigné, cette boîte prend le pas sur le carnet.</span>
                  </div>

                  {/* DIRECT FIELD : SELECTION DES PAYS */}
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">PAYS DU DESTINATAIRE</label>
                    <select
                      value={recipientCountry}
                      onChange={(e) => setRecipientCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      {NON_AFRICAN_COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DIRECT FIELD : SUJET */}
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">SUJET / MOT DE PASSE (Facultatif)</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                      placeholder="Ex: Alerte Virement Reçu"
                    />
                  </div>

                  {/* DIRECT FIELD : TELEVERSEMENT IMAGE */}
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">PIÈCE JOINTE IMAGE (Facultatif/MMS)</label>
                    
                    {!attachedImage ? (
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                          dragActive 
                            ? 'border-blue-500 bg-blue-600/10' 
                            : 'border-slate-800 bg-slate-950 hover:bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <Upload size={14} className="text-slate-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-300">Glissez ou sélectionnez une image</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Formats PNG, JPG, GIF</span>
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden" 
                        />
                      </div>
                    ) : (
                      <div className="border border-slate-800 rounded-xl p-2 bg-slate-950 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={attachedImage} className="h-10 w-10 object-cover rounded-lg border border-slate-850" alt="pièce-jointe" />
                          <div>
                            <span className="text-[9.5px] text-emerald-400 block font-bold font-mono">IMAGE CHARGÉE :</span>
                            <span className="text-[9.5px] text-slate-400 max-w-[120px] truncate block">Image d'Évaluation</span>
                          </div>
                        </div>
                        <button 
                          onClick={handleRemoveImage}
                          className="p-1 text-slate-400 hover:text-red-400 bg-slate-900 rounded-lg hover:bg-slate-850 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* TEMPLATE SHORTCUT QUICKSELECTOR */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-2 uppercase">MODÈLES RAPIDES ALERTE</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl.text)}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-left hover:border-blue-500/40 transition-all text-[11px] cursor-pointer group"
                  >
                    <div className="font-semibold text-blue-400 flex items-center justify-between">
                      {tpl.name} <Sparkles size={11} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-slate-400 truncate mt-1">{tpl.text}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* SMS CORE MESSAGE TEXTAREA */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider">MESSAGE DE VOTRE COMPTE / ALERTE TEST</label>
                <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                  <span>Caractères: <strong className={charCount > 160 ? 'text-amber-400' : 'text-slate-200'}>{charCount}</strong></span>
                  <span>|</span>
                  <span>Segments: <strong className="text-blue-400">{smsSegments}</strong></span>
                </div>
              </div>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-700 leading-relaxed font-sans"
                placeholder="Ex : ALERT : Votre virement d'un montant de... est en attente."
              />
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850/60 flex items-center justify-between text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1 font-sans text-[10.5px]"><Calculator size={13} className="text-blue-400" /> Coût de simulation déduit :</span>
                <span className="font-mono text-white font-bold">{totalCost.toLocaleString('fr-FR')} €</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleSend}
              disabled={isSending || charCount === 0 || (!isDirectMode && selectedContacts.length === 0)}
              className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                isSending || charCount === 0 || (!isDirectMode && selectedContacts.length === 0)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-705'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
              }`}
            >
              <Send size={14} /> 
              {isSending ? `Envoi en cours (${progress}%)` : isDirectMode ? `Acheminer vers le destinataire direct` : `Diffuser auprès de ${selectedContacts.length} contact(s)`}
            </button>
          </div>
        </div>

        {/* BRADCUST STREAM LOGS */}
        {sendingLogs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Terminal size={14} /> CONSOLE DE BROADCAST SMS
              </span>
              <span className="text-[10px] text-slate-500">Protocole: SMPP API v4</span>
            </div>
            {isSending && (
              <div className="w-full h-1.5 bg-slate-900 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="space-y-1.5 text-[11px] text-slate-350 max-h-40 overflow-y-auto pr-1">
              {sendingLogs.map((log, idx) => (
                <div key={idx} className={log.includes('Réussite') || log.includes('mise à jour') ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SMS HISTORIC PANELS (Vidéos, SMS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <History size={14} className="text-blue-400" /> HISTORIQUE DES SMS BANKING ENVOYÉS
          </h3>

          {smsCampaigns.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic border border-slate-800/80 rounded-xl bg-slate-950/20">
              Aucun historique de SMS envoyé disponible.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {smsCampaigns.map((log) => (
                <div key={log.id} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-400">{log.recipientEmailOrPhone || "Direct"}</span>
                      {log.recipientCountry && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {log.recipientCountry}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleDateString('fr-FR')} {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {log.subject && (
                    <div className="text-[10px] font-bold text-slate-300">
                      Sujet : {log.subject}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 leading-normal bg-slate-900/40 p-2 border border-slate-850 rounded-lg">
                    {log.content}
                  </p>

                  <div className="flex items-center justify-between">
                    {log.image ? (
                      <div className="relative group">
                        <img src={log.image} className="h-10 w-16 object-cover rounded border border-slate-800" alt="Attachement" />
                        <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-bold rounded transition-opacity pointer-events-none">
                          <Eye size={10} /> MMS
                        </span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-500 font-sans italic">Aucune image attachée</div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">Coût : {log.cost} €</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recipient CRM Contacts Selector (Col 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px] justify-between">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">DESTINATAIRES DU CARNET</span>
            </div>
            {!isDirectMode && (
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                {selectedContacts.length === contacts.length ? 'Décocher' : 'Tous'}
              </button>
            )}
          </div>

          {isDirectMode ? (
            <div className="text-center py-20 px-4">
              <AlertCircle size={32} className="text-blue-500/60 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300">Mode d'Envoi Direct Activé</p>
              <p className="text-[10px] text-slate-500 mt-1 lines-4">
                Vous avez saisi un destinataire unique direct ({directRecipient}). Le carnet d'adresses standard est désactivé pour que le message soit acheminé instantanément à cette boîte.
              </p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-20">
              <AlertCircle size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-[11px] text-slate-400 italic">Aucun contact trouvé dans votre espace.</p>
              <p className="text-[9.5px] text-slate-500 mt-1">Saisissez un destinataire direct.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
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
                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-white leading-tight truncate">{c.name}</h4>
                      <p className="text-[10px] text-slate-550 tracking-tight font-mono mt-0.5 truncate">{c.phone || c.email}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
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

        <div className="pt-4 border-t border-slate-850 mt-4 shrink-0">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Nb Destinataires :</span>
            <span className="text-white font-bold">{targetRecipientsCount}</span>
          </div>
          <div className="text-[9.5px] text-slate-500 text-center italic">
            Coût d'essai déduit de votre solde global de diffusion sécurisée à la validation.
          </div>
        </div>
      </div>

    </div>
  );
}
