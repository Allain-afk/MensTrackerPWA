import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

interface MonthYearPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number;
  onSelectMonthYear: (year: number, month: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function MonthYearPickerModal({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  onSelectMonthYear,
}: MonthYearPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);

  if (!isOpen) return null;

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 12, 30, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="month-year-picker-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '20px 22px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -10px 40px rgba(112, 26, 117, 0.18)',
          borderTop: '1px solid rgba(233, 213, 255, 0.6)',
          fontFamily: "'Nunito', sans-serif",
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E9D5FF' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FCE7F3, #EDE9FE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CalendarIcon size={18} color="#7C3AED" />
            </div>
            <div>
              <h2 id="month-year-picker-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1F2937' }}>
                Jump to Month
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#7C3AED', fontWeight: 700 }}>
                Quick Calendar Navigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(243, 232, 255, 0.7)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B21A8',
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Year Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAF5FF',
          borderRadius: '18px',
          padding: '8px 12px',
          marginBottom: '18px',
          border: '1px solid #F3E8FF',
        }}>
          <button
            className="tap-active"
            onClick={() => setSelectedYear((y) => y - 1)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9D5FF',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#7C3AED',
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937' }}>
            {selectedYear}
          </span>

          <button
            className="tap-active"
            onClick={() => setSelectedYear((y) => y + 1)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9D5FF',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#7C3AED',
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 12-Month Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}>
          {MONTHS.map((_, index) => {
            const isCurrent = selectedYear === currentYear && index === currentMonth;
            const isTodayMonth = selectedYear === todayYear && index === todayMonth;

            return (
              <button
                key={index}
                className="tap-active"
                onClick={() => {
                  onSelectMonthYear(selectedYear, index);
                  onClose();
                }}
                style={{
                  padding: '12px 6px',
                  borderRadius: '14px',
                  border: isCurrent
                    ? '1.5px solid #EC4899'
                    : isTodayMonth
                    ? '1.5px solid #C084FC'
                    : '1px solid #F3E8FF',
                  background: isCurrent
                    ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
                    : isTodayMonth
                    ? 'rgba(192, 132, 252, 0.1)'
                    : '#FAF5FF',
                  color: isCurrent ? '#FFFFFF' : '#1F2937',
                  fontSize: '13px',
                  fontWeight: isCurrent || isTodayMonth ? 800 : 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {SHORT_MONTHS[index]}
                {isTodayMonth && !isCurrent && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '6px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#8B5CF6',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Back to Today Action */}
        <button
          className="tap-active"
          onClick={() => {
            onSelectMonthYear(todayYear, todayMonth);
            onClose();
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: '#FAF5FF',
            border: '1.5px solid #DDD6FE',
            borderRadius: '14px',
            color: '#7C3AED',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          ↩ Return to Current Month ({SHORT_MONTHS[todayMonth]} {todayYear})
        </button>
      </div>
    </div>,
    document.body
  );
}
