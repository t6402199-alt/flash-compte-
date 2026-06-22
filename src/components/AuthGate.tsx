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
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db, saveTransferToDb, getTransfersByEmailFromDb, findTransferByAnyField, getClientByTokenFromDb, authenticateClientViaFirestore, saveClientToDb, getClientByUidFromDb } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SimulatedTransfer, Client } from '../types';

const getPublicOrigin = () => {
  let origin = window.location.origin;
  // Convert private workspace dev container subdomains to the public preview/shared ones to prevent Google 403 authorization errors for clients on other phones/browsers
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin;
};

interface AuthGateProps {
  onAdminAuthenticated: (user: any) => void;
  onBypassAdmin: () => void;
  onBeneficiaryAuthenticated: (transfer: SimulatedTransfer) => void;
  onClientFirestoreAuthenticated?: (client: Client) => void;
  transfers: SimulatedTransfer[];
  onCreateToast: (msg: string) => void;
  initialTab?: 'beneficiary' | 'admin';
  onBackToHome?: () => void;
  isStrictClientMode?: boolean;
}

export default function AuthGate({ 
  onAdminAuthenticated, 
  onBypassAdmin, 
  onBeneficiaryAuthenticated, 
  onClientFirestoreAuthenticated,
  transfers,
  onCreateToast,
  initialTab = 'beneficiary',
  onBackToHome,
  isStrictClientMode = false
}: AuthGateProps) {
  const [activeTab, setActiveTab] = useState<'beneficiary' | 'admin'>(() => {
    return isStrictClientMode ? 'beneficiary' : 'admin';
  });

  // Sync state if initialTab prop changes
  React.useEffect(() => {
    setActiveTab(isStrictClientMode ? 'beneficiary' : 'admin');
  }, [isStrictClientMode]);

  // Check URL query parameters for admin bypass on mount
  React.useEffect(() => {
    setActiveTab(isStrictClientMode ? 'beneficiary' : 'admin');
  }, []);

  // Pre-fill email from secure URL token parameter if detected
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    if (token) {
      setBenAuthMode('firebase');
      setBenFirebaseMode('signin');
      const lookupClientByToken = async () => {
        try {
          const client = await getClientByTokenFromDb(token);
          if (client) {
            setBenEmail(client.email);
            onCreateToast(`Lien valide rattaché pour : ${client.email}`);
          }
        } catch (e) {
          console.error("Token lookup exception:", e);
        }
      };
      lookupClientByToken();
    }

    const cParam = searchParams.get('c') || searchParams.get('sid');
    if (cParam) {
      setBenAuthMode('pin');
      const lookupTransfer = async () => {
        try {
          const match = await findTransferByAnyField(cParam);
          if (match) {
            setBenId(match.email);
            setBenEmail(match.email);
            setBenPassword(match.codePin); // Automatically prefill the generated PIN code!
            if (match.firstName) {
              setDetectedClientName(`${match.firstName} ${match.lastName}`);
            }
            if (match.version === 'V2') {
              setIsV2Mode(true);
            }
            onCreateToast(`Dossier rattaché pour : ${match.email}`);
          }
        } catch (e) {
          console.error("Transfer lookup exception:", e);
        }
      };
      lookupTransfer();
    }
  }, []);
  
  // Beneficiary form state
  const [benAuthMode, setBenAuthMode] = useState<'pin' | 'firebase'>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('token')) return 'firebase';
    return 'pin';
  });
  const [benFirebaseMode, setBenFirebaseMode] = useState<'signin' | 'signup'>('signin');
  const [benId, setBenId] = useState('');
  const [benPin, setBenPin] = useState('');
  const [benShowPin, setBenShowPin] = useState(false);
  const [benEmail, setBenEmail] = useState('');
  const [benPassword, setBenPassword] = useState('');
  const [benShowPassword, setBenShowPassword] = useState(false);
  const [benError, setBenError] = useState<string | null>(null);
  const [benLoading, setBenLoading] = useState(false);

  // Client dynamic name lookup as they type
  const [detectedClientName, setDetectedClientName] = useState<string | null>(null);
  const [isV2Mode, setIsV2Mode] = useState(false);

  const handleClientEmailChange = async (emailVal: string) => {
    setBenEmail(emailVal);
    if (!emailVal || !emailVal.trim() || !emailVal.includes('@')) {
      setDetectedClientName(null);
      setIsV2Mode(false);
      return;
    }
    try {
      // 1. Try checking Firestore database transfers collection (Flash Compte entries) first
      const qTransfers = query(
        collection(db, 'transfers'),
        where("email", "==", emailVal.toLowerCase().trim())
      );
      const snapTransfers = await getDocs(qTransfers);
      if (!snapTransfers.empty) {
        const txDoc = snapTransfers.docs[0].data() as SimulatedTransfer;
        if (txDoc) {
          if (txDoc.firstName) {
            setDetectedClientName(`${txDoc.firstName} ${txDoc.lastName}`);
          }
          if (txDoc.version === 'V2') {
            setIsV2Mode(true);
          } else {
            setIsV2Mode(false);
          }
          return;
        }
      }

      // 2. Try checking standard Client registration
      const q = query(
        collection(db, 'clients'), 
        where("email", "==", emailVal.toLowerCase().trim())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const clientDoc = snap.docs[0].data() as Client;
        if (clientDoc) {
          if (clientDoc.name) {
            setDetectedClientName(clientDoc.name);
          }
          // Check if there is a matching transfer linked to this email to see if it's V2
          const localMatch = transfers.find(t => t.email.toLowerCase().trim() === emailVal.toLowerCase().trim());
          if (localMatch && localMatch.version === 'V2') {
            setIsV2Mode(true);
          } else {
            setIsV2Mode(false);
          }
        }
      } else {
        // Double check local transfers if offline/caching of list exists
        const localMatch = transfers.find(t => t.email.toLowerCase().trim() === emailVal.toLowerCase().trim());
        if (localMatch) {
          if (localMatch.firstName) {
            setDetectedClientName(`${localMatch.firstName} ${localMatch.lastName}`);
          }
          setIsV2Mode(localMatch.version === 'V2');
        } else {
          setDetectedClientName(null);
          setIsV2Mode(false);
        }
      }
    } catch (e) {
      console.warn("Real-time name search query skipped/warning:", e);
      setDetectedClientName(null);
      setIsV2Mode(false);
    }
  };

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMode, setAdminMode] = useState<'signin' | 'signup'>('signin');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Admin recovery state
  const [adminForgotPasswordMode, setAdminForgotPasswordMode] = useState(false);
  const [adminResetEmail, setAdminResetEmail] = useState('');
  const [adminResetSuccessMessage, setAdminResetSuccessMessage] = useState<string | null>(null);
  const [adminResetErrorMessage, setAdminResetErrorMessage] = useState<string | null>(null);

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminResetErrorMessage(null);
    setAdminResetSuccessMessage(null);
    if (!adminResetEmail.trim()) {
      setAdminResetErrorMessage("Veuillez saisir votre adresse e-mail administrateur.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, adminResetEmail.trim());
      setAdminResetSuccessMessage("Lien de récupération envoyé ! Veuillez consulter votre messagerie électronique (vérifiez également les spams).");
      onCreateToast("E-mail de récupération envoyé avec succès !");
    } catch (err: any) {
      console.error("Password reset error:", err);
      let errorText = "Une erreur est survenue lors de l'envoi de l'e-mail de récupération.";
      if (err.code === 'auth/user-not-found') {
        errorText = "Aucun utilisateur trouvé avec cette adresse e-mail.";
      } else if (err.code === 'auth/invalid-email') {
        errorText = "L'adresse e-mail saisie est invalide.";
      }
      setAdminResetErrorMessage(errorText);
    }
  };

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
                        t.id.toLowerCase().replace('tx-', '') === benId.trim().toLowerCase() ||
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

  // Beneficiary submit handler (Unified: supports both SimulatedTransfer PIN code and Firebase/Firestore client auth)
  const handleBeneficiaryFirebaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenError(null);
    setBenLoading(true);

    const emailVal = benEmail.trim().toLowerCase();
    const codeVal = benPassword.trim(); // Stored as the user's input password or codePin

    if (!emailVal || !codeVal) {
      setBenError("L'adresse e-mail et le code d'accès sont requis.");
      setBenLoading(false);
      return;
    }

    try {
      // 1. Try checking SimulatedTransfer (Flash Compte) first, as requested!
      // Find transfer matching this email and codePin
      let transferMatch: SimulatedTransfer | null = null;
      
      // Look in the local list first
      transferMatch = transfers.find(t => 
        t.email.trim().toLowerCase() === emailVal && t.codePin === codeVal
      ) || null;

      // If not found locally, query from database
      if (!transferMatch) {
        // Find transfer matching the email
        const potentialTx = await findTransferByAnyField(emailVal);
        if (potentialTx && potentialTx.codePin === codeVal) {
          transferMatch = potentialTx;
        }
      }

      if (transferMatch) {
         if (transferMatch.isBlocked && !isStrictClientMode) {
           // Allow blocked logins in strict client mode so they can see the blockage details page as targeted!
           setBenError("Accès suspendu. Veuillez contacter le support de virement pour débloquer votre dossier.");
         } else {
           onCreateToast(`Connexion bénéficiaire réussie !`);
           onBeneficiaryAuthenticated(transferMatch);
         }
         setBenLoading(false);
         return;
      }

      // 2. If no transfer PIN match, fallback to standard Client Firebase Authentications / Firestore
      let clientDoc: Client | null = null;
      
      // Log in with standard Firebase Authentication on main instance
      try {
        const userCreds = await signInWithEmailAndPassword(auth, emailVal, codeVal);
        const uid = userCreds.user.uid;
        clientDoc = await getClientByUidFromDb(uid);
      } catch (authErr) {
        console.log("Firebase Auth failed, trying direct Firestore codeClient login:", authErr);
      }

      // Fallback to direct Firestore collection credentials matching (very useful for legacy code pin accounts)
      if (!clientDoc) {
        clientDoc = await authenticateClientViaFirestore(emailVal, codeVal);
      }

      if (clientDoc) {
        if (clientDoc.statut !== 'actif') {
          setBenError("Votre espace client est boqué. Veuillez contacter l'administrateur.");
          setBenLoading(false);
          return;
        }

        onCreateToast(`Connexion Espace Client réussie !`);
        if (onClientFirestoreAuthenticated) {
          onClientFirestoreAuthenticated(clientDoc);
        }
      } else {
        setBenError("Identifiants de connexion incorrects. Veuillez vérifier l'adresse e-mail et le code PIN.");
      }
    } catch (err: any) {
      console.error("Client login exception: ", err);
      let localizedError = err.message || "Une erreur est survenue lors de l'authentification.";
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
        const uid = userCredential.user.uid;
        
        // Generate a random client token and 1-year expiration date
        const clientToken = 'tk_' + Math.random().toString(36).substring(2, 15);
        const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
        
        const newAdminDoc: Client = {
          uid,
          email: adminEmail.trim().toLowerCase(),
          token: clientToken,
          codeClient: adminPassword.trim(), // Storing client access code password
          pin: adminPassword.trim(),
          statut: 'actif',
          montant: 0,
          dateExpiration: expirationDate,
          createdAt: Date.now(),
          role: 'admin',
          plan: 'vip'
        };
        
        await saveClientToDb(newAdminDoc);

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
        
        {onBackToHome && !isStrictClientMode && (
          <button
            onClick={onBackToHome}
            type="button"
            className="absolute top-5 right-5 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer transition select-none z-10"
            title="Retour à l'accueil du site"
          >
            <span className="text-[11px] font-bold px-1.5 py-0.5">✕</span>
          </button>
        )}

        {/* Brand Header & Logo */}
        <div className="flex flex-col items-center mb-6">
          {isV2Mode ? (
            <div className="flex flex-col items-center select-none font-sans focus:outline-none">
              <div className="h-16 w-16 bg-[#0B69C1] rounded-full flex items-center justify-center text-white font-serif text-[42px] font-extrabold shadow-md mb-2">
                V
              </div>
              <span className="text-2xl font-black tracking-wider text-slate-900">VANTEX</span>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center gap-2 select-none font-sans focus:outline-none"
              title="KitsCms Platform"
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
          )}
        </div>

        {/* SaaS Admin Access */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            {adminForgotPasswordMode ? (
              // Password Reset Mode for Operator/Admin
              <div className="space-y-4 text-left animate-fade-in">
                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    Récupération de mot de passe
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Saisissez votre adresse e-mail d'administrateur pour recevoir un lien de réinitialisation.
                  </p>
                </div>

                {adminResetErrorMessage && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-600">
                    ⚠️ {adminResetErrorMessage}
                  </div>
                )}

                {adminResetSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-3 text-xs text-emerald-600">
                    ✔️ {adminResetSuccessMessage}
                  </div>
                )}

                <form onSubmit={handleAdminResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase block">
                      E-mail Administrateur
                    </label>
                    <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition bg-white shadow-sm">
                      <div className="bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-center text-slate-400 shrink-0">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        required
                        value={adminResetEmail}
                        onChange={(e) => setAdminResetEmail(e.target.value)}
                        className="w-full bg-white px-4 py-3 text-xs text-slate-800 font-medium focus:outline-none"
                        placeholder="nom@exemple.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-md flex items-center justify-center gap-1.5 mt-2"
                  >
                    Envoyer le lien de récupération
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminForgotPasswordMode(false);
                        setAdminResetErrorMessage(null);
                        setAdminResetSuccessMessage(null);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-600 font-extrabold cursor-pointer bg-transparent border-none"
                    >
                      👈 Retour à la connexion opérateur
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Standard Admin Sign-In / Sign-Up
              <>
                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    {adminMode === 'signin' ? "Administration Opérateur" : "Inscription Administration"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {adminMode === 'signin' ? "Accès réservé aux gestionnaires de conformité" : "Créer un nouveau compte administrateur / opérateur"}
                  </p>
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

                <form onSubmit={handleAdminSubmit} className="space-y-4 text-left animate-fade-in">
                  
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
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase block">
                        Mot de Passe
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminForgotPasswordMode(true);
                          setAdminResetEmail(adminEmail);
                        }}
                        className="text-[10px] text-blue-500 hover:text-blue-600 font-bold bg-transparent border-none cursor-pointer"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
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
                        placeholder={adminMode === 'signin' ? "Mot de passe" : "Définir un mot de passe (min. 6 car.)"}
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

                  <div className="flex items-center justify-end text-[11px] pt-1">
                    <span className="text-slate-400 font-mono">Firebase Auth</span>
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-md flex items-center justify-center gap-1.5 mt-2"
                  >
                    {adminLoading ? "Traitement..." : adminMode === 'signin' ? "Connexion administration" : "Créer le compte administration"}
                  </button>

                  <div className="flex flex-col sm:flex-row justify-between items-center text-xs mt-2 pt-1 gap-1 text-slate-400 font-medium">
                    <span>
                      {adminMode === 'signin' ? "Pas encore de compte ?" : "Déjà enregistré ?"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminMode(adminMode === 'signin' ? 'signup' : 'signin');
                        setAdminError(null);
                        setAdminSuccess(null);
                      }}
                      className="text-blue-500 hover:text-blue-600 font-black transition cursor-pointer select-none"
                    >
                      {adminMode === 'signin' ? "👉 Créer un nouveau" : "👉 Se connecter maintenant"}
                    </button>
                  </div>
                </form>

                <div className="pt-4 border-t border-slate-101 text-center">
                  {onBackToHome && (
                    <button 
                      type="button" 
                      onClick={onBackToHome} 
                      className="text-[11px] text-slate-450 hover:text-blue-600 font-semibold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer select-none"
                    >
                      🏠 Retourner à la page d'accueil du site
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Espace Client / Beneficiary Pure Access */}
        {activeTab === 'beneficiary' && (
          <div className="space-y-4">
            <div className="text-center">
              {isV2Mode ? (
                <>
                  {detectedClientName ? (
                    <div className="py-2 px-3 bg-blue-50 text-[#0B69C1] rounded-2xl font-bold text-sm tracking-tight inline-block mb-2">
                       Bienvenue, {detectedClientName}
                    </div>
                  ) : (
                    <h3 className="text-lg font-black text-slate-900 mb-1">
                      Espace Client Personnel
                    </h3>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Saisissez vos accès pour consulter vos comptes de dépôt
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    Espace Client Sécurisé
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connectez-vous avec vos identifiants d'accès ou code fonctionnel générés.
                  </p>
                </>
              )}
            </div>

            {benError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-600">
                ⚠️ {benError}
              </div>
            )}

            {detectedClientName && (
              <div className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 select-none animate-pulse ${
                isV2Mode 
                  ? 'bg-[#0d2a23] border-[#1b4d3e] text-[#10b981]' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span>👤</span>
                <span>Bonjour, <span className="uppercase font-extrabold">{detectedClientName}</span></span>
              </div>
            )}

            <form onSubmit={handleBeneficiaryFirebaseSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase block">
                  {isV2Mode ? "Votre adresse e-mail" : "Adresse e-mail client"}
                </label>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0B69C1] transition bg-white shadow-sm">
                  <div className="bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    value={benEmail}
                    onChange={(e) => handleClientEmailChange(e.target.value)}
                    className="w-full bg-white px-4 py-3 text-xs text-slate-800 font-medium focus:outline-none"
                    placeholder={isV2Mode ? "Ex: samuel.bello@gmail.com" : "Saisissez votre e-mail"}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase block">
                  {isV2Mode ? "Votre code pin" : "Code Personnel / Fonctionnel"}
                </label>
                <div className="relative flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0B69C1] transition bg-white shadow-sm">
                  <div className="bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-center text-slate-400 shrink-0">
                    <Lock size={15} />
                  </div>
                  <input
                    type={benShowPassword ? "text" : "password"}
                    required
                    value={benPassword}
                    onChange={(e) => setBenPassword(e.target.value)}
                    className="w-full bg-white px-4 py-3 text-xs text-slate-800 font-medium focus:outline-none"
                    placeholder={isV2Mode ? "Code PIN d'accès" : "Saisissez votre code d'accès"}
                  />
                  <button
                    type="button"
                    onClick={() => setBenShowPassword(!benShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {benShowPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={benLoading}
                className={`w-full py-3.5 ${
                  isV2Mode ? 'bg-[#0B69C1] hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-750'
                } disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-md flex items-center justify-center gap-1.5 mt-2`}
              >
                {benLoading ? "Connexion..." : isV2Mode ? "Se connecter →" : "Se connecter"}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
