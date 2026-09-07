import React, { useState } from 'react';
import { Mail, MessageSquare, Clock, ShieldCheck, CheckCircle2, Send, AlertCircle, Phone } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { contentService } from '../../services/contentService';

/**
 * FitBite Support & Athlete Inquiry Center Page
 */
export const SupportPage = () => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [formError, setFormError] = useState('');

  // Update name/email if user logs in or profile changes
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.full_name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setFormError('Please fill out all required fields before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await contentService.submitSupportTicket(formData);
      const ticket = response?.ticket || response?.data?.ticket || response;
      setSubmittedTicket(ticket);
      toast.success('Inquiry submitted successfully! A confirmation has been generated.');
    } catch (err) {
      console.error('Support ticket submission error:', err);
      setFormError(err.message || 'Failed to submit inquiry. Please try again.');
      toast.error(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setFormData({
      name: user?.full_name || '',
      email: user?.email || '',
      subject: '',
      category: 'general',
      message: '',
    });
    setFormError('');
  };

  return (
    <div className="support-page-root">
      {/* Hero Section */}
      <section className="support-hero-section">
        <div className="container">
          <div className="support-hero-content animate-slideUp">
            <Badge variant="primary" size="md">
              <MessageSquare size={14} /> Athlete Support Desk
            </Badge>
            <h1 className="support-hero-title">
              How Can We Help Your <span className="text-gradient">Nutrition Journey?</span>
            </h1>
            <p className="support-hero-desc">
              Have a question about your order, shipping, ingredients, or subscriptions? Our dedicated customer care and clinical team are ready to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Form & Contact Info */}
      <div className="container support-body-section">
        <div className="support-layout-grid">
          {/* Left Column: Form or Success Card */}
          <div className="form-col">
            <Card padding="lg" className="support-form-card">
              {submittedTicket ? (
                <div className="ticket-success-view animate-fadeIn">
                  <div className="success-icon-wrap">
                    <CheckCircle2 size={42} />
                  </div>
                  <h2 className="success-title">Support Ticket Created</h2>
                  <p className="success-desc">
                    Thank you, <strong>{formData.name}</strong>. Your inquiry has been routed to our nutrition desk.
                  </p>

                  <div className="ticket-badge-box">
                    <span className="ticket-label">Tracking Ticket ID:</span>
                    <span className="ticket-num">
                      {submittedTicket.ticket_number || submittedTicket.id || 'TICK-FB-1001'}
                    </span>
                  </div>

                  <p className="response-time-note">
                    We typically respond within 2 to 4 business hours with full tracking or resolution.
                  </p>

                  <Button variant="outline" size="md" onClick={handleReset}>
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="support-form">
                  <h2 className="form-card-title">Submit a Support Ticket</h2>
                  <p className="form-card-desc">
                    Fill in your inquiry details below and an associate will assist you shortly.
                  </p>

                  {formError && (
                    <div className="form-error-alert animate-fadeIn">
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="form-row-2">
                    <Input
                      label="Your Name"
                      name="name"
                      required
                      placeholder="e.g. Deeksha Sharma"
                      value={formData.name}
                      onChange={handleChange}
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      required
                      placeholder="e.g. deeksha@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="category-select-group">
                      <label htmlFor="category" className="field-label">
                        Inquiry Category <span className="req">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="category-dropdown"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="order">Orders & Tracking</option>
                        <option value="product">Product & Flavors</option>
                        <option value="nutrition">Nutrition & Ingredients</option>
                        <option value="refund">Refunds & Returns</option>
                      </select>
                    </div>

                    <Input
                      label="Subject"
                      name="subject"
                      required
                      placeholder="Brief topic of your inquiry"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <Input
                    label="Message Details"
                    name="message"
                    required
                    multiline
                    rows={5}
                    placeholder="Provide full details regarding your question or order number..."
                    value={formData.message}
                    onChange={handleChange}
                  />

                  <div className="submit-btn-wrap">
                    <Button
                      variant="primary"
                      size="lg"
                      type="submit"
                      isLoading={isSubmitting}
                      rightIcon={<Send size={16} />}
                    >
                      Submit Inquiry Ticket
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>

          {/* Right Column: Contact Channels & Operating Hours */}
          <div className="info-col">
            <Card glass padding="lg" className="contact-info-card">
              <h3 className="info-card-title">Direct Support Channels</h3>
              <p className="info-card-subtitle">Prefer direct email or chat? Contact our nutrition team:</p>

              <div className="contact-points-list">
                <div className="contact-point">
                  <div className="point-icon">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="point-title">Email Desk</span>
                    <a href="mailto:support@fitbite.in" className="point-link">
                      support@fitbite.in
                    </a>
                  </div>
                </div>

                <div className="contact-point">
                  <div className="point-icon">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="point-title">Operating Hours</span>
                    <p className="point-detail">Monday – Saturday: 9:00 AM – 7:00 PM IST</p>
                  </div>
                </div>

                <div className="contact-point">
                  <div className="point-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="point-title">Response SLA</span>
                    <p className="point-detail">Standard tickets resolved in under 4 hours</p>
                  </div>
                </div>
              </div>

              <div className="hq-location-box">
                <span className="hq-tag">FitBite Nutrition Labs</span>
                <p>Bengaluru, Karnataka 560001, India</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        .support-page-root {
          width: 100%;
        }

        .support-hero-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-12) 0 var(--space-10);
          text-align: center;
          border-bottom: 1px solid var(--color-border);
        }

        .support-hero-content {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .support-hero-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
        }

        @media (min-width: 768px) {
          .support-hero-title {
            font-size: var(--font-size-4xl);
          }
        }

        .support-hero-desc {
          font-size: var(--font-size-md);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .support-body-section {
          padding-top: var(--space-10);
          padding-bottom: var(--space-16);
        }

        .support-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 1024px) {
          .support-layout-grid {
            grid-template-columns: 1fr 360px;
            gap: var(--space-12);
            align-items: start;
          }
        }

        .support-form-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
        }

        .support-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .form-card-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .form-card-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--space-2);
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 640px) {
          .form-row-2 {
            grid-template-columns: 1fr 1fr;
          }
        }

        .category-select-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .field-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .req {
          color: var(--color-danger);
        }

        .category-dropdown {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          background: var(--color-bg-card);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-family: var(--font-sans);
          outline: none;
        }

        .category-dropdown:focus {
          border-color: var(--color-primary);
        }

        .form-error-alert {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
        }

        .submit-btn-wrap {
          margin-top: var(--space-2);
        }

        /* Ticket Success View */
        .ticket-success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-6);
          gap: var(--space-3);
        }

        .success-icon-wrap {
          color: var(--color-success);
          margin-bottom: var(--space-2);
        }

        .success-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .success-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .ticket-badge-box {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-cream-subtle);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-xl);
          border: 1px dashed var(--color-primary);
          margin: var(--space-3) 0;
        }

        .ticket-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          text-transform: uppercase;
        }

        .ticket-num {
          font-family: var(--font-heading);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-primary-dark);
        }

        .response-time-note {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          margin-bottom: var(--space-4);
        }

        /* Contact Info Card */
        .contact-info-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .info-card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .info-card-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .contact-points-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .contact-point {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .point-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-lg);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .point-title {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          text-transform: uppercase;
        }

        .point-link {
          font-size: var(--font-size-sm);
          color: var(--color-primary-dark);
          text-decoration: none;
          font-weight: var(--font-weight-semibold);
        }

        .point-detail {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .hq-location-box {
          margin-top: var(--space-2);
          padding: var(--space-3);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .hq-tag {
          display: block;
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
};

export default SupportPage;
