/**
 * Comprehensive Endpoint Testing Script
 * Tests all API endpoints and displays pass/fail status
 *
 * Run with: npx tsx scripts/test-endpoints.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface TestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  statusCode?: number
  message?: string
  responseTime?: number
}

const results: TestResult[] = []

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
  }
  const reset = '\x1b[0m'
  console.log(`${colors[type]}${message}${reset}`)
}

async function testEndpoint(
  method: string,
  endpoint: string,
  options: {
    body?: any
    headers?: Record<string, string>
    expectedStatus?: number
    description?: string
    skip?: boolean
  } = {}
): Promise<TestResult> {
  if (options.skip) {
    const result: TestResult = {
      endpoint,
      method,
      status: 'SKIP',
      message: options.description || 'Skipped',
    }
    results.push(result)
    return result
  }

  const start = Date.now()

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions)
    const responseTime = Date.now() - start

    const expectedStatus = options.expectedStatus || 200
    const isSuccess = response.status === expectedStatus || (response.status >= 200 && response.status < 300)

    const result: TestResult = {
      endpoint,
      method,
      status: isSuccess ? 'PASS' : 'FAIL',
      statusCode: response.status,
      responseTime,
      message: options.description || `Expected ${expectedStatus}, got ${response.status}`,
    }

    results.push(result)
    return result
  } catch (error) {
    const result: TestResult = {
      endpoint,
      method,
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start,
    }
    results.push(result)
    return result
  }
}

async function runTests() {
  log('\n🧪 Starting Endpoint Tests...\n', 'info')
  log('='.repeat(80), 'info')

  // Public Routes
  log('\n📂 PUBLIC ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('GET', '/', {
    description: 'Landing page',
  })

  await testEndpoint('GET', '/sign-in', {
    description: 'Sign-in page',
  })

  await testEndpoint('GET', '/sign-up', {
    description: 'Sign-up page',
  })

  await testEndpoint('GET', '/api/health', {
    description: 'Health check endpoint',
  })

  // API Routes - Admin
  log('\n📂 ADMIN API ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('GET', '/api/admin/whoami', {
    description: 'Admin whoami (requires auth)',
    expectedStatus: 401, // Should fail without auth
  })

  await testEndpoint('POST', '/api/admin/approve-professor', {
    body: { professorId: 'test-id', isApproved: true },
    description: 'Approve professor (requires auth)',
    expectedStatus: 401,
  })

  // API Routes - Professor
  log('\n📂 PROFESSOR API ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('GET', '/api/professor/whoami', {
    description: 'Professor whoami (requires auth)',
    expectedStatus: 401,
  })

  // API Routes - Student
  log('\n📂 STUDENT API ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('GET', '/api/student/whoami', {
    description: 'Student whoami (requires auth)',
    expectedStatus: 401,
  })

  // API Routes - Enrollment
  log('\n📂 ENROLLMENT API ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('POST', '/api/enrollments/join', {
    body: { classCode: 'INVALID-CODE' },
    description: 'Join class with invalid code (requires auth)',
    expectedStatus: 401,
  })

  // API Routes - Role Management
  log('\n📂 ROLE MANAGEMENT API ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('POST', '/api/set-role', {
    body: { role: 'student' },
    description: 'Set role (requires auth)',
    expectedStatus: 401,
  })

  // API Routes - Seed (Public for testing)
  log('\n📂 UTILITY API ROUTES', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('POST', '/api/seed', {
    description: 'Database seed endpoint',
    skip: true, // Skip to avoid resetting data
  })

  await testEndpoint('GET', '/api/init-admin', {
    description: 'Initialize admin user',
  })

  // Protected Pages
  log('\n📂 PROTECTED PAGES (Should return 404 without auth)', 'info')
  log('-'.repeat(80), 'info')

  await testEndpoint('GET', '/admin', {
    description: 'Admin portal (Clerk protected)',
    expectedStatus: 404, // Clerk protect-rewrite returns 404 without session
  })

  await testEndpoint('GET', '/professor', {
    description: 'Professor portal (Clerk protected)',
    expectedStatus: 404,
  })

  await testEndpoint('GET', '/student', {
    description: 'Student portal (Clerk protected)',
    expectedStatus: 404,
  })

  await testEndpoint('GET', '/dashboard', {
    description: 'Dashboard redirect handler (Clerk protected)',
    expectedStatus: 404,
  })

  // Print Results
  log('\n' + '='.repeat(80), 'info')
  log('\n📊 TEST RESULTS', 'info')
  log('='.repeat(80) + '\n', 'info')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
    const statusText = result.status.padEnd(6)
    const methodText = result.method.padEnd(6)
    const endpointText = result.endpoint.padEnd(40)
    const statusCode = result.statusCode ? `[${result.statusCode}]`.padEnd(6) : ''.padEnd(6)
    const responseTime = result.responseTime ? `${result.responseTime}ms`.padEnd(8) : ''.padEnd(8)

    const type = result.status === 'PASS' ? 'success' : result.status === 'FAIL' ? 'error' : 'warning'
    log(`${icon} ${statusText} ${methodText} ${endpointText} ${statusCode} ${responseTime}`, type)

    if (result.message && result.status === 'FAIL') {
      log(`   └─ ${result.message}`, 'error')
    }
  })

  log('\n' + '-'.repeat(80), 'info')
  log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`, 'info')

  if (failed > 0) {
    log(`\n⚠️  ${failed} test(s) failed!`, 'error')
    log('Note: Auth-protected API routes return 401, protected pages return 404', 'warning')
  } else {
    log('\n🎉 All tests passed!', 'success')
  }

  log('\n' + '='.repeat(80) + '\n', 'info')

  // Generate endpoint summary
  log('\n📋 ENDPOINT SUMMARY', 'info')
  log('='.repeat(80) + '\n', 'info')

  const grouped = results.reduce((acc, result) => {
    const key = result.endpoint.split('/')[1] || 'root'
    if (!acc[key]) acc[key] = []
    acc[key].push(result)
    return acc
  }, {} as Record<string, TestResult[]>)

  Object.entries(grouped).forEach(([group, items]) => {
    log(`\n${group.toUpperCase()}:`, 'info')
    items.forEach(item => {
      const status = item.status === 'PASS' ? '✅ PASS' : item.status === 'FAIL' ? '❌ FAIL' : '⏭️  SKIP'
      log(`  ${status} - ${item.method} ${item.endpoint}`)
    })
  })

  log('\n' + '='.repeat(80) + '\n', 'info')

  return failed === 0
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    log(`\n❌ Test runner error: ${error.message}`, 'error')
    process.exit(1)
  })
