// /src/lib/email/sendMail.js
import 'server-only';
import nodemailer from 'nodemailer';

export async function sendMail({ to, subject, html, text }) {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
    EMAIL_SECURE,
  } = process.env;

  // Dev fallback: if SMTP is not configured, log the email instead of throwing
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.log('---- DEV EMAIL (missing SMTP env) ----');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('HTML:', html);
    console.log('--------------------------------------');
    return { ok: true, dev: true };
  }

  const secure =
    (EMAIL_SECURE ?? '').toString().toLowerCase() === 'true' ||
    Number(EMAIL_PORT) === 465;

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  // Optional sanity check (useful when debugging SMTP issues)
  // await transporter.verify();

  await transporter.sendMail({
    from: EMAIL_FROM || EMAIL_USER, // fallback to mailbox
    to,
    subject,
    text,
    html,
  });

  return { ok: true };
}
