-- Simple Azure SQL Database setup for hello world test
-- Run this in your Azure SQL Database

CREATE TABLE messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    message NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Insert test data
INSERT INTO messages (message) VALUES ('Hello World from Azure SQL!');
INSERT INTO messages (message) VALUES ('Database connection is working!');
INSERT INTO messages (message) VALUES ('Next.js + Azure SQL = Success!');