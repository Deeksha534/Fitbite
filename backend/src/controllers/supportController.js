const supportService = require('../services/supportService');

/**
 * Controller handling customer support inquiries, contact forms,
 * and admin resolution workflows.
 */

/**
 * @route   POST /api/v1/support/contact
 * @desc    Submit a customer support inquiry / contact form ticket
 * @access  Public (Optional Auth)
 */
const createTicket = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ticket = await supportService.createTicket(userId, req.body);

    return res.status(201).json({
      success: true,
      message: `Your inquiry has been received. Support ticket #${ticket.ticket_number} created.`,
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/support/my-tickets
 * @desc    Get all support tickets submitted by current authenticated customer
 * @access  Private (Authenticated)
 */
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await supportService.getUserTickets(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Support tickets retrieved successfully',
      data: {
        total: tickets.length,
        tickets,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/admin/support/tickets
 * @desc    List all support tickets with filters
 * @access  Private (Admin Only)
 */
const getAdminTickets = async (req, res, next) => {
  try {
    const data = await supportService.getAdminTickets(req.query);

    return res.status(200).json({
      success: true,
      message: 'Support tickets retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/v1/admin/support/tickets/:id
 * @desc    Update a support ticket status and add resolution notes
 * @access  Private (Admin Only)
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const ticket = await supportService.updateTicketStatus(ticketId, req.body);

    return res.status(200).json({
      success: true,
      message: `Ticket #${ticket.ticket_number} updated to '${ticket.status}'`,
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAdminTickets,
  updateTicketStatus,
};
