import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  X, 
  Bell, 
  Coins, 
  CheckCircle, 
  Smartphone,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SmsCampaign from './components/SmsCampaign';
import EmailCampaign from './components/EmailCampaign';
import ContactsManager from './components/ContactsManager';
import BillingManager from './components/BillingManager';
import FlashCompteV1 from './components/FlashCompteV1';
import FlashCompteV2 from './components/FlashCompteV2';
import HistoryPanel from './components/HistoryPanel';
import SimulatedBankPortal from './components/SimulatedBankPortal';
import AuthGate from './components/AuthGate';
import LandingPage from './components/LandingPage';
import ClientPortal from './components/ClientPortal';
import AdminClientsManager from './components/AdminClientsManager';
import { Contact, CampaignLog, PaymentTransaction, SimulatedTransfer, Client } from './types';
import { 
  getTransfersFromDb, 
  saveTransferToDb, 
  deleteTransferFromDb,
  getContactsFromDb, 
  saveContactToDb, 
  deleteContactFromDb,
  getCampaignsFromDb, 
  saveCampaignToDb, 
  getTransactionsFromDb, 
  saveTransactionToDb, 
  getBalanceFromDb, 
  saveBalanceToDb,
  getTransferByIdFromDb,
  findTransferByAnyField,
  getTransfersByEmailFromDb,
  saveClientToDb,
  getClientByUidFromDb,
  db,
  auth
} from './lib/firebase';
import { onSnapshot, collection, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const getPublicOrigin = () => window.location.origin;

export default function App() {
  // Navigation & Screen Controller
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [liveSimulationTx, setLiveSimulationTx] = useState<SimulatedTransfer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasClientQuery = searchParams.get('sid') || 
                           searchParams.get('c') || 
                           searchParams.get('portal') || 
                           searchParams.get('token') || 
                           window.location.pathname.includes('/espace-client');
    return !hasClientQuery;
  });
  const [authGateTab, setAuthGateTab] = useState<'beneficiary' | 'admin'>('beneficiary');
  
  // Modals
  const [quickTrialModal, setQuickTrialModal] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(() => {
    return localStorage.getItem('user_role') as 'admin' | 'client' | null;
  });
  const [clientProfile, setClientProfile] = useState<Client | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [bypassAdmin, setBypassAdmin] = useState<boolean>(false);

  // Sync client profile details in real-time if role is client
  useEffect(() => {
    if (!currentUser || userRole !== 'client') {
      setClientProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'clients', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Client;
        setClientProfile(data);
        if (data.statut !== 'actif') {
          alert("Votre compte FLASHCOMPTE PRO a été bloqué par un administrateur.");
          signOut(auth);
          handleLogout();
        }
      }
    });
    return () => unsub();
  }, [currentUser, userRole]);

  // Subscribe to Firebase Authentication state change
  useEffect(() => {
    // Force end loading after 300ms fallback to open the app automatically and instantly
    const forceTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 300);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(forceTimer);
      setCurrentUser(user);
      if (user) {
        setShowLandingPage(false);
        try {
          const clientRef = doc(db, 'clients', user.uid);
          const clientSnap = await getDoc(clientRef);
          
          if (clientSnap.exists()) {
            const clientData = clientSnap.data() as Client;
            
            if (clientData.statut !== 'actif') {
              alert("Votre compte FLASHCOMPTE PRO est bloqué.");
              await signOut(auth);
              handleLogout();
              setAuthLoading(false);
              return;
            }

            if (clientData.role === 'admin') {
              setUserRole('admin');
              localStorage.setItem('user_role', 'admin');
            } else {
              setUserRole('client');
              localStorage.setItem('user_role', 'client');
              
              // Verify URL token if present
              const urlToken = new URLSearchParams(window.location.search).get("token");
              if (urlToken && clientData.token !== urlToken) {
                alert("Accès refusé : Token de sécurité invalide.");
                await signOut(auth);
                handleLogout();
                setAuthLoading(false);
                return;
              }

              // Pre-load their first transfer matching email if any
              const matches = await getTransfersByEmailFromDb(user.email || '');
              if (matches.length > 0) {
                setLiveSimulationTx(matches[0]);
              }
            }
          } else {
            // User exists in auth but no doc (legacy users or bootstrap admin sillyfr079@gmail.com)
            const isEmailDefaultAdmin = user.email?.toLowerCase().trim() === 'sillyfr079@gmail.com';
            
            if (isEmailDefaultAdmin) {
              const rootAdmin: Client = {
                uid: user.uid,
                email: user.email?.toLowerCase() || '',
                codeClient: 'ADM001',
                token: 'admin-token',
                role: 'admin',
                montant: 1850000,
                statut: 'actif',
                plan: 'vip',
                createdAt: Date.now()
              };
              await saveClientToDb(rootAdmin);
              setUserRole('admin');
              localStorage.setItem('user_role', 'admin');
            } else {
              // Create default client doc so no one gets stuck
              const clientCode = 'C' + Math.floor(100000 + Math.random() * 900000);
              const clientToken = 'tk_' + Math.random().toString(36).substring(2, 10);
              const defaultClient: Client = {
                uid: user.uid,
                email: user.email?.toLowerCase() || '',
                codeClient: clientCode,
                token: clientToken,
                role: 'client',
                montant: 0,
                statut: 'actif',
                plan: 'free',
                createdAt: Date.now()
              };
              await saveClientToDb(defaultClient);
              setUserRole('client');
              localStorage.setItem('user_role', 'client');
              
              const matches = await getTransfersByEmailFromDb(user.email || '');
              if (matches.length > 0) {
                setLiveSimulationTx(matches[0]);
              }
            }
          }
        } catch (err) {
          console.error("Firestore auth sync failed:", err);
          setUserRole('client');
        }
      } else {
        setUserRole(null);
        localStorage.removeItem('user_role');
        setLiveSimulationTx(null);
      }
      setAuthLoading(false);
    });
    return () => {
      clearTimeout(forceTimer);
      unsubscribe();
    };
  }, []);

  // Core App states loaded from Firestore with local state for visual speed
  const isClient = userRole === 'client';

  const [balance, setBalance] = useState<number>(1525000);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [transfers, setTransfers] = useState<SimulatedTransfer[]>([]);

  // 1. Initial configuration loading and real-time synchronization on mount
  useEffect(() => {
    async function initDb() {
      try {
        // Fetch everything in parallel to minimize latency on mobile networks and cold starts
        const [dbBalance, dbContacts, dbCampaigns, dbTransactions, dbTransfers] = await Promise.all([
          getBalanceFromDb(),
          getContactsFromDb(),
          getCampaignsFromDb(),
          getTransactionsFromDb(),
          getTransfersFromDb()
        ]);

        // Set Balance
        if (dbBalance !== null) {
          setBalance(dbBalance);
        } else {
          await saveBalanceToDb(1525000);
        }

        // Set Contacts
        if (dbContacts.length > 0) {
          setContacts(dbContacts);
        } else {
          setContacts([]);
        }

        // Set Campaigns
        if (dbCampaigns.length > 0) {
          setCampaigns(dbCampaigns);
        } else {
          setCampaigns([]);
        }

        // Set Transactions
        if (dbTransactions.length > 0) {
          setTransactions(dbTransactions);
        } else {
          setTransactions([]);
        }

        // Set Transfers
        if (dbTransfers.length > 0) {
          setTransfers(dbTransfers);
        } else {
          setTransfers([]);
        }
      } catch (err) {
        console.error("Database initialization failed, fallbacks applied:", err);
      }
    }

    initDb();

    // Setup active listeners for absolute real-time multi-browser/multi-phone data syncing!
    const unsubTransfers = onSnapshot(collection(db, 'transfers'), (snapshot) => {
      const items: SimulatedTransfer[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as SimulatedTransfer);
      });
      setTransfers(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      console.warn("Firestore transfers snapshot listener: fallback active", err);
    });

    const unsubContacts = onSnapshot(collection(db, 'contacts'), (snapshot) => {
      const items: Contact[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Contact);
      });
      setContacts(items);
    }, (err) => {
      console.warn("Contacts listener warning:", err);
    });

    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const items: CampaignLog[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CampaignLog);
      });
      setCampaigns(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      console.warn("Campaigns listener warning:", err);
    });

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const items: PaymentTransaction[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PaymentTransaction);
      });
      setTransactions(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      console.warn("Transactions listener warning:", err);
    });

    const unsubBalance = onSnapshot(doc(db, 'system', 'balance'), (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().balance);
      }
    }, (err) => {
      console.warn("Balance listener warning:", err);
    });

    return () => {
      unsubTransfers();
      unsubContacts();
      unsubCampaigns();
      unsubTransactions();
      unsubBalance();
    };
  }, []);

  // 1b. Automatic System Theme preference detection (Clair / Sombre)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    handleThemeChange(mediaQuery);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      mediaQuery.addListener(handleThemeChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }, []);

  // 2. Direct load and verification of specific query parameters (device-agnostic)
  useEffect(() => {
    const getUrlParam = (paramName: string): string | null => {
      // 1. Check standard URL search parameters
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get(paramName)) return searchParams.get(paramName);

      // 2. Check hash string (e.g. #/c=123 or #c=123)
      const hash = window.location.hash;
      if (hash) {
        const cleanedHash = hash.replace(/^#[/?]/, '').replace(/^#/, '');
        const hashParams = new URLSearchParams(cleanedHash);
        if (hashParams.get(paramName)) return hashParams.get(paramName);
        
        // Match key-value form in hash like c=...
        const match = hash.match(new RegExp(`[?&]${paramName}=([^&]+)`));
        if (match) return decodeURIComponent(match[1]);
        
        const simpleMatch = hash.match(new RegExp(`${paramName}=([^&]+)`));
        if (simpleMatch) return decodeURIComponent(simpleMatch[1]);
      }

      // 3. Regex match raw URL
      const fullUrl = window.location.href;
      const regexMatch = fullUrl.match(new RegExp(`[?&]${paramName}=([^&#]+)`));
      if (regexMatch) return decodeURIComponent(regexMatch[1]);

      return null;
    };

    const cParam = getUrlParam('sid') || getUrlParam('c');
    const portalParam = getUrlParam('portal');
    const txidParam = getUrlParam('txid');

    async function checkUrlParams() {
      if (cParam) {
        const targetId = cParam.startsWith('tx-') ? cParam : `tx-${cParam}`;
        
        // Load target transfer directly from Firestore or any field matching to ensure multi-device robustness!
        let match = await findTransferByAnyField(cParam) || await getTransferByIdFromDb(targetId);

        if (!match) {
          // Check local list fallback
          match = transfers.find(t => 
            t.id === cParam || 
            t.id === `tx-${cParam}` ||
            t.codePin === cParam ||
            t.reference?.toLowerCase().includes(cParam.toLowerCase())
          );
        }

        // If completely absent, initialize the Samuel BELLO custom pre-seeded scenario!
        if (!match) {
          const generatedId = `tx-${cParam}`;
          match = {
            id: generatedId,
            version: 'V1',
            lastName: 'BELLO',
            firstName: 'Samuel',
            country: 'Bénin (+229)',
            phone: '+229 97 61 26 73',
            email: 'gabriellagarguczi@gmail.com',
            address: 'Lot 45, Quartier Haie Vive, Cotonou',
            language: 'Français',
            senderBank: 'TRANSFERWIRE SECURE PLATFORM',
            amount: 10000,
            currency: 'EUR (€)',
            startPercentage: 15,
            stopPercentage: 50,
            customMessage: "Echec du transfert un problème est survenu, veuillez contacter l'expéditeur ou le support transferwire. Cordialement",
            emailAlert: true,
            smsAlert: false,
            codePin: '117850',
            isBlocked: false,
            senderName: 'Trésorerie Centrale Pro',
            recipientName: 'Samuel BELLO',
            recipientBank: 'Bank of Africa Benin',
            recipientAccount: 'BJ328 09483 09489 001',
            type: 'BANK_WIRE',
            reference: `TRW-${cParam.toUpperCase()}`,
            createdAt: new Date().toISOString(),
            status: 'SUCCESS',
            delaySeconds: 4,
            otpCode: '',
            feePercent: 1.2,
            isCompleted: false,
            generatedUrl: `${getPublicOrigin()}/?sid=${cParam}`
          };
        }

        if (match) {
          setLiveSimulationTx(match);
        }
      } else if (portalParam === 'true' && txidParam) {
        let match = await findTransferByAnyField(txidParam) || await getTransferByIdFromDb(txidParam);
        if (!match) {
          match = transfers.find(t => t.id === txidParam);
        }
        if (match) {
          setLiveSimulationTx(match);
        }
      }
    }

    checkUrlParams();
  }, [transfers]);

  // 3. Keep live simulation transfer in sync with real-time updates from transfers list
  useEffect(() => {
    if (liveSimulationTx) {
      const updated = transfers.find(t => t.id === liveSimulationTx.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(liveSimulationTx)) {
        setLiveSimulationTx(updated);
      }
    }
  }, [transfers, liveSimulationTx]);

  // Shared Helper triggers
  const onCreateToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      localStorage.removeItem('user_role');
      setBypassAdmin(false);
      setLiveSimulationTx(null);
      setShowLandingPage(true);
      onCreateToast("Déconnexion réussie !");
    } catch (error: any) {
      console.error("Standard error signing out: ", error);
      onCreateToast("Une erreur est survenue lors de la déconnexion.");
    }
  };

  const deductBalance = (amount: number) => {
    setBalance(prev => {
      const newVal = Math.max(0, prev - amount);
      saveBalanceToDb(newVal);
      return newVal;
    });
  };

  const onAddBalance = (amount: number, method: string) => {
    setBalance(prev => {
      const newVal = prev + amount;
      saveBalanceToDb(newVal);
      return newVal;
    });
    const newTx: PaymentTransaction = {
      id: `tr-${Math.floor(Math.random() * 9000 + 1005)}`,
      amount,
      method,
      status: 'Complété',
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);
    saveTransactionToDb(newTx);
  };

  const handleCampaignSend = (campaign: Omit<CampaignLog, 'id' | 'createdAt'>) => {
    const newLog: CampaignLog = {
      ...campaign,
      id: `cam-${Math.floor(Math.random() * 9000 + 1002)}`,
      createdAt: new Date().toISOString()
    };
    setCampaigns(prev => [newLog, ...prev]);
    saveCampaignToDb(newLog);
    return true;
  };

  // Contacts management calls
  const onAddContact = (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: `c-${Math.floor(Math.random() * 9000 + 1003)}`,
      createdAt: new Date().toISOString()
    };
    setContacts(prev => [newContact, ...prev]);
    saveContactToDb(newContact);
    onCreateToast(`Contact ${contact.name} ajouté au CRM !`);
  };

  const onDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    deleteContactFromDb(id);
    onCreateToast('Contact supprimé.');
  };

  const onPopulateSampleContacts = () => {
    const preSeeded: Contact[] = [
      { id: `c-seed-${Math.floor(Math.random() * 100000)}`, name: 'Fatoumata Bamba', phone: '+225 05 99 87 65 43', email: 'f.bamba@bamba-co.net', company: 'Bamba Telecom CI', createdAt: new Date().toISOString() },
      { id: `c-seed-${Math.floor(Math.random() * 100000)}`, name: 'Ousmane Cissé', phone: '+221 70 88 99 001', email: 'cisse@ousmane-dev.sn', company: 'Cissé Consulting Sénégal', createdAt: new Date().toISOString() },
      { id: `c-seed-${Math.floor(Math.random() * 100000)}`, name: 'Kadiatou Touré', phone: '+224 622 34 56 78', email: 'kadi.toure@conakry-import.gn', company: 'Toure & Frères Import', createdAt: new Date().toISOString() }
    ];
    setContacts(prev => [...preSeeded, ...prev]);
    preSeeded.forEach(c => saveContactToDb(c));
    onCreateToast('3 contacts d\'Afrique de l\'Ouest injectés au carnet !');
  };

  // Simulated Transfers core functions
  const onGenerateTransfer = (transferData: Omit<SimulatedTransfer, 'id' | 'createdAt' | 'generatedUrl' | 'isCompleted'>) => {
    const txId = `tx-${Math.floor(100000 + Math.random() * 900000)}`; // 6 digits like the user's screenshots
    const shortCode = txId.replace('tx-', '');
    const newTransfer: SimulatedTransfer = {
      ...transferData,
      id: txId,
      createdAt: new Date().toISOString(),
      isCompleted: false,
      generatedUrl: `${getPublicOrigin()}/?sid=${shortCode}`
    };

    setTransfers(prev => [newTransfer, ...prev]);
    saveTransferToDb(newTransfer);
    return newTransfer;
  };

  const onDeleteTransfer = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    deleteTransferFromDb(id);
    onCreateToast('Scénario de licence supprimé.');
  };

  const onClearAllTransfers = () => {
    transfers.forEach(t => deleteTransferFromDb(t.id));
    setTransfers([]);
    onCreateToast('Historique des simulations purgé.');
  };

  const onSetCompleted = (id: string) => {
    setTransfers(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, isCompleted: true } : t);
      const found = updated.find(t => t.id === id);
      if (found) {
        saveTransferToDb(found);
      }
      return updated;
    });
  };

  const onUpdatePercentages = (id: string, start: number, stop: number, message: string) => {
    setTransfers(prev => {
      const updated = prev.map(t => t.id === id ? {
        ...t,
        startPercentage: start,
        stopPercentage: stop,
        customMessage: message,
        otpCode: Math.floor(100000 + Math.random() * 900000).toString() // Generate a new release key
      } : t);
      const found = updated.find(t => t.id === id);
      if (found) {
        saveTransferToDb(found);
      }
      return updated;
    });
    onCreateToast('Mise à jour des pourcentages effectuée !');
  };

  const onSetBlockedState = (id: string, isBlocked: boolean) => {
    setTransfers(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, isBlocked } : t);
      const found = updated.find(t => t.id === id);
      if (found) {
        saveTransferToDb(found);
      }
      return updated;
    });
    onCreateToast(isBlocked ? 'Accès client bloqué avec succès.' : 'Accès client débloqué.');
  };

  const onTriggerEmailNotification = (title: string, content: string, status: 'Envoyé' | 'En attente' | 'Échoué') => {
    const newLog: CampaignLog = {
      id: `cam-${Math.floor(Math.random() * 9000 + 1007)}`,
      type: 'EMAIL',
      title,
      content,
      recipientsCount: 1,
      cost: 10,
      status,
      createdAt: new Date().toISOString()
    };
    setCampaigns(prev => [newLog, ...prev]);
    saveCampaignToDb(newLog);
    onCreateToast(`E-mail de simulation envoyé : ${title}`);
  };

  // Quick Trial Modal processing
  const [quickRecipient, setQuickRecipient] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickGate, setQuickGate] = useState('Wave S.A.');

  const handleQuickTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRecipient.trim() || !quickAmount.trim()) {
      alert('Veuillez renseigner toutes les informations requises.');
      return;
    }
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Montant invalide.');
      return;
    }

    const created = onGenerateTransfer({
      version: 'V1',
      lastName: quickRecipient.trim(),
      firstName: '',
      country: 'Côte d\'Ivoire (+225)',
      phone: '+225 07 00 00 000',
      email: `${quickRecipient.toLowerCase().replace(/\s+/g, '')}@demo-quick.com`,
      address: 'Abidjan Plateau, Avenue Chardy',
      language: 'Français',
      senderBank: 'BCEAO Hub Central',
      amount: amt,
      currency: 'FCFA (XOF)',
      startPercentage: 10,
      stopPercentage: 100,
      customMessage: 'Virement Express validé avec succès.',
      emailAlert: true,
      smsAlert: false,
      codePin: Math.floor(100000 + Math.random() * 900000).toString(),
      isBlocked: false,
      senderName: 'Trésor Mobile Sandbox',
      recipientName: quickRecipient.trim(),
      recipientBank: quickGate,
      recipientAccount: '+2250789045',
      type: 'WAVE',
      reference: `FTX-QUICK-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'SUCCESS',
      delaySeconds: 3,
      otpCode: '',
      feePercent: 0.1,
    });

    setQuickTrialModal(false);
    setQuickRecipient('');
    setQuickAmount('');
    setLiveSimulationTx(created);
  };

  // Dynamic counter aggregate math
  const smsCountTotal = campaigns.filter(c => c.type === 'SMS').reduce((acc, c) => acc + c.recipientsCount, 0);
  const emailCountTotal = campaigns.filter(c => c.type === 'EMAIL').reduce((acc, c) => acc + c.recipientsCount, 0);

  // loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-mono tracking-widest animate-pulse">CHARGEMENT DES SYSTÈMES SECURE...</span>
      </div>
    );
  }

  // Handle Authentication Gate for operators and client logins
  const isOperatorAuthenticated = (currentUser !== null && userRole === 'admin') || bypassAdmin === true;
  
  // SECURE CLIENT PORTAL (FLASHCOMPTE PRO)
  // If authenticated as client: show their personalized workspace containing their balance, plans, code client in real-time
  if (!isOperatorAuthenticated && currentUser !== null && userRole === 'client') {
    return (
      <ClientPortal 
        clientUser={clientProfile || {
          uid: currentUser.uid,
          email: currentUser.email || '',
          codeClient: 'C...',
          token: '...',
          role: 'client',
          montant: 0,
          statut: 'actif',
          plan: 'free',
          createdAt: Date.now()
        }}
        transfers={transfers}
        onLaunchSimulation={(tx) => setLiveSimulationTx(tx)}
        onLogout={handleLogout}
      />
    );
  }

  // STRICT SEPARATION OF CLIENT EXPERIENCE FOR GUESTS:
  // If we have an active client context (loaded transfer from URL parameters or selected client connection),
  // and they are NOT authenticated as an operator - then display ONLY the secure Bank Portal view.
  // This completely removes all unrequested backdrops, sidebars, dashboard information, and data of others.
  if (liveSimulationTx && !isOperatorAuthenticated) {
    return (
      <SimulatedBankPortal 
        transfer={liveSimulationTx} 
        onClose={() => {
          setLiveSimulationTx(null);
          if (userRole === 'client') {
            setUserRole(null);
            localStorage.removeItem('user_role');
          }
        }} 
        onSetCompleted={onSetCompleted}
        onTriggerEmailNotification={onTriggerEmailNotification}
        isFirebaseAuthed={currentUser !== null && userRole === 'client'}
        firebaseSignOut={handleLogout}
        isOperatorView={false}
      />
    );
  }

  const isClientAuthenticated = (currentUser !== null && userRole === 'client') || (liveSimulationTx !== null && userRole === 'client');
  const isAuthenticated = isOperatorAuthenticated || isClientAuthenticated;
  
  if (!isAuthenticated) {
    if (showLandingPage) {
      return (
        <LandingPage 
          onEnterAdminDemo={() => {
            setBypassAdmin(true);
            setShowLandingPage(false);
          }}
          onOpenAuthGate={(tab) => {
            setAuthGateTab(tab);
            setShowLandingPage(false);
          }}
          transfersCount={transfers.length}
        />
      );
    }

    return (
      <AuthGate 
        initialTab={authGateTab}
        onBackToHome={() => setShowLandingPage(true)}
        onAdminAuthenticated={(user) => {
          setCurrentUser(user);
          setUserRole('admin');
          localStorage.setItem('user_role', 'admin');
          setShowLandingPage(false);
        }}
        onBypassAdmin={() => {
          setBypassAdmin(true);
          setShowLandingPage(false);
        }}
        onBeneficiaryAuthenticated={(transfer) => {
          setUserRole('client');
          localStorage.setItem('user_role', 'client');
          setLiveSimulationTx(transfer);
          setShowLandingPage(false);
        }}
        transfers={transfers}
        onCreateToast={onCreateToast}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#F3F4F6] text-slate-800 flex font-sans selection:bg-blue-600 selection:text-white antialiased transition-all duration-150`}>
      {/* Sidebar navigation component - Always available for direct unrestricted tool navigation as requested */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        balance={balance} 
        currentUserEmail={currentUser ? currentUser.email : (bypassAdmin ? "Mode Démo / Évaluation" : null)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 pt-4 min-h-screen flex flex-col justify-between transition-all md:ml-64">
        <div className="max-w-7xl w-full mx-auto space-y-6">
          
          {/* KitsCms TOP BRAND HEADER - Styled EXACTLY like the screenshot original site */}
          <header className="bg-white border border-slate-200 rounded-3xl p-4 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-3">
              {/* 3D Isometric KitsCms Cube Logo */}
              <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                <svg className="w-10 h-10 select-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top Panel (Blue) */}
                  <path d="M12 2L21 6.5L12 11L3 6.5L12 2Z" fill="#3B82F6" />
                  {/* Left Panel (Orange/Yellow) */}
                  <path d="M3 6.5L12 11V21L3 16.5V6.5Z" fill="#F97316" />
                  {/* Right Panel (Green) */}
                  <path d="M12 11L21 6.5V16.5L12 21V11Z" fill="#10B981" />
                </svg>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  <span className="text-emerald-500 font-extrabold select-none">Kits</span>
                  <span className="text-blue-600 select-none">Cms</span>
                </span>
                <p className="text-[9px] text-slate-400 font-black leading-none font-mono tracking-widest uppercase">WORKSPACE ENTERPRISE</p>
              </div>
            </div>
            
            {/* Action buttons on right */}
            <div className="flex items-center gap-3">
              {/* Grid categories shortcut icon in white/light blue card */}
              <div className="p-2.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-2xl flex items-center justify-center cursor-pointer transition shadow-sm border border-slate-200/40">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
                </svg>
              </div>
              
              {/* Logout Power Red Button */}
              <button 
                onClick={handleLogout}
                title="Se déconnecter de la session"
                className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/10 cursor-pointer transition duration-150"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </header>

          {/* Core View tabs routing switcher */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              balance={balance} 
              smsCount={smsCountTotal} 
              emailCount={emailCountTotal} 
              contactsCount={contacts.length}
              campaigns={campaigns}
              transfers={transfers}
              transactions={transactions}
              setActiveTab={setActiveTab}
              setQuickTrialModal={setQuickTrialModal}
              isAdmin={true}
              clientTransfer={liveSimulationTx}
              onLaunchSimulation={(tx) => setLiveSimulationTx(tx)}
              onAddBalance={onAddBalance}
            />
          )}

          {activeTab === 'clients' && (
            <AdminClientsManager 
              onCreateToast={onCreateToast}
            />
          )}

          {activeTab === 'sms' && (
            <SmsCampaign 
              balance={balance} 
              contacts={contacts} 
              onSendSms={handleCampaignSend} 
              deductBalance={deductBalance} 
            />
          )}

          {activeTab === 'email' && (
            <EmailCampaign 
              balance={balance} 
              contacts={contacts} 
              onSendEmail={handleCampaignSend} 
              deductBalance={deductBalance} 
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsManager 
              contacts={contacts} 
              onAddContact={onAddContact} 
              onDeleteContact={onDeleteContact} 
              onPopulateSampleContacts={onPopulateSampleContacts} 
            />
          )}

          {activeTab === 'billing' && (
            <BillingManager 
              balance={balance} 
              onAddBalance={onAddBalance} 
              transactions={transactions} 
            />
          )}

          {activeTab === 'flash-v1' && (
            <FlashCompteV1 
              onGenerateTransfer={onGenerateTransfer} 
              onCreateToast={onCreateToast} 
              setActiveTab={setActiveTab}
              setLiveSimulationTx={setLiveSimulationTx}
              transfers={transfers}
              onUpdatePercentages={onUpdatePercentages}
              onSetBlockedState={onSetBlockedState}
              deductBalance={deductBalance}
              balance={balance}
              onDeleteTransfer={onDeleteTransfer}
            />
          )}

          {activeTab === 'flash-v2' && (
            <FlashCompteV2 
              onGenerateTransfer={onGenerateTransfer} 
              onCreateToast={onCreateToast} 
              setActiveTab={setActiveTab}
              setLiveSimulationTx={setLiveSimulationTx}
              transfers={transfers}
              onUpdatePercentages={onUpdatePercentages}
              onSetBlockedState={onSetBlockedState}
              deductBalance={deductBalance}
              balance={balance}
              onDeleteTransfer={onDeleteTransfer}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPanel 
              transfers={transfers} 
              onDeleteTransfer={onDeleteTransfer} 
              onClearAllTransfers={onClearAllTransfers}
              onLaunchSimulation={setLiveSimulationTx}
              onCreateToast={onCreateToast}
              onSetBlockedState={onSetBlockedState}
              onUpdatePercentages={onUpdatePercentages}
            />
          )}

        </div>

        {/* Global aesthetic footer */}
        <footer className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-4 max-w-7xl w-full mx-auto">
          <span>PORTAIL DEV SECURISE • SILLYFR EXCLUSIVE</span>
          <div className="flex gap-4">
            <a href="#" onClick={(e) => { e.preventDefault(); alert("FlashConnect Pro v2.5 Sandbox compliant interbancaire - Sans raccordement monétaire réel."); }} className="hover:text-slate-300">Conditions Générales d'Essai</a>
            <span>•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Licence active SillyFR Studio."); }} className="hover:text-slate-300">Règlementation UMOA</a>
          </div>
        </footer>
      </main>

      {/* IMMERSIVE LIVE BANK GATEWAY SIMULATOR OVERLAY */}
      {liveSimulationTx && isOperatorAuthenticated && (
        <SimulatedBankPortal 
          transfer={liveSimulationTx} 
          onClose={() => setLiveSimulationTx(null)} 
          onSetCompleted={onSetCompleted}
          onTriggerEmailNotification={onTriggerEmailNotification}
          isFirebaseAuthed={currentUser !== null && userRole === 'client'}
          firebaseSignOut={handleLogout}
          isOperatorView={true}
        />
      )}

      {/* QUICK WORKSPACE TRIAL MODAL */}
      {quickTrialModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl animate-scale-up">
            <button
              onClick={() => setQuickTrialModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-500 hover:text-white cursor-pointer transition"
            >
              <X size={15} />
            </button>
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-3">
              <Zap className="text-amber-400 fill-amber-400/10" size={18} />
              <h3 className="text-base font-bold text-white font-display">Simulacre Express Virement V1</h3>
            </div>

            <form onSubmit={handleQuickTrialSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">NOM DU BENEFICIAIRE *</label>
                <input
                  type="text"
                  required
                  value={quickRecipient}
                  onChange={(e) => setQuickRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Fatou Cissé"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">MONTANT (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: 250000"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">OPERATEUR MOBILE *</label>
                  <select
                    value={quickGate}
                    onChange={(e) => setQuickGate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Wave Mali S.A.">Wave Mobile</option>
                    <option value="Orange Money Afrique">Orange Money</option>
                    <option value="Ecobank Direct">Ecobank CI</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-lg shadow-blue-500/10"
              >
                Lancer l'essai interbancaire immédiat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FLOAT TOAST NOTIFIER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-slate-200 py-3 px-5 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in select-none">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-medium font-mono">{toast}</span>
        </div>
      )}
    </div>
  );
}
