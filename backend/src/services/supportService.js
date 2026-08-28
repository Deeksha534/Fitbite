const { query } = require('../config/database');

/**
 * Service managing customer support tickets, inquiries,
 * customer ticket histories, and administrative resolution workflows.
 */

/**
 * Generates a unique tracking ticket number.
 * e.g. "TICK-20260828-4821"
 */
const generateTicketNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TICK-${dateStr}-${randomSuffix}`;
};

/**
 * Creates a new support ticket / contact inquiry.
 *
 * @param {string|null} userId - Authenticated user UUID or null
 * @param {Object} data - { name, email, subject, category, message }
 * @returns {Promise<Object>} Created ticket details
 */
const createTicket = async (userId, { name, email, subject, category = 'general', message }) => {
  const ticketNumber = generateTicketNumber();
  const normalizedEmail = email.trim().toLowerCase();
  const sanitizedName = name.trim();
  const sanitizedSubject = subject.trim();
  const sanitizedMessage = message.trim();

  const result = await query(
    `INSERT INTO public.support_tickets (
       ticket_number, user_id, name, email, subject, category, message, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
     RETURNING id, ticket_number, user_id, name, email, subject, category,
               message, status, admin_notes, created_at, updated_at`,
    [
      ticketNumber,
      userId || null,
      sanitizedName,
      normalizedEmail,
      sanitizedSubject,
      category,
      sanitizedMessage,
    ]
  );

  return result.rows[0];
};

/**
 * Retrieves all support tickets submitted by a customer.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} List of customer tickets
 */
const getUserTickets = async (userId) => {
  const result = await query(
    `SELECT id, ticket_number, user_id, name, email, subject, category,
            message, status, admin_notes, created_at, updated_at
     FROM public.support_tickets
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Retrieves paginated support tickets for administrators.
 *
 * @param {Object} options - { page, limit, status, category, search }
 * @returns {Promise<Object>} Paginated tickets list
 */
const getAdminTickets = async ({ page = 1, limit = 20, status, category, search } = {}) => {
  const whereConditions = [];
  const queryParams = [];
  let paramIndex = 1;

  if (status) {
    whereConditions.push(`status = $${paramIndex++}`);
    queryParams.push(status);
  }

  if (category) {
    whereConditions.push(`category = $${paramIndex++}`);
    queryParams.push(category);
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    whereConditions.push(
      `(ticket_number ILIKE $${paramIndex} OR subject ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`
    );
    queryParams.push(term);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM public.support_tickets ${whereClause}`,
    queryParams
  );
  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  const dataParams = [...queryParams, limit, offset];
  const ticketsResult = await query(
    `SELECT id, ticket_number, user_id, name, email, subject, category,
            message, status, admin_notes, created_at, updated_at
     FROM public.support_tickets
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    dataParams
  );

  return {
    tickets: ticketsResult.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
};

/**
 * Updates a support ticket's status and records resolution notes (Admin).
 *
 * @param {string} ticketId - Ticket UUID
 * @param {Object} updateData - { status, admin_notes }
 * @returns {Promise<Object>} Updated ticket
 */
const updateTicketStatus = async (ticketId, { status, admin_notes }) => {
  const check = await query('SELECT id, ticket_number FROM public.support_tickets WHERE id = $1', [
    ticketId,
  ]);
  if (check.rows.length === 0) {
    const err = new Error('Support ticket not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    updates.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (admin_notes !== undefined) {
    updates.push(`admin_notes = $${paramIndex++}`);
    params.push(admin_notes && admin_notes.trim().length > 0 ? admin_notes.trim() : null);
  }

  params.push(ticketId);

  const result = await query(
    `UPDATE public.support_tickets
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, ticket_number, user_id, name, email, subject, category,
               message, status, admin_notes, created_at, updated_at`,
    params
  );

  return result.rows[0];
};

module.exports = {
  createTicket,
  getUserTickets,
  getAdminTickets,
  updateTicketStatus,
};
