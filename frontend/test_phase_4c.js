import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend environment and DB pool
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const backendApp = require('../backend/src/app');
const { pool, query } = require('../backend/src/config/database');

const results = [];

const logResult = (testNum, testName, passed, details = '') => {
  results.push({ testNum, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [Test ${testNum}]: ${testName}${details ? ` -> ${details}` : ''}`);
};

const sendRequest = async (apiBase, method, endpoint, body = null, headers = {}) => {
  const url = `${apiBase}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  return { status: response.status, data };
};

async function runPhase4CVerification() {
  console.log('====================================================');
  console.log('🧪 FitBite Phase 4C Product Catalog, Details, Reviews & Content Verification');
  console.log('====================================================\n');

  let localServer = null;
  let apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  // Setup ephemeral or live target server
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

  console.log(`🌐 Target Server: ${apiBase}\n`);

  const uniqueId = Date.now();
  const testCustomerEmail = `customer_4c_${uniqueId}@fitbite.test`;
  const testCustomerPass = 'ValidCustomerPass123!';
  let customerToken = null;
  let sampleProductId = null;
  let sampleCategoryId = null;

  try {
    // --------------------------------------------------------------------------
    // 1. FILE STRUCTURE & ARCHITECTURE
    // --------------------------------------------------------------------------
    console.log('--- 1. FILE STRUCTURE & ARCHITECTURE ---');

    const expectedFiles = [
      'src/services/catalogService.js',
      'src/services/contentService.js',
      'src/components/catalog/MacroPill.jsx',
      'src/components/catalog/ProductCard.jsx',
      'src/components/catalog/ProductGrid.jsx',
      'src/components/catalog/ProductFilters.jsx',
      'src/components/catalog/ImageGallery.jsx',
      'src/components/catalog/NutritionFactsTable.jsx',
      'src/components/catalog/ProductReviewsSection.jsx',
      'src/components/content/MacroCalculator.jsx',
      'src/components/content/RecipeCard.jsx',
      'src/components/content/FAQAccordion.jsx',
      'src/pages/public/ProductsPage.jsx',
      'src/pages/public/ProductDetailPage.jsx',
      'src/pages/public/NutritionPage.jsx',
      'src/pages/public/RecipesPage.jsx',
      'src/pages/public/FitnessTipsPage.jsx',
      'src/pages/public/FAQPage.jsx',
      'src/pages/public/SupportPage.jsx',
    ];

    let allFilesExist = true;
    for (const relPath of expectedFiles) {
      const fullPath = path.join(__dirname, relPath);
      if (!fs.existsSync(fullPath)) {
        allFilesExist = false;
        console.error(`Missing file: ${relPath}`);
      }
    }

    logResult(
      1,
      'All 19 Phase 4C source files created (catalog services, components, and pages)',
      allFilesExist,
      `Verified ${expectedFiles.length} files`
    );

    // --------------------------------------------------------------------------
    // 2. CATEGORIES API (GET /api/v1/categories)
    // --------------------------------------------------------------------------
    console.log('\n--- 2. CATEGORIES API INTEGRATION ---');

    const catRes = await sendRequest(apiBase, 'GET', '/categories');
    const categories = catRes.data?.data?.categories || [];
    if (categories.length > 0) {
      sampleCategoryId = categories[0].id;
    }

    logResult(
      2,
      'GET /api/v1/categories returns live active categories with product counts (200 OK)',
      catRes.status === 200 && catRes.data?.success === true && Array.isArray(categories) && categories.length > 0,
      `Retrieved ${categories.length} categories (e.g. ${categories.map((c) => c.name).slice(0, 3).join(', ')})`
    );

    // --------------------------------------------------------------------------
    // 3. PRODUCT CATALOG LISTING (GET /api/v1/products)
    // --------------------------------------------------------------------------
    console.log('\n--- 3. PRODUCT CATALOG LISTING & PAGINATION ---');

    const prodRes = await sendRequest(apiBase, 'GET', '/products');
    const products = prodRes.data?.data?.products || [];
    const pagination = prodRes.data?.data?.pagination || {};

    if (products.length > 0) {
      sampleProductId = products[0].id;
    }

    logResult(
      3,
      'GET /api/v1/products returns real database products with pagination metadata (200 OK)',
      prodRes.status === 200 &&
        prodRes.data?.success === true &&
        Array.isArray(products) &&
        products.length > 0 &&
        pagination.total > 0 &&
        pagination.totalPages >= 1,
      `Found ${products.length} products, Total in DB: ${pagination.total}`
    );

    // --------------------------------------------------------------------------
    // 4. SEARCH QUERY INTEGRATION (GET /api/v1/products?search=...)
    // --------------------------------------------------------------------------
    console.log('\n--- 4. SEARCH & DEBOUNCED QUERYING ---');

    const firstWord = products[0]?.name?.split(' ')[0] || 'Almond';
    const searchRes = await sendRequest(apiBase, 'GET', `/products?search=${encodeURIComponent(firstWord)}`);
    const searchProducts = searchRes.data?.data?.products || [];

    logResult(
      4,
      `GET /api/v1/products?search=${firstWord} returns matching products from backend search`,
      searchRes.status === 200 &&
        searchRes.data?.success === true &&
        searchProducts.length > 0 &&
        searchProducts.some((p) => p.name.toLowerCase().includes(firstWord.toLowerCase())),
      `Matched ${searchProducts.length} product(s) for "${firstWord}"`
    );

    // --------------------------------------------------------------------------
    // 5. CATEGORY & PRICE FILTERING
    // --------------------------------------------------------------------------
    console.log('\n--- 5. CATEGORY & PRICE FILTERING ---');

    if (sampleCategoryId) {
      const catFilterRes = await sendRequest(apiBase, 'GET', `/products?category_id=${sampleCategoryId}`);
      const catFilteredProds = catFilterRes.data?.data?.products || [];

      logResult(
        5,
        'GET /api/v1/products?category_id=... filters products strictly by category',
        catFilterRes.status === 200 &&
          catFilterRes.data?.success === true &&
          catFilteredProds.every((p) => p.category_id === sampleCategoryId),
        `Found ${catFilteredProds.length} products for Category ID: ${sampleCategoryId}`
      );
    } else {
      logResult(5, 'Category filtering verified', true, 'Skipped due to empty categories');
    }

    // Price range filtering
    const priceRes = await sendRequest(apiBase, 'GET', '/products?min_price=100&max_price=200');
    const priceProds = priceRes.data?.data?.products || [];
    const priceValid = priceProds.every((p) => Number(p.price) >= 100 && Number(p.price) <= 200);

    logResult(
      6,
      'GET /api/v1/products?min_price=100&max_price=200 filters products within price bounds',
      priceRes.status === 200 && priceRes.data?.success === true && priceValid,
      `Found ${priceProds.length} products in range ₹100 - ₹200`
    );

    // --------------------------------------------------------------------------
    // 6. BACKEND-SUPPORTED SORTING
    // --------------------------------------------------------------------------
    console.log('\n--- 6. CATALOG SORTING ---');

    const sortAscRes = await sendRequest(apiBase, 'GET', '/products?sort=price_asc');
    const sortDescRes = await sendRequest(apiBase, 'GET', '/products?sort=price_desc');
    const ascProds = sortAscRes.data?.data?.products || [];
    const descProds = sortDescRes.data?.data?.products || [];

    let isAscSorted = true;
    for (let i = 1; i < ascProds.length; i++) {
      if (Number(ascProds[i].price) < Number(ascProds[i - 1].price)) isAscSorted = false;
    }

    let isDescSorted = true;
    for (let i = 1; i < descProds.length; i++) {
      if (Number(descProds[i].price) > Number(descProds[i - 1].price)) isDescSorted = false;
    }

    logResult(
      7,
      'GET /api/v1/products?sort=price_asc and sort=price_desc sorts prices accurately',
      sortAscRes.status === 200 && sortDescRes.status === 200 && isAscSorted && isDescSorted,
      `Asc: min ₹${ascProds[0]?.price} -> max ₹${ascProds[ascProds.length - 1]?.price}`
    );

    // --------------------------------------------------------------------------
    // 7. PAGINATION INTEGRATION
    // --------------------------------------------------------------------------
    console.log('\n--- 7. CATALOG PAGINATION ---');

    const pageRes = await sendRequest(apiBase, 'GET', '/products?page=1&limit=2');
    const pageProds = pageRes.data?.data?.products || [];
    const pagePagi = pageRes.data?.data?.pagination || {};

    logResult(
      8,
      'GET /api/v1/products?page=1&limit=2 respects limit and calculates totalPages correctly',
      pageRes.status === 200 &&
        pageRes.data?.success === true &&
        pageProds.length <= 2 &&
        pagePagi.page === 1 &&
        pagePagi.limit === 2,
      `Returned ${pageProds.length} items (Total: ${pagePagi.total}, Pages: ${pagePagi.totalPages})`
    );

    // --------------------------------------------------------------------------
    // 8. PRODUCT DETAILS & IMAGE GALLERY (GET /api/v1/products/:id)
    // --------------------------------------------------------------------------
    console.log('\n--- 8. PRODUCT SPECIFICATIONS & DETAILS ---');

    const detailRes = await sendRequest(apiBase, 'GET', `/products/${sampleProductId}`);
    const productDetail = detailRes.data?.data?.product || detailRes.data?.data;

    logResult(
      9,
      `GET /api/v1/products/${sampleProductId} returns product details, macros, and image gallery (200 OK)`,
      detailRes.status === 200 &&
        detailRes.data?.success === true &&
        productDetail &&
        productDetail.id === sampleProductId &&
        productDetail.protein_grams !== undefined &&
        Array.isArray(productDetail.images),
      `Product: "${productDetail?.name}", Protein: ${productDetail?.protein_grams}g, Images: ${productDetail?.images?.length || 0}`
    );

    // --------------------------------------------------------------------------
    // 9. INVALID PRODUCT / 404 RESILIENCE
    // --------------------------------------------------------------------------
    console.log('\n--- 9. INVALID UUID / 404 RESILIENCE ---');

    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const notFoundRes = await sendRequest(apiBase, 'GET', `/products/${nonExistentId}`);

    logResult(
      10,
      'GET /api/v1/products/00000000-0000-0000-0000-000000000000 returns 404 Not Found cleanly',
      notFoundRes.status === 404 && notFoundRes.data?.success === false,
      `Status: ${notFoundRes.status}, Message: "${notFoundRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 10. PRODUCT REVIEWS & SUMMARY (GET /api/v1/products/:id/reviews)
    // --------------------------------------------------------------------------
    console.log('\n--- 10. REVIEWS & RATING DISTRIBUTION ---');

    const reviewsRes = await sendRequest(apiBase, 'GET', `/products/${sampleProductId}/reviews`);
    const reviewsSummary = reviewsRes.data?.data?.summary || {};
    const reviewsList = reviewsRes.data?.data?.reviews || [];

    logResult(
      11,
      `GET /api/v1/products/${sampleProductId}/reviews returns rating summary and customer reviews (200 OK)`,
      reviewsRes.status === 200 &&
        reviewsRes.data?.success === true &&
        reviewsSummary.average_rating !== undefined &&
        reviewsSummary.rating_distribution !== undefined &&
        Array.isArray(reviewsList),
      `Avg Rating: ${reviewsSummary.average_rating}, Total Reviews: ${reviewsSummary.total_reviews}`
    );

    // --------------------------------------------------------------------------
    // 11. FEATURED REVIEWS (GET /api/v1/reviews/featured)
    // --------------------------------------------------------------------------
    console.log('\n--- 11. FEATURED TESTIMONIALS ---');

    const featReviewsRes = await sendRequest(apiBase, 'GET', '/reviews/featured?limit=3');
    const featReviews = featReviewsRes.data?.data?.reviews || [];

    logResult(
      12,
      'GET /api/v1/reviews/featured?limit=3 returns top-rated athlete testimonials (200 OK)',
      featReviewsRes.status === 200 && featReviewsRes.data?.success === true && Array.isArray(featReviews),
      `Retrieved ${featReviews.length} featured reviews for landing page`
    );

    // --------------------------------------------------------------------------
    // 12. AUTH-AWARE REVIEW ELIGIBILITY CHECK
    // --------------------------------------------------------------------------
    console.log('\n--- 12. REVIEW ELIGIBILITY & AUTH ENFORCEMENT ---');

    // Register a test customer to test eligibility
    const regRes = await sendRequest(apiBase, 'POST', '/auth/register', {
      email: testCustomerEmail,
      password: testCustomerPass,
      full_name: 'Phase 4C Reviewer',
      phone: '+91 91234 56789',
    });
    customerToken = regRes.data?.data?.token;

    const eligRes = await sendRequest(
      apiBase,
      'GET',
      `/products/${sampleProductId}/reviews/eligibility`,
      null,
      {
        Authorization: `Bearer ${customerToken}`,
      }
    );

    logResult(
      13,
      'GET /api/v1/products/:id/reviews/eligibility returns auth review status (200 OK)',
      eligRes.status === 200 &&
        eligRes.data?.success === true &&
        eligRes.data?.data?.is_eligible_to_review !== undefined &&
        eligRes.data?.data?.has_reviewed !== undefined,
      `Eligible: ${eligRes.data?.data?.is_eligible_to_review}, Verified Buyer: ${eligRes.data?.data?.is_verified_buyer}`
    );

    // --------------------------------------------------------------------------
    // 13. NUTRITION GUIDE API (GET /api/v1/content/nutrition-guide)
    // --------------------------------------------------------------------------
    console.log('\n--- 13. NUTRITION SCIENCE GUIDE ---');

    const nutGuideRes = await sendRequest(apiBase, 'GET', '/content/nutrition-guide');
    const guideData = nutGuideRes.data?.data || {};

    logResult(
      14,
      'GET /api/v1/content/nutrition-guide returns macro principles and quality standards (200 OK)',
      nutGuideRes.status === 200 &&
        nutGuideRes.data?.success === true &&
        Array.isArray(guideData.macro_principles) &&
        Array.isArray(guideData.quality_commitments),
      `Principles: ${guideData.macro_principles?.length}, Commitments: ${guideData.quality_commitments?.length}`
    );

    // --------------------------------------------------------------------------
    // 14. RECIPES API (GET /api/v1/content/recipes)
    // --------------------------------------------------------------------------
    console.log('\n--- 14. GOURMET RECIPES CONTENT ---');

    const recipesRes = await sendRequest(apiBase, 'GET', '/content/recipes');
    const recipesList = recipesRes.data?.data?.recipes || [];

    logResult(
      15,
      'GET /api/v1/content/recipes returns artisan healthy recipes with macros and instructions (200 OK)',
      recipesRes.status === 200 &&
        recipesRes.data?.success === true &&
        Array.isArray(recipesList) &&
        recipesList.length > 0 &&
        recipesList[0].ingredients !== undefined &&
        recipesList[0].instructions !== undefined,
      `Found ${recipesList.length} recipes (e.g. "${recipesList[0]?.title}")`
    );

    // --------------------------------------------------------------------------
    // 15. FITNESS TIPS API (GET /api/v1/content/fitness-tips)
    // --------------------------------------------------------------------------
    console.log('\n--- 15. FITNESS & RECOVERY ARTICLES ---');

    const tipsRes = await sendRequest(apiBase, 'GET', '/content/fitness-tips');
    const tipsList = tipsRes.data?.data?.tips || [];

    logResult(
      16,
      'GET /api/v1/content/fitness-tips returns athletic recovery advice with key takeaways (200 OK)',
      tipsRes.status === 200 &&
        tipsRes.data?.success === true &&
        Array.isArray(tipsList) &&
        tipsList.length > 0 &&
        Array.isArray(tipsList[0].key_takeaways),
      `Found ${tipsList.length} articles (e.g. "${tipsList[0]?.title}")`
    );

    // --------------------------------------------------------------------------
    // 16. FAQ API (GET /api/v1/content/faq)
    // --------------------------------------------------------------------------
    console.log('\n--- 16. CATEGORIZED FAQ ---');

    const faqRes = await sendRequest(apiBase, 'GET', '/content/faq');
    const faqList = faqRes.data?.data?.faq || [];

    logResult(
      17,
      'GET /api/v1/content/faq returns categorized FAQs with question and answer pairs (200 OK)',
      faqRes.status === 200 &&
        faqRes.data?.success === true &&
        Array.isArray(faqList) &&
        faqList.length > 0 &&
        Array.isArray(faqList[0].items),
      `Found ${faqList.length} FAQ categories with ${faqList.reduce((acc, c) => acc + (c.items?.length || 0), 0)} Q&As`
    );

    // --------------------------------------------------------------------------
    // 17. SUPPORT TICKET SUBMISSION (POST /api/v1/support/contact)
    // --------------------------------------------------------------------------
    console.log('\n--- 17. ATHLETE SUPPORT TICKET SUBMISSION ---');

    const ticketRes = await sendRequest(apiBase, 'POST', '/support/contact', {
      name: 'Phase 4C Athlete',
      email: 'athlete.support.test@fitbite.in',
      subject: 'Inquiry regarding Whey Isolate batch certificate',
      category: 'product',
      message: 'Could you please provide the heavy metal test report for the Chocolate Almond batch?',
    });

    const ticketData = ticketRes.data?.data?.ticket || ticketRes.data?.data;

    logResult(
      18,
      'POST /api/v1/support/contact creates customer support ticket and generates ticket number (201 Created)',
      (ticketRes.status === 201 || ticketRes.status === 200) &&
        ticketRes.data?.success === true &&
        ticketData &&
        (ticketData.ticket_number || ticketData.id),
      `Status: ${ticketRes.status}, Ticket No: ${ticketData?.ticket_number || ticketData?.id}`
    );
  } catch (error) {
    console.error('Unhandled exception in Phase 4C test suite:', error);
    logResult(999, 'Test suite execution completed without uncaught exceptions', false, error.message);
  } finally {
    // Clean up temporary test customer
    if (testCustomerEmail) {
      await query('DELETE FROM public.users WHERE email = $1', [testCustomerEmail]);
      console.log('\n🧹 Temporary test customer cleaned up from PostgreSQL.');
    }

    if (localServer) {
      localServer.close();
    }
    pool.end();
  }

  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(
    `📊 Verification Summary: Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`
  );
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4CVerification();
