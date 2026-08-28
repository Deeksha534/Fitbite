const express = require('express');
const supportController = require('../controllers/supportController');
const {
  validate,
  validateQuery,
  createTicketSchema,
  updateTicketStatusSchema,
  ticketQuerySchema,
} = require('../validators/supportValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/support/contact
 * @desc    Submit a customer support inquiry / contact form ticket
 * @access  Public (Optional Auth attaches user_id if logged in)
 */
router.post(
  '/contact',
  optionalAuth,
  validate(createTicketSchema),
  supportController.createTicket
);

/**
 * @route   GET /api/v1/support/my-tickets
 * @desc    Get all support tickets submitted by current authenticated customer
 * @access  Private (Authenticated Customer)
 */
router.get('/my-tickets', authenticateToken, supportController.getMyTickets);

// ============================================================================
// ADMIN SUPPORT TICKET MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/support/admin/tickets
 * @desc    List all support tickets with filters
 * @access  Private (Admin Only)
 */
router.get(
  '/admin/tickets',
  authenticateToken,
  requireAdmin,
  validateQuery(ticketQuerySchema),
  supportController.getAdminTickets
);

/**
 * @route   PATCH /api/v1/support/admin/tickets/:id
 * @desc    Update ticket status and resolution notes
 * @access  Private (Admin Only)
 */
router.patch(
  '/admin/tickets/:id',
  authenticateToken,
  requireAdmin,
  validateUUID('id'),
  validate(updateTicketStatusSchema),
  supportController.updateTicketStatus
);

module.exports = router;
