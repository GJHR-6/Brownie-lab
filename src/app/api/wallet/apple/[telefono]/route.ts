import { NextResponse } from 'next/server';

// Apple Wallet no disponible — ver src/lib/wallet/apple.ts
export async function GET() {
  return NextResponse.json(
    { error: 'Apple Wallet no disponible. Usa la tarjeta web en brownielabhn.com' },
    { status: 410 }
  );
}
