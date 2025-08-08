// Login endpoint tests
import { 
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  TEST_USERS,
  assertSuccess,
  assertFailure,
  assertRole,
  logTestResult,
  logTestSection 
} from '../utils/testHelpers.js';

export async function runLoginTests() {
  logTestSection('Login & Session Tests');
  
  try {
    // Setup: Create a test user
    const testUser = {
      ...TEST_USERS.REGULAR,
      email: `login-test-${Date.now()}@example.com`
    };
    
    const setupResult = await registerUser(testUser);
    assertSuccess(setupResult, 'Test user creation');

    // Test 1: Valid login
    const loginResult = await loginUser(testUser.email, testUser.password);
    assertSuccess(loginResult, 'Valid login');
    assertRole(loginResult.data.user, 'User');
    logTestResult('Valid user login', true, `Role: ${loginResult.data.user.role}`);

    const sessionCookie = loginResult.sessionCookie;
    if (!sessionCookie) {
      throw new Error('No session cookie received');
    }

    // Test 2: Session validation (/me endpoint)
    const meResult = await getCurrentUser(sessionCookie);
    assertSuccess(meResult, 'Session validation');
    assertRole(meResult.data.user, 'User');
    logTestResult('Session validation', true, 'Valid session');

    // Test 3: Logout
    const logoutResult = await logoutUser(sessionCookie);
    assertSuccess(logoutResult, 'Logout');
    logTestResult('User logout', true, 'Session invalidated');

    // Test 4: Session validation after logout (should fail)
    const meAfterLogoutResult = await getCurrentUser(sessionCookie);
    assertFailure(meAfterLogoutResult, 401, 'Session after logout');
    logTestResult('Session after logout', true, 'Correctly invalidated');

    // Test 5: Invalid credentials (should fail)
    const invalidLoginResult = await loginUser(testUser.email, 'wrongpassword');
    assertFailure(invalidLoginResult, 401, 'Invalid credentials');
    logTestResult('Invalid credentials rejection', true, 'Correctly rejected');

    // Test 6: Non-existent user (should fail)
    const nonExistentResult = await loginUser('nonexistent@example.com', 'password');
    assertFailure(nonExistentResult, 401, 'Non-existent user');
    logTestResult('Non-existent user rejection', true, 'Correctly rejected');

    // Test 7: Missing fields (should fail)
    const missingFieldsResult = await loginUser('', '');
    assertFailure(missingFieldsResult, 400, 'Missing fields');
    logTestResult('Missing fields validation', true, 'Correctly rejected');

    return { success: true, testsRun: 7, testsPassed: 7 };

  } catch (error) {
    logTestResult('Login tests', false, error.message);
    return { success: false, error: error.message };
  }
}