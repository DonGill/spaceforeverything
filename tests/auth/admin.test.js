// Admin functionality tests
import { 
  registerUser,
  loginUser,
  promoteUser,
  getCurrentUser,
  TEST_USERS,
  assertSuccess,
  assertFailure,
  assertRole,
  logTestResult,
  logTestSection 
} from '../utils/testHelpers.js';

export async function runAdminTests() {
  logTestSection('Admin & Role Management Tests');
  
  try {
    // Setup: Create test users
    const regularUser = {
      ...TEST_USERS.REGULAR,
      email: `admin-test-regular-${Date.now()}@example.com`
    };
    
    const adminUser = {
      ...TEST_USERS.ADMIN,
      email: `admin-test-admin-${Date.now()}@example.com`
    };

    // Create users
    const regularSetup = await registerUser(regularUser);
    assertSuccess(regularSetup, 'Regular user creation');
    const regularUserId = regularSetup.data.userId;

    const adminSetup = await registerUser(adminUser);
    assertSuccess(adminSetup, 'Admin user creation');
    const adminUserId = adminSetup.data.userId;

    console.log(`\n⚠️  Manual SQL required to promote admin user:`);
    console.log(`UPDATE dbo.Users SET RoleId = (SELECT Id FROM dbo.Roles WHERE Name = 'Admin') WHERE Id = '${adminUserId}';`);
    console.log(`\nSkipping admin tests - requires manual database update`);
    console.log(`Run the SQL above, then use 'npm run test:admin' to test admin functionality`);

    // Test 1: Regular user cannot promote (should fail)
    const regularLogin = await loginUser(regularUser.email, regularUser.password);
    assertSuccess(regularLogin, 'Regular user login');
    
    const unauthorizedPromote = await promoteUser(regularLogin.sessionCookie, regularUserId);
    assertFailure(unauthorizedPromote, 403, 'Unauthorized promotion');
    logTestResult('Unauthorized promotion blocked', true, 'Access denied as expected');

    // Test 2: Invalid user ID (should fail)
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const invalidUserPromote = await promoteUser(regularLogin.sessionCookie, fakeUserId);
    assertFailure(invalidUserPromote, 403, 'Invalid user promotion'); // Still 403 because not admin
    logTestResult('Invalid user ID with non-admin', true, 'Access denied as expected');

    return { 
      success: true, 
      testsRun: 2, 
      testsPassed: 2,
      note: 'Admin promotion tests require manual database setup'
    };

  } catch (error) {
    logTestResult('Admin tests', false, error.message);
    return { success: false, error: error.message };
  }
}

// Separate test for when admin is properly set up
export async function runAdminPromotionTests(adminEmail, adminPassword) {
  logTestSection('Admin Promotion Tests (Manual Setup Required)');
  
  try {
    // Test with actual admin user
    const adminLogin = await loginUser(adminEmail, adminPassword);
    assertSuccess(adminLogin, 'Admin login');
    assertRole(adminLogin.data.user, 'Admin');
    logTestResult('Admin user login', true, 'Admin role confirmed');

    // Create a user to promote
    const targetUser = {
      ...TEST_USERS.REGULAR,
      email: `promotion-target-${Date.now()}@example.com`
    };
    
    const targetSetup = await registerUser(targetUser);
    assertSuccess(targetSetup, 'Target user creation');
    const targetUserId = targetSetup.data.userId;

    // Test 1: Valid promotion
    const promoteResult = await promoteUser(adminLogin.sessionCookie, targetUserId);
    assertSuccess(promoteResult, 'User promotion');
    logTestResult('User promotion to Lister', true, 'Successfully promoted');

    // Test 2: Verify promotion by logging in as promoted user
    const promotedLogin = await loginUser(targetUser.email, targetUser.password);
    assertSuccess(promotedLogin, 'Promoted user login');
    assertRole(promotedLogin.data.user, 'Lister');
    logTestResult('Promotion verification', true, 'Role changed to Lister');

    // Test 3: Double promotion (should fail)
    const doublePromote = await promoteUser(adminLogin.sessionCookie, targetUserId);
    assertFailure(doublePromote, 400, 'Double promotion');
    logTestResult('Double promotion prevention', true, 'Correctly blocked');

    // Test 4: Non-existent user promotion (should fail)
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const fakeUserPromote = await promoteUser(adminLogin.sessionCookie, fakeUserId);
    assertFailure(fakeUserPromote, 404, 'Non-existent user promotion');
    logTestResult('Non-existent user promotion', true, 'Correctly blocked');

    return { success: true, testsRun: 4, testsPassed: 4 };

  } catch (error) {
    logTestResult('Admin promotion tests', false, error.message);
    return { success: false, error: error.message };
  }
}