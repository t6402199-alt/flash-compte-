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

  // Check URL query parameters for admin bypass on mount
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('admin') === 'true') {
      setActiveTab('admin');
    }
  }, []);
  
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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Main card wrapper container styled exactly like Photo 2 */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden animate-scale-up">
        
        {/* Brand Header & Logo from Photo 2 */}
        <div className="flex flex-col items-center mb-6">
          <div 
            onClick={() => setActiveTab(activeTab === 'beneficiary' ? 'admin' : 'beneficiary')}
            className="flex items-center justify-center gap-2 select-none font-sans cursor-pointer focus:outline-none"
            title="TRANSFERWIRE"
          >
            <svg className="w-14 h-14 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="18" r="4.5" fill="#10B981" />
              <circle cx="64" cy="22" r="5" fill="#34D399" />
              <circle cx="76" cy="32" r="5.5" fill="#059669" />
              <circle cx="82" cy="46" r="6" fill="#3B82F6" />
              <circle cx="80" cy="61" r="5.5" fill="#2563EB" />
              <circle cx="72" cy="74" r="5" fill="#1D4ED8" />
              <circle cx="59" cy="81" r="4.5" fill="#1E40AF" />
              <circle cx="45" cy="81" r="4.5" fill="#0284C7" />
              <circle cx="31" cy="74" r="5" fill="#0EA5E9" />
              <circle cx="21" cy="62" r="5.5" fill="#38BDF8" />
              <circle cx="18" cy="47" r="6" fill="#10B981" />
              <circle cx="22" cy="33" r="5" fill="#6EE7B7" />
              <circle cx="32" cy="22" r="4" fill="#A7F3D0" />
              <circle cx="48" cy="42" r="6" fill="#059669" />
              <circle cx="58" cy="46" r="5.5" fill="#10B981" />
              <circle cx="62" cy="56" r="5" fill="#2563EB" />
              <circle cx="54" cy="64" r="5.5" fill="#3B82F6" />
              <circle cx="44" cy="61" r="6" fill="#0284C7" />
              <circle cx="38" cy="51" r="5" fill="#34D399" />
            </svg>
            <span className="text-2xl font-black tracking-wider text-[#0F62FE]">TRANSFERWIRE</span>
          </div>
        </div>

        {/* Tab 1: Beneficiary Access */}
        {activeTab === 'beneficiary' && (
          <div className="space-y-5 text-center">
            
            <h3 className="text-lg font-black text-slate-900 mb-1 font-sans">Connexion à votre compte</h3>
            
            {/* User profile capsule banner row as on Photo 2 */}
            <div className="my-4 inline-flex items-center gap-2 px-5 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 select-none shadow-sm uppercase tracking-wide">
              <User className="text-slate-500" size={13} />
              ACCÈS CONFORMITÉ CLIENT
            </div>

            {benError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-left text-xs font-semibold text-rose-600 leading-relaxed">
                <span>⚠️ {benError}</span>
              </div>
            )}

            <form onSubmit={handleBeneficiarySubmit} className="space-y-4 text-left">
              {/* E-mail Input block (No labels, empty placeholder code, gray icon) */}
              <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition bg-white shadow-sm">
                <div className="bg-slate-50 border-r border-slate-200 px-4 py-3.5 flex items-center justify-center text-slate-400 shrink-0 select-none">
                  <Mail size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={benId}
                  onChange={(e) => setBenId(e.target.value)}
                  className="w-full bg-white px-4 py-3.5 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none"
                  placeholder=""
                />
              </div>

              {/* PIN Access Code block (No labels, empty placeholder, dual-colored layout) */}
              <div className="relative flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition bg-white shadow-sm">
                <div className="bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-center text-slate-400 shrink-0 select-none">
                  <Lock size={15} />
                </div>
                <input
                  type={benShowPin ? "text" : "password"}
                  required
                  value={benPin}
                  onChange={(e) => setBenPin(e.target.value)}
                  className="w-full bg-white px-4 py-3.5 text-xs sm:text-sm text-slate-800 font-mono font-bold tracking-widest focus:outline-none"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setBenShowPin(!benShowPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {benShowPin ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={benLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-1 font-semibold uppercase tracking-wide"
              >
                {benLoading ? "Connexion..." : "se connecter"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: SaaS Admin Access */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 mb-1">Administration Opérateur</h3>
              <p className="text-[11px] text-slate-500">Accès réservé aux gestionnaires de conformité</p>
            </div>

            {adminError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-600">
                ⚠️ {adminError}
              </div>
            )}

            {adminSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-3 text-xs text-emerald-600 flex items-start gap-2">
                <CheckCircle size={15} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4 text-left">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase block">
                  Identifiant Admin
                </label>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition bg-white shadow-sm">
                  <div className="bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-white px-4 py-3 text-xs text-slate-800 font-medium focus:outline-none"
                    placeholder="E-mail"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase block">
                  Mot de Passe
                </label>
                <div className="relative flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition bg-white shadow-sm">
                  <div className="bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-center text-slate-400 shrink-0">
                    <Lock size={15} />
                  </div>
                  <input
                    type={adminShowPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-white px-4 py-3 text-xs text-slate-800 font-medium focus:outline-none"
                    placeholder="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setAdminShowPassword(!adminShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-660 cursor-pointer"
                  >
                    {adminShowPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                  className="text-blue-600 hover:text-blue-700 font-bold transition hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  {adminMode === 'signin' 
                    ? "Créer un compte opérateur" 
                    : "Retour à l'authentification"}
                </button>
                <span className="text-slate-400 font-mono">Firebase</span>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-md flex items-center justify-center gap-1.5 mt-2"
              >
                {adminLoading ? "Traitement..." : (
                  adminMode === 'signin' ? "Connexion administration" : "Créer le compte"
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button 
                type="button" 
                onClick={() => setActiveTab('beneficiary')} 
                className="text-xs text-gray-500 hover:text-blue-600 font-bold transition cursor-pointer select-none"
              >
                ← Retour à l'Espace Client
              </button>
            </div>

            {/* Quick Demo Access Bypass Button */}
            <div className="pt-2 flex flex-col items-center">
              <button
                onClick={onBypassAdmin}
                className="w-full py-2 border border-dashed border-slate-300 hover:border-blue-500/50 hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-xl text-[10px] font-bold cursor-pointer transition-all duration-200"
              >
                ⚡ Entrée de démonstration rapide (Contourner l'Admin)
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
