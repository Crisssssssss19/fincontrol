import { IInvoiceRepository } from '@/core/repositories/IInvoiceRepository';
import { Invoice, InvoiceStatus } from '@/core/entities/Invoice';

export class UpdateInvoiceStatus {
  constructor(private invoiceRepository: IInvoiceRepository) {}

  async execute(id: string, status: InvoiceStatus): Promise<Invoice> {
    return this.invoiceRepository.update(id, { status });
  }
}
export default UpdateInvoiceStatus;
