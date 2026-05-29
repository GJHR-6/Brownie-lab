/**
 * Google Wallet Loyalty Pass generator (JWT "Save to Wallet" flow)
 *
 * Required env vars:
 *   GOOGLE_WALLET_ISSUER_ID  → ID numérico de Google Pay & Wallet Console
 *   GOOGLE_WALLET_SA_EMAIL   → email de la service account de Google Cloud
 *   GOOGLE_WALLET_SA_KEY     → base64(service account JSON key file)
 *
 * Setup:
 *   1. Google Pay & Wallet Console → crear Issuer account
 *   2. Google Cloud → IAM → crear Service Account con rol "Wallet Object Issuer"
 *   3. Crear JSON key → descargar → base64 encode: `base64 -w 0 key.json`
 *   4. Crear LoyaltyClass una sola vez via API (o script setup)
 *   5. npm install jsonwebtoken
 *
 * Flujo:
 *   GET /api/wallet/google/[telefono]
 *   → generarGoogleWalletUrl()
 *   → redirect a https://pay.google.com/gp/v/save/{jwt}
 *   → usuario guarda el pase en Google Wallet
 */

import type { ClienteFidelizacion } from '@/actions/fidelizacion';

const ISSUER_ID    = process.env.GOOGLE_WALLET_ISSUER_ID ?? '';
const SA_EMAIL     = process.env.GOOGLE_WALLET_SA_EMAIL  ?? '';
const SA_KEY_B64   = process.env.GOOGLE_WALLET_SA_KEY    ?? '';
const CLASS_SUFFIX = 'brownielab_loyalty';
const ORIGIN       = 'https://brownielabhn.com';

export async function generarGoogleWalletUrl(cliente: ClienteFidelizacion): Promise<string> {
  if (!ISSUER_ID || !SA_EMAIL || !SA_KEY_B64) {
    throw new Error('Google Wallet env vars no configurados. Ver src/lib/wallet/google.ts');
  }

  const jwt = await import('jsonwebtoken');
  const saKey = JSON.parse(Buffer.from(SA_KEY_B64, 'base64').toString('utf-8'));

  const classId  = `${ISSUER_ID}.${CLASS_SUFFIX}`;
  const objectId = `${ISSUER_ID}.brownielab_${cliente.telefono}`;
  const sellosRestantes = 10 - cliente.compras_actuales;

  const loyaltyObject = {
    id:          objectId,
    classId,
    state:       'ACTIVE',
    accountId:   cliente.telefono,
    accountName: cliente.nombre || 'Cliente Brownie Lab',

    loyaltyPoints: {
      balance: { int: cliente.compras_actuales },
      label:   'Sellos',
    },

    barcode: {
      type:          'QR_CODE',
      value:         cliente.telefono,
      alternateText: cliente.telefono,
    },

    textModulesData: [
      {
        id:     'progreso',
        header: 'Progreso',
        body:   `${cliente.compras_actuales} de 10 sellos completados`,
      },
      {
        id:     'restantes',
        header: 'Siguiente premio',
        body:   sellosRestantes === 0
          ? '¡Tienes un brownie gratis disponible!'
          : `Te faltan ${sellosRestantes} compra${sellosRestantes !== 1 ? 's' : ''}`,
      },
      {
        id:     'totales',
        header: 'Compras históricas',
        body:   `${cliente.compras_totales} en total`,
      },
    ],

    linksModuleData: {
      uris: [
        {
          uri:         ORIGIN,
          description: 'Ver mi progreso',
          id:          'web',
        },
      ],
    },
  };

  const payload = {
    iss:     SA_EMAIL,
    aud:     'google',
    origins: [ORIGIN],
    typ:     'savetowallet',
    payload: {
      loyaltyObjects: [loyaltyObject],
    },
  };

  const token = jwt.default.sign(payload, saKey.private_key, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
}

/**
 * Actualiza un LoyaltyObject existente en Google Wallet via REST API PATCH.
 * Llamar después de cada registrarCompra para mantener el pase sincronizado.
 */
export async function actualizarGoogleWalletObject(cliente: ClienteFidelizacion): Promise<void> {
  if (!ISSUER_ID || !SA_EMAIL || !SA_KEY_B64) return; // env vars no configurados → skip silencioso

  const { GoogleAuth } = await import('google-auth-library');
  const saKey = JSON.parse(Buffer.from(SA_KEY_B64, 'base64').toString('utf-8'));

  const auth = new GoogleAuth({
    credentials: saKey,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  const authClient = await auth.getClient();
  const objectId = `${ISSUER_ID}.brownielab_${cliente.telefono}`;
  const sellosRestantes = 10 - cliente.compras_actuales;

  const patch = {
    loyaltyPoints: {
      balance: { int: cliente.compras_actuales },
      label:   'Sellos',
    },
    textModulesData: [
      {
        id:     'progreso',
        header: 'Progreso',
        body:   `${cliente.compras_actuales} de 10 sellos completados`,
      },
      {
        id:     'restantes',
        header: 'Siguiente premio',
        body:   sellosRestantes === 0
          ? '¡Tienes un brownie gratis disponible!'
          : `Te faltan ${sellosRestantes} compra${sellosRestantes !== 1 ? 's' : ''}`,
      },
      {
        id:     'totales',
        header: 'Compras históricas',
        body:   `${cliente.compras_totales} en total`,
      },
    ],
  };

  await (authClient as any).request({
    url:    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(objectId)}`,
    method: 'PATCH',
    data:   patch,
  });
}

/**
 * Crea el LoyaltyClass una sola vez en Google Wallet.
 * Llamar este script manualmente con: npx ts-node src/lib/wallet/google-setup.ts
 * No se necesita llamar en runtime.
 */
export async function crearLoyaltyClass(): Promise<void> {
  const { GoogleAuth } = await import('google-auth-library');
  const saKey = JSON.parse(Buffer.from(SA_KEY_B64, 'base64').toString('utf-8'));

  const auth = new GoogleAuth({
    credentials: saKey,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  const client = await auth.getClient();
  const classId = `${ISSUER_ID}.${CLASS_SUFFIX}`;

  const loyaltyClass = {
    id:          classId,
    issuerName:  'Brownie Lab',
    programName: 'Club Brownie Lab',
    programLogo: {
      sourceUri:   { uri: `${ORIGIN}/logo.png` },
      contentDescription: { defaultValue: { language: 'es', value: 'Logo Brownie Lab' } },
    },
    rewardsTierLabel:  'Nivel',
    rewardsTier:       'Fiel',
    countryCode:       'HN',
    reviewStatus:      'UNDER_REVIEW',
    hexBackgroundColor: '#5c391a',
    heroImage: {
      sourceUri: { uri: `${ORIGIN}/og-image.jpg` },
      contentDescription: { defaultValue: { language: 'es', value: 'Brownies artesanales' } },
    },
  };

  const res = await (client as any).request({
    url:    'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
    method: 'POST',
    data:   loyaltyClass,
  });

  console.log('LoyaltyClass creada:', res.data.id);
}
