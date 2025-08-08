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

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

export async function createUser(email: string, firstName: string, lastName: string, passwordHash: string, roleId?: string) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Default to 'User' role if no role specified
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const roleResult = await request.query("SELECT Id FROM Roles WHERE Name = 'User'");
      finalRoleId = roleResult.recordset[0]?.Id;
    }
    
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('firstName', sql.NVarChar(100), firstName)
      .input('lastName', sql.NVarChar(100), lastName)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .input('roleId', sql.UniqueIdentifier, finalRoleId)
      .query(`
        INSERT INTO Users (Email, FirstName, LastName, PasswordHash, RoleId)
        OUTPUT INSERTED.Id
        VALUES (@email, @firstName, @lastName, @passwordHash, @roleId)
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`
        SELECT u.Id, u.Email, u.FirstName, u.LastName, u.PasswordHash, 
               u.EmailVerified, u.IsActive, u.CreatedAt, u.LastLoginAt,
               r.Name as RoleName, r.Id as RoleId
        FROM Users u
        JOIN Roles r ON u.RoleId = r.Id
        WHERE u.Email = @email AND u.IsActive = 1
      `);
    
    return result.recordset[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

export async function getUserById(userId: string) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT u.Id, u.Email, u.FirstName, u.LastName,
               u.EmailVerified, u.IsActive, u.CreatedAt, u.LastLoginAt,
               r.Name as RoleName, r.Id as RoleId
        FROM Users u
        JOIN Roles r ON u.RoleId = r.Id
        WHERE u.Id = @userId AND u.IsActive = 1
      `);
    
    return result.recordset[0] || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function updateUserLastLogin(userId: string) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('UPDATE Users SET LastLoginAt = GETUTCDATE() WHERE Id = @userId');
  } catch (error) {
    console.error('Error updating user last login:', error);
    throw error;
  }
}

export async function promoteUserToLister(userId: string, promotedBy: string) {
  try {
    const pool = await getConnection();
    
    // Get Lister role ID
    const roleResult = await pool.request()
      .query("SELECT Id FROM Roles WHERE Name = 'Lister'");
    const listerRoleId = roleResult.recordset[0]?.Id;
    
    if (!listerRoleId) {
      throw new Error('Lister role not found');
    }
    
    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('listerRoleId', sql.UniqueIdentifier, listerRoleId)
      .input('promotedBy', sql.UniqueIdentifier, promotedBy)
      .query(`
        UPDATE Users 
        SET RoleId = @listerRoleId, 
            PromotedAt = GETUTCDATE(), 
            PromotedBy = @promotedBy,
            UpdatedAt = GETUTCDATE()
        WHERE Id = @userId
      `);
  } catch (error) {
    console.error('Error promoting user to lister:', error);
    throw error;
  }
}

// ============================================
// SESSION MANAGEMENT FUNCTIONS
// ============================================

export async function createSession(userId: string, sessionToken: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('sessionToken', sql.NVarChar(255), sessionToken)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .input('ipAddress', sql.NVarChar(45), ipAddress)
      .input('userAgent', sql.NVarChar(500), userAgent)
      .query(`
        INSERT INTO UserSessions (UserId, SessionToken, ExpiresAt, IpAddress, UserAgent)
        OUTPUT INSERTED.Id
        VALUES (@userId, @sessionToken, @expiresAt, @ipAddress, @userAgent)
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSessionByToken(sessionToken: string) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('sessionToken', sql.NVarChar(255), sessionToken)
      .query(`
        SELECT s.Id, s.UserId, s.ExpiresAt, s.IsActive,
               u.Email, u.FirstName, u.LastName, r.Name as RoleName
        FROM UserSessions s
        JOIN Users u ON s.UserId = u.Id
        JOIN Roles r ON u.RoleId = r.Id
        WHERE s.SessionToken = @sessionToken 
          AND s.IsActive = 1 
          AND s.ExpiresAt > GETUTCDATE()
          AND u.IsActive = 1
      `);
    
    return result.recordset[0] || null;
  } catch (error) {
    console.error('Error fetching session by token:', error);
    throw error;
  }
}

export async function invalidateSession(sessionToken: string) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('sessionToken', sql.NVarChar(255), sessionToken)
      .query('UPDATE UserSessions SET IsActive = 0 WHERE SessionToken = @sessionToken');
  } catch (error) {
    console.error('Error invalidating session:', error);
    throw error;
  }
}

// ============================================
// PASSWORD RESET FUNCTIONS
// ============================================

export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('token', sql.UniqueIdentifier, token)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO PasswordResetTokens (UserId, Token, ExpiresAt)
        OUTPUT INSERTED.Id
        VALUES (@userId, @token, @expiresAt)
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating password reset token:', error);
    throw error;
  }
}

export async function validatePasswordResetToken(token: string) {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('token', sql.UniqueIdentifier, token)
      .query(`
        SELECT p.Id, p.UserId, p.ExpiresAt, u.Email
        FROM PasswordResetTokens p
        JOIN Users u ON p.UserId = u.Id
        WHERE p.Token = @token 
          AND p.ExpiresAt > GETUTCDATE() 
          AND p.UsedAt IS NULL
          AND u.IsActive = 1
      `);
    
    return result.recordset[0] || null;
  } catch (error) {
    console.error('Error validating password reset token:', error);
    throw error;
  }
}

export async function markPasswordResetTokenAsUsed(tokenId: string) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('tokenId', sql.UniqueIdentifier, tokenId)
      .query('UPDATE PasswordResetTokens SET UsedAt = GETUTCDATE() WHERE Id = @tokenId');
  } catch (error) {
    console.error('Error marking password reset token as used:', error);
    throw error;
  }
}

// ============================================
// ROLE FUNCTIONS
// ============================================

export async function getAllRoles() {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT Id, Name, Description FROM Roles ORDER BY Name');
    
    return result.recordset;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}