// DEPLOYMENT: PostgreSQL (Supabase) - Uncomment for production deployment
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'e_procurement',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const result = await pool.query(sql, params);
  return result.rows as unknown as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? (result.rows[0] as unknown as T) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params?: any[]): Promise<any> {
  const result = await pool.query(sql, params);
  return result;
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// LOCAL: MySQL (XAMPP) - Active for local development
// import mysql, { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

// const pool = mysql.createPool({
//   host: process.env.DATABASE_HOST || 'localhost',
//   port: parseInt(process.env.DATABASE_PORT || '3306'),
//   user: process.env.DATABASE_USER || 'root',
//   password: process.env.DATABASE_PASSWORD || '',
//   database: process.env.DATABASE_NAME || 'e_procurement',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0,
// });

// export default pool;

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
//   const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
//   return rows as unknown as T;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
//   const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
//   return rows.length > 0 ? (rows[0] as unknown as T) : null;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export async function execute(sql: string, params?: any[]): Promise<ResultSetHeader> {
//   const [result] = await pool.execute<ResultSetHeader>(sql, params);
//   return result;
// }

// export async function transaction<T>(
//   callback: (connection: PoolConnection) => Promise<T>
// ): Promise<T> {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     const result = await callback(connection);
//     await connection.commit();
//     return result;
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }
