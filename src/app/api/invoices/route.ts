import { NextResponse } from 'next/server';
import { invoiceRepository } from '@/infrastructure/repositories/SupabaseInvoiceRepository';
import { GetUserInvoices } from '@/core/usecases/invoices/GetUserInvoices';
import { CreateInvoice } from '@/core/usecases/invoices/CreateInvoice';
import { DeleteInvoice } from '@/core/usecases/invoices/DeleteInvoice';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const usecase = new GetUserInvoices(invoiceRepository);
    const invoices = await usecase.execute(user.userId);

    return NextResponse.json({ success: true, invoices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let invoice;
    
    if (body.id) {
      const existing = await invoiceRepository.findById(body.id);
      if (existing) {
        if (existing.userId !== user.userId) {
          return NextResponse.json({ success: false, error: 'Unauthorized invoice modification' }, { status: 403 });
        }
        invoice = await invoiceRepository.update(body.id, {
          name: body.name,
          description: body.description,
          type: body.type,
          amount: Number(body.amount),
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          paymentDate: body.paymentDate,
          status: body.status,
          attachmentUrl: body.attachmentUrl,
        });
      }
    }

    if (!invoice) {
      const usecase = new CreateInvoice(invoiceRepository);
      invoice = await usecase.execute({
        ...body,
        userId: user.userId,
      });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}


export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing invoice ID' }, { status: 400 });
    }

    const usecase = new DeleteInvoice(invoiceRepository);
    const success = await usecase.execute(id, user.userId);

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
