import { useState } from 'react';
import { useCycle } from '../context/CycleContext';
import { wellnessArticles, type WellnessArticle } from '../config/wellnessContent';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

type FilterPhase = 'All' | 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal' | 'General';

const PHASE_FILTERS: { value: FilterPhase; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { value: 'All', label: 'All', emoji: '📚', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { value: 'Menstrual', label: 'Menstrual', emoji: '🩸', color: '#BE185D', bg: '#FDF2F8', border: '#FBCFE8' },
  { value: 'Follicular', label: 'Follicular', emoji: '🌱', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  { value: 'Ovulatory', label: 'Ovulatory', emoji: '⭐', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  { value: 'Luteal', label: 'Luteal', emoji: '🍂', color: '#9333EA', bg: '#F5F3FF', border: '#DDD6FE' },
  { value: 'General', label: 'General', emoji: '🌸', color: '#0369a1', bg: '#F0F9FF', border: '#BAE6FD' },
];

function ArticleCard({ article, defaultOpen }: { article: WellnessArticle; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const phaseColor = PHASE_FILTERS.find((f) => f.value === article.phase) ?? PHASE_FILTERS[0];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '18px',
      border: `1.5px solid ${phaseColor.border}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
    }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '13px',
          background: phaseColor.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}>
          {article.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937', lineHeight: 1.3 }}>
            {article.title}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '11px', fontWeight: 600, color: phaseColor.color }}>
            {article.phase} · {article.tags.slice(0, 2).join(', ')}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          {open
            ? <ChevronUp size={18} color="#9CA3AF" />
            : <ChevronDown size={18} color="#9CA3AF" />
          }
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '4px' }} />
          {article.body.map((paragraph, i) => (
            <p key={i} style={{
              margin: 0,
              fontSize: '13px',
              color: '#4B5563',
              fontWeight: 600,
              lineHeight: 1.65,
              fontFamily: "'Nunito', sans-serif",
            }}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function WellnessScreen() {
  const { currentPhase } = useCycle();
  const [activeFilter, setActiveFilter] = useState<FilterPhase>('All');

  // Pre-select filter based on current cycle phase
  const suggestedFilter: FilterPhase =
    currentPhase === 'Menstrual Phase' ? 'Menstrual'
    : currentPhase === 'Follicular Phase' ? 'Follicular'
    : currentPhase === 'Ovulatory Phase' ? 'Ovulatory'
    : currentPhase === 'Luteal Phase' ? 'Luteal'
    : 'All';

  const filteredArticles: WellnessArticle[] = activeFilter === 'All'
    ? wellnessArticles
    : wellnessArticles.filter((a) => a.phase === activeFilter);

  const activeStyle = PHASE_FILTERS.find((f) => f.value === activeFilter) ?? PHASE_FILTERS[0];

  return (
    <div style={{ height: '100%', background: '#FAFAFA', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)', padding: '8px 20px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BookOpen size={22} color="#8B5CF6" strokeWidth={2.5} />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Wellness Library</h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#A855F7', fontWeight: 600 }}>
          {wellnessArticles.length} articles · 100% offline
        </p>

        {/* Current phase suggestion */}
        {suggestedFilter !== 'All' && activeFilter === 'All' && (
          <button
            onClick={() => setActiveFilter(suggestedFilter)}
            style={{
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.85)',
              border: '1.5px solid #E9D5FF',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#7C3AED',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              backdropFilter: 'blur(6px)',
            }}
          >
            ✨ Show {suggestedFilter} articles (your current phase)
          </button>
        )}
      </div>

      {/* Phase Filter Tabs */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {PHASE_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 12px',
                  border: `1.5px solid ${isActive ? filter.border : '#F3F4F6'}`,
                  borderRadius: '999px',
                  background: isActive ? filter.bg : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isActive ? filter.color : '#9CA3AF',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 2px 8px ${filter.border}80` : 'none',
                }}
              >
                <span>{filter.emoji}</span>
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Article count row */}
      <div style={{ padding: '10px 16px 4px', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: activeStyle.color }}>
          {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          {activeFilter !== 'All' ? ` about the ${activeFilter} phase` : ''}
        </p>
      </div>

      {/* Articles list */}
      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredArticles.map((article, i) => (
          <ArticleCard key={article.id} article={article} defaultOpen={i === 0 && filteredArticles.length === 1} />
        ))}
      </div>
    </div>
  );
}
