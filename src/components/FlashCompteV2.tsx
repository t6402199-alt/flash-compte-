import React, { useState } from 'react';
import { 
  ShieldAlert, 
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
  Sliders,
  Search
} from 'lucide-react';
import { SimulatedTransfer, TransferType } from '../types';

interface FlashCompteV2Props {
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

export default function FlashCompteV2({ 
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
}: FlashCompteV2Props) {
  
  // FORM 1: CREATE CLIENT ACCESS WITH SMART V2 PARAMS
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [country, setCountry] = useState('Sénégal (+221)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState('Français');

  const [senderBank, setSenderBank] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('FCFA (XOF)');
  const [startPercentage, setStartPercentage] = useState(20);
  const [stopPercentage, setStopPercentage] = useState(100);
  const [customMessage, setCustomMessage] = useState('Validation de sécurité interbancaire - Code OTP Requis.');

  // Smart V2 Advanced Gateway fields
  const [status, setStatus] = useState<'SUCCESS' | 'BLOCKED_OTP' | 'FRAUD_ALERT' | 'ACCOUNT_LOCKED'>('BLOCKED_OTP');
  const [delaySeconds, setDelaySeconds] = useState(6);
  const [otpCode, setOtpCode] = useState('448833');
  const [feePercent, setFeePercent] = useState(1);

  const [emailAlert, setEmailAlert] = useState(true);
  const [smsAlert, setSmsAlert] = useState(false);

  // Modal details state
  const [modalOpen, setModalOpen] = useState(false);
  const [createdTx, setCreatedTx] = useState<SimulatedTransfer | null>(null);

  // FORM 2: UPDATE ACCESS
  const [selectedUpdateId, setSelectedUpdateId] = useState('');
  const [updateStartPercent, setUpdateStartPercent] = useState(20);
  const [updateStopPercent, setUpdateStopPercent] = useState(100);
  const [updateMessage, setUpdateMessage] = useState('');

  // FORM 3: BLOCK / UNBLOCK
  const [selectedBlockId, setSelectedBlockId] = useState('');

  // Search input
  const [searchTerm, setSearchTerm] = useState('');

  // Filter V2 transfers
  const v2Transfers = transfers.filter(t => t.version === 'V2');
  const filteredV2Transfers = v2Transfers.filter(t => 
    t.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUpdateTarget = (id: string) => {
    setSelectedUpdateId(id);
    const target = transfers.find(t => t.id === id);
    if (target) {
      setUpdateStartPercent(target.startPercentage);
      setUpdateStopPercent(target.stopPercentage);
      setUpdateMessage(target.customMessage);
    } else {
      setUpdateStartPercent(20);
      setUpdateStopPercent(100);
      setUpdateMessage('');
    }
  };

  const handleCreateSmartAccess = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim() || !firstName.trim() || !phone.trim() || !email.trim() || !address.trim() || !amount.trim()) {
      alert('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Veuillez spécifier une valeur numérique pour le virement.');
      return;
    }

    // Cost: 4000 base + 1000 if SMS selected
    const baseCost = 4000;
    const additionalCost = smsAlert ? 1000 : 0;
    const totalCost = baseCost + additionalCost;

    if (balance < totalCost) {
      alert(`Solde de crédits d'évaluation insuffisant. ${totalCost} crédits de licence V2 sont requis.`);
      return;
    }

    // Deduct cost
    deductBalance(totalCost);

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const recipientName = `${firstName.trim()} ${lastName.trim()}`;
    const mappedBank = senderBank.trim() || 'Wave Sénégal S.A.';
    const txRef = `FTX2-${Math.floor(100000 + Math.random() * 900000)}`;

    const transfer = onGenerateTransfer({
      version: 'V2',
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
      senderName: 'Trésorerie Multilatérale Sarl',
      recipientName,
      recipientBank: mappedBank,
      recipientAccount: `N° ${Math.floor(10000000 + Math.random() * 90000000)}`,
      type: 'WAVE',
      reference: txRef,
      status, // smart behaviors
      delaySeconds,
      otpCode: status === 'BLOCKED_OTP' ? (otpCode.trim() || '448833') : '',
      feePercent
    });

    setCreatedTx(transfer);
    setModalOpen(true);
    onCreateToast('Succès : Accès intelligent Flash V2 créé avec conformité AML !');

    // Reset Form
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
      alert('Veuillez sélectionner un accès.');
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
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-400 border border-indigo-505/10">
            <ShieldAlert className="fill-indigo-400/20" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-display">Générateur Flash Compte V2 (Smart Gateway)</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Configurez des scénarios d'évaluation complexes avec l'Espace bancaire V2 bénéficiant de filtres anti-fraude, de jetons d'authentification forte 3D-Secure et de bypass réglementaire.
            </p>
          </div>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 px-5 text-center shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">Consommation Smart</span>
          <span className="text-lg font-mono font-black text-white">5 000 <span className="text-xs text-indigo-400 font-bold uppercase">Créds</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: PRIMARY REGISTRATION FORM (3 cols width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-4 mb-5">
              <span className="text-xs font-mono bg-indigo-500/14 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">ETAPE 1</span>
              <h3 className="text-sm font-bold text-slate-200">Créer un profil client V2 (Premium)</h3>
            </div>

            <form onSubmit={handleCreateSmartAccess} className="space-y-6">
              
              {/* Client Info Block */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider flex items-center gap-2">
                  <User size={12} /> INFORMATIONS SUR LE CLIENT PRO :
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom du destinataire <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
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
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
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
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="Sénégal (+221)">🇸🇳 Sénégal (+221)</option>
                      <option value="Côte d'Ivoire (+225)">🇨🇮 Côte d'Ivoire (+225)</option>
                      <option value="France (+33)">🇫🇷 France (+33)</option>
                      <option value="Mali (+223)">🇲🇱 Mali (+223)</option>
                      <option value="Bénin (+229)">🇧🇯 Bénin (+229)</option>
                      <option value="Togo (+228)">🇹🇬 Togo (+228)</option>
                      <option value="Burkina Faso (+226)">🇧🇫 Burkina Faso (+226)</option>
                      <option value="Niger (+227)">🇳🇪 Niger (+227)</option>
                      <option value="Cameroun (+237)">🇨🇲 Cameroun (+237)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Téléphone mobile direct <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Adresse e-mail bénéficiaire <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Langue de l'espace bancaire <span className="text-red-500 font-bold">*</span></label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="Français">Français</option>
                      <option value="English">English</option>
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
                    className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Capital & Virement / Gateway choice */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider flex items-center gap-2">
                  <Coins size={12} /> SOLDE COMPTABLES ET GESTION VIR VIRUELLES :
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">
                      Raison d'affichage de l'expéditeur
                    </label>
                    <input
                      type="text"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500"
                      placeholder=""
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Fonds à créditer <span className="text-red-500 font-bold">*</span></label>
                      <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Dévise monétaire <span className="text-red-500 font-bold">*</span></label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                      >
                        <option value="FCFA (XOF)">FCFA XOF (F.CFA)</option>
                        <option value="FCFA (XAF)">FCFA XAF (F.CFA)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="RON (lei)">RON (lei) - Leu</option>
                        <option value="BRL (R$)">BRL (R$) - Real brésilien</option>
                        <option value="HUF (Ft)">HUF (Ft) - Forint hongrois</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pourcentage de début * (0 à 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={startPercentage}
                      onChange={(e) => setStartPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pourcentage d'arrêt * (0 à 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={stopPercentage}
                      onChange={(e) => setStopPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Message de validation réglementaire de sécurité <span className="text-red-500 font-bold">*</span></label>
                  <textarea
                    required
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 h-16 resize-none"
                    placeholder=""
                  />
                </div>
              </div>

              {/* STAGE 2: ADVANCED GATEWAY PARAMETERS (SMART BEHAVIORS FROM SCREENSHOTS) */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider flex items-center gap-2">
                  <Sliders size={12} /> CONFIGURATION DE LA SMART GATEWAY V2 :
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Comportement recherché de la simulation</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3 py-2.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="BLOCKED_OTP">🚨 Authentification OTP Requise (3D-Secure)</option>
                      <option value="SUCCESS">✅ Transfert direct sans authentification</option>
                      <option value="FRAUD_ALERT">❌ Redirection d'Alerte de Fraude AML</option>
                      <option value="ACCOUNT_LOCKED">🔒 Espace Client Suspendu / Compte Gelé</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Vitesse de chargement (Latence) :</span>
                      <strong className="text-indigo-400">{delaySeconds} secondes</strong>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer mt-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {status === 'BLOCKED_OTP' && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Code OTP requis pour by-passer <span className="text-red-500 font-bold">*</span></label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-950 border border-slate-820 rounded-xl px-4 py-2.5 text-xs text-amber-400 font-black font-mono focus:outline-none focus:border-indigo-500"
                        placeholder=""
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Frais de transfert interbancaires</label>
                    <select
                      value={feePercent}
                      onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-820 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="0.5">0.5% Frais standard Wave Africa</option>
                      <option value="1">1% Tarif Mobile Money Standard</option>
                      <option value="1.5">1.5% Virement bancaire Swift</option>
                      <option value="2.5">2.5% Western Union Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Alert Blocks */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-3">
                    <Smartphone className="shrink-0 text-slate-500" size={18} />
                    <div className="text-xs">
                      <strong className="block text-white">Prise en charge SMS de sécurité (V2 Premium) :</strong>
                      <span className="text-slate-500">Alerte le client en direct par SMS avec son code PIN de connexion V2.</span>
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
                        smsAlert ? 'bg-indigo-500' : 'bg-slate-800'
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
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-black rounded-2xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 transition duration-200"
              >
                Créer l'accès intelligent ({smsAlert ? '6000' : '5000'} Crédits) <ArrowRight size={14} />
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: MODIFICATION, LOCKING SYSTEM, ACTIVE CLIENTS LIST (2 cols width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* BLOCK 1: UPDATE PARAMETERS (MODIFIER POURCENTAGE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <RefreshCw className="text-indigo-400 animate-spin-slow" size={16} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modifier un accès client v2</h4>
            </div>

            <form onSubmit={applyUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Sélectionner l'accès client V2 <span className="text-red-500">*</span></label>
                <select
                  value={selectedUpdateId}
                  onChange={(e) => handleSelectUpdateTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="">-- Vos Smart Access V2 --</option>
                  {v2Transfers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.recipientName} ({t.id} - {t.amount} {t.currency})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUpdateId && (
                <>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1">Action sur l'accès choisi *</label>
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
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Message d'alerte *</label>
                    <textarea
                      required
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-300 h-16 resize-none"
                    />
                  </div>

                  {/* Real-time Update Recap Block */}
                  <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-3.5 text-[11px] font-mono text-slate-400 space-y-1">
                    <span className="text-white font-bold block mb-1.5 flex items-center gap-1.5">
                      <FileText size={12} className="text-indigo-400" /> Récapitulatif :
                    </span>
                    <div>⚬ Client : <strong className="text-slate-200">{getSelectedClientInfoForUpdate()?.recipientName || 'N/A'}</strong></div>
                    <div>⚬ Nouveau pourcentage départ : <strong className="text-blue-400">{updateStartPercent}%</strong></div>
                    <div>⚬ Nouveau pourcentage arrêt : <strong className="text-amber-500">{updateStopPercent}%</strong></div>
                    <div>⚬ Message : <span className="text-slate-300 block bg-slate-950 p-2 rounded border border-slate-850 mt-1 italic">"{updateMessage || 'N/A'}"</span></div>
                    <p className="text-[9px] text-indigo-400/80 mt-1.5 uppercase font-bold leading-tight">
                      NB : Un nouveau code OTP de déblocage 3D-secure sera automatiquement synchronisé à la mise à jour.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-lg"
                  >
                    Mise à jour v2 →
                  </button>
                </>
              )}
            </form>
          </div>

          {/* BLOCK 2: LOCK / UNLOCK SYSTEM (BLOQUER ET DEBLOQUER) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Lock className="text-indigo-400" size={16} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bloquer ou débloquer un accès client v2</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Sélectionner l'accès client <span className="text-red-500">*</span></label>
                <select
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="">-- Vos Smart Access V2 --</option>
                  {v2Transfers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.recipientName} ({t.id} - {t.isBlocked ? 'BLOQUÉ' : 'COMPTE ACTIF'})
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
                    className="py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-[11px] uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition"
                  >
                    <Lock size={12} /> Bloquer accès
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetBlockedState(selectedBlockId, false);
                      setSelectedBlockId('');
                    }}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition"
                  >
                    <Unlock size={12} /> Débloquer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* BLOCK 3: CREATED LINKS HISTORY REEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-450 animate-pulse" size={16} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Liste des accès v2 ({v2Transfers.length})
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-650"
                placeholder="Chercher client V2..."
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredV2Transfers.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-6">Aucun accès client configuré sous la version V2 (Smart) pour le moment.</p>
              ) : (
                filteredV2Transfers.map(t => (
                  <div key={t.id} className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-white truncate block max-w-[120px]">{t.recipientName}</strong>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none outfit ${
                        t.isBlocked 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {t.isBlocked ? 'Flash Compte bloqué' : 'Flash Compte actif'}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 truncate max-w-[140px]">{t.generatedUrl}</span>
                        <button
                          onClick={() => handleCopyToClipboard(t.generatedUrl, 'Lien Smart V2 copié !')}
                          className="text-indigo-400 hover:text-white transition p-1 cursor-pointer bg-slate-900 border border-slate-800 rounded"
                          title="Copier le lien"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 bg-slate-900/80 px-2 py-1 rounded">
                        <span className="text-[9px] text-slate-500">OTP Déblocage :</span>
                        <strong className="text-amber-400 font-mono text-[9px]">{t.otpCode || 'SUCCESS'}</strong>
                      </div>
                      <div className="text-slate-500 text-[9px] pt-1">
                        généré le {new Date(t.createdAt).toLocaleDateString('fr-FR')} à {new Date(t.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} UTC+0
                      </div>
                    </div>

                    {/* Quick actions row */}
                    <div className="flex gap-1.5 pt-1 border-t border-slate-900">
                      <button
                        onClick={() => setLiveSimulationTx(t)}
                        className="py-1 px-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye size={10} /> Tester V2
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
              <h3 className="text-base font-black text-slate-900 font-sans">Détails de l'accès client V2</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Hash du lien */}
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-4">
              <span>🔗 <strong>Hash du lien:</strong> {createdTx.id.replace('tx-', '')}</span>
            </div>

            {/* Immersive Helper Grey Dialog Card from screenshot */}
            <div className="bg-slate-100 rounded-2xl p-4 text-xs text-slate-650 leading-relaxed space-y-3">
              <p>
                Utilisez le <strong className="text-slate-900 font-bold">lien de connexion</strong> et les <strong className="text-slate-900 font-bold">identifiants</strong> définis ci-dessous pour la connexion à l'accès flash compte client.
              </p>

              {/* Login Link Box */}
              <div>
                <span className="text-slate-700 font-bold block text-[11px] mb-1">Lien de connexion :</span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                  <span className="text-slate-800 font-mono select-all truncate shrink">{createdTx.generatedUrl}</span>
                  <button
                    onClick={() => handleCopyToClipboard(createdTx.generatedUrl, 'URL de connexion client copiée !')}
                    className="p-1 hover:bg-slate-55 rounded text-slate-500 hover:text-slate-800 transition"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {/* Email Credentials */}
              <div className="space-y-3">
                <div>
                  <span className="text-slate-700 font-bold block text-[11px] mb-1">Adresse e-mail :</span>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                    <span className="text-slate-800 truncate shrink">{createdTx.email}</span>
                    <button
                      onClick={() => handleCopyToClipboard(createdTx.email, 'Adresse email copiée !')}
                      className="p-1 hover:bg-slate-55 rounded text-slate-500 hover:text-slate-800 transition"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-700 font-bold block text-[11px] mb-1">Code Pin :</span>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                    <span className="text-slate-900 font-bold select-all truncate shrink">{createdTx.codePin}</span>
                    <button
                      onClick={() => handleCopyToClipboard(createdTx.codePin, 'Code PIN copié !')}
                      className="p-1 hover:bg-slate-55 rounded text-slate-500 hover:text-slate-800 transition"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Email send action triggers with yellow and blue exactly as on the screenshots */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] sm:text-[11px] font-sans my-4">
              <button
                type="button"
                onClick={() => alert(`Succès V2 : Les identifiants de connexion ont été programmés pour envoi immédiat par e-mail vers ${createdTx.email}`)}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg transition-all shadow-sm flex items-center justify-center text-center cursor-pointer leading-tight"
              >
                Envoyer les identifiants de connexion au client par e-mail ✉
              </button>
              <button
                type="button"
                onClick={() => alert(`Succès V2 : Le code de déblocage du virement a été programmé pour envoi immédiat par e-mail vers ${createdTx.email}`)}
                className="p-3 bg-[#FCB316] hover:bg-[#E09A0A] text-slate-900 font-extrabold rounded-lg transition-all shadow-sm flex items-center justify-center text-center cursor-pointer leading-tight"
              >
                Envoyer le code de déblocage du virement au client par e-mail ✉
              </button>
            </div>

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
                  <span className="text-slate-550 block font-bold text-[10px] uppercase font-mono">Pays et indicatif :</span>
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
