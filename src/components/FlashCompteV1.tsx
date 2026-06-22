import React, { useState } from 'react';
import { 
  Zap, 
  User, 
  ArrowRight, 
  Coins, 
  Globe, 
  Link as LinkIcon, 
  Copy, 
  Eye, 
  Info, 
  Lock, 
  Unlock, 
  X, 
  FileText, 
  Mail, 
  Smartphone,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';
import { SimulatedTransfer, TransferType, SimulatedEmail } from '../types';
import { saveTransferToDb } from '../lib/firebase';

interface FlashCompteV1Props {
  onGenerateTransfer: (transfer: Omit<SimulatedTransfer, 'id' | 'createdAt' | 'generatedUrl' | 'isCompleted'>) => SimulatedTransfer;
  onCreateToast: (message: string) => void;
  setActiveTab: (tab: string) => void;
  setLiveSimulationTx: (transfer: SimulatedTransfer) => void;
  transfers: SimulatedTransfer[];
  onUpdatePercentages: (id: string, start: number, stop: number, message: string) => void;
  onSetBlockedState: (id: string, isBlocked: boolean) => void;
  deductBalance: (amount: number) => void;
  balance: number;
  onDeleteTransfer: (id: string) => void;
}

export default function FlashCompteV1({ 
  onGenerateTransfer, 
  onCreateToast, 
  setActiveTab,
  setLiveSimulationTx,
  transfers,
  onUpdatePercentages,
  onSetBlockedState,
  deductBalance,
  balance,
  onDeleteTransfer
}: FlashCompteV1Props) {
  
  // FORM 1: CREATE CLIENT ACCESS
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [country, setCountry] = useState('France (+33)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState('Français');

  const [senderBank, setSenderBank] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR (€)');
  const [startPercentage, setStartPercentage] = useState(15);
  const [stopPercentage, setStopPercentage] = useState(85);
  const [customMessage, setCustomMessage] = useState('Virement en attente d\'approbation intermédiaire.');

  const [emailAlert, setEmailAlert] = useState(true);
  const [smsAlert, setSmsAlert] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [createdTx, setCreatedTx] = useState<SimulatedTransfer | null>(null);

  // Dispatch choices state
  const [dispatchTarget, setDispatchTarget] = useState<'credentials' | 'unlock' | null>(null);
  const [apiSimStep, setApiSimStep] = useState<string[]>([]);
  const [apiSimRunning, setApiSimRunning] = useState(false);
  const [apiSimSuccess, setApiSimSuccess] = useState(false);

  const handleActionOpenUrl = (url: string, toastMsg: string) => {
    window.open(url, '_blank');
    onCreateToast(toastMsg);
    
    // Also save in-app simulated email so that when they open the page, the user can indeed see they received it!
    if (createdTx) {
      const isCredentials = dispatchTarget === 'credentials';
      const brandNewEmail: SimulatedEmail = {
        id: `mail-${Math.floor(10000 + Math.random() * 90000)}`,
        sender: 'conformite@transferwireworld.com',
        recipient: createdTx.email,
        subject: isCredentials ? `🔑 Vos identifiants de connexion TransferWire` : `⚠️ Rapprochement Règlementaire : Code de déblocage`,
        body: isCredentials ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0F62FE; color: #ffffff; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: bold;">TRANSFERWIRE SECURE ACCESS</h1>
            </div>
            <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
              <p>Bonjour <strong>${createdTx.firstName} ${createdTx.lastName}</strong>,</p>
              <p>Vos accès sécurisés ont été configurés avec l'habilitation de conformité pour la consultation interbancaire.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Lien de connexion direct :</strong><br/><a href="${createdTx.generatedUrl}" target="_blank" style="color: #0F62FE; font-weight: bold; word-break: break-all;">${createdTx.generatedUrl}</a></p>
                <p style="margin: 0 0 8px 0;"><strong>E-mail :</strong> <code>${createdTx.email}</code></p>
                <p style="margin: 0;"><strong>Code PIN d'accès :</strong> <strong style="color: #0F62FE; font-size: 16px;">${createdTx.codePin}</strong></p>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
                🛡️ Cet e-mail est confidentiel. Ne partagez jamais vos identifiants ou votre code de sécurité avec des tiers.
              </p>
            </div>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #b91c1c; color: #ffffff; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: bold;">CONFORMITÉ INTERBANCAIRE</h1>
            </div>
            <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
              <p>Bonjour <strong>${createdTx.firstName} ${createdTx.lastName}</strong>,</p>
              <p>Dans le cadre des contrôles réglementaires BCEAO/SWIFT, votre virement est consigné à <strong>${createdTx.stopPercentage}%</strong>.</p>
              <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #991b1b; font-weight: bold; uppercase;">Code de déblocage de sécurité (OTP) :</p>
                <strong style="color: #b91c1c; font-size: 24px; letter-spacing: 2px;">${createdTx.otpCode || 'NON DEFINI'}</strong>
              </div>
              <p>Renseignez ce code d'accréditation sur l'interface sécurisée de votre espace personnel pour libérer les fonds en transit réglementaire.</p>
            </div>
          </div>
        `,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: 'SUCCESS'
      };
      const currentEmails = createdTx.emails || [];
      createdTx.emails = [brandNewEmail, ...currentEmails];
      saveTransferToDb(createdTx);
    }
  };

  const startApiSimulation = (tx: SimulatedTransfer, type: 'credentials' | 'unlock') => {
    if (apiSimRunning) return;
    setApiSimRunning(true);
    setApiSimSuccess(false);
    setApiSimStep(["[1/4] Initialisation du pont de routage API..."]);

    setTimeout(() => {
      setApiSimStep(prev => [...prev, "[2/4] Connexion sécurisée aux serveurs Resend / SendGrid et passerelle SMS... ✅"]);
    }, 800);

    setTimeout(() => {
      setApiSimStep(prev => [...prev, "[3/4] Requête d'envoi émise aux opérateurs Telecom et SMTP... ✅"]);
    }, 1500);

    setTimeout(() => {
      setApiSimStep(prev => [...prev, "[4/4] Ping de détection et livraison réussie au destinataire ! ✅"]);
      
      // Persist simulated email inside client's simulated inbox automatically
      if (type === 'credentials') {
        const brandNewEmail: SimulatedEmail = {
          id: `mail-${Math.floor(10000 + Math.random() * 90000)}`,
          sender: 'conformite@transferwireworld.com',
          recipient: tx.email,
          subject: `🔑 Vos identifiants de connexion TransferWire`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #0F62FE; color: #ffffff; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold;">TRANSFERWIRE SECURE ACCESS</h1>
              </div>
              <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
                <p>Bonjour <strong>${tx.firstName} ${tx.lastName}</strong>,</p>
                <p>Vos accès sécurisés ont été configurés avec l'habilitation de conformité pour la consultation interbancaire.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Lien de connexion direct :</strong><br/><a href="${tx.generatedUrl}" target="_blank" style="color: #0F62FE; font-weight: bold; word-break: break-all;">${tx.generatedUrl}</a></p>
                  <p style="margin: 0 0 8px 0;"><strong>E-mail :</strong> <code>${tx.email}</code></p>
                  <p style="margin: 0;"><strong>Code PIN d'accès :</strong> <strong style="color: #0F62FE; font-size: 16px;">${tx.codePin}</strong></p>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
                  🛡️ Cet e-mail est confidentiel. Ne partagez jamais vos identifiants ou votre code de sécurité avec des tiers.
                </p>
              </div>
            </div>
          `,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'SUCCESS'
        };
        const currentEmails = tx.emails || [];
        tx.emails = [brandNewEmail, ...currentEmails];
        saveTransferToDb(tx);
      } else {
        const brandNewEmail: SimulatedEmail = {
          id: `mail-${Math.floor(10000 + Math.random() * 90000)}`,
          sender: 'conformite@transferwireworld.com',
          recipient: tx.email,
          subject: `⚠️ Rapprochement Règlementaire : Code de déblocage`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #b91c1c; color: #ffffff; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold;">CONFORMITÉ INTERBANCAIRE</h1>
              </div>
              <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
                <p>Bonjour <strong>${tx.firstName} ${tx.lastName}</strong>,</p>
                <p>Dans le cadre des contrôles réglementaires BCEAO/SWIFT, votre virement est consigné à <strong>${tx.stopPercentage}%</strong>.</p>
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #991b1b; font-weight: bold; uppercase;">Code de déblocage de sécurité (OTP) :</p>
                  <strong style="color: #b91c1c; font-size: 24px; letter-spacing: 2px;">${tx.otpCode || 'NON DEFINI'}</strong>
                </div>
                <p>Renseignez ce code d'accréditation sur l'interface sécurisée de votre espace personnel pour libérer les fonds en transit réglementaire.</p>
              </div>
            </div>
          `,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'SUCCESS'
        };
        const currentEmails = tx.emails || [];
        tx.emails = [brandNewEmail, ...currentEmails];
        saveTransferToDb(tx);
      }

      setApiSimRunning(false);
      setApiSimSuccess(true);
      onCreateToast("Routage API sécurisé simulé (Twilio & Resend API) complété ! Le client recevra ses identifiants.");
    }, 2500);
  };

  const handleSendCredentials = (createdTx: SimulatedTransfer) => {
    setDispatchTarget('credentials');
    setApiSimSuccess(false);
    setApiSimRunning(false);
    setApiSimStep([]);
  };

  const handleSendUnlockCode = (createdTx: SimulatedTransfer) => {
    setDispatchTarget('unlock');
    setApiSimSuccess(false);
    setApiSimRunning(false);
    setApiSimStep([]);
  };

  // FORM 2: UPDATE ACCESS
  const [selectedUpdateId, setSelectedUpdateId] = useState('');
  const [updateStartPercent, setUpdateStartPercent] = useState(15);
  const [updateStopPercent, setUpdateStopPercent] = useState(85);
  const [updateMessage, setUpdateMessage] = useState('');

  // FORM 3: BLOCK / UNBLOCK ACCESS
  const [selectedBlockId, setSelectedBlockId] = useState('');

  // Search input for list filter
  const [searchTerm, setSearchTerm] = useState('');

  // Filter V1 transfers
  const v1Transfers = transfers.filter(t => t.version === 'V1');
  const filteredV1Transfers = v1Transfers.filter(t => 
    t.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trigger loading details of update
  const handleSelectUpdateTarget = (id: string) => {
    setSelectedUpdateId(id);
    const target = transfers.find(t => t.id === id);
    if (target) {
      setUpdateStartPercent(target.startPercentage);
      setUpdateStopPercent(target.stopPercentage);
      setUpdateMessage(target.customMessage);
    } else {
      setUpdateStartPercent(15);
      setUpdateStopPercent(85);
      setUpdateMessage('');
    }
  };

  const handleCreateAccess = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim() || !firstName.trim() || !phone.trim() || !email.trim() || !address.trim() || !amount.trim()) {
      alert('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Le montant à créditer doit être supérieur à zéro.');
      return;
    }

    // Cost computation: 3000 base + 1000 if SMS alert is selected (Total credits in image is 4000)
    const baseCost = 3000;
    const additionalCost = smsAlert ? 1000 : 0;
    const totalCost = baseCost + additionalCost;

    if (balance < totalCost) {
      alert(`Solde de crédits d'évaluation insuffisant. ${totalCost} crédits sont requis pour générer cet accès client.`);
      return;
    }

    // Deduct cost from balance
    deductBalance(totalCost);

    // Form random pin code (like 117850 in image)
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const recipientName = `${firstName.trim()} ${lastName.trim()}`;
    const mappedBank = senderBank.trim() || 'Ecobank Côte d\'Ivoire';
    const txRef = `FTX-${Math.floor(100000 + Math.random() * 900000)}`;

    const transfer = onGenerateTransfer({
      version: 'V1',
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      country,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      language,
      senderBank: mappedBank,
      amount: parsedAmount,
      currency,
      startPercentage: Number(startPercentage),
      stopPercentage: Number(stopPercentage),
      customMessage: customMessage.trim(),
      emailAlert,
      smsAlert,
      codePin: pin,
      isBlocked: false,
      senderName: 'Trésorerie Digitale SA',
      recipientName,
      recipientBank: mappedBank,
      recipientAccount: `N° ${Math.floor(10000000 + Math.random() * 90000000)}`,
      type: 'BANK_WIRE',
      reference: txRef,
      status: 'SUCCESS',
      delaySeconds: 4,
      otpCode: '',
      feePercent: 0.1
    });

    setCreatedTx(transfer);
    setModalOpen(true);
    onCreateToast('Succès : Accès client Flash V1 créé et provisionné !');

    // Reset Form fields
    setLastName('');
    setFirstName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setAmount('');
  };

  const applyUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpdateId) {
      alert('Veuillez sélectionner un accès client dans la liste.');
      return;
    }
    onUpdatePercentages(
      selectedUpdateId, 
      Number(updateStartPercent), 
      Number(updateStopPercent), 
      updateMessage
    );
    setSelectedUpdateId('');
    setUpdateMessage('');
  };

  const handleCopyToClipboard = (text: string, toastMessage: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        onCreateToast(toastMessage);
        return;
      }
    } catch (e) {
      console.warn("Navigator clipboard failed, using fallback:", e);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        onCreateToast(toastMessage);
      } else {
        onCreateToast("Erreur lors de la copie du texte.");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      onCreateToast("Sélectionnez le texte manuellement pour copier.");
    }
  };

  const getSelectedClientInfoForUpdate = () => {
    if (!selectedUpdateId) return null;
    return transfers.find(t => t.id === selectedUpdateId);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Title & Banner Header block */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-500/10 p-3 rounded-2xl text-green-400 border border-green-500/10">
            <Zap className="fill-green-400/20" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-display">Créer un accès flash compte client v1</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Configurez instantanément l'Espace bancaire privé d'un client et fournissez-lui des identifiants sécurisés (Email & Code Pin) configurables en temps réel pour évaluer ses virements.
            </p>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 px-5 text-center shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block">Consommation Standard</span>
          <span className="text-lg font-mono font-black text-white">4 000 <span className="text-xs text-emerald-400 font-bold uppercase">Créds</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: PRIMARY REGISTRATION FORM (3 cols width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-4 mb-5">
              <span className="text-xs font-mono bg-blue-500/14 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">ETAPE 1</span>
              <h3 className="text-sm font-bold text-slate-200">Génération des Identifiants & Solde d'évaluation</h3>
            </div>

            <form onSubmit={handleCreateAccess} className="space-y-6">
              
              {/* Client Info Block */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider flex items-center gap-2">
                  <User size={12} /> INFORMATIONS SUR LE CLIENT :
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Prénom <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pays de résidence <span className="text-red-500 font-bold">*</span></label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="France (+33)">🇫🇷 France (+33)</option>
                      <option value="Belgique (+32)">🇧🇪 Belgique (+32)</option>
                      <option value="Suisse (+41)">🇨🇭 Suisse (+41)</option>
                      <option value="Luxembourg (+352)">🇱🇺 Luxembourg (+352)</option>
                      <option value="Allemagne (+49)">🇩🇪 Allemagne (+49)</option>
                      <option value="Espagne (+34)">🇪🇸 Espagne (+34)</option>
                      <option value="Italie (+39)">🇮🇹 Italie (+39)</option>
                      <option value="Royaume-Uni (+44)">🇬🇧 Royaume-Uni (+44)</option>
                      <option value="Portugal (+351)">🇵🇹 Portugal (+351)</option>
                      <option value="Roumanie (+40)">🇷🇴 Roumanie (+40)</option>
                      <option value="Hongrie (+36)">🇭🇺 Hongrie (+36)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Numéro de téléphone <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Adresse e-mail <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Langue d'affichage du compte <span className="text-red-500 font-bold">*</span></label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="Français">Français</option>
                      <option value="English">English</option>
                      <option value="Deutsch">Deutsch</option>
                      <option value="Español">Español</option>
                      <option value="Português">Português</option>
                      <option value="Italiano">Italiano</option>
                      <option value="Belgique (NL)">Nederlands (Belgique)</option>
                      <option value="Română">Română</option>
                      <option value="Magyar">Magyar</option>
                      <option value="Polski">Polski</option>
                      <option value="العربية">العربية (Arabe)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Adresse complète de résidence <span className="text-red-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Capital & Virement configuration */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider flex items-center gap-2">
                  <Coins size={12} /> SOLDE DU COMPTE ET VIREMENT :
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">
                      Banque émettrice des virements entrants <span className="text-slate-600 font-normal italic">(Facultatif)</span>
                    </label>
                    <input
                      type="text"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Montant à créditer <span className="text-red-500 font-bold">*</span></label>
                      <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Devise d'affichage <span className="text-red-500 font-bold">*</span></label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                      >
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="RON (lei)">RON (lei) - Leu</option>
                        <option value="HUF (Ft)">HUF (Ft) - Forint hongrois</option>
                        <option value="BRL (R$)">BRL (R$) - Real brésilien</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pourcentage de départ <span className="text-red-500 font-bold">*</span> (0 à 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={startPercentage}
                      onChange={(e) => setStartPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pourcentage d'arrêt <span className="text-red-500 font-bold">*</span> (0 à 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={stopPercentage}
                      onChange={(e) => setStopPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Message d'arrêt à la fin du virement <span className="text-red-500 font-bold">*</span></label>
                  <textarea
                    required
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-3 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 h-20 resize-none"
                    placeholder="Entrez le message indicatif de blocage de fonds ou d'acheminement..."
                  />
                </div>
              </div>

              {/* Alert Blocks */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-4 flex gap-3 text-xs leading-normal text-blue-400">
                  <Mail className="shrink-0 text-blue-400" size={16} />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wide font-sans mb-1 text-white">Alerte par e-mail (Obligatoire) :</strong>
                    Les alertes par e-mail de transfert et de mise à jour système sont automatiquement adressées au destinataire. NB : Intégrées et totalement gratuites de base.
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-3">
                    <Smartphone className="shrink-0 text-slate-500" size={18} />
                    <div className="text-xs">
                      <strong className="block text-white">Alerte par SMS (Optionnel / Faculté) :</strong>
                      <span className="text-slate-500">Alerte le client en direct par SMS automatique à la création de son code PIN.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 border border-amber-500/10 rounded">
                      +1000 CRÉDS
                    </span>
                    <button
                      type="button"
                      onClick={() => setSmsAlert(!smsAlert)}
                      className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${
                        smsAlert ? 'bg-green-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`w-5.5 h-5.5 bg-white rounded-full transition-transform duration-250 ${
                        smsAlert ? 'translate-x-5.5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-slate-950 font-black rounded-2xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 transition-all duration-200"
              >
                Créer l'accès client ({smsAlert ? '5000' : '4000'} Crédits) <ArrowRight size={14} />
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: MODIFICTION, LOCKING SYSTEM, ACTIVE CLIENTS LIST (2 cols width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* BLOCK 1: UPDATE PARAMETERS (MODIFIER POURCENTAGE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <RefreshCw className="text-blue-400 animate-spin-slow" size={16} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modifier un accès client v1</h4>
            </div>

            <form onSubmit={applyUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Sélectionner l'accès client <span className="text-red-500">*</span></label>
                <select
                  value={selectedUpdateId}
                  onChange={(e) => handleSelectUpdateTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="">-- Vos Flash Compte Client(s) Créés --</option>
                  {v1Transfers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.recipientName} ({t.id} - {t.amount} {t.currency})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUpdateId && (
                <>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1">Action(s) possible(s) sur l'accès choisi *</label>
                    <select
                      readOnly
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 pointer-events-none select-none font-medium"
                    >
                      <option>Modifier les pourcentages et le message</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1">Départ *</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={updateStartPercent}
                        onChange={(e) => setUpdateStartPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1">Arrêt *</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={updateStopPercent}
                        onChange={(e) => setUpdateStopPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Message à afficher *</label>
                    <textarea
                      required
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-300 h-16 resize-none"
                    />
                  </div>

                  {/* Real-time Update Recap Block */}
                  <div className="bg-blue-950/10 border border-blue-900/20 rounded-2xl p-3.5 text-[11px] font-mono text-slate-400 space-y-1">
                    <span className="text-white font-bold block mb-1.5 flex items-center gap-1.5">
                      <FileText size={12} className="text-blue-400" /> Récapitulatif de la mise à jour :
                    </span>
                    <div>⚬ Accès client à corriger : <strong className="text-slate-200">{getSelectedClientInfoForUpdate()?.recipientName || 'N/A'}</strong></div>
                    <div>⚬ Nouveau pourcentage de départ : <strong className="text-blue-400">{updateStartPercent}%</strong></div>
                    <div>⚬ Nouveau pourcentage d'arrêt : <strong className="text-amber-500">{updateStopPercent}%</strong></div>
                    <div>⚬ Nouveau message d'arrêt : <span className="text-slate-300 block bg-slate-950 p-2 rounded border border-slate-850 mt-1 italic">"{updateMessage || 'N/A'}"</span></div>
                    <p className="text-[9px] text-red-400/80 mt-1.5 uppercase font-bold leading-normal">
                      NB : Un nouveau code de déblocage du virement est généré automatiquement à chaque mise à jour.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-lg shadow-blue-500/10"
                  >
                    Mise à jour →
                  </button>
                </>
              )}
            </form>
          </div>

          {/* BLOCK 2: LOCK / UNLOCK SYSTEM (BLOQUER ET DEBLOQUER) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Lock className="text-amber-500" size={16} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bloquer ou débloquer un accès client v1</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Sélectionner l'accès client <span className="text-red-500">*</span></label>
                <select
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="">-- Vos Flash Compte Client(s) Créés --</option>
                  {v1Transfers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.recipientName} ({t.id} - {t.isBlocked ? 'BLOQUÉ' : 'OUTILS ACTIF'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBlockId && (
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSetBlockedState(selectedBlockId, true);
                      setSelectedBlockId('');
                    }}
                    className="py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-[11px] uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10 transition"
                  >
                    <Lock size={12} /> Bloquer accès
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetBlockedState(selectedBlockId, false);
                      setSelectedBlockId('');
                    }}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 transition"
                  >
                    <Unlock size={12} /> Débloquer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* BLOCK 3: CREATED LINKS HISTORY REEL (LISTE DES ACCES) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-green-400 animate-pulse" size={16} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Liste des accès v1 ({v1Transfers.length})
                </h4>
              </div>
            </div>

            {/* Quick search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Search size={12} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600"
                placeholder="Chercher par nom..."
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredV1Transfers.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-6">Aucun accès client configuré sous la version V1 pour le moment.</p>
              ) : (
                filteredV1Transfers.map(t => (
                  <div key={t.id} className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-white truncate block max-w-[120px]">{t.recipientName}</strong>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none ${
                        t.isBlocked 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {t.isBlocked ? 'Flash Compte bloqué' : 'Flash Compte actif'}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 truncate max-w-[140px]">{t.generatedUrl}</span>
                        <button
                          onClick={() => handleCopyToClipboard(t.generatedUrl, 'Lien de simulation copié !')}
                          className="text-blue-400 hover:text-white transition p-1 cursor-pointer bg-slate-900 border border-slate-800 rounded"
                          title="Copier le lien"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                      <div className="text-slate-500 mt-2 text-[9px]">
                        généré le {new Date(t.createdAt).toLocaleDateString('fr-FR')} à {new Date(t.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} UTC+0
                      </div>
                    </div>

                    {/* Quick actions row */}
                    <div className="flex gap-1.5 pt-1 border-t border-slate-900">
                      <button
                        onClick={() => setLiveSimulationTx(t)}
                        className="py-1 px-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye size={10} /> Tester
                      </button>
                      <button
                        onClick={() => {
                          setCreatedTx(t);
                          setModalOpen(true);
                        }}
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[9px] font-bold transition cursor-pointer"
                      >
                        Créds Info
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL SYSTEM: POPUP DETAILS "DÉTAILS DE L'ACCÈS CLIENT" (MATCHES THE SCREENSHOT WITH BLUE & YELLOW BTNS) */}
      {modalOpen && createdTx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white text-slate-800 rounded-3xl p-6 relative shadow-2xl animate-scale-up border border-slate-200 my-8 max-h-[92vh] overflow-y-auto">
            
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 font-sans">Détails de l'accès client</h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setDispatchTarget(null);
                  setApiSimStep([]);
                  setApiSimRunning(false);
                  setApiSimSuccess(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Immersive Helper Grey Dialog Card from screenshot */}
            <div className="bg-slate-105 border border-slate-200/60 rounded-2xl p-4 text-xs text-slate-705 leading-relaxed space-y-3 font-sans">
              <p>
                Utilisez le <strong className="text-slate-900 font-extrabold">lien de connexion</strong> et les <strong className="text-slate-900 font-extrabold">identifiants</strong> définis ci-dessous pour la connexion à l'accès flash compte client.
              </p>

              {/* Login Link Box */}
              <div className="space-y-1">
                <span className="text-slate-700 font-extrabold block text-[11px]">Lien de connexion :</span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <span className="text-slate-800 font-mono select-all truncate shrink">{createdTx.generatedUrl}</span>
                  <button
                    onClick={() => handleCopyToClipboard(createdTx.generatedUrl, 'URL de connexion client copiée !')}
                    className="p-1.5 bg-slate-500 hover:bg-slate-600 rounded-lg text-white transition cursor-pointer shrink-0 ml-2"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {/* Email Box */}
              <div className="space-y-1">
                <span className="text-slate-700 font-extrabold block text-[11px]">Adresse e-mail :</span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <span className="text-slate-800 font-bold select-all truncate shrink">{createdTx.email}</span>
                  <button
                    onClick={() => handleCopyToClipboard(createdTx.email, 'Adresse e-mail copiée !')}
                    className="p-1.5 bg-slate-500 hover:bg-slate-600 rounded-lg text-white transition cursor-pointer shrink-0 ml-2"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {/* PIN Box */}
              <div className="space-y-1">
                <span className="text-slate-700 font-extrabold block text-[11px]">Code Pin :</span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <span className="text-slate-900 font-mono font-black select-all text-sm">{createdTx.codePin}</span>
                  <button
                    onClick={() => handleCopyToClipboard(createdTx.codePin, 'Code PIN copié !')}
                    className="p-1.5 bg-slate-500 hover:bg-slate-600 rounded-lg text-white transition cursor-pointer shrink-0 ml-2"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

             {/* Multichannel send panel implementation */}
             {!dispatchTarget ? (
               <div className="grid grid-cols-2 gap-2 text-center text-[10px] sm:text-[11px] font-sans my-4">
                 <button
                   type="button"
                   onClick={() => handleSendCredentials(createdTx)}
                   className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center text-center cursor-pointer leading-tight"
                 >
                   Envoyer les identifiants de connexion au client par e-mail ✉
                 </button>
                 <button
                   type="button"
                   onClick={() => handleSendUnlockCode(createdTx)}
                   className="p-3 bg-[#FCB316] hover:bg-[#E09A0A] text-slate-900 font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center text-center cursor-pointer leading-tight"
                 >
                   Envoyer le code de déblocage du virement au client par e-mail ✉
                 </button>
               </div>
             ) : (
               <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-4 font-sans space-y-3">
                 <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                   <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                     🚀 Canal d'expédition : <strong className="text-blue-600 uppercase">{dispatchTarget === 'credentials' ? 'Identifiants d\'accès' : 'Code de déblocage (OTP)'}</strong>
                   </span>
                   <button 
                     onClick={() => {
                       setDispatchTarget(null);
                       setApiSimStep([]);
                       setApiSimSuccess(false);
                     }}
                     className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                   >
                     ← Retour
                   </button>
                 </div>

                 {/* Formulating URLs inside React */}
                 {(() => {
                   const isCreds = dispatchTarget === 'credentials';
                   const subjectText = isCreds 
                     ? "🔑 Vos identifiants de connexion TransferWire" 
                     : "⚠️ Rapprochement Règlementaire : Code de déblocage";

                   const messageText = isCreds
                     ? `Bonjour ${createdTx.firstName} ${createdTx.lastName},\n\n` +
                       `Voici vos identifiants sécurisés pour vous connecter à votre espace bancaire TransferWire :\n\n` +
                       `🔗 Lien de connexion : ${createdTx.generatedUrl}\n` +
                       `📧 Identifiant : ${createdTx.email}\n` +
                       `🔑 Code PIN d'accès : ${createdTx.codePin}\n\n` +
                       `Conservez précieusement ces identifiants de sécurité.\n\n` +
                       `Cordialement,\n` +
                       `Le Service de la Conformité`
                     : `Bonjour ${createdTx.firstName} ${createdTx.lastName},\n\n` +
                       `Votre virement de compensation monétaire est bloqué à ${createdTx.stopPercentage}% de sa progression d'acheminement.\n` +
                       `Pour procéder à la libération définitive de vos fonds, veuillez introduire le code OTP ci-dessous :\n\n` +
                       `⚡ Code de déblocage (OTP) : ${createdTx.otpCode || 'NON DEFINI'}\n\n` +
                       `Introduisez ce code d'accréditation réglementaire sur l'interface sécurisée de votre espace client.\n\n` +
                       `Cordialement,\n` +
                       `La Direction de la Conformité`;

                   const mailtoUrl = `mailto:${createdTx.email}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(messageText)}`;
                   const cleanPhone = createdTx.phone ? createdTx.phone.replace(/[^0-9+]/g, '') : '';
                   const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageText)}`;
                   
                   const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
                   const smsSeparator = isIos ? '&' : '?';
                   const smsUrl = `sms:${cleanPhone}${smsSeparator}body=${encodeURIComponent(messageText)}`;

                   return (
                     <div className="space-y-3">
                       <p className="text-[11px] text-slate-500 leading-normal">
                         Sélectionnez un canal pour acheminer instantanément le contenu à <strong className="text-slate-800">{createdTx.firstName} {createdTx.lastName}</strong> ({createdTx.phone || createdTx.email}) :
                       </p>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {/* Option 1: Email Direct */}
                         <button
                           onClick={() => handleActionOpenUrl(mailtoUrl, "Modèle de mail ouvert avec succès dans votre application de messagerie !")}
                           className="flex items-center gap-2 p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition text-left cursor-pointer group"
                         >
                           <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition shrink-0">
                             <Mail size={14} />
                           </div>
                           <div>
                             <span className="block text-xs font-bold text-slate-900 leading-tight">E-mail (Mailto)</span>
                             <span className="block text-[9.5px] text-slate-500 font-mono truncate max-w-[120px]">{createdTx.email}</span>
                           </div>
                         </button>

                         {/* Option 2: WhatsApp Direct */}
                         <button
                           onClick={() => handleActionOpenUrl(whatsappUrl, "WhatsApp ouvert avec les identifiants pré-remplis pour envoi instantané !")}
                           className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition text-left cursor-pointer group"
                         >
                           <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-200 transition shrink-0">
                             <Smartphone size={14} />
                           </div>
                           <div>
                             <span className="block text-xs font-bold text-slate-900 leading-tight">WhatsApp Direct</span>
                             <span className="block text-[9.5px] text-slate-500 font-mono truncate max-w-[120px]">{createdTx.phone}</span>
                           </div>
                         </button>

                         {/* Option 3: SMS Mobile */}
                         <button
                           onClick={() => handleActionOpenUrl(smsUrl, "Messagerie SMS système ouverte avec le message prêt à l'envoi !")}
                           className="flex items-center gap-2 p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition text-left cursor-pointer group"
                         >
                           <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition shrink-0">
                             <Smartphone size={14} />
                           </div>
                           <div>
                             <span className="block text-xs font-bold text-slate-900 leading-tight">SMS Ligne Mobile</span>
                             <span className="block text-[9.5px] text-slate-500 font-mono truncate max-w-[120px]">{createdTx.phone}</span>
                           </div>
                         </button>

                         {/* Option 4: Background API simulation */}
                         <button
                           onClick={() => startApiSimulation(createdTx, dispatchTarget)}
                           disabled={apiSimRunning}
                           className={`flex items-center gap-2 p-2.5 border rounded-xl text-left transition shrink-0 ${
                             apiSimRunning 
                               ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                               : 'bg-indigo-900/10 border-indigo-200 hover:border-indigo-400 text-indigo-900 hover:bg-indigo-900/20 cursor-pointer'
                           }`}
                         >
                           <div className={`p-1.5 rounded-lg shrink-0 ${apiSimRunning ? 'bg-slate-200 text-slate-400' : 'bg-indigo-200 text-indigo-700'}`}>
                             <RefreshCw size={14} className={apiSimRunning ? 'animate-spin' : ''} />
                           </div>
                           <div>
                             <span className="block text-xs font-extrabold leading-tight">Routage API Automatique</span>
                             <span className="block text-[9.5px] font-sans font-semibold">Simuler Twilio & Resend ⚡</span>
                           </div>
                         </button>
                       </div>

                       {/* API Simulator Terminal view */}
                       {(apiSimRunning || apiSimStep.length > 0) && (
                         <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-indigo-400 leading-normal space-y-1 block animate-scale-up">
                           <div className="flex items-center justify-between text-slate-500 border-b border-slate-900 pb-1.5 mb-1.5 uppercase font-bold text-[8.5px]">
                             <span>Terminal de routage API - Simulation PCI-DSS</span>
                             <span className="animate-pulse flex items-center gap-1 text-indigo-400">● ACTIF</span>
                           </div>
                           {apiSimStep.map((step, idx) => (
                             <div key={idx} className="block">{step}</div>
                           ))}
                           {apiSimRunning && (
                             <div className="flex items-center gap-2 text-slate-500 italic mt-1 bg-slate-900/50 py-1 px-1.5 rounded">
                               <RefreshCw size={10} className="animate-spin text-indigo-400 shrink-0" />
                               <span>Opération réseau du serveur en cours...</span>
                             </div>
                           )}
                           {apiSimSuccess && (
                             <div className="text-emerald-400 font-extrabold mt-2 border-t border-emerald-950/50 pt-1.5 flex items-center gap-1 uppercase text-[9px]">
                               <span>✔️ ROUTAGE TERMINÉ AVEC SUCCÈS. LIVRAISON OK.</span>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   );
                 })()}
               </div>
             )}

            {/* Client profile details card exactly as on screenshot */}
            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-655 font-sans">
              <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px] block mb-2 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" /> Informations sur le client :
              </span>
              
              <div className="space-y-2 pl-1.5">
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Prénom Nom :</span>
                  <strong className="text-slate-950 text-sm font-sans block">{createdTx.firstName} {createdTx.lastName}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Adresse e-mail :</span>
                  <strong className="text-slate-950 text-sm font-sans block">{createdTx.email}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Numéro de téléphone :</span>
                  <strong className="text-slate-950 text-sm font-mono block">{createdTx.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Pays :</span>
                  <strong className="text-slate-950 text-sm font-sans block">{createdTx.country}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Adresse de résidence :</span>
                  <strong className="text-slate-900 text-[11px] leading-relaxed block font-sans">{createdTx.address}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Langue du client :</span>
                  <strong className="text-slate-950 text-xs font-sans block uppercase">
                    {createdTx.language === 'English' ? 'EN (Code ISO)' :
                     createdTx.language === 'Deutsch' ? 'DE (Code ISO)' :
                     createdTx.language === 'Español' ? 'ES (Code ISO)' :
                     createdTx.language === 'Hungarian' || createdTx.language?.toLowerCase().includes('hu') ? 'HU (Code ISO)' : 'FR (Code ISO)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Account progress metrics exactly as on screenshot */}
            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-655 font-sans mt-4">
              <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px] block mb-2 flex items-center gap-1.5">
                <Coins size={13} className="text-slate-400" /> Solde du compte et virement :
              </span>

              <div className="space-y-2 pl-1.5">
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Banque émettrice :</span>
                  <strong className="text-slate-950 text-sm font-sans block">{createdTx.senderBank || 'BCEAO Central Bank Sandbox'}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Solde du compte :</span>
                  <strong className="text-slate-950 text-base font-bold font-mono block text-emerald-700">
                    {createdTx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {
                      createdTx.currency.includes('XOF') || createdTx.currency.includes('XAF') ? 'XOF' :
                      createdTx.currency.includes('EUR') ? 'EUR' :
                      createdTx.currency.includes('USD') ? 'USD' : 
                      createdTx.currency.includes('HUF') ? 'Ft' : 'Ft'
                    }
                  </strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Pourcentage de départ du virement :</span>
                  <strong className="text-slate-950 text-sm font-mono block">{createdTx.startPercentage}%</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Pourcentage d'arrêt du virement :</span>
                  <strong className="text-slate-950 text-sm font-mono block">{createdTx.stopPercentage}%</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Message à affiché :</span>
                  <strong className="text-slate-900 text-[11px] leading-relaxed block font-sans italic">{createdTx.customMessage}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono mb-1">Code de déblocage du virement :</span>
                  <div className="inline-flex items-center gap-2 bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-lg select-all">
                    <span>{createdTx.otpCode || createdTx.codePin}</span>
                    <button
                      onClick={() => handleCopyToClipboard(createdTx.otpCode || createdTx.codePin, 'Code de déblocage copié !')}
                      className="p-1 hover:text-blue-400 rounded transition"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Code déjà utilisé :</span>
                  <span className="inline-block bg-orange-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded uppercase mt-1 tracking-wider">
                    NON
                  </span>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Alert Mail Pro :</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 mt-1 text-[11px]">
                    ✔️ Activé
                  </span>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Alert SMS Pro :</span>
                  <span className={`font-bold flex items-center gap-1 mt-1 text-[11px] ${createdTx.smsAlert ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {createdTx.smsAlert ? '✔️ Activé' : '❌ Désactivé'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Coût de création :</span>
                  <strong className="text-slate-950 text-xs block">4000 Crédits</strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Date de création :</span>
                  <strong className="text-slate-950 text-xs font-sans block block">
                    {new Date(createdTx.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })} à {new Date(createdTx.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit', minute: '2-digit'
                    })} UTC+0
                  </strong>
                </div>
                <div>
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Etat :</span>
                  <span className="inline-flex items-center gap-1 bg-emerald-55 text-emerald-700 font-extrabold text-[11px] px-3 py-1 rounded-full border border-emerald-250 mt-1.5 shadow-sm">
                    ✔️ Flash Compte actif
                  </span>
                </div>
              </div>
            </div>

            {/* Primary controls exactly as on screenshot including permanent delete link/button */}
            <div className="mt-6 pt-4 border-t border-slate-150 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous vraiment supprimer définitivement cet accès client ?')) {
                    onDeleteTransfer(createdTx.id);
                    setModalOpen(false);
                  }
                }}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs sm:text-sm cursor-pointer shadow-md transition flex items-center justify-center gap-1.5 shadow-red-500/10 uppercase"
              >
                Supprimer ce lien d'accès
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs uppercase cursor-pointer text-center transition"
              >
                Fermer l'Aperçu Administratif
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
