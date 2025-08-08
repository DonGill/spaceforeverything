// Test helper functions for API testing
const BASE_URL = 'http://localhost:3001/api';

// Test user templates
export const TEST_USERS = {
  REGULAR: {
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'testpassword123'
  },
  ADMIN: {
    email: 'testadmin@example.com',
    firstName: 'Test',
    lastName: 'Admin', 
    password: 'adminpassword123'
  },
  LISTER: {
    email: 'testlister@example.com',
    firstName: 'Test',
    lastName: 'Lister',
    password: 'listerpassword123'
  }
};

// API Helper Functions
export async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data, status: response.status };
}

// Authentication Helpers
export async function registerUser(userData) {
  return makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function loginUser(email, password) {
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  // Extract session cookie if login successful
  let sessionCookie = '';
  if (result.response.headers.get('set-cookie')) {
    const setCookieHeader = result.response.headers.get('set-cookie');
    const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
    if (sessionMatch) {
      sessionCookie = `session=${sessionMatch[1]}`;
    }
  }
  
  return { ...result, sessionCookie };
}

export async function logoutUser(sessionCookie) {
  return makeRequest('/auth/logout', {
    method: 'POST',
    headers: { Cookie: sessionCookie }
  });
}

export async function getCurrentUser(sessionCookie) {
  return makeRequest('/auth/me', {
    headers: { Cookie: sessionCookie }
  });
}

export async function promoteUser(adminSessionCookie, userId) {
  return makeRequest('/admin/promote', {
    method: 'POST',
    headers: { Cookie: adminSessionCookie },
    body: JSON.stringify({ userId })
  });
}

// Test Setup Helpers
export async function createTestUser(userType = 'REGULAR') {
  const userData = TEST_USERS[userType];
  const { data, status } = await registerUser(userData);
  
  return {
    userData,
    userId: data.userId,
    success: data.success,
    status
  };
}

export async function loginAsRole(role = 'REGULAR') {
  const userData = TEST_USERS[role];
  const loginResult = await loginUser(userData.email, userData.password);
  
  return {
    ...loginResult,
    userData
  };
}

// Test Cleanup Helpers
export async function cleanupTestUsers() {
  // Note: In a real app, you'd want to clean up test users
  // For now, we'll leave them in the database
  console.log('🧹 Test cleanup - keeping test users for now');
}

// Assertion Helpers
export function assertSuccess(result, message = '') {
  if (!result.data.success) {
    throw new Error(`${message} - Expected success but got: ${result.data.error || 'Unknown error'}`);
  }
}

export function assertFailure(result, expectedStatus, message = '') {
  if (result.data.success) {
    throw new Error(`${message} - Expected failure but got success`);
  }
  if (result.status !== expectedStatus) {
    throw new Error(`${message} - Expected status ${expectedStatus} but got ${result.status}`);
  }
}

export function assertRole(user, expectedRole) {
  if (user.role !== expectedRole) {
    throw new Error(`Expected role '${expectedRole}' but got '${user.role}'`);
  }
}

// Test Result Helpers
export function logTestResult(testName, success, details = '') {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}${details ? ' - ' + details : ''}`);
}

export function logTestSection(sectionName) {
  console.log(`\n🔍 ${sectionName}`);
}