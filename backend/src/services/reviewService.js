const { query } = require('../config/database');

/**
 * Service managing customer product reviews, ratings aggregations,
 * and verified purchase authentication.
 */

/**
 * Retrieves paginated reviews for a specific product along with summary statistics.
 *
 * @param {string} productId - Product UUID
 * @param {Object} queryParams - { page, limit, sort }
 * @returns {Promise<Object>} Aggregated review data and paginated items
 */
const getProductReviews = async (productId, { page = 1, limit = 10, sort = 'newest' }) => {
  // 1. Verify product exists
  const productCheck = await query(
    'SELECT id, name, slug FROM public.products WHERE id = $1',
    [productId]
  );

  if (productCheck.rows.length === 0) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  const product = productCheck.rows[0];

  // 2. Fetch rating aggregations and star distribution
  const statsResult = await query(
    `SELECT 
       COUNT(*)::int AS total_reviews,
       COALESCE(ROUND(AVG(rating), 1), 0)::float AS average_rating,
       COUNT(*) FILTER (WHERE rating = 5)::int AS five_star,
       COUNT(*) FILTER (WHERE rating = 4)::int AS four_star,
       COUNT(*) FILTER (WHERE rating = 3)::int AS three_star,
       COUNT(*) FILTER (WHERE rating = 2)::int AS two_star,
       COUNT(*) FILTER (WHERE rating = 1)::int AS one_star
     FROM public.reviews
     WHERE product_id = $1`,
    [productId]
  );

  const stats = statsResult.rows[0];

  // 3. Build sorting clause
  let orderByClause = 'r.created_at DESC';
  if (sort === 'oldest') {
    orderByClause = 'r.created_at ASC';
  } else if (sort === 'highest_rating') {
    orderByClause = 'r.rating DESC, r.created_at DESC';
  } else if (sort === 'lowest_rating') {
    orderByClause = 'r.rating ASC, r.created_at DESC';
  }

  // 4. Fetch paginated reviews with reviewer profile details
  const offset = (page - 1) * limit;
  const reviewsResult = await query(
    `SELECT 
       r.id,
       r.product_id,
       r.user_id,
       r.rating,
       r.title,
       r.comment,
       r.is_verified_purchase,
       r.created_at,
       r.updated_at,
       COALESCE(p.full_name, 'Verified Customer') AS user_name,
       p.avatar_url AS user_avatar
     FROM public.reviews r
     LEFT JOIN public.profiles p ON r.user_id = p.id
     WHERE r.product_id = $1
     ORDER BY ${orderByClause}
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );

  const totalReviews = stats.total_reviews;
  const totalPages = Math.ceil(totalReviews / limit) || 1;

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
    },
    summary: {
      total_reviews: stats.total_reviews,
      average_rating: stats.average_rating,
      rating_distribution: {
        5: stats.five_star,
        4: stats.four_star,
        3: stats.three_star,
        2: stats.two_star,
        1: stats.one_star,
      },
    },
    reviews: reviewsResult.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalReviews,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
};

/**
 * Retrieves top-rated verified customer reviews for homepage testimonials.
 *
 * @param {number} limit - Maximum number of reviews to return
 * @returns {Promise<Array>} Array of featured review cards
 */
const getFeaturedReviews = async (limit = 6) => {
  const result = await query(
    `SELECT 
       r.id,
       r.rating,
       r.title,
       r.comment,
       r.is_verified_purchase,
       r.created_at,
       COALESCE(p.full_name, 'Fitness Enthusiast') AS user_name,
       p.avatar_url AS user_avatar,
       p.bio AS user_bio,
       pr.id AS product_id,
       pr.name AS product_name,
       pr.slug AS product_slug,
       pr.flavor AS product_flavor,
       (
         SELECT image_url 
         FROM public.product_images 
         WHERE product_id = pr.id 
         ORDER BY is_primary DESC, display_order ASC 
         LIMIT 1
       ) AS product_image_url
     FROM public.reviews r
     JOIN public.products pr ON r.product_id = pr.id
     LEFT JOIN public.profiles p ON r.user_id = p.id
     WHERE r.rating >= 4 AND pr.is_active = true
     ORDER BY r.is_verified_purchase DESC, r.rating DESC, r.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
};

/**
 * Checks whether a customer is eligible to write a review and returns their verified status.
 *
 * @param {string} userId - User UUID
 * @param {string} productId - Product UUID
 * @returns {Promise<Object>} Review eligibility status and existing review if present
 */
const checkReviewEligibility = async (userId, productId) => {
  // 1. Verify product exists
  const productCheck = await query(
    'SELECT id, name FROM public.products WHERE id = $1',
    [productId]
  );

  if (productCheck.rows.length === 0) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Check for existing review by this user
  const existingReviewResult = await query(
    `SELECT id, rating, title, comment, is_verified_purchase, created_at, updated_at
     FROM public.reviews
     WHERE product_id = $1 AND user_id = $2`,
    [productId, userId]
  );

  const existingReview = existingReviewResult.rows[0] || null;

  // 3. Check for delivered purchase in orders
  const purchaseCheck = await query(
    `SELECT o.id, o.order_number, o.created_at
     FROM public.orders o
     JOIN public.order_items oi ON o.id = oi.order_id
     WHERE o.user_id = $1 
       AND oi.product_id = $2 
       AND o.order_status = 'delivered'
     LIMIT 1`,
    [userId, productId]
  );

  const isVerifiedBuyer = purchaseCheck.rows.length > 0;

  return {
    product_id: productId,
    has_reviewed: !!existingReview,
    is_verified_buyer: isVerifiedBuyer,
    is_eligible_to_review: !existingReview,
    existing_review: existingReview,
  };
};

/**
 * Creates a new review for a product. Automatically computes is_verified_purchase
 * based on canonical delivered orders.
 *
 * @param {string} userId - Reviewer User UUID
 * @param {string} productId - Target Product UUID
 * @param {Object} reviewData - { rating, title, comment }
 * @returns {Promise<Object>} Created review object
 */
const createProductReview = async (userId, productId, { rating, title, comment }) => {
  // 1. Verify product exists and is active
  const productCheck = await query(
    'SELECT id, name FROM public.products WHERE id = $1',
    [productId]
  );

  if (productCheck.rows.length === 0) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Check if user has already reviewed this product
  const existingCheck = await query(
    'SELECT id FROM public.reviews WHERE product_id = $1 AND user_id = $2',
    [productId, userId]
  );

  if (existingCheck.rows.length > 0) {
    const err = new Error('You have already reviewed this product. You can update your existing review.');
    err.statusCode = 409;
    throw err;
  }

  // 3. Check if user is a verified buyer (has completed & delivered order with this product)
  const orderCheck = await query(
    `SELECT o.id
     FROM public.orders o
     JOIN public.order_items oi ON o.id = oi.order_id
     WHERE o.user_id = $1 
       AND oi.product_id = $2 
       AND o.order_status = 'delivered'
     LIMIT 1`,
    [userId, productId]
  );

  const isVerifiedPurchase = orderCheck.rows.length > 0;
  const sanitizedTitle = title && title.trim().length > 0 ? title.trim() : null;
  const sanitizedComment = comment && comment.trim().length > 0 ? comment.trim() : null;

  // 4. Insert review into public.reviews
  const insertResult = await query(
    `INSERT INTO public.reviews (
       product_id,
       user_id,
       rating,
       title,
       comment,
       is_verified_purchase
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, product_id, user_id, rating, title, comment, is_verified_purchase, created_at, updated_at`,
    [productId, userId, rating, sanitizedTitle, sanitizedComment, isVerifiedPurchase]
  );

  const newReview = insertResult.rows[0];

  // Fetch author profile display details
  const profileResult = await query(
    'SELECT full_name, avatar_url FROM public.profiles WHERE id = $1',
    [userId]
  );
  const profile = profileResult.rows[0] || {};

  return {
    ...newReview,
    user_name: profile.full_name || 'Verified Customer',
    user_avatar: profile.avatar_url || null,
  };
};

/**
 * Updates an existing review. Enforces ownership check.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {string} userRole - User role ('customer' or 'admin')
 * @param {string} reviewId - Review UUID to update
 * @param {Object} updateData - { rating, title, comment }
 * @returns {Promise<Object>} Updated review object
 */
const updateReview = async (userId, userRole, reviewId, { rating, title, comment }) => {
  // 1. Fetch existing review
  const reviewResult = await query(
    'SELECT id, product_id, user_id, rating, title, comment, is_verified_purchase, created_at FROM public.reviews WHERE id = $1',
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    const err = new Error('Review not found');
    err.statusCode = 404;
    throw err;
  }

  const existingReview = reviewResult.rows[0];

  // 2. Ownership enforcement (only owner can edit review content)
  if (existingReview.user_id !== userId && userRole !== 'admin') {
    const err = new Error('Forbidden. You can only edit your own reviews.');
    err.statusCode = 403;
    throw err;
  }

  // 3. Build dynamic parameterized update
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (rating !== undefined) {
    updates.push(`rating = $${paramIndex++}`);
    params.push(rating);
  }

  if (title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    params.push(title && title.trim().length > 0 ? title.trim() : null);
  }

  if (comment !== undefined) {
    updates.push(`comment = $${paramIndex++}`);
    params.push(comment && comment.trim().length > 0 ? comment.trim() : null);
  }

  params.push(reviewId);

  const updatedResult = await query(
    `UPDATE public.reviews
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, product_id, user_id, rating, title, comment, is_verified_purchase, created_at, updated_at`,
    params
  );

  const updatedReview = updatedResult.rows[0];

  const profileResult = await query(
    'SELECT full_name, avatar_url FROM public.profiles WHERE id = $1',
    [updatedReview.user_id]
  );
  const profile = profileResult.rows[0] || {};

  return {
    ...updatedReview,
    user_name: profile.full_name || 'Verified Customer',
    user_avatar: profile.avatar_url || null,
  };
};

/**
 * Deletes a review. Enforces owner or administrator authorization.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {string} userRole - User role ('customer' or 'admin')
 * @param {string} reviewId - Review UUID to delete
 * @returns {Promise<Object>} Confirmation message
 */
const deleteReview = async (userId, userRole, reviewId) => {
  const reviewResult = await query(
    'SELECT id, product_id, user_id FROM public.reviews WHERE id = $1',
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    const err = new Error('Review not found');
    err.statusCode = 404;
    throw err;
  }

  const review = reviewResult.rows[0];

  // Owner or Admin may delete
  if (review.user_id !== userId && userRole !== 'admin') {
    const err = new Error('Forbidden. You do not have permission to delete this review.');
    err.statusCode = 403;
    throw err;
  }

  await query('DELETE FROM public.reviews WHERE id = $1', [reviewId]);

  return {
    success: true,
    message: 'Review deleted successfully',
    deleted_id: reviewId,
  };
};

module.exports = {
  getProductReviews,
  getFeaturedReviews,
  checkReviewEligibility,
  createProductReview,
  updateReview,
  deleteReview,
};
