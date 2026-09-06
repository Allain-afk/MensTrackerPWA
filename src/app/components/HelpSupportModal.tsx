import { useState } from 'react';
import { X, HelpCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_COPY } from '../config/appCopy';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How are my cycle phases and ovulation predicted?',
    answer:
      'Predictions are calculated based on your historical cycle lengths and standard reproductive physiology. Ovulation is estimated ~14 days before your next predicted period, with the fertile window covering the 5 days prior plus ovulation day. When "Adaptive Predictions" are enabled in Settings, the algorithm gives higher mathematical weight to your most recent cycles.',
  },
  {
    question: 'What does the app do if my period is late?',
    answer:
      'Unlike apps that push your calendar forward blindly, this app switches into an overdue indicator showing how many days late you are. It gives you immediate clarity without generating phantom future cycles. As soon as your period begins, simply tap "Log Today\'s Period" to calibrate the next cycle.',
  },
  {
    question: 'How do I transfer my data to a new phone or browser?',
    answer:
      'Go to Settings → Offline Backup and tap "Export Backup". Save the encrypted backup file to your phone files, cloud drive, or email it to yourself. On your new phone or browser, open this web app, go to Settings → Offline Backup, tap "Import Backup", and pick your saved file.',
  },
  {
    question: 'How do I generate a report for my gynecologist?',
    answer:
      'Open the "Insights" tab and tap "Export PDF" on the Doctor\'s Clinical Report card at the top. The app generates a formatted 1-page clinical report with cycle regularity metrics, clinical variation flags, historical cycles, and symptom frequencies ready to print or save.',
  },
  {
    question: 'Are my logs or intimate activity stored online?',
    answer:
      'No. The app operates with 100% on-device privacy. All data is written to your browser\'s private SQLite database. No accounts are required, no trackers are embedded, and your health details are never transmitted over the internet.',
  },
  {
    question: 'How do I log medications and lifestyle factors?',
    answer:
      'When adding or editing a daily entry in the Log tab, scroll down to the "Medications & Remedies" and "Lifestyle & Daily Factors" sections. You can tap preset pills (like Ibuprofen, Paracetamol, Birth Control, High Stress, Workout) or tap "Add other" to create custom tags.',
  },
];

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleContactEmail = () => {
    const subject = encodeURIComponent(`${APP_COPY.appName} Support Request`);
    const body = encodeURIComponent(`Hi ${APP_COPY.appName} Support,\n\nI have a question or feedback:\n\n`);
    window.location.href = `mailto:${APP_COPY.supportEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        overflowY: 'auto',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F0F9FF 0%, #F5F3FF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#0EA5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>
                Help & Frequently Asked Questions
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#0284C7', fontWeight: 700 }}>
                Guides, usage tips & support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#F1F5F9',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Direct Support Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)',
              border: '1.5px solid #DDD6FE',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>Have an issue or idea?</div>
              <div style={{ fontSize: '11px', color: '#6D28D9', fontWeight: 600 }}>We typically respond within 24 hours.</div>
            </div>
            <button
              onClick={handleContactEmail}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: 'none',
                background: '#0284C7',
                color: 'white',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                fontFamily: "'Nunito', sans-serif",
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Mail size={14} />
              <span>Contact Support</span>
            </button>
          </div>

          {/* FAQs Accordion */}
          <div>
            <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Frequently Asked Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: isOpen ? '#F8FAFC' : '#FFFFFF',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: 'pointer',
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 800, color: isOpen ? '#0369A1' : '#1E293B' }}>
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={16} color="#0369A1" style={{ flexShrink: 0 }} />
                      ) : (
                        <ChevronDown size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0 14px 14px',
                          fontSize: '12px',
                          color: '#475569',
                          lineHeight: 1.55,
                          borderTop: '1px solid #F1F5F9',
                          paddingTop: '10px',
                        }}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', background: '#FAFAFA' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              border: 'none',
              background: '#0EA5E9',
              color: 'white',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
