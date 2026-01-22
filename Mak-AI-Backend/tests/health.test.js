const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, message, warning = false) {
  const status = passed ? '✓ PASS' : (warning ? '⚠ WARN' : '✗ FAIL');
  const color = passed ? colors.green : (warning ? colors.yellow : colors.red);
  
  console.log(`${color}${status}${colors.reset} - ${name}`);
  if (message) {
    console.log(`  ${message}`);
  }
  
  results.tests.push({ name, passed, message, warning });
  if (passed) {
    results.passed++;
  } else if (warning) {
    results.warnings++;
  } else {
    results.failed++;
  }
}

// Test function
async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    const response = await axios.get(url, { timeout: TIMEOUT });
    const passed = response.status === expectedStatus;
    logTest(name, passed, `Status: ${response.status} (expected ${expectedStatus})`);
    return { passed, response };
  } catch (error) {
    const status = error.response?.status || 'N/A';
    const message = error.response?.data?.message || error.message;
    logTest(name, false, `Status: ${status}, Error: ${message}`);
    return { passed: false, error };
  }
}

// Main test suite
async function runTests() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Backend Health Check Tests${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`Testing backend at: ${BASE_URL}\n`);

  // Test 1: Basic health check
  await testEndpoint(
    'Basic Health Check',
    `${BASE_URL}/health`
  );

  // Test 2: API health check
  await testEndpoint(
    'API Health Check',
    `${BASE_URL}/api/health`
  );

  // Test 3: Detailed health check
  const detailedTest = await testEndpoint(
    'Detailed Health Check',
    `${BASE_URL}/api/health/detailed`
  );

  if (detailedTest.passed && detailedTest.response) {
    const data = detailedTest.response.data;
    console.log(`\n${colors.blue}Service Status:${colors.reset}`);
    Object.keys(data.services || {}).forEach(service => {
      const serviceData = data.services[service];
      const statusColor = serviceData.status === 'healthy' ? colors.green : colors.red;
      console.log(`  ${statusColor}${serviceData.status.toUpperCase()}${colors.reset} - ${service}: ${serviceData.message}`);
    });
  }

  // Test 4: Firebase health check
  const firebaseTest = await testEndpoint(
    'Firebase Connection',
    `${BASE_URL}/api/health/firebase`
  );

  // Test 5: Google OAuth health check
  const googleTest = await testEndpoint(
    'Google OAuth Configuration',
    `${BASE_URL}/api/health/google-oauth`,
    200 // Accept 200 even if not configured (it's optional)
  );

  if (googleTest.response?.status === 503) {
    logTest('Google OAuth Configuration', true, 'Not configured (this is optional)', true);
    results.warnings++;
    results.failed--; // Don't count as failure
  }

  // Test 6: Environment variables check
  await testEndpoint(
    'Environment Variables',
    `${BASE_URL}/api/health/environment`
  );

  // Test 7: Test 404 handler
  await testEndpoint(
    '404 Handler',
    `${BASE_URL}/api/nonexistent`,
    404
  );

  // Print summary
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Test Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Total: ${results.passed + results.warnings + results.failed}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});

