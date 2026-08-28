import { Sale, Installment, Client } from '../types';

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.startsWith('55')) {
    return digits;
  }
  return digits;
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = cleanPhone(phone || '');
  if (!message) {
    return cleaned ? `https://api.whatsapp.com/send?phone=${cleaned}` : 'https://api.whatsapp.com/send';
  }
  
  // Normalizing string with NFC ensures unicode emojis (4-byte code points) are cleanly encoded
  const normalizedMessage = typeof message === 'string' ? message.normalize('NFC') : String(message);
  const encoded = encodeURIComponent(normalizedMessage);
  
  return cleaned 
    ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}

export function isDateOverdue(dueDate: string | undefined | null): boolean {
  if (!dueDate || typeof dueDate !== 'string') return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cleanDateStr = dueDate.trim();
    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (cleanDateStr.includes('/')) {
      const parts = cleanDateStr.split('/');
      if (parts.length === 3) {
        if (parts[0].length <= 2 && parts[2].length === 4) {
          cleanDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    } else if (cleanDateStr.includes('-')) {
      const parts = cleanDateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        // If DD-MM-YYYY
        if (parts[0].length <= 2 && parts[2].length === 4) {
          cleanDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    const cleanYMD = cleanDateStr.split('T')[0];
    const [y, m, d] = cleanYMD.split('-').map(Number);
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return false;
    
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);
    return due < today;
  } catch {
    return false;
  }
}

export function isBirthdayThisMonth(birthDate?: string | null): boolean {
  if (!birthDate || typeof birthDate !== 'string') return false;
  try {
    const parts = birthDate.split('-');
    if (parts.length < 2) return false;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return parseInt(parts[1], 10) === currentMonth;
  } catch {
    return false;
  }
}

export function isBirthdayToday(birthDate?: string | null): boolean {
  if (!birthDate || typeof birthDate !== 'string') return false;
  try {
    const parts = birthDate.split('-');
    if (parts.length < 3) return false;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    return parseInt(parts[1], 10) === currentMonth && parseInt(parts[2], 10) === currentDay;
  } catch {
    return false;
  }
}

export function generateSaleReceiptMessage(
  sale: Sale, 
  consultantName: string = 'Sua Consultora de Beleza',
  pixKey?: string,
  customFooter?: string
): string {
  const formattedDate = formatDate(sale.date);
  const formattedTotal = formatCurrency(sale.totalAmount);
  
  let msg = `✨ *COMPROVANTE DE PEDIDO* ✨\n`;
  msg += `🌸 *O Boticário & Eudora*\n`;
  msg += `─────────────────────────\n`;
  msg += `👤 *Cliente:* ${sale.clientName}\n`;
  msg += `📅 *Data:* ${formattedDate}\n`;
  msg += `🏷️ *Ciclo:* ${sale.cycle}\n`;
  msg += `─────────────────────────\n`;
  msg += `🛍️ *ITENS DO PEDIDO:*\n`;

  sale.items.forEach((item, idx) => {
    const brandName = item.brand === 'boticario' ? 'O Boticário' : 'Eudora';
    msg += `${idx + 1}. *${item.productName}*\n`;
    msg += `   └ ${item.quantity}x ${formatCurrency(item.unitSalePrice)} = *${formatCurrency(item.subtotal)}* (${brandName})\n`;
  });

  msg += `─────────────────────────\n`;
  msg += `Subtotal: ${formatCurrency(sale.subtotal)}\n`;
  if (sale.discountValue > 0) {
    const discLabel = sale.discountType === 'percentage' ? `${sale.discountValue}%` : formatCurrency(sale.discountValue);
    msg += `Desconto Especial: -${discLabel}\n`;
  }
  msg += `*TOTAL A PAGAR:* ${formattedTotal}\n`;
  
  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro à Vista',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    fiado: 'Parcelado / Fiado',
  };
  msg += `Forma de Pagamento: *${paymentLabels[sale.paymentMethod] || sale.paymentMethod}*\n`;

  if (pixKey && (sale.paymentMethod === 'pix' || sale.paymentMethod === 'fiado')) {
    msg += `🔑 *Chave PIX:* ${pixKey}\n`;
  }

  if (sale.paymentMethod === 'fiado' && sale.installments && sale.installments.length > 0) {
    msg += `\n📋 *PARCELAS:*\n`;
    sale.installments.forEach((inst) => {
      const status = inst.isPaid ? '✅ Paga' : '⏳ Vence em ' + formatDate(inst.dueDate);
      msg += `• Parcela ${inst.installmentNumber}/${inst.totalInstallments}: ${formatCurrency(inst.amount)} (${status})\n`;
    });
  }

  if (customFooter && customFooter.trim()) {
    msg += `\n${customFooter.trim()}\n`;
  } else {
    msg += `\n💖 *Muito obrigada pela sua preferência e carinho!*\n`;
  }
  msg += `_${consultantName}_ 💄`;

  return msg;
}

export function generatePaymentReminderMessage(
  clientName: string, 
  installment: Installment, 
  consultantName: string = 'Sua Consultora',
  pixKey?: string
): string {
  const instNumber = installment?.installmentNumber ?? 1;
  const totalInst = installment?.totalInstallments ?? 1;
  const amount = installment?.amount ?? 0;
  const dueDate = installment?.dueDate ?? '';
  const isOverdue = isDateOverdue(dueDate);

  let msg = `Olá ${clientName || 'Cliente'}, tudo bem? 🌸\n\n`;
  if (isOverdue) {
    msg += `Passando para lembrar com carinho que a parcela *${instNumber}/${totalInst}* no valor de *${formatCurrency(amount)}* referente aos seus produtinhos O Boticário & Eudora venceu em *${formatDate(dueDate)}*.\n\n`;
  } else {
    msg += `Passando com carinho para lembrar da parcela *${instNumber}/${totalInst}* no valor de *${formatCurrency(amount)}*, com vencimento em *${formatDate(dueDate)}* referente aos seus produtinhos de beleza.\n\n`;
  }

  if (pixKey && pixKey.trim()) {
    msg += `🔑 *Chave PIX para pagamento:* ${pixKey.trim()}\n\n`;
  }

  msg += `Caso já tenha realizado o pagamento ou precise de qualquer ajuda, é só me avisar! Muito obrigada pelo carinho e preferência! 💄✨\n\n_${consultantName}_`;
  return msg;
}

export function generateBirthdayMessage(
  clientOrName: Client | string,
  discountCouponOrConsultant = '10% de desconto Especial',
  consultantName = 'Sua Consultora de Beleza'
): string {
  const rawName = typeof clientOrName === 'string' ? clientOrName : (clientOrName?.name || 'Cliente');
  const firstName = (rawName.split(' ')[0] || 'Cliente').toUpperCase();
  const coupon = discountCouponOrConsultant || '10% de desconto';

  return `🎉 *PARABÉNS, ${firstName}!* 🎂🎈\n\nHoje é o seu dia especial! Desejo muita saúde, paz, conquistas e momentos cheios de brilho e beleza! ✨\n\nPara celebrar essa data tão linda, preparei um mimo especial pra você: *${coupon}* em qualquer produtinho O Boticário ou Eudora do ciclo atual! 🎁💄\n\nUm grande abraço e tenha um dia maravilhoso! 🌸\n\n_${consultantName}_`;
}
