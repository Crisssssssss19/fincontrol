import { IInvoiceRepository } from '@/core/repositories/IInvoiceRepository';
import { Invoice } from '@/core/entities/Invoice';

export class CreateInvoice {
  constructor(private invoiceRepository: IInvoiceRepository) {}

  async execute(invoice: Omit<Invoice, 'id'> & { id?: string }): Promise<Invoice> {
    if (invoice.amount < 0) {
      throw new Error('El monto de la factura no puede ser negativo');
    }
    return this.invoiceRepository.create(invoice);
  }
}
export default CreateInvoice;
