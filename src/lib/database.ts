import sql from 'mssql';

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE || '',
  user: process.env.AZURE_SQL_USERNAME || '',
  password: process.env.AZURE_SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  try {
    if (pool) {
      return pool;
    }
    
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function getMessages() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT id, message, created_at FROM messages ORDER BY created_at DESC');
    return result.recordset;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}