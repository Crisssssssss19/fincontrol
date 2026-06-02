import { Invoice } from '../entities/Invoice';

export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByUserId(userId: string): Promise<Invoice[]>;
  create(invoice: Omit<Invoice, 'id'> & { id?: string }): Promise<Invoice>;
  update(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
  delete(id: string): Promise<boolean>;
}
