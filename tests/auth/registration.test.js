// Registration endpoint tests
import { 
  registerUser, 
  TEST_USERS, 
  assertSuccess, 
  assertFailure, 
  logTestResult, 
  logTestSection 
} from '../utils/testHelpers.js';

export async function runRegistrationTests() {
  logTestSection('Registration Tests');
  
  try {
    // Test 1: Valid registration
    const validUser = {
      ...TEST_USERS.REGULAR,
      email: `test-${Date.now()}@example.com` // Unique email
    };
    const result1 = await registerUser(validUser);
    assertSuccess(result1, 'Valid registration');
    logTestResult('Valid user registration', true, `UserId: ${result1.data.userId}`);

    // Test 2: Duplicate email (should fail)
    const result2 = await registerUser(validUser); // Same email
    assertFailure(result2, 409, 'Duplicate email registration');
    logTestResult('Duplicate email rejection', true, 'Correctly rejected');

    // Test 3: Missing fields (should fail)
    const invalidUser = { email: 'incomplete@example.com' };
    const result3 = await registerUser(invalidUser);
    assertFailure(result3, 400, 'Missing fields');
    logTestResult('Missing fields validation', true, 'Correctly rejected');

    // Test 4: Invalid email format (should fail)
    const badEmailUser = {
      ...TEST_USERS.REGULAR,
      email: 'notanemail'
    };
    const result4 = await registerUser(badEmailUser);
    assertFailure(result4, 400, 'Invalid email format');
    logTestResult('Invalid email format validation', true, 'Correctly rejected');

    // Test 5: Short password (should fail)
    const shortPasswordUser = {
      ...TEST_USERS.REGULAR,
      email: `shortpw-${Date.now()}@example.com`,
      password: '123'
    };
    const result5 = await registerUser(shortPasswordUser);
    assertFailure(result5, 400, 'Short password');
    logTestResult('Short password validation', true, 'Correctly rejected');

    return { success: true, testsRun: 5, testsPassed: 5 };

  } catch (error) {
    logTestResult('Registration tests', false, error.message);
    return { success: false, error: error.message };
  }
}