import { Linking, Platform } from 'react-native';

export type ContactMethod = 'call' | 'sms' | 'whatsapp';

/** Keeps a leading "+" and digits only, e.g. "+91 98765-43210" → "+919876543210". */
export function cleanPhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

export function hasPhone(phone: string) {
  return cleanPhone(phone).replace('+', '').length >= 6;
}

function buildUrl(method: ContactMethod, phone: string, message: string) {
  const number = cleanPhone(phone);
  const text = encodeURIComponent(message);
  switch (method) {
    case 'call':
      return `tel:${number}`;
    case 'sms':
      // iOS uses "&body=", Android uses "?body=".
      return `sms:${number}${Platform.OS === 'ios' ? '&' : '?'}body=${text}`;
    case 'whatsapp':
      // wa.me wants the full international number without "+".
      return `https://wa.me/${number.replace('+', '')}?text=${text}`;
  }
}

/** Opens the dialer, SMS app or WhatsApp. Resolves to false if nothing could open it. */
export async function contact(method: ContactMethod, phone: string, message = '') {
  try {
    await Linking.openURL(buildUrl(method, phone, message));
    return true;
  } catch {
    return false;
  }
}
