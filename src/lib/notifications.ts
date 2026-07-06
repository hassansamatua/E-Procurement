import { v4 as uuidv4 } from 'uuid';
import { execute } from './db';
import { sendTemplateEmail } from './email';

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category?: string;
  referenceId?: string;
  referenceType?: string;
  sendEmail?: boolean;
  emailTo?: string;
  emailTemplate?: string;
  emailVariables?: Record<string, string>;
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const id = uuidv4();
    let isEmailSent = false;

    await execute(
      `INSERT INTO notifications (id, user_id, title, message, type, category, reference_id, reference_type, is_email_sent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.userId,
        payload.title,
        payload.message,
        payload.type || 'INFO',
        payload.category || null,
        payload.referenceId || null,
        payload.referenceType || null,
        false,
      ]
    );

    if (payload.sendEmail && payload.emailTo && payload.emailTemplate) {
      isEmailSent = await sendTemplateEmail(
        payload.emailTemplate,
        payload.emailTo,
        payload.emailVariables || {}
      );

      if (isEmailSent) {
        await execute('UPDATE notifications SET is_email_sent = TRUE WHERE id = ?', [id]);
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await execute(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await execute(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
}
