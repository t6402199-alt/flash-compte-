import React, { useState, useRef } from 'react';
import { 
  Mail, 
  Send, 
  Eye, 
  EyeOff, 
  FileText, 
  Sparkles, 
  Check, 
  Users, 
  AlertCircle,
  History,
  MapPin,
  Upload,
  X,
  Plus
} from 'lucide-react';
import { Contact, CampaignLog, SimulatedTransfer, SimulatedEmail } from '../types';
import { NON_AFRICAN_COUNTRIES } from '../lib/constants';
import { saveTransferToDb } from '../lib/firebase';

interface EmailCampaignProps {
  balance: number;
  contacts: Contact[];
  onSendEmail: (campaign: Omit<CampaignLog, 'id' | 'createdAt'>) => boolean;
  deductBalance: (amount: number) => void;
  campaigns: CampaignLog[];
  transfers: SimulatedTransfer[];
}

export default function EmailCampaign({ 
  balance, 
  contacts, 
  onSendEmail, 
  deductBalance, 
  campaigns, 
  transfers 
}: EmailCampaignProps) {
  // Main email inputs
  const [subject, setSubject] = useState('');
  const [senderMask, setSenderMask] = useState('Alerte Sécurisée <support@flashconnect.net>');
  const [emailBody, setEmailBody] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Optional direct routing inputs (non-obligatoires)
  const [directRecipient, setDirectRecipient] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('France (+33)');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COST_PER_EMAIL = 1; // 1 € per email

  const contactsWithEmail = contacts.filter(c => c.email);
  
  // Calculate targets & cost
  const isDirectMode = directRecipient.trim().length > 0;
  const targetRecipientsCount = isDirectMode ? 1 : selectedContacts.length;
  const totalCost = targetRecipientsCount * COST_PER_EMAIL;

  const handleSelectAll = () => {
    if (selectedContacts.length === contactsWithEmail.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contactsWithEmail.map(c => c.id));
    }
  };

  const handleToggleContact = (id: string) => {
    if (isDirectMode) return;
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cid => cid !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const emailTemplates = [
    {
      name: 'Alerte Virement Bancaire 📊',
      subject: 'Avis de Crédit Exceptionnel Flash Compte - Référence [TxID]',
      body: `<h3>Notification de Virement Flash Compte V1</h3>
<p>Madame, Monsieur,</p>
<p>Nous vous informons qu'un virement d'essai bancaire d'un montant de <strong>[Montant] €</strong> a été initié de manière sécurisée vers votre compte.</p>
<p>Afin de finaliser ou de libérer cette étape de virement rattachée au protocole sécurisé <strong>FlashConnect Pro</strong>, veuillez vous inscrire et valider à la passerelle de confirmation.</p>
<p><em>Cet e-mail automatique est généré en sandbox par l'émetteur certifié.</em></p>`
    },
    {
      name: 'Validation de Facturation 🔑',
      subject: 'Validation requise pour libérer votre solde commercial',
      body: `<h3>Félicitations administrative de Virement !</h3>
<p>Votre compte principal est actuellement bridé ou nécessite un déblocage urgent lié aux impôts de transfert internationaux.</p>
<p>Veuillez charger des crédits, ou ajouter des documents requis pour finaliser la transaction d'évaluation.</p>
<p>Cordialement,<br>L'équipe Support Technique.</p>`
    },
    {
      name: 'Promotion Canal SMS 🌌',
      subject: 'Découvrez notre suite Cloud et activez vos SMS Illimités',
      body: `<h3>Boostez vos performances marketing !</h3>
<p>Notre application FlashConnect Pro vous propose un accès exclusif à des canaux SMS directs avec de hauts taux de délivrabilité d'alertes.</p>
<p>Créez des scénarios transactionnels avancés de tests et gérez tout votre CRM facilement.</p>`
    }
  ];

  const applyTemplate = (tpl: typeof emailTemplates[0]) => {
    setSubject(tpl.subject);
    setEmailBody(tpl.body);
  };

  // Image upload
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
      alert("Seuls les formats d'images (PNG, JPG, GIF) sont acceptés.");
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

  // Dispatch Email
  // Dispatch Email
  const handleSend = () => {
    if (!subject.trim()) {
      alert('Veuillez préciser un sujet d\'email.');
      return;
    }
    if (!emailBody.trim()) {
      alert('Veuillez composer le corps de l\'email.');
      return;
    }
    if (!isDirectMode && selectedContacts.length === 0) {
      alert('Veuillez sélectionner au moins un destinataire dans votre carnet ou saisir une adresse de destination directe.');
      return;
    }
    if (balance < totalCost) {
      alert('Solde insuffisant pour couvrir cet envoi d\'emails de simulation.');
      return;
    }

    setIsSending(true);

    // Build recipients list
    const recipientsList: { name: string; email: string }[] = [];
    if (isDirectMode) {
      recipientsList.push({
        name: directRecipient.includes('@') ? 'Destinataire Direct' : 'Destinataire Téléphonique',
        email: directRecipient.trim()
      });
    } else {
      contactsWithEmail.filter(c => selectedContacts.includes(c.id)).forEach(c => {
        recipientsList.push({ name: c.name, email: c.email });
      });
    }

    setTimeout(async () => {
      // Deduct standard balance
      deductBalance(totalCost);

      const metaEnv = (import.meta as any).env || {};
      const mailerliteApiKey = metaEnv.VITE_MAILERLITE_API_KEY;
      const mailerliteSenderEmail = metaEnv.VITE_MAILERLITE_SENDER_EMAIL;
      
      const isMailerliteConfigured = !!mailerliteApiKey;
      let realSendError: string | null = null;

      // Parse sender email and name from senderMask
      // Example senderMask: "Alerte Sécurisée <support@flashconnect.net>"
      let fromEmail = mailerliteSenderEmail || 'support@flashconnect.net';
      let fromName = 'Alerte Sécurisée';
      
      const maskMatch = senderMask.match(/^(.*?)\s*<(.*?)>$/);
      if (maskMatch) {
        fromName = maskMatch[1].trim();
        fromEmail = mailerliteSenderEmail || maskMatch[2].trim();
      } else if (senderMask.includes('@')) {
        fromEmail = senderMask.trim();
        fromName = senderMask.split('@')[0];
      }

      // Route simulated email to matching customer transfer secure inboxes in Firestore
      for (const rec of recipientsList) {
        const emailToMatch = rec.email?.trim().toLowerCase();
        
        // Build final content body with the attached image renders if present
        let finalBody = emailBody;
        if (attachedImage) {
          finalBody = `<div style="text-align:center; margin-bottom:15px;">
            <img src="${attachedImage}" style="max-width:100%; height:auto; max-height:220px; border-radius:12px; border:1px solid #e2e8f0; display:inline-block;" />
          </div>` + emailBody;
        }

        // 1. Send real email via MailerLite if configured
        if (isMailerliteConfigured) {
          try {
            // Extract clean text (strip HTML tags)
            const plainText = emailBody.replace(/<[^>]*>/g, '');
            
            const response = await fetch('https://connect.mailerlite.com/api/emails/transactional', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${mailerliteApiKey}`
              },
              body: JSON.stringify({
                subject: subject,
                from: fromEmail,
                from_name: fromName,
                to: rec.email,
                html: finalBody,
                text: plainText
              })
            });

            if (!response.ok) {
              const errDetails = await response.json().catch(() => ({}));
              console.error("Mailerlite API Error Response:", errDetails);
              throw new Error(errDetails?.message || `Statut ${response.status}`);
            }
          } catch (err: any) {
            console.error(`MailerLite dispatch failed for ${rec.email}:`, err);
            realSendError = err.message || "Erreur de connexion Mailerlite";
          }
        }

        // 2. Also save to the internal/simulated database so client receives it in their sandbox portal inbox
        const clientTx = transfers.find(t => t.email?.trim().toLowerCase() === emailToMatch);
        if (clientTx) {
          const simulatedInboxEmail: SimulatedEmail = {
            id: `mail-${Math.floor(Math.random() * 90000 + 10000)}`,
            sender: senderMask || 'Alerte Pro <support@flashconnect.net>',
            recipient: clientTx.email,
            subject: subject,
            body: finalBody,
            timestamp: new Date().toISOString(),
            status: isMailerliteConfigured && realSendError ? 'FAILURE' : 'SUCCESS'
          };

          const currentEmails = clientTx.emails || [];
          clientTx.emails = [simulatedInboxEmail, ...currentEmails];
          await saveTransferToDb(clientTx);
        }
      }

      // Add to general campaigns history logs
      onSendEmail({
        type: 'EMAIL',
        title: subject,
        content: emailBody,
        recipientsCount: targetRecipientsCount,
        cost: totalCost,
        status: isMailerliteConfigured && realSendError ? 'Échoué' : 'Envoyé',
        recipientEmailOrPhone: isDirectMode ? directRecipient : `${targetRecipientsCount} contacts du carnet`,
        recipientCountry,
        subject: subject,
        image: attachedImage || undefined
      });

      setIsSending(false);

      if (isMailerliteConfigured) {
        if (realSendError) {
          alert(`Erreur d'envoi MailerLite : ${realSendError}\n\nAssurez-vous que l'adresse d'expéditeur (${fromEmail}) appartient à un domaine vérifié sur votre compte MailerLite.`);
        } else {
          alert(`Campagne MailerLite acheminée avec succès vers de vraies boîtes de réception (${targetRecipientsCount} destinataire(s)).`);
          setSubject('');
          setEmailBody('');
          setDirectRecipient('');
          setAttachedImage(null);
          setSelectedContacts([]);
        }
      } else {
        alert(`Campagne de simulation d'email acheminée avec succès aux boîtes de réception virtuelles.`);
        setSubject('');
        setEmailBody('');
        setDirectRecipient('');
        setAttachedImage(null);
        setSelectedContacts([]);
      }
    }, 1500);
  };

  // Local filtered campaigns list
  const emailCampaigns = campaigns.filter(c => c.type === 'EMAIL');

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 animate-fade-in">
      
      {/* Configuration & Compose (Col 1-2) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600/10 p-2.5 rounded-xl text-purple-400">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Émetteur de Campagne Email</h3>
                <p className="text-xs text-slate-500">
                  Créez et diffusez des simulations d'alertes HTML enrichies d'images dans les boîtes de réception
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 text-slate-300 font-sans px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer hover:shadow"
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Masquer' : 'Aperçu Direct'}
            </button>
          </div>

          <div className="space-y-4">
            {/* Sender and basic parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10.5px] font-bold text-slate-400 block mb-1">MASQUE EXPÉDITEUR CERTIFIÉ</label>
                <input
                  type="text"
                  value={senderMask}
                  onChange={(e) => setSenderMask(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="Ex: BCEAO Secure <support@bceao.int>"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-400 block mb-1">SUJET DU MESSAGE ALERTE</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-sans"
                  placeholder="Ex: Confirmation de virement imminent"
                />
              </div>
            </div>

            {/* OPTIONAL DIRECT ROUTING ACCORDION */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
              <div className="p-4 bg-slate-950 border-b border-slate-850">
                <h4 className="text-xs font-black text-slate-350 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400 animate-pulse" /> Options d'envois directes facultatives
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5">Saisissez l'adresse de votre client de test directe ou liez une image</p>
              </div>

              <div className="p-4 space-y-4 bg-slate-950/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DIRECT ELEMENT : RECIPIENT */}
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">DESTINATAIRE UNIQUE DIRECT (Optionnel)</label>
                    <input
                      type="text"
                      value={directRecipient}
                      onChange={(e) => setDirectRecipient(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 font-mono"
                      placeholder="Ex: sillyfr079@gmail.com ou +336446392"
                    />
                    <span className="text-[9.5px] text-slate-550 mt-1 block">Renseigner une adresse désactive le carnet de droite.</span>
                  </div>

                  {/* DIRECT ELEMENT : COUNTRY SELECTOR */}
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">PAYS DU DESTINATAIRE (Optionnel)</label>
                    <select
                      value={recipientCountry}
                      onChange={(e) => setRecipientCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                    >
                      {NON_AFRICAN_COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DIRECT ELEMENT : FILES / IMAGE */}
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">PIÈCE JOINTE BANNIÈRE / LOGO BANQUE (Optionnel)</label>
                  
                  {!attachedImage ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        dragActive 
                          ? 'border-purple-500 bg-purple-650/10' 
                          : 'border-slate-850 bg-slate-950 hover:bg-slate-950/70 hover:border-slate-750'
                      }`}
                    >
                      <Upload size={15} className="text-slate-500 mb-1" />
                      <span className="text-[10px] font-bold text-slate-300">Intégrer une image ou photo d'en-tête (Drag & Drop)</span>
                      <span className="text-[9px] text-slate-550 mt-0.5">Formats acceptés : PNG, JPG, GIF</span>
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
                        <img src={attachedImage} className="h-10 w-16 object-cover rounded-lg border border-slate-800" alt="pièce-jointe-logo" />
                        <div>
                          <span className="text-[9.5px] text-purple-400 block font-bold font-mono">PIÈCE INTERNE CHARGÉE :</span>
                          <span className="text-[9px] text-slate-400">Bannière mail d'essai</span>
                        </div>
                      </div>
                      <button 
                        onClick={handleRemoveImage}
                        className="p-1 px-1.5 text-slate-400 hover:text-red-400 bg-slate-900 rounded-lg hover:bg-slate-850 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* QUICK EMAIL TEMPLATES */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-2 uppercase">MODÈLES COMMERCIAUX CERTIFIÉS</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {emailTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800/60 hover:border-purple-500/20 rounded-xl text-left transition text-xs cursor-pointer group"
                  >
                    <div className="font-semibold text-purple-450 flex items-center justify-between leading-tight mb-1 truncate">
                      {tpl.name}
                      <Sparkles size={11} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-500 text-[10px] truncate block">{tpl.subject}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TEXTAREA HTML EDITOR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CONSTRUCTEUR DU MAIL (Code HTML & Texte Pro)</label>
                <span className="text-[9.5px] text-slate-550 font-mono">Prend en charge CSS inline</span>
              </div>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={7}
                className="w-full bg-slate-950 border border-slate-855 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
                placeholder="Ex:<p>Bonjour,</p> <p>Votre virement de 500 € a été validé.</p>"
              />
            </div>

            {/* SEND ACTION BUTTON */}
            <button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !emailBody.trim() || (!isDirectMode && selectedContacts.length === 0)}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSending || !subject.trim() || !emailBody.trim() || (!isDirectMode && selectedContacts.length === 0)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/10'
              }`}
            >
              <Send size={14} />
              {isSending ? 'Acheminement crypté en cours...' : isDirectMode ? "Envoyer au destinataire direct unique" : `Acheminer vers les ${selectedContacts.length} destinataires`}
            </button>
          </div>
        </div>

        {/* LIVE IN-BOX INTERACTIVE PREVIEW */}
        {showPreview && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl animate-scale-up">
            <span className="text-xs font-bold text-slate-400 block mb-3 font-mono">APERÇU RÉEL DANS LA RECEPTION CLIENTS</span>
            <div className="bg-white rounded-2xl p-5 text-slate-800 shadow-inner border border-slate-200 min-h-[180px]">
              <div className="border-b border-slate-100 pb-3 mb-3.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-slate-400 font-bold w-12 text-[11px]">De :</span>
                  <span className="text-slate-700 font-mono">{senderMask}</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-slate-400 font-bold w-12 text-[11px]">Sujet :</span>
                  <span className="text-slate-900 font-bold">{subject || "(Aucun sujet spécifié)"}</span>
                </div>
              </div>
              
              {attachedImage && (
                <div className="text-center mb-4 border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-slate-450 block text-left mb-1.5 font-mono">📎 IMAGE EN-TÊTE INTÉGRÉE :</span>
                  <img src={attachedImage} className="max-h-40 rounded-xl border object-contain mx-auto" alt="Logo-Banque-Aperçu" />
                </div>
              )}

              {emailBody ? (
                <div 
                  className="text-xs text-slate-800 space-y-2 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              ) : (
                <div className="text-slate-400 text-center text-[11px] italic py-8">
                  Composez votre email pour afficher un aperçu conforme en temps réel.
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMAIL CAMPAIGNS HISTORICAL LOGGER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <History size={14} className="text-purple-400" /> HISTORIQUE DES MAIL MARKETING ENVOYÉS
          </h3>

          {emailCampaigns.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic border border-slate-800/80 rounded-xl bg-slate-950/20">
              Aucun historique d'email marketing disponible.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {emailCampaigns.map((log) => (
                <div key={log.id} className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-purple-400">{log.recipientEmailOrPhone || "Direct"}</span>
                      {log.recipientCountry && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {log.recipientCountry}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-550 font-mono">
                      {new Date(log.createdAt).toLocaleDateString('fr-FR')} {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs font-extrabold text-slate-200">
                    Sujet : {log.title}
                  </div>

                  <div 
                    className="text-[11px] text-slate-400 leading-normal bg-slate-900/40 p-2.5 border border-slate-850 rounded-lg max-h-24 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: log.content }}
                  />

                  <div className="flex items-center justify-between pt-1">
                    {log.image ? (
                      <div className="relative group">
                        <img src={log.image} className="h-10 w-16 object-cover rounded border border-slate-800" alt="Attachement" />
                        <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-bold rounded transition-opacity pointer-events-none">
                          Image
                        </span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-500 italic">Aucun en-tête d'image</div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">Coût : {log.cost} €</span>
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
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

      {/* Selector: Custom target or contacts checklist (Col 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px] justify-between">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">CILBLES CARNET (AVEC EMAIL)</span>
            </div>
            {!isDirectMode && (
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
              >
                {selectedContacts.length === contactsWithEmail.length ? 'Décocher' : 'Tous'}
              </button>
            )}
          </div>

          {isDirectMode ? (
            <div className="text-center py-20 px-4">
              <AlertCircle size={32} className="text-purple-500/60 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300">Envoi direct actif</p>
              <p className="text-[10px] text-slate-550 mt-1 lines-4">
                Vous avez renseigné un destinataire direct unique ({directRecipient}). Le système bypass le carnet standard pour l'acheminer directement à cet e-mail client.
              </p>
            </div>
          ) : contactsWithEmail.length === 0 ? (
            <div className="text-center py-20">
              <AlertCircle size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-[11px] text-slate-400 italic">Aucun contact avec courriel n'est disponible.</p>
              <span className="text-[9.5px] text-slate-550 block mt-1">Saisissez l'adresse mail du destinataire direct ci-contre.</span>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {contactsWithEmail.map(c => {
                const isSelected = selectedContacts.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleContact(c.id)}
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                      isSelected 
                        ? 'bg-purple-600/10 border-purple-500' 
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-800'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-white leading-tight truncate">{c.name}</h4>
                      <p className="text-[9.5px] text-slate-500 tracking-tight font-mono mt-0.5 truncate">{c.email}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-800 bg-slate-950'
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
          <div className="flex justify-between text-xs text-slate-400 mb-3 font-mono">
            <span>Coût total :</span>
            <span className="text-purple-400 font-bold">{totalCost.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="text-[9.5px] text-slate-500 text-center italic">
            Tarif standard : 1 € par envoi d'alerte.
          </div>
        </div>
      </div>

    </div>
  );
}
