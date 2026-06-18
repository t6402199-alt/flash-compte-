import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldAlert, 
  Zap, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle,
  HelpCircle,
  Key
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, saveTransferToDb, getTransfersByEmailFromDb, findTransferByAnyField } from '../lib/firebase';
import { SimulatedTransfer } from '../types';

interface AuthGateProps {
  onAdminAuthenticated: (user: any) => void;
  onBypassAdmin: () => void;
  onBeneficiaryAuthenticated: (transfer: SimulatedTransfer) => void;
  transfers: SimulatedTransfer[];
  onCreateToast: (msg: string) => void;
}

export default function AuthGate({ 
  onAdminAuthenticated, 
  onBypassAdmin, 
  onBeneficiaryAuthenticated, 
  transfers,
  onCreateToast
}: AuthGateProps) {
  const [activeTab, setActiveTab] = useState<'beneficiary' | 'admin'>('beneficiary');
  
  // Beneficiary form state
  const [benAuthMode, setBenAuthMode] = useState<'pin' | 'firebase'>('pin');
  const [benFirebaseMode, setBenFirebaseMode] = useState<'signin' | 'signup'>('signin');
  const [benId, setBenId] = useState('');
  const [benPin, setBenPin] = useState('');
  const [benShowPin, setBenShowPin] = useState(false);
  const [benEmail, setBenEmail] = useState('');
  const [benPassword, setBenPassword] = useState('');
  const [benShowPassword, setBenShowPassword] = useState(false);
  const [benError, setBenError] = useState<string | null>(null);
  const [benLoading, setBenLoading] = useState(false);

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMode, setAdminMode] = useState<'signin' | 'signup'>('signin');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Beneficiary submit handler (PIN)
  const handleBeneficiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenError(null);
    setBenLoading(true);

    if (!benId.trim() || !benPin.trim()) {
      setBenError("Veuillez remplir tous les champs requis.");
      setBenLoading(false);
      return;
    }

    try {
      // 1. Find locally
      let match = transfers.find(t => {
        const idMatch = t.id.toLowerCase() === benId.trim().toLowerCase() ||
                        `tx-${t.id.toLowerCase()}` === benId.trim().toLowerCase();
        const emailMatch = t.email.trim().toLowerCase() === benId.trim().toLowerCase();
        const refMatch = t.reference?.toLowerCase() === benId.trim().toLowerCase();
        const phoneMatch = t.phone.replace(/\s+/g, '') === benId.trim().replace(/\s+/g, '');

        return (idMatch || emailMatch || refMatch || phoneMatch) && t.codePin === benPin.trim();
      });

      // 2. Direct Firestore search queries if missing locally (crucial for new browsers/cold devices)
      if (!match) {
        match = await findTransferByAnyField(benId);
        if (match && match.codePin !== benPin.trim()) {
          match = null;
        }
      }

      if (match) {
        if (match.isBlocked) {
          setBenError("Accès suspendu. Veuillez contacter le support de virement pour débloquer votre dossier.");
        } else {
          onCreateToast(`Connexion bénéficiaire réussie !`);
          onBeneficiaryAuthenticated(match);
        }
      } else {
        setBenError("Identifiant de transfert ou code PIN incorrect. Veuillez vérifier vos accès.");
      }
    } catch (err: any) {
      setBenError(err.message || "Une erreur est survenue lors de la validation.");
    } finally {
      setBenLoading(false);
    }
  };

  // Beneficiary submit handler (Firebase Auth)
  const handleBeneficiaryFirebaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenError(null);
    setBenLoading(true);

    if (!benEmail.trim() || !benPassword.trim()) {
      setBenError("L'adresse e-mail et le mot de passe sont requis.");
      setBenLoading(false);
      return;
    }

    try {
      let userCredential;
      if (benFirebaseMode === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, benEmail.trim(), benPassword);
        onCreateToast("Votre compte client a été créé avec Firebase ✔️ !");
      } else {
        userCredential = await signInWithEmailAndPassword(auth, benEmail.trim(), benPassword);
        onCreateToast("Connexion réussie via Firebase Auth ✔️ !");
      }

      const email = userCredential.user.email || benEmail.trim();
      
      // Look up existing transfers matching this email in Firestore
      const matches = await getTransfersByEmailFromDb(email);
      let match = matches.length > 0 ? matches[0] : null;

      // If no transfer dossier exists yet for this client email, automatically seed a realistic dossier!
      if (!match) {
        const seededId = `tx-seeded-${Date.now()}`;
        match = {
          id: seededId,
          version: 'V1',
          lastName: 'CLENT',
          firstName: email.split('@')[0],
          country: 'France (+33)',
          phone: '+33 6 12 34 56 78',
          email: email.toLowerCase(),
          address: 'Avenue des Champs-Élysées, Paris',
          language: 'Français',
          senderBank: 'TRANSFERWIRE SECURE PLATFORM',
          amount: 10000,
          currency: 'EUR (€)',
          startPercentage: 15,
          stopPercentage: 50,
          customMessage: "Fonds prêts pour virement. Veuillez valider le transfert vers votre compte de destination.",
          emailAlert: true,
          smsAlert: false,
          codePin: '123456',
          isBlocked: false,
          senderName: 'Service des Vires Securisés',
          recipientName: email.split('@')[0].toUpperCase() + ' Client',
          recipientBank: 'Société Générale',
          recipientAccount: 'FR76 3000 3021 3456 7890 123',
          type: 'BANK_WIRE',
          reference: `TRW-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: new Date().toISOString(),
          status: 'SUCCESS',
          delaySeconds: 4,
          otpCode: '',
          feePercent: 1.2,
          isCompleted: false,
          generatedUrl: `${window.location.origin}/?c=${seededId}`
        };
        // Persist to DB directly using saveTransferToDb
        await saveTransferToDb(match);
        onCreateToast("Nouveau dossier de simulation €10,000 généré pour vos essais !");
      }

      if (match.isBlocked) {
        setBenError("Accès suspendu. Veuillez contacter le support de virement pour débloquer votre dossier.");
      } else {
        onBeneficiaryAuthenticated(match);
      }
    } catch (err: any) {
      console.error("Client Auth Exception:", err);
      let localizedError = "Échec de l'authentification client. Veuillez vérifier vos accès.";
      if (err.code === 'auth/email-already-in-use') {
        localizedError = "Cette adresse e-mail est déjà associée à un compte client.";
      } else if (err.code === 'auth/invalid-email') {
        localizedError = "L'adresse e-mail fourine est invalide.";
      } else if (err.code === 'auth/weak-password') {
        localizedError = "Le mot de passe de compte doit comporter au moins 6 caractères.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = "Adresse e-mail ou mot de passe incorrect.";
      } else {
        localizedError = err.message || localizedError;
      }
      setBenError(localizedError);
    } finally {
      setBenLoading(false);
    }
  };

  // Admin Firebase Auth submit handler
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);
    setAdminLoading(true);

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError("L'adresse e-mail et le mot de passe sont requis.");
      setAdminLoading(false);
      return;
    }

    try {
      if (adminMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
        setAdminSuccess("Votre compte opérateur a été créé avec succès ✔️ ! Vous êtes maintenant connecté.");
        onCreateToast("Création de compte réussie !");
        setTimeout(() => {
          onAdminAuthenticated(userCredential.user);
        }, 1200);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
        onCreateToast("Connexion administrateur réussie !");
        onAdminAuthenticated(userCredential.user);
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let localizedError = "Échec de l'authentification. Veuillez vérifier vos identifiants.";
      if (err.code === 'auth/email-already-in-use') {
        localizedError = "Cette adresse e-mail est déjà associée à un compte administrateur.";
      } else if (err.code === 'auth/invalid-email') {
        localizedError = "L'adresse e-mail fournie est invalide.";
      } else if (err.code === 'auth/weak-password') {
        localizedError = "Le mot de passe doit comporter au moins 6 caractères.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = "Identifiants invalides ou incorrects.";
      }
      setAdminError(localizedError);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Background radial spotlight and grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(37,99,235,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main card wrapper container */}
      <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl backdrop-blur-md overflow-hidden animate-scale-up">
        
        {/* Glow detail accents */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 animate-pulse">
            <Zap className="text-white fill-amber-300/30" size={24} />
          </div>
          <h2 className="text-2xl font-bold font-display text-white tracking-tight">Portail de Connexion</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Espace sécurisé FlashConnect. Veuillez choisir votre canal pour vous connecter.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 bg-slate-950 border border-slate-800 rounded-2xl p-1 mb-6">
          <button
            onClick={() => {
              setActiveTab('beneficiary');
              setBenError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'beneficiary' 
                ? 'bg-slate-900 border border-slate-800 text-blue-400 font-medium' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={15} />
            Espace Bénéficiaire
          </button>
          
          <button
            onClick={() => {
              setActiveTab('admin');
              setAdminError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-slate-900 border border-slate-800 text-blue-400 font-medium' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert size={15} />
            Administrateur (SaaS)
          </button>
        </div>

        {/* Tab 1: Beneficiary Access */}
        {activeTab === 'beneficiary' && (
          <div className="space-y-4">
            
            {/* Sub-tabs for Beneficiary login styles */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 mb-2">
              <button
                type="button"
                onClick={() => {
                  setBenAuthMode('pin');
                  setBenError(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition ${
                  benAuthMode === 'pin' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Accès Rapide PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setBenAuthMode('firebase');
                  setBenError(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1 ${
                  benAuthMode === 'firebase' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Espace client Firebase</span>
                <span className="bg-blue-500/20 text-[8px] px-1 rounded text-blue-300">Nouveau</span>
              </button>
            </div>

            {benError && (
              <div className="bg-red-950/40 border border-red-900/30 rounded-2xl p-3.5 flex items-start gap-2 text-xs text-red-400 leading-relaxed">
                <span>⚠️ {benError}</span>
              </div>
            )}

            {benAuthMode === 'pin' ? (
              <form onSubmit={handleBeneficiarySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase block">
                    Identifiant Généré <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <Mail size={15} />
                    </span>
                    <input
                      type="text"
                      required
                      value={benId}
                      onChange={(e) => setBenId(e.target.value)}
                      placeholder="Ex: Votre Email ou Référence (ex: TRW-...)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Saisissez l'e-mail indiqué lors de la création du virement ou votre référence unique.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase block">
                    Code PIN du Virement <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <Key size={15} />
                    </span>
                    <input
                      type={benShowPin ? "text" : "password"}
                      required
                      value={benPin}
                      onChange={(e) => setBenPin(e.target.value)}
                      placeholder="Saisissez votre code PIN (ex : 6 chiffres)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setBenShowPin(!benShowPin)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
                    >
                      {benShowPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Le mot de passe de déverrouillage de virement émis par votre gestionnaire.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={benLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase cursor-pointer transition shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  {benLoading ? "Validation en cours..." : "Valider mes accès de virement"}
                  <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleBeneficiaryFirebaseSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase block">
                    Email Espace Client <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      required
                      value={benEmail}
                      onChange={(e) => setBenEmail(e.target.value)}
                      placeholder="client@mail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase block">
                    Mot de passe Firebase <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type={benShowPassword ? "text" : "password"}
                      required
                      value={benPassword}
                      onChange={(e) => setBenPassword(e.target.value)}
                      placeholder="Saisissez un mot de passe (min. 6 car.)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setBenShowPassword(!benShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
                    >
                      {benShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBenFirebaseMode(benFirebaseMode === 'signin' ? 'signup' : 'signin');
                      setBenError(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-bold transition hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    {benFirebaseMode === 'signin' 
                      ? "Créer un compte client" 
                      : "Déjà membre client ? Se connecter"}
                  </button>
                  <span className="text-slate-500 font-mono text-[10px]">Espace Client Firebase</span>
                </div>

                <button
                  type="submit"
                  disabled={benLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase cursor-pointer transition shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  {benLoading ? "Traitement Firebase..." : (
                    benFirebaseMode === 'signin' ? "Connexion Espace Client" : "Créer mon Compte Client"
                  )}
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: SaaS Admin Access */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            
            {adminError && (
              <div className="bg-red-950/40 border border-red-905/30 rounded-2xl p-3.5 text-xs text-red-400">
                ⚠️ {adminError}
              </div>
            )}

            {adminSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-905/30 rounded-2xl p-3.5 text-xs text-emerald-400 flex items-start gap-2">
                <CheckCircle size={15} className="mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase block">
                Email Administrateur <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@flash-compte.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase block">
                Mot de Passe Administrateur <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock size={15} />
                </span>
                <input
                  type={adminShowPassword ? "text" : "password"}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setAdminShowPassword(!adminShowPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
                >
                  {adminShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={() => {
                  setAdminMode(adminMode === 'signin' ? 'signup' : 'signin');
                  setAdminError(null);
                  setAdminSuccess(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-bold transition hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                {adminMode === 'signin' 
                  ? "Créer un compte opérateur" 
                  : "Déjà un compte ? Connectez-vous"}
              </button>
              <span className="text-slate-500 font-mono">Firebase Secure</span>
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase cursor-pointer transition shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 mt-2"
            >
              {adminLoading ? "Traitement avec Firebase..." : (
                adminMode === 'signin' ? "Connexion administration" : "Créer mon compte"
              )}
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Demo Fast Sandbox Entry Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-850 flex flex-col items-center select-none">
          <p className="text-[10px] text-slate-500 text-center mb-2 font-medium">
            Entrée rapide de démonstration pour inspecter les outils d'évaluation
          </p>
          <button
            onClick={onBypassAdmin}
            className="w-full py-2 border border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-950/20 text-slate-400 hover:text-blue-400 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Zap className="text-amber-400 fill-amber-400/20" size={13} />
            Accéder directement sans mot de passe (Version Demo)
          </button>
        </div>

      </div>

      {/* Aesthetic credentials tips footer */}
      <div className="mt-4 text-center select-none text-[10px] text-slate-600 font-mono flex items-center gap-1">
        <HelpCircle size={12} />
        <span>Astuce : Un client se connecte à sa simulation en saisissant son e-mail & PIN générés</span>
      </div>

    </div>
  );
}
