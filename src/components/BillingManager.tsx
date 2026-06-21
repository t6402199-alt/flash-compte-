import React, { useState } from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  Wallet, 
  PhoneIcon, 
  Check, 
  ChevronRight, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { PaymentTransaction } from '../types';

interface BillingManagerProps {
  balance: number;
  onAddBalance: (amount: number, method: string) => void;
  transactions: PaymentTransaction[];
}

export default function BillingManager({ balance, onAddBalance, transactions }: BillingManagerProps) {
  const [amountInput, setAmountInput] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Visa');
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods = [
    { id: 'Visa', label: 'Carte Bancaire (Visa / Mastercard)', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/50', icon: '💳', suffix: 'Card €' },
    { id: 'Sepa', label: 'Virement / Prélèvement SEPA', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50', icon: '🇪🇺', suffix: 'SEPA €' },
    { id: 'virement', label: 'Virement bancaire européen', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/50', icon: '🏦', suffix: 'Bank €' }
  ];

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }

    if (parsedAmount > 10000000) {
      alert('Montant maximal de simulation par dépôt: 10 000 000 €.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onAddBalance(parsedAmount, selectedMethod);
      setAmountInput('');
      setPhoneInput('');
      setIsLoading(false);
      alert(`Simulation réussie ! Votre solde principal FlashConnect a été crédité de + ${parsedAmount.toLocaleString('fr-FR')} € via ${selectedMethod}.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 animate-fade-in">
      {/* Deposit Setup */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-5">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Rechargement du Portefeuille</h3>
            <p className="text-xs text-slate-500 font-medium">Alimentez instantanément votre solde SMS/Email pour vos essais</p>
          </div>
        </div>

        <form onSubmit={handleRecharge} className="space-y-5">
          {/* Method Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2.5">CHOISIR LE MOYEN DE PAIEMENT (SIMULATION EUROPE)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paymentMethods.map(m => {
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 border rounded-xl flex items-center justify-between text-left transition duration-150 cursor-pointer ${
                      isSelected 
                        ? `${m.color.split(' ')[0]} ${m.color.split(' ')[1]} border-blue-500 scale-[1.01] ring-1 ring-blue-500/20` 
                        : 'bg-slate-950/40 border-slate-850 text-slate-350 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs font-semibold">{m.label}</span>
                    </div>
                    {isSelected && (
                      <span className="bg-blue-500 text-white rounded-full p-0.5">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input & Phone number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">MONTANT À RECHARGER (EUR) *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-16 py-2.5 text-sm font-semibold font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: 500"
                  min="1"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-500 font-mono">EUR (€)</span>
              </div>
            </div>

            {selectedMethod !== 'Visa' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">IDENTIFIANT DE FACTURATION COMPTE *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <PhoneIcon size={13} />
                  </span>
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="Ex: IBAN ou No. Compte..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick recharge shortcuts */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">RECHARGE RAPIDE :</label>
            <div className="flex flex-wrap gap-2">
              {[50, 100, 250, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountInput(amt.toString())}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-xs text-slate-200 rounded-lg font-mono font-bold cursor-pointer transition"
                >
                  +{amt.toLocaleString('fr-FR')} €
                </button>
              ))}
            </div>
          </div>

          {/* Simulation informational banner */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-400">
            <AlertCircle size={14} className="text-blue-400 shrink-0" />
            <span>
              Les recharges de solde s'effectuent dans le cadre de <strong>l'environnement de simulation FlashConnect</strong>. Aucun prélèvement réel ne sera effectué.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !amountInput}
            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform ${
              isLoading || !amountInput
                ? 'bg-slate-850 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10'
            }`}
          >
            {isLoading ? "Vérification de la passerelle..." : <>Valider le rechargement de {(parseInt(amountInput) || 0).toLocaleString('fr-FR')} € <ChevronRight size={14} /></>}
          </button>
        </form>
      </div>

      {/* Transaction log sidebar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
            <CreditCard size={15} className="text-slate-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">HISTORIQUE DES DEPÔTS</span>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500 italic">
                Aucun dépôt enregistré.<br />Utilisez le formulaire pour ajouter des fonds.
              </div>
            ) : (
              transactions.map(tr => (
                <div key={tr.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white leading-tight">
                      <span>Dépôt {tr.method}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{tr.createdAt}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400">+{tr.amount.toLocaleString('fr-FR')} €</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded-full block w-fit ml-auto mt-0.5 font-mono">Succès</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-855 mt-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-start gap-2">
            <HelpCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-400 leading-normal">
              FlashConnect s'interface avec Stripe ou Adyen pour la mise en ligne opérationnelle de vos solutions de paiement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
