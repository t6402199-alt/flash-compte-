import React, { useState, useRef } from 'react';
import {
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

import { Contact, CampaignLog, SimulatedTransfer, SimulatedEmail } from '../types';
import { NON_AFRICAN_COUNTRIES } from '../lib/constants';
import { saveTransferToDb } from '../lib/firebase';

interface EmailCampaignProps {
  balance: number;
  contacts: Contact[];
  onSendEmail: (campaign: Omit<CampaignLog, 'id' | 'createdAt'>) => boolean;
  deductBalance: (amount: number) => void;
  campaigns: CampaignLog[];
  transfers: SimulatedTransfer[];
}

export default function EmailCampaign({
  balance,
  contacts,
  onSendEmail,
  deductBalance,
  campaigns,
  transfers
}: EmailCampaignProps) {

  const [subject, setSubject] = useState('');
  const [senderMask, setSenderMask] = useState('Alerte Sécurisée <support@flashconnect.net>');
  const [emailBody, setEmailBody] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [directRecipient, setDirectRecipient] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('France (+33)');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const COST_PER_EMAIL = 1;

  const contactsWithEmail = contacts.filter(c => c.email);
  const isDirectMode = directRecipient.trim().length > 0;

  const targetRecipientsCount = isDirectMode ? 1 : selectedContacts.length;
  const totalCost = targetRecipientsCount * COST_PER_EMAIL;

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAttachedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert("Image uniquement");
    }
  };

  const handleSend = () => {
    if (!subject || !emailBody) return;
    if (balance < totalCost) return;

    setIsSending(true);

    const recipients: { email: string }[] = [];

    if (isDirectMode) {
      recipients.push({ email: directRecipient });
    } else {
      contactsWithEmail
        .filter(c => selectedContacts.includes(c.id))
        .forEach(c => recipients.push({ email: c.email }));
    }

    setTimeout(async () => {
      deductBalance(totalCost);

      for (const rec of recipients) {

        let finalBody = emailBody;

        if (attachedImage) {
          finalBody =
            `<div style="text-align:center;margin-bottom:10px;">
              <img src="${attachedImage}" style="max-width:100%;border-radius:10px;" />
            </div>` + emailBody;
        }

        // 👉 ENVOI VIA CLOUDLARE WORKER (SEULE SOURCE)
        await fetch("https://flashcompte.workers.dev/send-campaign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            subject,
            from: senderMask,
            to: rec.email,
            html: finalBody,
            text: emailBody.replace(/<[^>]*>/g, '')
          })
        });

        const clientTx = transfers.find(
          t => t.email?.trim().toLowerCase() === rec.email?.trim().toLowerCase()
        );

        if (clientTx) {
          const email: SimulatedEmail = {
            id: `mail-${Date.now()}`,
            sender: senderMask,
            recipient: clientTx.email,
            subject,
            body: finalBody,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS'
          };

          clientTx.emails = [email, ...(clientTx.emails || [])];
          await saveTransferToDb(clientTx);
        }
      }

      onSendEmail({
        type: 'EMAIL',
        title: subject,
        content: emailBody,
        recipientsCount: targetRecipientsCount,
        cost: totalCost,
        status: 'Envoyé',
        recipientEmailOrPhone: isDirectMode ? directRecipient : `${targetRecipientsCount} contacts`,
        recipientCountry,
        subject,
        image: attachedImage || undefined
      });

      setIsSending(false);
      setSubject('');
      setEmailBody('');
      setDirectRecipient('');
      setSelectedContacts([]);
      setAttachedImage(null);

      alert("Campagne envoyée avec succès via Worker.");
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4 text-white">

      <div className="flex items-center gap-2">
        <Mail />
        <h2>Campagne Email</h2>
      </div>

      <input
        placeholder="Expéditeur"
        value={senderMask}
        onChange={(e) => setSenderMask(e.target.value)}
        className="w-full p-2 bg-black border"
      />

      <input
        placeholder="Sujet"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full p-2 bg-black border"
      />

      <textarea
        placeholder="Message"
        value={emailBody}
        onChange={(e) => setEmailBody(e.target.value)}
        className="w-full p-2 bg-black border h-32"
      />

      <input
        placeholder="Email direct (optionnel)"
        value={directRecipient}
        onChange={(e) => setDirectRecipient(e.target.value)}
        className="w-full p-2 bg-black border"
      />

      <button
        onClick={handleSend}
        disabled={isSending}
        className="bg-purple-600 px-4 py-2 rounded"
      >
        {isSending ? "Envoi..." : "Envoyer"}
      </button>

    </div>
  );
      }
