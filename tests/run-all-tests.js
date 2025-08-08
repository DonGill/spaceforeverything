// Main test runner for all authentication tests
import { runRegistrationTests } from './auth/registration.test.js';
import { runLoginTests } from './auth/login.test.js';
import { runAdminTests, runAdminPromotionTests } from './auth/admin.test.js';
import { cleanupTestUsers } from './utils/testHelpers.js';

async function runAllTests() {
  console.log('🚀 Running Complete Authentication Test Suite\n');
  console.log('⚠️  Make sure your development server is running on http://localhost:3001\n');
  
  const testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    results: []
  };

  const tests = [
    { name: 'Registration', runner: runRegistrationTests },
    { name: 'Login & Sessions', runner: runLoginTests },
    { name: 'Admin Access Control', runner: runAdminTests }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running ${test.name} Tests`);
    console.log(`${'='.repeat(50)}`);
    
    try {
      const result = await test.runner();
      testResults.results.push({ name: test.name, ...result });
      
      if (result.success) {
        testResults.totalTests += result.testsRun || 0;
        testResults.passedTests += result.testsPassed || 0;
      } else {
        testResults.totalTests += result.testsRun || 1;
        testResults.failedTests += 1;
      }
    } catch (error) {
      console.error(`❌ ${test.name} tests failed:`, error.message);
      testResults.results.push({ 
        name: test.name, 
        success: false, 
        error: error.message 
      });
      testResults.totalTests += 1;
      testResults.failedTests += 1;
    }
  }

  // Test Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('🎯 TEST SUMMARY');
  console.log(`${'='.repeat(50)}`);
  
  testResults.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const details = result.success 
      ? `${result.testsPassed || 0}/${result.testsRun || 0} passed`
      : result.error;
    console.log(`${status} ${result.name}: ${details}`);
    
    if (result.note) {
      console.log(`   ℹ️  ${result.note}`);
    }
  });
  
  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passedTests}`);
  console.log(`   Failed: ${testResults.failedTests}`);
  
  const successRate = testResults.totalTests > 0 
    ? Math.round((testResults.passedTests / testResults.totalTests) * 100)
    : 0;
  console.log(`   Success Rate: ${successRate}%`);
  
  if (testResults.failedTests === 0) {
    console.log('\n🎉 All tests passed! Your authentication system is rock solid.');
  } else {
    console.log(`\n⚠️  ${testResults.failedTests} test(s) failed. Review the errors above.`);
  }
  
  // Cleanup
  await cleanupTestUsers();
  
  return testResults;
}

// Run specific admin promotion tests (when admin is set up)
async function runAdminOnlyTests() {
  console.log('🔐 Running Admin Promotion Tests\n');
  console.log('This requires an admin user to be manually promoted in the database.\n');
  
  const adminEmail = 'admin@example.com';
  const adminPassword = 'adminpassword123';
  
  try {
    const result = await runAdminPromotionTests(adminEmail, adminPassword);
    
    console.log(`\n📊 ADMIN TEST RESULTS:`);
    if (result.success) {
      console.log(`✅ All ${result.testsPassed}/${result.testsRun} admin tests passed`);
    } else {
      console.log(`❌ Admin tests failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Admin tests failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--admin-only')) {
  runAdminOnlyTests();
} else {
  runAllTests();
}