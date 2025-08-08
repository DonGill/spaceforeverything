-- Users, Roles, and Authentication Schema
-- Simplified single-role-per-user architecture
-- Created: 2025-08-08

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE Roles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(50) NOT NULL UNIQUE, -- 'User', 'Lister', 'Admin'
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    INDEX IX_Roles_Name (Name)
);

-- Insert default roles
INSERT INTO Roles (Name, Description) VALUES 
    ('User', 'Standard user who can view and comment on listings'),
    ('Lister', 'User who can create and manage their own listings'),
    ('Admin', 'Administrator with full system access');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleId UNIQUEIDENTIFIER NOT NULL,
    EmailVerified BIT NOT NULL DEFAULT 0,
    EmailVerificationToken UNIQUEIDENTIFIER NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2 NULL,
    PromotedAt DATETIME2 NULL, -- When user was promoted to Lister
    PromotedBy UNIQUEIDENTIFIER NULL, -- Admin who promoted the user
    
    FOREIGN KEY (RoleId) REFERENCES Roles(Id),
    FOREIGN KEY (PromotedBy) REFERENCES Users(Id),
    INDEX IX_Users_Email (Email),
    INDEX IX_Users_RoleId (RoleId),
    INDEX IX_Users_EmailVerificationToken (EmailVerificationToken),
    INDEX IX_Users_IsActive (IsActive)
);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE UserSessions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    SessionToken NVARCHAR(255) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IpAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_UserSessions_SessionToken (SessionToken),
    INDEX IX_UserSessions_UserId (UserId),
    INDEX IX_UserSessions_ExpiresAt (ExpiresAt)
);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE PasswordResetTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token UNIQUEIDENTIFIER NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UsedAt DATETIME2 NULL,
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_PasswordResetTokens_Token (Token),
    INDEX IX_PasswordResetTokens_UserId (UserId)
);

-- ============================================
-- UTILITY VIEWS
-- ============================================
GO

-- View for user details with role name
CREATE VIEW UserDetails AS
SELECT 
    u.Id,
    u.Email,
    u.FirstName,
    u.LastName,
    r.Name AS RoleName,
    u.EmailVerified,
    u.IsActive,
    u.CreatedAt,
    u.LastLoginAt,
    u.PromotedAt,
    promoter.FirstName + ' ' + promoter.LastName AS PromotedByName
FROM Users u
JOIN Roles r ON u.RoleId = r.Id
LEFT JOIN Users promoter ON u.PromotedBy = promoter.Id;

GO

-- ============================================
-- CLEANUP PROCEDURES
-- ============================================

-- Procedure to clean up expired sessions
CREATE PROCEDURE CleanupExpiredSessions
AS
BEGIN
    DELETE FROM UserSessions 
    WHERE ExpiresAt < GETUTCDATE() OR IsActive = 0;
    
    DELETE FROM PasswordResetTokens 
    WHERE ExpiresAt < GETUTCDATE() OR UsedAt IS NOT NULL;
END;