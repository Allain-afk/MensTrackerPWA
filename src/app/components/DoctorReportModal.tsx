import { createPortal } from 'react-dom';
import { X, Printer, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCycle, keyToDate } from '../context/CycleContext';
import { useUser } from '../context/UserContext';
import { analyzeCyclePatterns } from '../utils/cycleAnalytics';

interface DoctorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DoctorReportModal({ isOpen, onClose }: DoctorReportModalProps) {
  const { name } = useUser();
  const { logs, periodStarts, settings } = useCycle();

  if (!isOpen) return null;

  const cycleAnalysis = analyzeCyclePatterns(logs, periodStarts, settings.cycleLength);
  const { regularity, pmsPatterns } = cycleAnalysis;

  // Build sorted cycle history
  const sortedStarts = [...periodStarts]
    .map((k) => ({ date: k instanceof Date ? k : keyToDate(k) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // newest first

  const cycleRows = sortedStarts.map((item, idx) => {
    let cycleLengthDays: number | null = null;
    const prevInTime = sortedStarts[idx + 1];
    if (prevInTime) {
      cycleLengthDays = Math.round(
        (item.date.getTime() - prevInTime.date.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Check period duration for this start (count consecutive days with isPeriod or flow)
    let periodDaysCount = 0;
    let heaviestFlow = 'None';
    const flowHierarchy: Record<string, number> = { Light: 1, Medium: 2, Heavy: 3 };
    let highestFlowVal = 0;

    const checkDate = new Date(item.date);
    for (let d = 0; d < 12; d++) {
      const curDate = new Date(checkDate);
      curDate.setDate(curDate.getDate() + d);
      const yyyy = curDate.getFullYear();
      const mm = String(curDate.getMonth() + 1).padStart(2, '0');
      const dd = String(curDate.getDate()).padStart(2, '0');
      const curKey = `${yyyy}-${mm}-${dd}`;
      const dayLog = logs[curKey];

      if (dayLog && (dayLog.isPeriod || dayLog.flow)) {
        periodDaysCount++;
        if (dayLog.flow && (flowHierarchy[dayLog.flow] || 0) > highestFlowVal) {
          highestFlowVal = flowHierarchy[dayLog.flow];
          heaviestFlow = dayLog.flow;
        }
      } else if (d > 0) {
        break; // consecutive streak ended
      }
    }

    return {
      startDate: item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      cycleLength: cycleLengthDays ? `${cycleLengthDays} days` : 'Current / Ongoing',
      periodDuration: periodDaysCount > 0 ? `${periodDaysCount} days` : `${settings.periodLength} days (est)`,
      heaviestFlow,
    };
  });

  // Calculate overall medication & symptom frequencies
  const medCounts: Record<string, number> = {};
  const symptomCounts: Record<string, number> = {};
  let totalLoggedDays = 0;

  Object.values(logs).forEach((log) => {
    totalLoggedDays++;
    log.medications?.forEach((m) => {
      medCounts[m] = (medCounts[m] || 0) + 1;
    });
    log.symptoms?.forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const topMeds = Object.entries(medCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="doctor-report-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'calc(10px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media print {
          /* Reset overlay styling during print */
          .doctor-report-backdrop {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            z-index: auto !important;
          }

          .no-print {
            display: none !important;
          }

          #printable-doctor-report {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 10px 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            display: block !important;
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Action Bar (hidden in print) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '740px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <FileText size={20} />
          <span style={{ fontWeight: 800, fontSize: '16px' }}>Clinical Health Summary</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '999px',
              border: 'none',
              background: '#8B5CF6',
              color: 'white',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div
        id="printable-doctor-report"
        style={{
          width: '100%',
          maxWidth: '740px',
          flex: 1,
          minHeight: 0,
          background: '#ffffff',
          borderRadius: '20px',
          padding: '28px 20px',
          color: '#1E293B',
          fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box',
        }}
      >
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🩺</span>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>
                  Gynecological & Cycle Health Summary
                </h1>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })} · Private & On-Device
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{name || 'Patient'}</div>
              <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                <ShieldCheck size={13} color="#10B981" />
                <span>Zero Server Uploads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Clinical Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Cycle Length</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
              {regularity.averageCycleLength} <span style={{ fontSize: '12px', fontWeight: 700 }}>days</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Range: {regularity.minCycleLength}–{regularity.maxCycleLength}d</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Period Length</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
              {settings.periodLength} <span style={{ fontSize: '12px', fontWeight: 700 }}>days</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Typical bleeding span</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regularity</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: regularity.regularityLabel === 'Very Regular' ? '#059669' : regularity.regularityLabel === 'Mostly Regular' ? '#D97706' : '#DC2626', marginTop: '4px' }}>
              {regularity.regularityLabel}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Var: ±{regularity.cycleLengthVariation} days</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tracked Cycles</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
              {periodStarts.length} <span style={{ fontSize: '12px', fontWeight: 700 }}>recorded</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{totalLoggedDays} total log entries</div>
          </div>
        </div>

        {/* Clinical Flags Notice if any */}
        {regularity.clinicalFlags.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '12px', padding: '12px 14px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#991B1B' }}>Clinical Variation Notes</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12px', color: '#B91C1C', fontWeight: 600 }}>
                {regularity.clinicalFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Historical Cycles Table */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
            Recorded Menstrual Cycles (Most Recent First)
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', color: '#475569', borderBottom: '2px solid #CBD5E1' }}>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Period Start</th>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Cycle Length</th>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Bleeding Duration</th>
                <th style={{ padding: '8px 10px', fontWeight: 800 }}>Heaviest Flow</th>
              </tr>
            </thead>
            <tbody>
              {cycleRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>
                    No period cycles recorded yet.
                  </td>
                </tr>
              ) : (
                cycleRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>{row.startDate}</td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>{row.cycleLength}</td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>{row.periodDuration}</td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>{row.heaviestFlow}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Symptoms, Recurrent PMS, and Medications Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Recurrent Premenstrual Patterns */}
          <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '12px', padding: '12px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, color: '#6B21A8', textTransform: 'uppercase' }}>
              Recurring Premenstrual Patterns (PMS)
            </h3>
            {pmsPatterns.length === 0 ? (
              <p style={{ margin: 0, fontSize: '11px', color: '#7E22CE' }}>No recurrent premenstrual patterns detected yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pmsPatterns.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#581C87', fontWeight: 700 }}>
                    <span>{p.name} ({p.category})</span>
                    <span>{p.frequencyPercent}% of cycles</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Common Symptoms Logged */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
              Frequent Physical Symptoms
            </h3>
            {topSymptoms.length === 0 ? (
              <p style={{ margin: 0, fontSize: '11px', color: '#15803D' }}>No symptoms logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {topSymptoms.map(([name, count], i) => (
                  <span
                    key={i}
                    style={{
                      background: '#DCFCE7',
                      color: '#14532D',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {name} ({count}x)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medications & Remedies */}
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '12px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, color: '#9F1239', textTransform: 'uppercase' }}>
              Remedies & Medications
            </h3>
            {topMeds.length === 0 ? (
              <p style={{ margin: 0, fontSize: '11px', color: '#BE123C' }}>No medications logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {topMeds.map(([name, count], i) => (
                  <span
                    key={i}
                    style={{
                      background: '#FFE4E6',
                      color: '#881337',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {name} ({count}x)
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Doctor's Consultation Notes Box */}
        <div style={{ border: '1px dashed #94A3B8', borderRadius: '12px', padding: '14px', background: '#FAFAFA' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
            Physician Consultation / Clinical Notes
          </div>
          <div style={{ height: '70px' }} />
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8' }}>
          <span>Generated by Menstrual Tracker App</span>
          <span>Confidential Medical Information</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
