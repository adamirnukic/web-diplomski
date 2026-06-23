import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env

/** SMTP is optional — when unset we fall back to returning the link to the UI. */
export function mailerConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<boolean> {
  if (!mailerConfigured()) return false
  const port = Number(SMTP_PORT ?? 587)
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  await transport.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to,
    subject: 'GameVault — reset lozinke',
    text: `Klikni na link da postaviš novu lozinku (vrijedi 1 sat):\n\n${link}\n\nAko nisi ti tražio/la reset, ignoriši ovaj email.`,
    html:
      `<p>Klikni na link da postaviš novu lozinku (vrijedi 1 sat):</p>` +
      `<p><a href="${link}">${link}</a></p>` +
      `<p>Ako nisi ti tražio/la reset, ignoriši ovaj email.</p>`,
  })
  return true
}
