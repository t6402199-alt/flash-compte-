export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  createdAt: string;
}

export type CampaignType = 'SMS' | 'EMAIL';

export interface CampaignLog {
  id: string;
  type: CampaignType;
  title: string;
  content: string;
  recipientsCount: number;
  cost: number;
  status: 'Envoyé' | 'En attente' | 'Échoué';
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: string;
  status: 'Complété' | 'En attente';
  createdAt: string;
}

export type TransferType = 'WESTERN_UNION' | 'WAVE' | 'ORANGE_MONEY' | 'BANK_WIRE' | 'WIZALL';

export interface SimulatedTransfer {
  id: string;
  version: 'V1' | 'V2';
  
  // Client Info (Informations sur le client)
  lastName: string;
  firstName: string;
  country: string;
  phone: string;
  email: string;
  address: string;
  language: string;

  // Account & Transfer Info (Solde du compte et virement)
  senderBank: string; // Banque émettrice des virements entrants
  amount: number; // Montant à créditer
  currency: string; // Devise
  startPercentage: number; // Pourcentage de départ
  stopPercentage: number; // Pourcentage d'arrêt
  customMessage: string; // Message à afficher à la fin

  // Alerts
  emailAlert: boolean;
  smsAlert: boolean;

  // Credentials
  codePin: string; // pin code
  generatedUrl: string;
  isBlocked: boolean; // account locked status

  // Legacy field safety compatibility
  senderName: string;
  recipientName: string;
  recipientBank: string;
  recipientAccount: string;
  type: TransferType;
  reference: string;
  createdAt: string;
  
  // V2 advanced custom fields
  status: 'SUCCESS' | 'BLOCKED_OTP' | 'FRAUD_ALERT' | 'ACCOUNT_LOCKED';
  delaySeconds: number;
  otpCode: string; // dynamic otp deblocage
  feePercent: number;
  
  // Simulation progressive state (for active rendering)
  isCompleted: boolean;
}
