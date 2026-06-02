import { IInvoiceRepository } from '@/core/repositories/IInvoiceRepository';
import { Invoice } from '@/core/entities/Invoice';

export class GetUserInvoices {
  constructor(private invoiceRepository: IInvoiceRepository) {}

  async execute(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByUserId(userId);
  }
}
export default GetUserInvoices;
