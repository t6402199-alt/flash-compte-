import React, { useState, useEffect } from 'react';
import { 
  Menu,
  User,
  Coins,
  CreditCard,
  ArrowUpRight,
  ChevronLeft,
  X,
  AlertTriangle,
  Building,
  CheckCircle,
  ShieldAlert,
  Lock,
  Mail,
  Key,
  RefreshCw,
  Phone,
  HelpCircle,
  Copy,
  PlusCircle,
  Check,
  Send,
  Eye,
  EyeOff,
  Inbox
} from 'lucide-react';
import { SimulatedTransfer } from '../types';

interface SimulatedBankPortalProps {
  transfer: SimulatedTransfer;
  onClose: () => void;
  onSetCompleted: (id: string) => void;
  onTriggerEmailNotification?: (title: string, content: string, status: 'Envoyé' | 'En attente' | 'Échoué') => void;
}

interface SimulatedEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE';
}

export default function SimulatedBankPortal({ 
  transfer, 
  onClose, 
  onSetCompleted, 
  onTriggerEmailNotification 
}: SimulatedBankPortalProps) {
  
  // PRIMARY PORTAL NAVIGATION
  // Screens: 'LOGIN' | 'PORTAL_DASHBOARD'
  const [currentScreen, setCurrentScreen] = useState<'LOGIN' | 'PORTAL_DASHBOARD'>('LOGIN');
  
  // Active tab in client workspace
  // Tabs: 'solde' | 'carte' | 'virement' | 'compte'
  const [activeTab, setActiveTab] = useState<'solde' | 'carte' | 'virement' | 'compte'>('solde');

  // FORM INPUTS
  const [inputEmail, setInputEmail] = useState(transfer.email);
  const [inputPin, setInputPin] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // NOTIFICATION CARD STATUS
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [showCardBanner, setShowCardBanner] = useState(true);

  // VIREMENT FLOW STATE (Step 1, 2, 3)
  const [virementStep, setVirementStep] = useState<1 | 2 | 3>(1);
  const [ibanInput, setIbanInput] = useState('');
  const [bicInput, setBicInput] = useState('');
  const [bankNameInput, setBankNameInput] = useState('');
  const [beneficiaryNameInput, setBeneficiaryNameInput] = useState('');
  const [motifInput, setMotifInput] = useState('');
  const [virementErrors, setVirementErrors] = useState<string | null>(null);

  // ID VERIFICATION (Step 2)
  const [securityCodeInput, setSecurityCodeInput] = useState('');
  const [securityCodeError, setSecurityCodeError] = useState<string | null>(null);

  // PROCESSING PROGRESS (Step 3)
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Vérification réglementaire de l'évaluation...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStartedProcessing, setHasStartedProcessing] = useState(false);

  // FAILURE RESIDUAL MODAL
  const [showFailureModal, setShowFailureModal] = useState(false);

  // SUCCESS OUTBOUND MODAL
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // AUXILIARY SIMULATED EMAIL INBOX FOR THE USER/OPERATOR to see outgoing alerts!
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [showEmailInbox, setShowEmailInbox] = useState(false);
  const [selectedInboxEmail, setSelectedInboxEmail] = useState<SimulatedEmail | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pre-fill input forms to speed up evaluator validation and avoid any credential mismatches
  useEffect(() => {
    if (transfer) {
      setInputEmail(transfer.email);
      setInputPin(transfer.codePin);
    }
  }, [transfer]);

  // LOGIN HANDLER
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);

    const isMatchEmail = inputEmail.trim().toLowerCase() === transfer.email.toLowerCase();
    const isMatchPin = inputPin.trim() === transfer.codePin;

    if (isMatchEmail && isMatchPin) {
      if (transfer.isBlocked) {
        alert("Espace client suspendu administrativement par l'opérateur.");
        return;
      }
      setCurrentScreen('PORTAL_DASHBOARD');
      setActiveTab('solde');
    } else {
      setLoginError(true);
    }
  };

  // SEND SIMULATED NOTIFICATION (Saves email locally for viewing and calls back-end logger)
  const sendEmailAlert = (type: 'SUCCESS' | 'FAILURE', details?: any) => {
    const feesVal = transfer.amount * (transfer.feePercent / 100);
    const netVal = transfer.amount - feesVal;
    
    let subject = '';
    let body = '';
    
    if (type === 'SUCCESS') {
      subject = `✅ [TRANSFERWIRE] Virement de ${transfer.amount.toLocaleString('fr-FR')} EUR effectué avec succès`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #1e3a8a; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.025em;">TRANSFERWIRE WIRE RECIPIENT</h1>
            <p style="margin: 6px 0 0 0; font-size: 11px; opacity: 0.8; font-family: monospace;">Avis d'émission : SUCCESSFUL_PAY</p>
          </div>
          <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
            <h2 style="color: #0d9488; font-size: 18px; margin-top: 0;">Félicitations, virement externe expédié !</h2>
            <p>Bonjour, <strong>${transfer.firstName} ${transfer.lastName}</strong>,</p>
            <p>Le virement national de compensation monétaire a été validé et traité de bout en bout par nos services de routage.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px;">
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Bénéficiaire :</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #0f172a;">${details?.beneficiaryName || transfer.firstName + ' ' + transfer.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Banque Bénéficiaire :</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #0f172a;">${details?.bankName || 'Banque Externe'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b;">IBAN associé :</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-weight: bold; text-align: right; color: #0d9488;">${details?.iban || 'FR76 8920...'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Montant transféré :</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #0f172a; font-size: 16px;">${transfer.amount.toLocaleString('fr-FR')} EUR</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; color: #64748b;">Frais et Timbres :</td>
                <td style="padding: 10px 14px; font-weight: bold; text-align: right; color: #22c55e;">Gratuit (0,00 EUR)</td>
              </tr>
            </table>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin-top: 15px; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #15803d; font-weight: bold;">✓ TRANSACTION LIBÉRÉE ET VALIDÉE</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #166534;">Les fonds sont crédités sur le compte récepteur sous les délais d'acheminement standards.</p>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              🛡️ Cet e-mail est une simulation PCI-DSS émise à des fins de démonstration technique par la passerelle de test TransferWire.
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `⚠️ [ALERT REGULATORY] Blocage administratif du transfert - Virement ${transfer.id.toUpperCase()}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fecdd3; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #b91c1c; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.025em;">AVIS DE BLOCAGE ADMINISTRATIF</h1>
            <p style="margin: 6px 0 0 0; font-size: 11px; opacity: 0.8; font-family: monospace;">Réf de dossier réglementaire : ${transfer.reference}</p>
          </div>
          <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
            <p>Cher(e) client (e), <strong>${transfer.firstName} ${transfer.lastName}</strong>,</p>
            <p>Notre automate interbancaire de surveillance de routage a immédiatement bloqué le virement externe sortant de <strong>${transfer.amount.toLocaleString('fr-FR')} EUR</strong> initié depuis votre compte.</p>
            
            <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 12px; text-transform: uppercase; font-family: monospace;">Rapport administratif du blocage :</h4>
              <p style="margin: 0; font-size: 12px; color: #be123c; font-style: italic; font-weight: bold;">
                "${transfer.customMessage}"
              </p>
            </div>

            <p>Pour régulariser et débloquer les fonds qui sont actuellement consignés à ${transfer.stopPercentage}% de progression dans notre chambre de compensation, vous devez vous acquitter des frais de timbre fiscaux calculés ci-dessous :</p>

            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #fffaf0; border: 1px solid #fef3c7;">
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #fef3c7; color: #b45309;">Solde en transit consigné :</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #fef3c7; font-weight: bold; text-align: right; color: #b45309;">${transfer.amount.toLocaleString('fr-FR')} EUR</td>
              </tr>
              <tr style="background-color: #fff5f5;">
                <td style="padding: 12px 14px; font-weight: bold; color: #9f1239;">Frais à régulariser (${transfer.feePercent}%) :</td>
                <td style="padding: 12px 14px; font-weight: bold; color: #b91c1c; text-align: right; font-size: 16px;">${feesVal.toLocaleString('fr-FR')} EUR</td>
              </tr>
            </table>

            <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px; margin-top: 15px; border-radius: 4px;">
              <p style="margin:0; font-size: 11px; color: #92400e; line-height: 1.5;">
                <strong>Note d'application réglementaire (UMOA/BCEAO) :</strong> Conformément aux règles juridiques internationales régissant les devises de test, ces frais ne peuvent pas être directement ponctionnés du solde global en transit. Ils doivent faire l'objet d'un règlement autonome immédiat par carte ou via coupons d'agences avant libération définitive.
              </p>
            </div>

            <p style="font-size: 11px; color: #a1a1aa; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              Support technique : support@transfer-wire-world.com • Renseignez la référence de réclamation : ${transfer.id.toUpperCase()}
            </p>
          </div>
        </div>
      `;
    }

    const brandNewEmail: SimulatedEmail = {
      id: `mail-${Math.floor(10000 + Math.random() * 90000)}`,
      sender: 'conformite@transferwireworld.com',
      recipient: transfer.email,
      subject,
      body,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: type
    };

    setEmails(prev => [brandNewEmail, ...prev]);
    setUnreadCount(prev => prev + 1);
    setSelectedInboxEmail(brandNewEmail);

    // Dynamic Tone Beep sound effect
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 Note
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5 Note
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Audio context block safety ignored
    }

    if (onTriggerEmailNotification) {
      onTriggerEmailNotification(
        type === 'SUCCESS' ? `Avis de Réussite - Virement Libéré` : `Notice d'Alerte - Suspension Réglementaire`,
        `Notification envoyée à ${transfer.email} pour le virement d'un montant de ${transfer.amount} EUR.`,
        type === 'SUCCESS' ? 'Envoyé' : 'Échoué'
      );
    }
  };

  // HANDLES VIREMENT FORM TRANSITION (Step 1 -> Step 2)
  const handleVirementNext = (e: React.FormEvent) => {
    e.preventDefault();
    setVirementErrors(null);

    if (!ibanInput || !bicInput || !bankNameInput || !beneficiaryNameInput || !motifInput) {
      setVirementErrors("Veuillez renseigner tous les champs obligatoires du formulaire.");
      return;
    }

    if (ibanInput.replace(/\s+/g, '').length < 10) {
      setVirementErrors("Le numéro de compte IBAN saisi est trop court.");
      return;
    }

    setVirementStep(2);
  };

  // HANDLES OTP / SECURITY CODE SUBMIT (Step 2 -> Step 3)
  const handleSecurityCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityCodeError(null);

    if (!securityCodeInput) {
      setSecurityCodeError("Le code de sécurité est requis.");
      return;
    }

    // Determine testing scenario choice based on user's manual entry
    let parsedTargetStop = transfer.stopPercentage;
    const entry = securityCodeInput.trim();

    if (entry === '000000') {
      // FORCE REGULATORY FAILURE SIMULATION
      parsedTargetStop = transfer.stopPercentage < 100 ? transfer.stopPercentage : 50;
    } else if (entry === '111111') {
      // FORCE 100% EXCELLENT WIRE INTEGRATION
      parsedTargetStop = 100;
    }

    // Start Step 3 loader
    setVirementStep(3);
    setHasStartedProcessing(true);
    setIsProcessing(true);
    setProgress(0);

    const stepLabelMessages = [
      { p: 10, m: "Initialisation du canal cryptographique PCI-DSS..." },
      { p: 25, m: "Analyse administrative des filtres de compensation..." },
      { p: 40, m: "Prise de contact avec les chambres BCEAO/SWIFT..." },
      { p: 60, m: "Vérification des taux de change interbancaire..." },
      { p: 75, m: "Routage du capital d'évaluation..." },
      { p: 90, m: "Application du protocole d'arrêt réglementaire..." }
    ];

    let currentProgress = 0;
    const totalDurationMs = transfer.delaySeconds * 1000 || 4000;
    const stepIntervalMs = totalDurationMs / parsedTargetStop;

    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      const hitLabel = stepLabelMessages.find(item => currentProgress >= item.p && currentProgress < item.p + 2);
      if (hitLabel) {
        setProgressLabel(hitLabel.m);
      }

      if (currentProgress >= parsedTargetStop) {
        clearInterval(timer);
        setIsProcessing(false);

        if (parsedTargetStop < 100) {
          // INTERMEDIATE STOP MODAL TRIGGER
          setShowFailureModal(true);
          sendEmailAlert('FAILURE', {
            beneficiaryName: beneficiaryNameInput,
            bankName: bankNameInput,
            iban: ibanInput,
            bic: bicInput
          });
        } else {
          // SUCCESSFUL TRANSACTION
          setShowSuccessModal(true);
          onSetCompleted(transfer.id);
          sendEmailAlert('SUCCESS', {
            beneficiaryName: beneficiaryNameInput,
            bankName: bankNameInput,
            iban: ibanInput,
            bic: bicInput
          });
        }
      }
    }, Math.max(stepIntervalMs, 20)); // prevent crazy-fast intervals
  };

  // Reset the virement steps wizard back to normal
  const resetVirementWizard = () => {
    setVirementStep(1);
    setIbanInput('');
    setBicInput('');
    setBankNameInput('');
    setBeneficiaryNameInput('');
    setMotifInput('');
    setSecurityCodeInput('');
    setHasStartedProcessing(false);
    setProgress(0);
    setShowFailureModal(false);
    setShowSuccessModal(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans text-slate-800">
      
      {/* Device wrapper mockup centering space */}
      <div className="w-full max-w-5xl bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col my-auto min-h-[620px] max-h-[95vh] relative">
        
        {/* Mock Browser URL and Debug Banner bar */}
        <div className="bg-slate-900 border-b border-slate-800 p-2 sm:p-3 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Colored dots */}
            <div className="flex gap-1.5 shrink-0 select-none">
              <span className="h-3 w-3 rounded-full bg-rose-500 block" />
              <span className="h-3 w-3 rounded-full bg-amber-400 block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500 block" />
            </div>

            {/* URL Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 flex items-center gap-2 max-w-[480px] truncate w-full md:w-96">
              <Lock className="text-emerald-500 shrink-0" size={12} />
              <span className="text-[10px] text-emerald-500 font-mono tracking-tight font-bold shrink-0">https://</span>
              <span className="text-[10px] text-slate-400 font-mono truncate select-all">
                secure-transferwire.int/client/auth?c={transfer.id.replace('tx-', '')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Toggle custom Inbox button helpful for evaluation */}
            <button
              onClick={() => {
                setShowEmailInbox(!showEmailInbox);
                setUnreadCount(0);
              }}
              style={{ contentVisibility: 'auto' }}
              className={`relative px-3 py-1.5 rounded-xl border text-[11px] font-mono leading-none tracking-tight flex items-center gap-2 transition cursor-pointer ${
                showEmailInbox
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Inbox size={13} /> Boîte Mail Client
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-extrabold text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Back to administrative console */}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-rose-650 hover:bg-rose-700 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer transition border border-rose-500/20"
            >
              <ChevronLeft size={13} /> Espace Admin
            </button>
          </div>
        </div>

        {/* Dynamic testing Cheat Sheet helper band */}
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-700 gap-3 font-medium select-none">
          <span className="flex items-center gap-1">Simulation : <strong className="text-slate-900 bg-amber-200 px-1.5 py-0.5 rounded uppercase text-[10px]">TRANSFERWIRE V1 Active</strong></span>
          <span className="flex items-center gap-1.5">Email : <strong className="text-indigo-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-250">{transfer.email}</strong></span>
          <span className="flex items-center gap-1.5">Code d'accès : <strong className="text-emerald-800 font-mono font-black bg-white px-2 py-0.5 rounded border border-emerald-300">{transfer.codePin}</strong></span>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* LEFT SIDE PANEL: REALISTIC SIMULATED INBOX DRAWER OR PORTAL SPLIT */}
          {showEmailInbox && (
            <div className="w-full md:w-80 bg-slate-900 text-white border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 z-10">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-indigo-400 flex items-center gap-1.5">
                  <Mail size={13} /> MAISON DU NET - BOÎTE MAIL
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono">Simulacre</span>
              </div>

              {emails.length === 0 ? (
                <div className="flex-1 p-8 text-center flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Mail size={32} className="opacity-30" />
                  <p className="text-xs">Aucun e-mail reçu pour le moment.</p>
                  <p className="text-[10px] leading-relaxed max-w-[200px]">Lancez l'évaluation ou initiez un virement pour recevoir les notifications de conformité.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* List of mails */}
                  <div className="h-1/3 border-b border-slate-800 overflow-y-auto select-none">
                    {emails.map((mail) => (
                      <div
                        key={mail.id}
                        onClick={() => setSelectedInboxEmail(mail)}
                        className={`p-3 border-b border-slate-800/60 cursor-pointer text-left transition leading-normal block ${
                          selectedInboxEmail?.id === mail.id ? 'bg-slate-800' : 'hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 truncate w-32 font-medium">{mail.sender}</span>
                          <span className="text-slate-500 font-mono">{mail.timestamp}</span>
                        </div>
                        <h4 className="text-[11px] font-extrabold text-white mt-1 truncate">{mail.subject}</h4>
                      </div>
                    ))}
                  </div>

                  {/* Mail Reader viewport */}
                  <div className="flex-1 overflow-y-auto p-3 bg-slate-950 text-slate-900">
                    {selectedInboxEmail ? (
                      <div className="space-y-3">
                        <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1 select-all">
                          <div><strong>De :</strong> {selectedInboxEmail.sender}</div>
                          <div><strong>À :</strong> {selectedInboxEmail.recipient}</div>
                          <div><strong>Sujet :</strong> {selectedInboxEmail.subject}</div>
                        </div>
                        
                        <div className="bg-white border rounded-lg p-1.5 scale-95 origin-top overflow-x-auto shadow-sm">
                          <div dangerouslySetInnerHTML={{ __html: selectedInboxEmail.body }} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6">Sélectionnez un e-mail à afficher.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CENTRAL CONTENT PANEL FRAME */}
          <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col">
            
            {/* VIEW A: THE LOGIN AREA SCREEN 1 */}
            {currentScreen === 'LOGIN' && (
              <div className="flex-1 flex items-center justify-center p-4">
                <main className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl animate-scale-up text-center">
                  
                  {/* Brand logo in shades of blue/teal */}
                  <div className="inline-flex items-center gap-1.5 mb-2 select-none">
                    <span className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md">W</span>
                    <strong className="text-blue-900 font-black text-lg tracking-wider font-sans uppercase">TRANSFERWIRE</strong>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1 font-sans">Connexion à votre compte</h3>
                  
                  {/* User profile capsule banner row */}
                  <div className="my-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-extrabold text-slate-700 select-none shadow-sm capitalize">
                    <span className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-white"><User size={12} /></span>
                    {transfer.firstName} {transfer.lastName}
                  </div>

                  {/* Warning test banner */}
                  <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl text-left space-y-1.5 mb-5 select-none text-[11px] leading-relaxed">
                    <strong className="text-amber-800 font-black uppercase text-[10px] block font-semibold">🔍 Notice d'évaluation Active :</strong>
                    <p className="text-slate-805 text-justify">
                      Vous êtes en mode Test. Ce message est automatiquement supprimé avec un vrai flash compte client.
                    </p>
                    <div className="pt-1.5 border-t border-amber-200 space-y-1">
                      <p className="font-semibold text-amber-900">
                        • Pour simuler un échec à {transfer.stopPercentage}% (ou blocage d'évaluation), saisissez le code : <strong className="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] border border-amber-300">000000</strong>
                      </p>
                      <p className="font-semibold text-emerald-850">
                        • Pour un virement libéré à 100% avec succès, saisissez le code : <strong className="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] border border-emerald-300">111111</strong>
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                    {/* E-mail Input block */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">Adresse e-mail :</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Mail size={14} />
                        </span>
                        <input
                          type="email"
                          required
                          value={inputEmail}
                          onChange={(e) => setInputEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-blue-600 focus:bg-white font-medium/semibold transition"
                          placeholder="votre@mail.com"
                        />
                      </div>
                    </div>

                    {/* PIN Access Code block */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">Code d'accès sécurisé :</label>
                        <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-bold font-mono">Entrée Requis</span>
                      </div>
                      
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Lock size={14} />
                        </span>
                        <input
                          type={showPin ? 'text' : 'password'}
                          required
                          value={inputPin}
                          onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-blue-600 focus:bg-white font-mono font-semibold tracking-wider transition"
                          placeholder="------"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                        >
                          {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit gate button */}
                    {loginError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-[10px] text-center font-bold">
                        E-mail ou code d'accès incorrect. Veuillez vous référer aux indices d'évaluation.
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-755 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 font-semibold"
                    >
                      Se connecter ➔
                    </button>
                  </form>

                  <p className="text-[9px] text-slate-400 text-center mt-6 uppercase tracking-wider font-semibold select-none leading-normal">
                    🔒 Système d'intermédiation monétaire certifiée PCI-DSS v4
                  </p>
                </main>
              </div>
            )}

            {/* VIEW B: PORTAL CLIENT SPACE PANEL WORKSPACE */}
            {currentScreen === 'PORTAL_DASHBOARD' && (
              <div className="flex-1 flex flex-col justify-between p-3 sm:p-6 space-y-4 relative">
                
                {/* Standard Header Row */}
                <div className="bg-white border border-slate-201 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <button className="p-1 px-1.5 hover:bg-slate-100 rounded text-slate-500 block">
                      <Menu size={16} />
                    </button>
                    {/* Brand type logo */}
                    <div className="flex items-center gap-1 text-blue-900 select-none">
                      <span className="h-5 w-5 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">W</span>
                      <strong className="font-black text-xs uppercase tracking-wider">TRANSFERWIRE</strong>
                    </div>
                  </div>

                  {/* Profile avatar thumbnail icon */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs select-none uppercase">
                      {transfer.firstName ? transfer.firstName[0] : 'U'}
                    </div>
                  </div>
                </div>

                {/* Subpage View content switcher based on activeTab */}
                <div className="flex-1 w-full max-w-3xl mx-auto space-y-4 pb-20 overflow-y-auto">
                  
                  {/* SUBPAGE 1: SOLDE VIEW ACCOUNT OVERVIEW */}
                  {activeTab === 'solde' && (
                    <div className="space-y-4 animate-fade-in text-left">
                      
                      {/* Success Closeable Balance notification banner */}
                      {showSuccessBanner && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl relative shadow-sm flex items-start gap-3">
                          <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                          <div className="text-xs leading-relaxed font-semibold pr-6">
                            Un virement de {transfer.amount.toLocaleString('fr-FR')} EUR reçu et crédité sur votre compte. Vous pouvez ajouter votre IBAN afin d'effectuer un virement externe vers votre banque.
                          </div>
                          <button 
                            onClick={() => setShowSuccessBanner(false)}
                            className="absolute top-3 right-3 text-emerald-550 hover:text-emerald-700 hover:bg-emerald-100 p-1 rounded-full cursor-pointer transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {/* Big Blue balance presentation card */}
                      <div className="bg-blue-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                        {/* Background coins ornament vector */}
                        <div className="absolute right-6 bottom-4 opacity-10 pointer-events-none">
                          <Coins size={140} />
                        </div>

                        <div className="space-y-1.5 z-10">
                          <span className="text-[10px] font-mono tracking-widest text-blue-200 uppercase font-black flex items-center gap-1">
                            <Coins size={11} className="text-blue-305" /> Solde du compte :
                          </span>
                          <strong className="text-4xl font-black font-sans tracking-tight block">
                            {transfer.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </strong>
                        </div>

                        {/* Button control actions directly inside card */}
                        <div className="grid grid-cols-2 gap-3 mt-6 z-10">
                          <button
                            onClick={() => setActiveTab('virement')}
                            className="bg-amber-450 hover:bg-amber-500 text-slate-950 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition flex items-center justify-center gap-1.5 shadow"
                          >
                            Effectuer un virement ➔
                          </button>
                          <button
                            onClick={() => setActiveTab('carte')}
                            className="bg-teal-500 hover:bg-teal-605 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition flex items-center justify-center gap-1.5 shadow"
                          >
                            Ma carte ➔
                          </button>
                        </div>
                      </div>

                      {/* Transaction history section list */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-101">
                          Historique des transactions
                        </h4>

                        <div className="space-y-4">
                          {/* Transfer Virement entry block */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 leading-normal">
                            <div className="flex items-center gap-3">
                              <span className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                <Building size={18} />
                              </span>
                              <div>
                                <h5 className="text-xs font-black text-slate-900 leading-tight">Virement reçu</h5>
                                <span className="text-[10px] text-slate-400 font-bold tracking-wider font-mono uppercase">TRANSFERWIRE</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <strong className="text-emerald-700 font-black text-sm font-sans">
                                +{transfer.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </strong>
                              <span className="text-[9px] text-slate-400 font-bold font-mono block mt-1">
                                {new Date(transfer.createdAt).toLocaleDateString('fr-FR')} {new Date(transfer.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Default card registration verification charge */}
                          <div className="flex items-center justify-between leading-normal opacity-80">
                            <div className="flex items-center gap-3">
                              <span className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center">
                                <CreditCard size={18} />
                              </span>
                              <div>
                                <h5 className="text-xs font-medium text-slate-650 leading-tight">Activation de compte</h5>
                                <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase">VÉRIFICATION D'IP</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <strong className="text-slate-650 font-black text-xs font-mono">
                                0,00 €
                              </strong>
                              <span className="text-[9px] text-slate-400 font-mono block">Trimestriel</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUBPAGE 2: MA CARTE VIEW */}
                  {activeTab === 'carte' && (
                    <div className="space-y-4 animate-fade-in text-left">
                      
                      {/* Card welcome activation popup */}
                      {showCardBanner && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl relative shadow-sm flex items-start gap-3">
                          <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                          <div className="text-xs leading-relaxed font-semibold pr-6">
                            Félicitations, votre carte de débit est disponible. Avant tout usage, vous devez activer votre carte pour accélérer l'acheminement de vos fonds crédité sur votre compte.
                          </div>
                          <button 
                            onClick={() => setShowCardBanner(false)}
                            className="absolute top-3 right-3 text-blue-550 hover:text-blue-700 hover:bg-blue-100 p-1 rounded-full cursor-pointer transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {/* PREMIUM INTERACTIVE DEBIT CARD */}
                      <div className="w-full max-w-md mx-auto aspect-[1.586/1] bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800 font-sans tracking-wide">
                        
                        {/* Decorative hologram circles card vector */}
                        <div className="absolute right-0 bottom-0 top-0 left-0 bg-[radial-gradient(circle_at_bottom_right,rgba(30,58,138,0.4),transparent)] -z-10" />
                        
                        {/* Title wire name layout */}
                        <div className="flex justify-between items-start z-10">
                          <strong className="font-black text-xs uppercase tracking-widest text-slate-300">TRANSFERWIRE</strong>
                          <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-black font-mono">DEBIT VISA</span>
                        </div>

                        {/* Yellow chip icon and NFC lines */}
                        <div className="z-10 my-3 flex items-center justify-between">
                          <div className="w-10 h-7 bg-amber-400/80 rounded-md border border-amber-500 shadow-sm relative overflow-hidden">
                            <span className="absolute inset-y-0 left-3 w-0.5 bg-slate-800/20" />
                            <span className="absolute inset-y-0 left-6 w-0.5 bg-slate-800/20" />
                            <span className="absolute inset-x-0 top-3 h-0.5 bg-slate-800/20" />
                          </div>
                        </div>

                        {/* Standard Mock Credit Card Number */}
                        <div className="z-10 text-lg sm:text-xl font-mono font-bold tracking-widest select-all mb-4">
                          4987 **** **** 8710
                        </div>

                        {/* Client details: cardholder and Expiry */}
                        <div className="flex justify-between items-end z-10 font-sans">
                          <div>
                            <span className="text-[8px] text-slate-400 font-mono tracking-wider block uppercase mb-0.5">Titulaire de carte</span>
                            <strong className="text-xs font-black uppercase text-slate-200 block truncate max-w-[180px]">
                              {transfer.firstName} {transfer.lastName}
                            </strong>
                          </div>

                          <div className="text-right text-[10px]">
                            <span className="text-[7px] text-slate-405 font-mono tracking-wider block uppercase mb-0.5">EXP : 06/2029</span>
                            <span className="font-mono font-bold text-slate-305 block">CVV : 818</span>
                          </div>
                        </div>
                      </div>

                      {/* Card activation controls buttons */}
                      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                        <button
                          onClick={() => {
                            alert("Félicitations administrative ! Votre carte de débit physique/virtuelle est active. Cette étape accélère l'Avis d'Acheminement Bancaire.");
                            setShowCardBanner(false);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer text-center hover:shadow transition"
                        >
                          Activer ma carte
                        </button>
                        <button
                          onClick={() => alert("Exception : Pour des raisons de sûreté monétaire, vous ne pouvez pas bloquer une carte d'évaluation de solde active.")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer text-center hover:shadow transition"
                        >
                          Bloquer ma carte
                        </button>
                      </div>

                      {/* Transactions and logs table section */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-101">
                          Transaction(s) par carte
                        </h4>
                        
                        <div className="py-6 text-center space-y-3 flex flex-col items-center justify-center">
                          <RefreshCw className="animate-spin text-blue-600" size={24} />
                          <p className="text-xs text-slate-500 font-medium">Interrogation des terminaux de paiements TPE de test...</p>
                          <span className="text-[10px] bg-slate-100 text-slate-450 px-2 py-0.5 rounded font-mono">Aucune transaction de débit enregistrée</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUBPAGE 3: VIREMENT ACTIONS MULTI-STEPS PROCESS */}
                  {activeTab === 'virement' && (
                    <div className="space-y-4 animate-fade-in text-left">
                      
                      {/* STEP 1: FILL BENEFICIARY BANK INFO */}
                      {virementStep === 1 && (
                        <form onSubmit={handleVirementNext} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                          
                          <div className="flex items-center justify-between border-b border-slate-101 pb-3.5 shrink-0">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                              Envoyer un virement sortant ➔
                            </h4>
                            <span className="text-xs font-mono font-bold text-slate-500">Avoir disponible : <strong className="text-slate-800">{transfer.amount.toLocaleString('fr-FR')} €</strong></span>
                          </div>

                          <div className="bg-slate-50 border border-slate-201 p-4 rounded-2xl flex items-center gap-2 select-none">
                            <Building size={14} className="text-blue-605" />
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Banque Débitrice émettrice : <strong>TRANSFERWIRE SECURE ACCREDITED</strong></span>
                          </div>

                          {/* Error block banner */}
                          {virementErrors && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                              <ShieldAlert size={15} /> {virementErrors}
                            </div>
                          )}

                          <div className="space-y-4 font-sans text-xs">
                            {/* Input IBAN */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Entrez l'IBAN / Numéro de Compte :</label>
                              <input
                                type="text"
                                required
                                value={ibanInput}
                                onChange={(e) => setIbanInput(e.target.value.toUpperCase())}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 transition"
                                placeholder="FR76 3000 6000 4829..."
                              />
                            </div>

                            {/* Input BIC and Bank name side-by-side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Code Banque (BIC / SWIFT) :</label>
                                <input
                                  type="text"
                                  required
                                  value={bicInput}
                                  onChange={(e) => setBicInput(e.target.value.toUpperCase())}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 transition"
                                  placeholder="SOCIETYFRXXXX"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Nom de la banque :</label>
                                <input
                                  type="text"
                                  required
                                  value={bankNameInput}
                                  onChange={(e) => setBankNameInput(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 transition"
                                  placeholder="Revolut / BoursoBank"
                                />
                              </div>
                            </div>

                            {/* Input Beneficiary and Motif transfer */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Nom du bénéficiaire :</label>
                                <input
                                  type="text"
                                  required
                                  value={beneficiaryNameInput}
                                  onChange={(e) => setBeneficiaryNameInput(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 transition"
                                  placeholder="Mon Compte Pro"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Motif du virement :</label>
                                <input
                                  type="text"
                                  required
                                  value={motifInput}
                                  onChange={(e) => setMotifInput(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 transition"
                                  placeholder="Régularisation / Epargne"
                                />
                              </div>
                            </div>

                          </div>

                          {/* Info warn details */}
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
                            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            <div>
                              <strong>Délai d'acheminement standard :</strong> Traitement du virement en 1-2 jours ouvrables. Frais de tenue : <strong>Gratuit (Sponsorisé par TransferWire).</strong>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-755 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 font-semibold"
                          >
                            Suivant ➔
                          </button>
                        </form>
                      )}

                      {/* STEP 2: DETAILS RECAP AND identity verification CODE ENTRY */}
                      {virementStep === 2 && (
                        <div className="space-y-4">
                          {/* Grey table summary of details */}
                          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="text-xs font-black text-slate-805 uppercase font-mono tracking-wider">Récapitulatif du virement</h4>
                              <button 
                                onClick={() => setVirementStep(1)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                              >
                                Modifier ✎
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">Montant du virement</span>
                                <strong className="text-sm text-slate-900 font-black">{transfer.amount.toLocaleString('fr-FR')} €</strong>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">IBAN bénéficiaire</span>
                                <strong className="text-xs font-mono text-slate-800">{ibanInput}</strong>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">Banque de réception</span>
                                <strong className="text-xs text-slate-800 font-bold">{bankNameInput} ({bicInput})</strong>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">Nom du bénéficiaire</span>
                                <strong className="text-xs text-slate-800 font-bold capitalize">{beneficiaryNameInput}</strong>
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">Motif du virement</span>
                                <p className="text-xs text-slate-705 italic font-medium">"{motifInput}"</p>
                              </div>
                            </div>
                          </div>

                          {/* Identity verification ID Entry */}
                          <form onSubmit={handleSecurityCodeSubmit} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b pb-3 shrink-0">
                              <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center"><Key size={14} /></span>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">Vérification de sécurité</h4>
                            </div>

                            {securityCodeError && (
                              <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs font-bold leading-normal">
                                {securityCodeError}
                              </div>
                            )}

                            <p className="text-xs text-slate-650 leading-relaxed font-medium">
                              Pour des raisons de sûreté d'acheminement, veuillez saisir le code de sécurité ou la clé d'habilitation reçue par SMS/E-mail afin de valider le virement externe :
                            </p>

                            <div className="space-y-2">
                              <label className="text-[10px] text-slate-400 block font-mono font-bold uppercase tracking-wider">Entrez le code de sécurité :</label>
                              <input
                                type="text"
                                required
                                value={securityCodeInput}
                                onChange={(e) => setSecurityCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold font-mono tracking-widest text-slate-900 placeholder-slate-350 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                                placeholder="------"
                              />
                            </div>

                            <div className="bg-indigo-50 border border-indigo-150 p-3.5 rounded-2xl text-[11px] leading-relaxed select-none text-indigo-900">
                              💡 <strong>Rappel du Sandbox de démonstration :</strong>
                              <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
                                <li>Renseignez le code Pin d'évaluation fourni : <strong className="font-mono bg-white px-1 py-0.5 rounded border leading-none">{transfer.codePin}</strong></li>
                                <li>Pour simuler un arrêt obligatoire en cours de charge : <strong className="font-mono bg-white px-1 py-0.5 rounded border leading-none">000000</strong></li>
                                <li>Pour simuler un succès complet de libération à 100% : <strong className="font-mono bg-white px-1 py-0.5 rounded border leading-none">111111</strong></li>
                              </ul>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-blue-600 hover:bg-blue-755 text-white font-black rounded-xl text-xs uppercase cursor-pointer shadow transition active:scale-95 text-center flex items-center justify-center gap-1.5 font-semibold"
                            >
                              Envoyer ➔
                            </button>
                          </form>
                        </div>
                      )}

                      {/* STEP 3: TRANSACTION PROCESSING LOADER PROGRESS AND BAR */}
                      {virementStep === 3 && (
                        <div className="space-y-4">
                          {/* Checked verification success banner */}
                          <div className="bg-slate-200/60 border border-slate-250 p-4 rounded-3xl text-left space-y-3 shadow-inner font-sans">
                            <div className="flex gap-2.5 items-start">
                              <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                              <div className="text-xs leading-relaxed">
                                <strong className="block text-slate-900 text-sm">Bien joué !</strong>
                                <span className="text-slate-650 font-medium font-semibold block mt-0.5">
                                  Vérification d'identité effectuée avec succès. Veuillez patienter jusqu'à la fin du virement des fonds vers votre banque avant d'actualiser cette page.
                                </span>
                              </div>
                            </div>

                            <div className="bg-white border rounded-2xl p-4 space-y-2 text-xs text-slate-650 divide-y divide-slate-100 select-all shadow-sm">
                              <div className="flex justify-between py-1.5">
                                <span>Nom du bénéficiaire :</span>
                                <strong className="text-slate-900 font-extrabold capitalize">{beneficiaryNameInput}</strong>
                              </div>
                              <div className="flex justify-between py-1.5">
                                <span>Banque de réception :</span>
                                <strong className="text-slate-950 font-extrabold">{bankNameInput} ({bicInput})</strong>
                              </div>
                              <div className="flex justify-between py-1.5 font-mono">
                                <span>IBAN / Numéro de Compte :</span>
                                <strong className="text-indigo-650 tracking-wide font-bold">{ibanInput}</strong>
                              </div>
                              <div className="flex justify-between py-1.5 pt-2 font-sans">
                                <span>Montant à recevoir :</span>
                                <strong className="text-slate-900 text-sm font-black">{transfer.amount.toLocaleString('fr-FR')} €</strong>
                              </div>
                            </div>
                          </div>

                          {/* Interactive live processing ticker progress bar */}
                          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center space-y-4">
                            {isProcessing ? (
                              <div className="space-y-1">
                                <span className="text-xs font-black text-blue-700 animate-pulse uppercase tracking-wider block">Virement en cours, veuillez patienter...</span>
                                <span className="text-[10px] text-slate-500 font-mono italic block">{progressLabel}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-rose-600 block uppercase tracking-widest font-mono">SÉCURISATION INTERROMPUE PAR LE SERVEUR</span>
                            )}

                            {/* EXCELLENT REPLICA PROGRESS BAR WITH STRIPED SHADING */}
                            <div className="w-full bg-slate-100 h-10 rounded-full overflow-hidden border border-slate-205 flex items-center relative shadow-inner">
                              
                              {/* Green progress content */}
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-505 transition-all duration-300 relative flex items-center justify-end pr-3"
                                style={{ 
                                  width: `${progress}%`,
                                  backgroundSize: '30px 30px',
                                  backgroundImage: isProcessing ? 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)' : 'none'
                                }}
                              />
                              
                              {/* Percentage text overlay inside centered for clean visual flow */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-mono font-black text-slate-900 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-slate-200 flex items-center gap-1">
                                  {isProcessing && <RefreshCw size={11} className="animate-spin text-emerald-600" />} {progress}%
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {/* SUBPAGE 4: MON COMPTE VIEW */}
                  {activeTab === 'compte' && (
                    <div className="space-y-4 animate-fade-in text-left">
                      
                      {/* Personal information group */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex gap-2 items-center border-b pb-3">
                          <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center"><User size={14} /></span>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Informations Personnelles</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Titulaire de compte :</span>
                            <strong className="text-xs text-slate-800 font-bold uppercase">{transfer.firstName} {transfer.lastName}</strong>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Adresse e-mail :</span>
                            <strong className="text-xs text-slate-900 font-mono font-bold select-all">{transfer.email}</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Numéro de téléphone :</span>
                            <strong className="text-xs text-slate-800 font-mono font-bold">{transfer.phone}</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Pays de résidence :</span>
                            <strong className="text-xs text-slate-800 font-bold">{transfer.country}</strong>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Adresse de résidence administrative :</span>
                            <p className="text-xs text-slate-800 font-medium capitalize">{transfer.address || "Not Defined Adress home"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bank account specifications group */}
                      <div className="bg-white border border-slate-205 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex gap-2 items-center border-b pb-3">
                          <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center"><Building size={14} /></span>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Compte et virement</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Type de compte :</span>
                            <strong className="text-xs text-slate-800 font-bold uppercase">Professionnel</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Statut général réglementaire :</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-505 block animate-ping" /> Actif
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Canaux de virement supportés :</span>
                            <strong className="text-xs text-slate-800 font-bold">UMOA Classique Interbancaire</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">IBAN Associé ou Virtuel :</span>
                            <span className="text-rose-600 font-medium font-bold block">
                              {ibanInput ? ibanInput : "! Aucun IBAN enregistré"}
                            </span>
                          </div>
                        </div>

                        {/* Logout button */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => {
                              resetVirementWizard();
                              setCurrentScreen('LOGIN');
                              setInputPin('');
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition flex items-center gap-1"
                          >
                            ✖ Déconnexion
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* VISUAL COMPASS BACKED TABS FOOTER MENU FROM PORTAL */}
                <nav className="absolute bottom-5 left-3 right-3 sm:left-4 sm:right-4 h-16 bg-white border border-slate-300 rounded-2xl shadow-xl flex items-center justify-around font-sans shrink-0 z-20 select-none">
                  <button
                    onClick={() => setActiveTab('solde')}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-l-2xl cursor-pointer ${
                      activeTab === 'solde' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Coins size={18} />
                    <span className="text-[9px] font-bold block mt-1">Solde</span>
                    {activeTab === 'solde' && <span className="absolute bottom-0 left-10 right-10 h-0.5 bg-blue-600 rounded-full" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('carte')}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer ${
                      activeTab === 'carte' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[9px] font-bold block mt-1">Ma carte</span>
                    {activeTab === 'carte' && <span className="absolute bottom-0 left-10 right-10 h-0.5 bg-blue-600 rounded-full" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('virement')}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer ${
                      activeTab === 'virement' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <ArrowUpRight size={18} />
                    <span className="text-[9px] font-bold block mt-1">Virement</span>
                    {activeTab === 'virement' && <span className="absolute bottom-0 left-10 right-10 h-0.5 bg-blue-600 rounded-full" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('compte')}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-r-2xl cursor-pointer ${
                      activeTab === 'compte' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <User size={18} />
                    <span className="text-[9px] font-bold block mt-1">Mon compte</span>
                    {activeTab === 'compte' && <span className="absolute bottom-0 left-10 right-10 h-0.5 bg-blue-600 rounded-full" />}
                  </button>
                </nav>

              </div>
            )}

          </div>

        </div>

        {/* ========================================================= */}
        {/* MODAL 1: REGULATORY BLOCK FAILURE (EXACT REPLICA SCREEN 8) */}
        {/* ========================================================= */}
        {showFailureModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden border border-slate-300 shadow-2xl animate-scale-up text-left">
              
              {/* Giant high-contrast red header banner with X symbol */}
              <div className="bg-red-600 p-6 flex flex-col items-center justify-center text-white relative">
                <span className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center font-bold text-3xl select-none mb-1 shadow border border-white/20">✖</span>
                <h3 className="text-lg font-black uppercase font-sans mt-2 tracking-wider">Echec du virement</h3>
              </div>

              {/* Detail list items summary as seen on Screen 8 */}
              <div className="p-5 sm:p-6 space-y-4">
                
                <div className="bg-slate-50 border rounded-2xl p-4 space-y-2 text-xs text-slate-650 divide-y divide-slate-101">
                  <div className="flex justify-between py-1 rounded">
                    <span>Nom du bénéficiaire :</span>
                    <strong className="text-slate-900 capitalize font-extrabold">{beneficiaryNameInput}</strong>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5 font-sans">
                    <span>Banque de réception :</span>
                    <strong className="text-slate-900 font-extrabold">{bankNameInput}</strong>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5 font-mono">
                    <span>IBAN / Numéro de Compte :</span>
                    <strong className="text-indigo-650 tracking-wider font-bold">{ibanInput}</strong>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5 font-mono">
                    <span>Code Banque (BIC / SWIFT) :</span>
                    <strong className="text-slate-900 font-bold">{bicInput}</strong>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-sans select-all">
                    <span>Montant à recevoir :</span>
                    <strong className="text-slate-900 text-sm font-black">{transfer.amount.toLocaleString('fr-FR')} €</strong>
                  </div>
                </div>

                {/* Important red alert paragraph as requested */}
                <div className="bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded-r-xl flex items-start gap-2 text-rose-910">
                  <AlertTriangle className="text-rose-650 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs leading-relaxed font-semibold">
                    Echec du transfert un problème est survenu, veuillez contacter l'expéditeur ou le support transferwire. Cordialement
                  </p>
                </div>

                {/* Bottom button controls */}
                <div className="flex justify-end pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowFailureModal(false);
                      // Fall back to showing Step 3 inactive progress state visually on background
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:shadow transition"
                  >
                    Fermer
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: SUCCESS INTEGRATION COMPLETED 100%               */}
        {/* ========================================================= */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden border border-slate-300 shadow-2xl animate-scale-up text-left">
              
              <div className="bg-emerald-600 p-6 flex flex-col items-center justify-center text-white text-center">
                <span className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mb-1 shadow border border-white/25">✓</span>
                <h3 className="text-lg font-black uppercase font-sans mt-2 tracking-wider">Virement effectué !</h3>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-2xl text-emerald-800 text-xs leading-relaxed font-semibold">
                  Le routage interbancaire complété à 100% de compensation. Les fonds d'un montant net de <strong>{transfer.amount.toLocaleString('fr-FR')} €</strong> ont été approuvés par l'habilitation de sécurité.
                </div>

                <div className="bg-slate-50 border rounded-2xl p-4 space-y-2 text-xs text-slate-650 divide-y divide-slate-100 font-sans shadow-sm">
                  <div className="flex justify-between py-1">
                    <span>Destinataire agrégé :</span>
                    <strong className="text-slate-900 uppercase font-black">{beneficiaryNameInput}</strong>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5 font-mono">
                    <span>Compte de réception :</span>
                    <strong className="text-indigo-600 font-bold">{ibanInput}</strong>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      resetVirementWizard();
                      setActiveTab('solde');
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:shadow transition"
                  >
                    Retour au solde
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
