import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Eye, 
  EyeOff, 
  FileText, 
  Sparkles, 
  Check, 
  Users, 
  AlertCircle 
} from 'lucide-react';
import { Contact, CampaignLog } from '../types';

interface EmailCampaignProps {
  balance: number;
  contacts: Contact[];
  onSendEmail: (campaign: Omit<CampaignLog, 'id' | 'createdAt'>) => boolean;
  deductBalance: (amount: number) => void;
}

export default function EmailCampaign({ balance, contacts, onSendEmail, deductBalance }: EmailCampaignProps) {
  const [subject, setSubject] = useState('');
  const [senderMask, setSenderMask] = useState('Alerte Sécurisée <support@flashconnect.net>');
  const [emailBody, setEmailBody] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const COST_PER_EMAIL = 10; // 10 FCFA per email to custom targets
  const totalCost = selectedContacts.length * COST_PER_EMAIL;

  const contactsWithEmail = contacts.filter(c => c.email);

  const handleSelectAll = () => {
    if (selectedContacts.length === contactsWithEmail.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contactsWithEmail.map(c => c.id));
    }
  };

  const handleToggleContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cid => cid !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const emailTemplates = [
    {
      name: 'Alerte Alerte Virement',
      subject: 'Avis de Crédit Exceptionnel Flash Compte - Référence [TxID]',
      body: `<h3>Notification de Virement Flash Compte V1</h3>
<p>Madame, Monsieur,</p>
<p>Nous vous informons qu'un virement d'essai bancaire d'un montant de <strong>[Montant] FCFA</strong> a été initié avec succès vers votre compte.</p>
<p>Pour suivre l'état de ce virement sécurisé rattaché au protocole de simulation <strong>FlashConnect Pro</strong>, veuillez consulter la passerelle de confirmation.</p>
<p><em>Cet e-mail est généré de manière automatique par les serveurs sandbox.</em></p>`
    },
    {
      name: 'Confirmation Compte',
      subject: 'Validation de votre adresse de facturation FlashConnect Pro',
      body: `<h3>Félicitations pour votre inscription !</h3>
<p>Bienvenue sur FlashConnect Pro, votre outil de marketing et d'essai bancaire omnicanal.</p>
<p>Votre compte principal est actuellement configuré et prêt à l'emploi. Vous pouvez charger votre portefeuille de simulation ou configurer des liens d'évaluation.</p>
<p>Cordialement,<br>L'équipe Support Technique.</p>`
    },
    {
      name: 'Promotion SaaS',
      subject: 'FlashConnect Pro: Activez vos alertes SMS illimitées',
      body: `<h3>Boostez vos performances marketing !</h3>
<p>FlashConnect Pro vous propose un accès exclusif à des canaux SMS directs avec des taux d'ouverture de 99%.</p>
<p>Configurez des scénarios transactionnels, simulez des virements bancaires virtuels pour vos tests unitaires, et gérez tout votre CRM à l'aide de notre suite cloud.</p>`
    }
  ];

  const applyTemplate = (tpl: typeof emailTemplates[0]) => {
    setSubject(tpl.subject);
    setEmailBody(tpl.body);
  };

  const handleSend = () => {
    if (!subject.trim()) {
      alert('Veuillez préciser un sujet.');
      return;
    }
    if (!emailBody.trim()) {
      alert('Veuillez composer le corps de l\'email.');
      return;
    }
    if (selectedContacts.length === 0) {
      alert('Veuillez sélectionner au moins un destinataire.');
      return;
    }
    if (balance < totalCost) {
      alert('Solde insuffisant pour couvrir les coûts d\'envoi. Veuillez recharger votre portefeuille.');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      deductBalance(totalCost);
      onSendEmail({
        type: 'EMAIL',
        title: subject,
        content: emailBody,
        recipientsCount: selectedContacts.length,
        cost: totalCost,
        status: 'Envoyé'
      });
      setIsSending(false);
      setSubject('');
      setEmailBody('');
      setSelectedContacts([]);
      alert(`Campagne Email diffusée avec succès à ${selectedContacts.length} destinataires (simulation)`);
    }, 1500);
  };

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 animate-fade-in">
      {/* Compose & Design Box */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600/10 p-2.5 rounded-xl text-purple-400">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Émetteur de Campagne Email</h3>
                <p className="text-xs text-slate-500">Diffusez des emails riches d'essais vers vos cibles d'affaires</p>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 font-sans px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Masquer l\'Aperçu' : 'Afficher l\'Aperçu'}
            </button>
          </div>

          <div className="space-y-4">
            {/* Sender and subject input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">MASQUE EXPÉDITEUR</label>
                <input
                  type="text"
                  value={senderMask}
                  onChange={(e) => setSenderMask(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="Ex: Alerte <support@serveur.com>"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">SUJET DU MESSAGE</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Confirmation de virement bancaire"
                />
              </div>
            </div>

            {/* Template shortcuts */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">MODÈLES D'EMAILS COMMERCIAUX</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {emailTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800/60 hover:border-blue-500/20 rounded-xl text-left transition text-xs cursor-pointer group"
                  >
                    <div className="font-semibold text-purple-400 flex items-center justify-between leading-tight mb-1 truncate">
                      {tpl.name}
                      <Sparkles size={11} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-500 text-[10px] truncate block">{tpl.subject}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Rich Editor content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CONSTRUCTEUR DU CONTENU (Format HTML/Texte)</label>
                <span className="text-[10px] text-slate-500 font-mono">Prise en charge des balises HTML standards</span>
              </div>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                className="w-full bg-slate-950 border border-slate-855 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                placeholder="Ex:<p>Bonjour,</p> <p>Votre virement flash de 500 000 FCFA est validé.</p>"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !emailBody.trim() || selectedContacts.length === 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all cursor-pointer ${
                isSending || !subject.trim() || !emailBody.trim() || selectedContacts.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/10'
              }`}
            >
              <Send size={15} />
              {isSending ? 'Diffusion globale en cours...' : `Envoyer l'Email à ${selectedContacts.length} destinataire(s)`}
            </button>
          </div>
        </div>

        {/* Live Visual Render Preview */}
        {showPreview && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl animate-scale-up">
            <span className="text-xs font-bold text-slate-400 block mb-3 font-mono">APERÇU RÉEL DANS LA BOÎTE DE RÉCEPTION</span>
            <div className="bg-white rounded-2xl p-6 text-slate-800 shadow-inner overflow-hidden border border-slate-200 min-h-[160px]">
              {/* Header Box inside simulation */}
              <div className="border-b border-slate-100 pb-3 mb-4 text-xs">
                <div className="flex gap-2">
                  <span className="text-slate-400 font-semibold w-16">De :</span>
                  <span className="text-slate-700 font-mono font-medium">{senderMask}</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-slate-400 font-semibold w-16">Sujet :</span>
                  <span className="text-slate-900 font-bold font-sans">{subject || "(Aucun sujet spécifié)"}</span>
                </div>
              </div>
              {/* Computed Body content inside simulator */}
              {emailBody ? (
                <div 
                  className="text-xs text-slate-800 space-y-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              ) : (
                <div className="text-slate-400 text-center text-xs italic py-6">
                  Le contenu de votre e-mail s'affichera ici en temps réel au fur et à mesure de votre saisie.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recipient CRM Segment checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">CILBLES AVEC EMAIL</span>
            </div>
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
            >
              {selectedContacts.length === contactsWithEmail.length ? 'Décocher Tout' : 'Tout Sélectionner'}
            </button>
          </div>

          {contactsWithEmail.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 italic">Aucun contact n'a de courriel configuré.</p>
              <button 
                onClick={() => applyTemplate({ name: '', subject: '', body: '' })} 
                className="text-[10px] text-blue-400 hover:underline mt-1 cursor-pointer"
              >
                Gérer les contacts pour ajouter des emails
              </button>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
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
                      <h4 className="text-xs font-semibold text-white leading-tight truncate">{c.name}</h4>
                      <p className="text-[9px] text-slate-500 tracking-tight font-mono mt-0.5 truncate">{c.email}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-purple-650 border-purple-500 text-white' : 'border-slate-800 bg-slate-950'
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
            <span>Envois d'Emails :</span>
            <span className="text-white font-bold">{selectedContacts.length} / {contactsWithEmail.length}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mb-3 font-mono">
            <span>Coût estimé :</span>
            <span className="text-purple-400 font-bold">{totalCost.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="text-[10px] text-slate-500 text-center italic leading-tight">
            Tarif standard SaaS : 10 FCFA par transmission validée.
          </div>
        </div>
      </div>
    </div>
  );
}
