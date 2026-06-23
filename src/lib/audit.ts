import { v4 as uuidv4 } from 'uuid';
import { execute } from './db';

interface AuditLogEntry {
  userId?: string;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (id, user_id, action, module, description, ip_address, user_agent, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        entry.userId || null,
        entry.action,
        entry.module,
        entry.description || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
      ]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
