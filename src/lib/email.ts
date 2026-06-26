// // DEPLOYMENT: Resend (Email) - Uncomment for production deployment
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// interface EmailOptions {
//   to: string;
//   subject: string;
//   html: string;
// }

// export async function sendEmail(options: EmailOptions): Promise<boolean> {
//   try {
//     await resend.emails.send({
//       from: process.env.RESEND_FROM_EMAIL || 'noreply@eprocurement.com',
//       to: options.to,
//       subject: options.subject,
//       html: options.html,
//     });
//     return true;
//   } catch (error) {
//     console.error('Email send failed:', error);
//     return false;
//   }
// }

// LOCAL: Nodemailer (SMTP) - Active for local development
import nodemailer from 'nodemailer';
import { queryOne } from './db';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@eprocurement.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

export async function sendTemplateEmail(
  templateName: string,
  to: string,
  variables: Record<string, string>
): Promise<boolean> {
  try {
    const template = await queryOne<{ subject: string; body: string }>(
      'SELECT subject, body FROM email_templates WHERE name = ? AND is_active = TRUE',
      [templateName]
    );

    if (!template) {
      console.error(`Email template '${templateName}' not found`);
      return false;
    }

    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    return sendEmail({ to, subject, html: body });
  } catch (error) {
    console.error('Template email failed:', error);
    return false;
  }
}
