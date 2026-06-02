export type InvoiceType = 'Agua' | 'Energía' | 'Internet' | 'Gas' | 'Educación' | 'Salud' | 'Transporte' | 'Entretenimiento' | 'Otros';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: InvoiceType;
  amount: number;
  issueDate: string;    // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  paymentDate?: string | null; // YYYY-MM-DD (null/undefined when pending or overdue)
  status: InvoiceStatus;
  attachmentUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

