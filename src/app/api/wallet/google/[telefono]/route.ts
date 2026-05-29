import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { generarGoogleWalletUrl } from '@/lib/wallet/google';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ telefono: string }> }
) {
  const { telefono } = await params;
  const tel = telefono.replace(/\D/g, '');

  try {
    const supabase = createSupabaseServiceClient();
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', tel)
      .single();

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const url = await generarGoogleWalletUrl(cliente);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('[Google Wallet]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error generando pase' },
      { status: 500 }
    );
  }
}
