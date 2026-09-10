import nodemailer from 'nodemailer';

export type PaymentEmail = {
  orderId: string;
  trxId: string;
  customerEmail: string;
  amount: string;
  status: string;
  reason?: string | null;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[
        character
      ] ?? character
  );
}

export async function sendPaymentStatusEmail(
  payment: PaymentEmail
): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } =
    process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM)
    return false;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  const subject =
    payment.status === 'approved'
      ? 'Safetly payment confirmed'
      : `Safetly payment ${payment.status.replaceAll('_', ' ')}`;
  const amount = escapeHtml(payment.amount);
  await transporter.sendMail({
    from: SMTP_FROM,
    to: payment.customerEmail,
    subject,
    text: `Safetly payment status: ${payment.status}\nOrder ID: ${payment.orderId}\nTransaction ID: ${payment.trxId}\nAmount: ৳${payment.amount}${payment.reason ? `\nMessage: ${payment.reason}` : ''}`,
    html: `<h2>Safetly payment status: ${escapeHtml(payment.status)}</h2><p><strong>Order ID:</strong> ${escapeHtml(payment.orderId)}</p><p><strong>Transaction ID:</strong> ${escapeHtml(payment.trxId)}</p><p><strong>Amount:</strong> ৳${amount}</p>${payment.reason ? `<p>${escapeHtml(payment.reason)}</p>` : ''}`,
  });
  return true;
}
