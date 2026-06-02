import { IInvoiceRepository } from '@/core/repositories/IInvoiceRepository';
import { Invoice, InvoiceType, InvoiceStatus } from '@/core/entities/Invoice';
import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

let mockInvoices: Invoice[] = [];

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  async findById(id: string): Promise<Invoice | null> {
    if (!hasSupabaseKeys) {
      return mockInvoices.find(b => b.id === id) || null;
    }
    try {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
      if (error || !data) return null;
      return this.mapToEntity(data);
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Invoice[]> {
    if (!hasSupabaseKeys) {
      return mockInvoices.filter(b => b.userId === userId);
    }
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: true });
      if (error || !data) return [];
      return data.map(this.mapToEntity);
    } catch {
      return [];
    }
  }

  async create(invoice: Omit<Invoice, 'id'> & { id?: string }): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: invoice.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!hasSupabaseKeys) {
      mockInvoices.push(newInvoice);
      return newInvoice;
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        id: newInvoice.id,
        user_id: newInvoice.userId,
        name: newInvoice.name,
        description: newInvoice.description,
        type: newInvoice.type,
        amount: newInvoice.amount,
        issue_date: newInvoice.issueDate || new Date().toISOString().split('T')[0],
        due_date: newInvoice.dueDate || new Date().toISOString().split('T')[0],
        payment_date: newInvoice.paymentDate || null,
        status: newInvoice.status,
        attachment_url: newInvoice.attachmentUrl,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creating invoice');
    }
    return this.mapToEntity(data);
  }

  async update(id: string, fields: Partial<Invoice>): Promise<Invoice> {
    if (!hasSupabaseKeys) {
      const idx = mockInvoices.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Invoice not found');
      mockInvoices[idx] = { ...mockInvoices[idx], ...fields, updatedAt: new Date() };
      return mockInvoices[idx];
    }

    const updatePayload: any = {};
    if (fields.name !== undefined) updatePayload.name = fields.name;
    if (fields.description !== undefined) updatePayload.description = fields.description;
    if (fields.type !== undefined) updatePayload.type = fields.type;
    if (fields.amount !== undefined) updatePayload.amount = fields.amount;
    if (fields.issueDate !== undefined) updatePayload.issue_date = fields.issueDate;
    if (fields.dueDate !== undefined) updatePayload.due_date = fields.dueDate;
    if (fields.paymentDate !== undefined) updatePayload.payment_date = fields.paymentDate;
    if (fields.status !== undefined) updatePayload.status = fields.status;
    if (fields.attachmentUrl !== undefined) updatePayload.attachment_url = fields.attachmentUrl;

    const { data, error } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error updating invoice');
    }
    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<boolean> {
    if (!hasSupabaseKeys) {
      const idx = mockInvoices.findIndex(b => b.id === id);
      if (idx === -1) return false;
      mockInvoices.splice(idx, 1);
      return true;
    }
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  private mapToEntity(data: any): Invoice {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      type: data.type as InvoiceType,
      amount: Number(data.amount),
      issueDate: data.issue_date || data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      dueDate: data.due_date || data.payment_date || new Date().toISOString().split('T')[0],
      paymentDate: data.payment_date || null,
      status: data.status as InvoiceStatus,
      attachmentUrl: data.attachment_url,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}
export const invoiceRepository = new SupabaseInvoiceRepository();
