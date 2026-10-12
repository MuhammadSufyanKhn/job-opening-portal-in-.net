import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { contactApi } from '../services/api';
import { PageTransition } from '../components/common/PageTransition';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResponse(null);

    // Frontend validation
    if (!name.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter an inquiry subject.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Message must contain at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await contactApi.submitMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res && res.success) {
        setSuccessResponse(res.message);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMessage('Failed to submit message. Please try again.');
      }
    } catch (err: any) {
      const serverError = err.response?.data?.message || err.response?.data?.title || 'Unable to submit your inquiry. Please check your connection and try again.';
      setErrorMessage(serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '48px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--amber-soft)', color: 'var(--amber-text)', fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
            <Mail size={15} />
            <span>Support & Communications</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginBottom: '14px', letterSpacing: '-0.03em' }}>
            Contact HireSphere Support
          </h1>
          <p className="muted" style={{ fontSize: '16px', lineHeight: 1.6 }}>
            Have questions regarding company verification, applicant privacy, or technical access? Submit your inquiry directly to our support desk below.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'flex-start' }}>
          {/* Left Column: Direct channels and reassurance */}
          <div>
            <div className="card" style={{ padding: '28px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', marginBottom: '24px', boxShadow: 'var(--sh)' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ink)' }}>
                Direct Platform Inquiries
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                      General Support
                    </span>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      support@hiresphere.com
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                      Response Time
                    </span>
                    <div style={{ fontSize: '15px', color: 'var(--ink)', marginTop: '2px' }}>
                      Inquiries are typically reviewed within 1–2 business days.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', borderRadius: 'var(--r)', background: 'var(--soft)', border: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5 }}>
                <b>Verification Assistance:</b> If you represent an organization awaiting employer approval, please specify your registered company name and registration email in the subject line.
              </div>
            </div>
          </div>

          {/* Right Column: Verified Submission Form */}
          <div className="card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--ink)' }}>
              Send an inquiry
            </h2>
            <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
              All fields are required. Submissions are processed by our backend dispatch system.
            </p>

            {successResponse && (
              <div style={{ padding: '16px', borderRadius: 'var(--r-sm)', background: 'var(--ok-bg)', color: 'var(--ok)', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <b>Message Sent Successfully</b>
                  <p style={{ fontSize: '14px', marginTop: '2px' }}>{successResponse}</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ padding: '14px', borderRadius: 'var(--r-sm)', background: 'var(--bad-bg)', color: 'var(--bad)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label htmlFor="contact-name" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Full Name <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '15px' }}
                />
              </div>

              <div>
                <label htmlFor="contact-email" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Email Address <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '15px' }}
                />
              </div>

              <div>
                <label htmlFor="contact-subject" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Subject <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="Brief summary of inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '15px' }}
                />
              </div>

              <div>
                <label htmlFor="contact-message" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Message <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Please describe how we can assist you..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '15px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn primary lg"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--r-sm)', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? (
                  <span>Submitting message...</span>
                ) : (
                  <>
                    <span>Submit Message</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
