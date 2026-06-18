import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  Sparkles,
  Search,
  CheckCircle,
  FilePlus2
} from 'lucide-react';
import { Contact } from '../types';

interface ContactsManagerProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  onDeleteContact: (id: string) => void;
  onPopulateSampleContacts: () => void;
}

export default function ContactsManager({ 
  contacts, 
  onAddContact, 
  onDeleteContact, 
  onPopulateSampleContacts 
}: ContactsManagerProps) {
  
  // States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez renseigner le nom.');
      return;
    }
    if (!phone.trim()) {
      alert('Veuillez fournir un numéro de téléphone.');
      return;
    }

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim() || undefined
    });

    // Reset fields
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 animate-fade-in">
      {/* Create Contact Box (Left panel) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl h-fit">
        <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-5">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Ajouter un Contact</h3>
            <p className="text-xs text-slate-500 font-medium">Insérez manuellement ou chargez des contacts de test</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">NOM COMPLET *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
              placeholder="Ex: Jean-Marc Koffi"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">NUMÉRO DE TELEPHONE (WhatsApp/Mobile Money) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="Ex: +225 07 48 93 21 00"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">ADRESSE EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="Ex: jean.koffi@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">ENTREPRISE / SERVICE</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Ex: Koffi Corp Sa"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 transition"
          >
            <UserPlus size={14} /> Enregistrer le Contact
          </button>
        </form>

        <div className="border-t border-slate-850 my-6 pt-5">
          <span className="text-[11px] font-bold text-slate-500 block mb-2 font-mono uppercase tracking-wider">RECHERCHE RAPIDE & ACTIONS</span>
          <button
            onClick={onPopulateSampleContacts}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Sparkles size={13} fill="currentColor" opacity="0.2" /> Injecter un Carnet de Test d'Afrique
          </button>
        </div>
      </div>

      {/* Contacts List Grid (Right Panel, taking 2 columns) */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Users size={18} className="text-blue-400" />
              <h3 className="text-base font-bold text-white">Base CRM Contacts ({contacts.length})</h3>
            </div>
            
            {/* Search Input box */}
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher nom, tel, email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800/80">
              <Users size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Aucun contact correspondant trouvé</p>
              <p className="text-xs text-slate-500 mt-1">Créez votre premier contact d'essai pour utiliser les filtres.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-2">Nom complet</th>
                    <th className="py-3 px-2">Téléphone</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Société</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredContacts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-950/20 transition-colors group">
                      <td className="py-3 px-2 font-semibold text-slate-200">{c.name}</td>
                      <td className="py-3 px-2 font-mono text-slate-400 flex items-center gap-1.5">
                        <Phone size={11} className="text-slate-500" /> {c.phone}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-400">
                        {c.email ? (
                          <span className="flex items-center gap-1.5"><Mail size={11} className="text-slate-500" /> {c.email}</span>
                        ) : (
                          <span className="text-slate-600">- non défini -</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {c.company ? (
                          <span className="bg-blue-600/10 text-blue-400 font-medium border border-blue-500/10 rounded-full px-2 py-0.5 text-[10px] inline-flex items-center gap-1">
                            <Building2 size={9} /> {c.company}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Individuel</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => onDeleteContact(c.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-950 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Supprimer contact"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-850 mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <span>Affichage de <strong>{filteredContacts.length}</strong> sur <strong>{contacts.length}</strong> contacts enregistrés.</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle size={10} /> Base Active
          </span>
        </div>
      </div>
    </div>
  );
}
