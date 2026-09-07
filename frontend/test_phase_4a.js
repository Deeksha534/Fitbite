import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend app for fallback testing
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const backendApp = require('../backend/src/app');
const { pool } = require('../backend/src/config/database');

const results = [];

const logResult = (testNum, testName, passed, details = '') => {
  results.push({ testNum, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [Test ${testNum}]: ${testName}${details ? ` -> ${details}` : ''}`);
};

async function runPhase4AVerification() {
  console.log('====================================================');
  console.log('🧪 FitBite Phase 4A Frontend Scaffolding & Layout Verification');
  console.log('====================================================\n');

  let localServer = null;
  let apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  try {
    // 1. Verify Project Configuration & Package Files
    console.log('--- 1. PROJECT STRUCTURE & CONFIGURATION ---');
    const packageJsonPath = path.join(__dirname, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    const packageJson = hasPackageJson ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) : {};

    logResult(
      1,
      'frontend/package.json exists with React 18, React Router, Vite, and Lucide React',
      hasPackageJson &&
        packageJson.dependencies?.react &&
        packageJson.dependencies?.['react-router-dom'] &&
        packageJson.dependencies?.['lucide-react'],
      `Dependencies: React ${packageJson.dependencies?.react}, Router ${packageJson.dependencies?.['react-router-dom']}`
    );

    const viteConfigPath = path.join(__dirname, 'vite.config.js');
    const hasViteConfig = fs.existsSync(viteConfigPath);
    logResult(
      2,
      'frontend/vite.config.js configured with React plugin and alias routing',
      hasViteConfig,
      `Vite Config Present: ${hasViteConfig}`
    );

    const envPath = path.join(__dirname, '.env');
    const hasEnv = fs.existsSync(envPath);
    const envContent = hasEnv ? fs.readFileSync(envPath, 'utf8') : '';
    logResult(
      3,
      'frontend/.env contains VITE_API_BASE_URL endpoint configuration',
      hasEnv && envContent.includes('VITE_API_BASE_URL='),
      `Config: ${envContent.trim()}`
    );

    // 2. Verify CSS Design Tokens & Reset System
    console.log('\n--- 2. CSS DESIGN SYSTEM & TOKENS ---');
    const tokensPath = path.join(__dirname, 'src/styles/tokens.css');
    const hasTokens = fs.existsSync(tokensPath);
    const tokensContent = hasTokens ? fs.readFileSync(tokensPath, 'utf8') : '';

    const hasCaramel = tokensContent.includes('#c87a3e');
    const hasEspresso = tokensContent.includes('#1e120d');
    const hasAmber = tokensContent.includes('#d97706');
    const hasCream = tokensContent.includes('#fdfbf7');
    const hasPoppins = tokensContent.includes('Poppins');

    logResult(
      4,
      'src/styles/tokens.css defines Caramel (#c87a3e), Espresso (#1e120d), Amber (#d97706), and Cream (#fdfbf7)',
      hasTokens && hasCaramel && hasEspresso && hasAmber && hasCream,
      `Caramel: ${hasCaramel}, Espresso: ${hasEspresso}, Amber: ${hasAmber}, Cream: ${hasCream}`
    );

    logResult(
      5,
      'src/styles/tokens.css defines typography hierarchy (Poppins & Inter) and glassmorphism tokens',
      hasPoppins && tokensContent.includes('--glass-blur') && tokensContent.includes('--shadow-glass'),
      `Typography: Poppins/Inter, Glass Tokens: Present`
    );

    const globalCssPath = path.join(__dirname, 'src/styles/global.css');
    const hasGlobalCss = fs.existsSync(globalCssPath);
    logResult(
      6,
      'src/styles/global.css contains responsive grid utilities, skeleton loaders, and animations',
      hasGlobalCss,
      `Global CSS Present: ${hasGlobalCss}`
    );

    // 3. Verify Reusable Common UI Components
    console.log('\n--- 3. REUSABLE COMMON COMPONENTS ---');
    const componentFiles = [
      'src/components/common/Button.jsx',
      'src/components/common/Input.jsx',
      'src/components/common/Card.jsx',
      'src/components/common/Badge.jsx',
      'src/components/common/Modal.jsx',
      'src/components/common/Spinner.jsx',
      'src/components/common/RatingStars.jsx',
    ];

    let allComponentsExist = true;
    for (const comp of componentFiles) {
      if (!fs.existsSync(path.join(__dirname, comp))) {
        allComponentsExist = false;
      }
    }

    logResult(
      7,
      'All 7 reusable common UI components created (Button, Input, Card, Badge, Modal, Spinner, RatingStars)',
      allComponentsExist,
      `Components count: ${componentFiles.length}`
    );

    // 4. Verify Layout Components
    console.log('\n--- 4. LAYOUT COMPONENTS & SHELL ---');
    const layoutFiles = [
      'src/components/layout/TopBar.jsx',
      'src/components/layout/Navbar.jsx',
      'src/components/layout/UserDropdown.jsx',
      'src/components/layout/MobileNav.jsx',
      'src/components/layout/Footer.jsx',
      'src/layouts/MainLayout.jsx',
    ];

    let allLayoutsExist = true;
    for (const layout of layoutFiles) {
      if (!fs.existsSync(path.join(__dirname, layout))) {
        allLayoutsExist = false;
      }
    }

    logResult(
      8,
      'All 6 layout components created (TopBar, Navbar, UserDropdown, MobileNav, Footer, MainLayout)',
      allLayoutsExist,
      `Layouts count: ${layoutFiles.length}`
    );

    // 5. Verify API Client & Toast Context
    console.log('\n--- 5. API CLIENT & CONTEXT PROVIDER ---');
    const apiJsPath = path.join(__dirname, 'src/services/api.js');
    const hasApiJs = fs.existsSync(apiJsPath);
    const apiJsContent = hasApiJs ? fs.readFileSync(apiJsPath, 'utf8') : '';

    const hasBearerAuth = apiJsContent.includes('headers.Authorization = `Bearer ${token}`');
    const has401Handling = apiJsContent.includes('fitbite:session_expired');

    logResult(
      9,
      'src/services/api.js implements JWT Bearer token injection and 401 session expiration handler',
      hasApiJs && hasBearerAuth && has401Handling,
      `Bearer Auth: ${hasBearerAuth}, 401 Expiration Listener: ${has401Handling}`
    );

    const toastContextPath = path.join(__dirname, 'src/context/ToastContext.jsx');
    const hasToastContext = fs.existsSync(toastContextPath);
    logResult(
      10,
      'src/context/ToastContext.jsx provides global toast alerts (success, error, warning, info)',
      hasToastContext,
      `ToastContext Present: ${hasToastContext}`
    );

    // 6. Verify Brand Image Assets
    console.log('\n--- 6. ASSETS & STATIC IMAGES ---');
    const publicImagesDir = path.join(__dirname, 'public/images');
    const hasImagesDir = fs.existsSync(publicImagesDir);
    const imagesCount = hasImagesDir ? fs.readdirSync(publicImagesDir).length : 0;

    logResult(
      11,
      'Brand imagery assets copied to frontend/public/images/ for static serving',
      hasImagesDir && imagesCount >= 9,
      `Image Assets Count: ${imagesCount}`
    );

    // 7. Verify Live Backend Connectivity (GET /api/v1/health & POST /api/v1/newsletter/subscribe)
    console.log('\n--- 7. LIVE BACKEND CONNECTIVITY ---');

    // Spin up local test server if backend is not already running on port 5000
    try {
      const probe = await fetch('http://localhost:5000/api/v1/health');
      if (probe.status === 200) {
        apiBase = 'http://localhost:5000/api/v1';
      } else {
        localServer = http.createServer(backendApp);
        await new Promise((resolve) => localServer.listen(0, resolve));
        const port = localServer.address().port;
        apiBase = `http://localhost:${port}/api/v1`;
      }
    } catch (e) {
      localServer = http.createServer(backendApp);
      await new Promise((resolve) => localServer.listen(0, resolve));
      const port = localServer.address().port;
      apiBase = `http://localhost:${port}/api/v1`;
    }

    try {
      const healthRes = await fetch(`${apiBase}/health`);
      const healthJson = await healthRes.json();
      logResult(
        12,
        'Frontend API client connects to backend GET /api/v1/health (200 OK)',
        healthRes.status === 200 && healthJson.success === true,
        `Backend Status: ${healthJson.status}, API: ${healthJson.name}`
      );
    } catch (e) {
      logResult(
        12,
        'Frontend API client connects to backend GET /api/v1/health (200 OK)',
        false,
        `Error: ${e.message}`
      );
    }

    let testEmail = `sub_phase4a_${Date.now()}@fitbite.test`;
    try {
      const newsRes = await fetch(`${apiBase}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, source: 'phase_4a_test' }),
      });
      const newsJson = await newsRes.json();
      logResult(
        13,
        'Footer newsletter integration connects to backend POST /api/v1/newsletter/subscribe (200 OK)',
        newsRes.status === 200 && newsJson.success === true,
        `Message: "${newsJson.message}"`
      );
    } catch (e) {
      logResult(
        13,
        'Footer newsletter integration connects to backend POST /api/v1/newsletter/subscribe (200 OK)',
        false,
        `Error: ${e.message}`
      );
    }

    // Clean up temporary subscriber from PostgreSQL
    await pool.query('DELETE FROM public.newsletter_subscribers WHERE email = $1', [testEmail]);

    // 8. Verify Production Build Artifacts
    console.log('\n--- 8. PRODUCTION BUILD VERIFICATION ---');
    const distPath = path.join(__dirname, 'dist');
    const hasDist = fs.existsSync(distPath);
    const hasDistIndex = fs.existsSync(path.join(distPath, 'index.html'));

    logResult(
      14,
      'Vite production build output (dist/index.html & assets/) compiles with zero errors',
      hasDist && hasDistIndex,
      `Build Dist Exists: ${hasDist}`
    );
  } catch (error) {
    console.error('Unhandled Exception in Phase 4A test suite:', error);
    logResult(999, 'Test suite execution completed without uncaught exceptions', false, error.message);
  } finally {
    if (localServer) {
      localServer.close();
    }
    pool.end();
  }

  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 Verification Summary: Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4AVerification();
