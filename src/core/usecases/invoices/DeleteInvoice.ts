import { IInvoiceRepository } from '../../repositories/IInvoiceRepository';

export class DeleteInvoice {
  constructor(private repo: IInvoiceRepository) {}
  async execute(id: string, userId: string): Promise<boolean> {
    const invoice = await this.repo.findById(id);
    if (!invoice || invoice.userId !== userId) {
      throw new Error('Not authorized or invoice not found');
    }
    return this.repo.delete(id);
  }
}
