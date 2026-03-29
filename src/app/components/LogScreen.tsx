import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, Check, Droplets, Minus, Plus } from 'lucide-react';
import {
  useCycle,
  dateToKey,
  keyToDate,
} from '../context/CycleContext';
import type {
  CervicalMucus,
  DayLog,
  EnergyLevel,
  FlowLevel,
  MoodType,
  ProtectionType,
  SleepQuality,
  SymptomType,
} from '../context/CycleContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const flowOptions: { value: Exclude<FlowLevel, null>; label: string; size: string }[] = [
  { value: 'Light', label: 'Light', size: '14px' },
  { value: 'Medium', label: 'Medium', size: '18px' },
  { value: 'Heavy', label: 'Heavy', size: '22px' },
];

const moodOptions: { value: MoodType; icon: string; label: string }[] = [
  { value: 'Happy', icon: '😊', label: 'Happy' },
  { value: 'Sensitive', icon: '🌸', label: 'Sensitive' },
  { value: 'Sad', icon: '😔', label: 'Sad' },
  { value: 'Energized', icon: '⚡', label: 'Energized' },
  { value: 'Anxious', icon: '😰', label: 'Anxious' },
  { value: 'Irritable', icon: '😤', label: 'Irritable' },
  { value: 'Calm', icon: '😌', label: 'Calm' },
  { value: 'Overwhelmed', icon: '😵', label: 'Overwhelmed' },
  { value: 'Focused', icon: '🎯', label: 'Focused' },
  { value: 'Indifferent', icon: '😶', label: 'Indifferent' },
  { value: 'Hopeful', icon: '🌟', label: 'Hopeful' },
  { value: 'Restless', icon: '🌀', label: 'Restless' },
];

const physicalSymptoms: { value: SymptomType; icon: string }[] = [
  { value: 'Cramps', icon: '😣' },
  { value: 'Headache', icon: '🤕' },
  { value: 'Bloating', icon: '😮' },
  { value: 'Fatigue', icon: '😴' },
  { value: 'Back Pain', icon: '🔴' },
  { value: 'Nausea', icon: '🤢' },
  { value: 'Tender Breasts', icon: '🫀' },
  { value: 'Acne', icon: '⚡' },
  { value: 'Constipation', icon: '🧱' },
  { value: 'Diarrhea', icon: '💧' },
  { value: 'Dizziness', icon: '💫' },
  { value: 'Joint Pain', icon: '🦴' },
  { value: 'Appetite Changes', icon: '🍽️' },
  { value: 'Cravings', icon: '🍫' },
  { value: 'Pelvic Pressure', icon: '🫁' },
];

const cervicalMucusOptions: { value: CervicalMucus; label: string; desc: string }[] = [
  { value: 'Dry', label: 'Dry', desc: 'None' },
  { value: 'Sticky', label: 'Sticky', desc: 'Crumbly' },
  { value: 'Creamy', label: 'Creamy', desc: 'Lotion-like' },
  { value: 'Watery', label: 'Watery', desc: 'Slippery' },
  { value: 'Egg White', label: 'Egg White', desc: 'Most fertile' },
];

const sleepOptions: { value: SleepQuality; icon: string; label: string }[] = [
  { value: 'Poor', icon: '😫', label: 'Poor' },
  { value: 'Fair', icon: '😑', label: 'Fair' },
  { value: 'Good', icon: '🙂', label: 'Good' },
  { value: 'Great', icon: '😊', label: 'Great' },
];

const energyOptions: { value: EnergyLevel; icon: string; label: string }[] = [
  { value: 'Low', icon: '🪫', label: 'Low' },
  { value: 'Medium', icon: '🔋', label: 'Medium' },
  { value: 'High', icon: '⚡', label: 'High' },
];

const perimenopauseSymptoms: { value: SymptomType; icon: string }[] = [
  { value: 'Hot Flashes', icon: '🔥' },
  { value: 'Night Sweats', icon: '💦' },
  { value: 'Sleep Changes', icon: '🛌' },
  { value: 'Cycle Spotting', icon: '🩹' },
];

const protectionOptions: { value: Exclude<ProtectionType, null>; label: string }[] = [
  { value: 'None', label: 'None' },
  { value: 'Condom', label: 'Condom' },
  { value: 'Pill', label: 'Pill' },
  { value: 'Withdrawal', label: 'Withdrawal' },
  { value: 'Emergency Contraception', label: 'Emergency' },
  { value: 'Other', label: 'Other' },
];

export function LogScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logs, saveLog, settings } = useCycle();

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayKey = dateToKey(todayDate);

  const dateKey = searchParams.get('date') || todayKey;
  const fromParam = searchParams.get('from') || '';

  const dateObj = keyToDate(dateKey);
  const isToday = dateKey === todayKey;
  const dayNum = dateObj.getDate();
  const monthName = MONTHS[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hasExistingLog = !!logs[dateKey];

  const existing = logs[dateKey];
  const symptomOptions = settings.perimenopauseMode
    ? [...physicalSymptoms, ...perimenopauseSymptoms]
    : physicalSymptoms;

  const [flow, setFlow] = useState<FlowLevel>(existing?.flow ?? null);
  const [moods, setMoods] = useState<Set<MoodType>>(new Set(existing?.moods as MoodType[] ?? []));
  const [symptoms, setSymptoms] = useState<Set<SymptomType>>(new Set(existing?.symptoms as SymptomType[] ?? []));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [isPeriod, setIsPeriod] = useState(existing?.isPeriod ?? false);
  const [hadIntimacy, setHadIntimacy] = useState(existing?.hadIntimacy ?? false);
  const [protectionUsed, setProtectionUsed] = useState<ProtectionType>(existing?.protectionUsed ?? null);
  const [intimacyNotes, setIntimacyNotes] = useState(existing?.intimacyNotes ?? '');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(existing?.sleepQuality ?? null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(existing?.energyLevel ?? null);
  const [waterGlasses, setWaterGlasses] = useState<number>(existing?.waterGlasses ?? 0);
  const [cervicalMucus, setCervicalMucus] = useState<CervicalMucus | null>(existing?.cervicalMucus ?? null);
  const [saved, setSaved] = useState(false);

  // Re-sync when dateKey changes (e.g., navigating from calendar)
  useEffect(() => {
    const ex = logs[dateKey];
    setFlow(ex?.flow ?? null);
    setMoods(new Set(ex?.moods as MoodType[] ?? []));
    setSymptoms(new Set(ex?.symptoms as SymptomType[] ?? []));
    setNotes(ex?.notes ?? '');
    setIsPeriod(ex?.isPeriod ?? false);
    setHadIntimacy(ex?.hadIntimacy ?? false);
    setProtectionUsed(ex?.protectionUsed ?? null);
    setIntimacyNotes(ex?.intimacyNotes ?? '');
    setSleepQuality(ex?.sleepQuality ?? null);
    setEnergyLevel(ex?.energyLevel ?? null);
    setWaterGlasses(ex?.waterGlasses ?? 0);
    setCervicalMucus(ex?.cervicalMucus ?? null);
    setSaved(false);
  }, [dateKey]);

  const toggleMood = (mood: MoodType) => {
    const next = new Set(moods);
    if (next.has(mood)) next.delete(mood); else next.add(mood);
    setMoods(next);
  };

  const toggleSymptom = (symptom: SymptomType) => {
    const next = new Set(symptoms);
    if (next.has(symptom)) next.delete(symptom); else next.add(symptom);
    setSymptoms(next);
  };

  const handleSave = () => {
    const log: DayLog = {
      flow,
      moods: Array.from(moods),
      symptoms: Array.from(symptoms),
      notes,
      isPeriod,
      hadIntimacy,
      protectionUsed: hadIntimacy ? protectionUsed : null,
      intimacyNotes: hadIntimacy ? intimacyNotes : '',
      sleepQuality,
      energyLevel,
      waterGlasses,
      cervicalMucus,
    };
    saveLog(dateKey, log);
    setSaved(true);
    setTimeout(() => {
      navigate(fromParam === 'calendar' ? '/calendar' : '/');
    }, 1100);
  };

  const handleBack = () => {
    navigate(fromParam === 'calendar' ? '/calendar' : '/');
  };

  // ─── Saved state ─────────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div style={{ minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)', gap: '16px', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #F472B6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(168,85,247,0.35)' }}>
          <Check size={36} color="white" strokeWidth={3} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
          {hasExistingLog ? 'Log Updated!' : 'Log Saved!'}
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, fontWeight: 600 }}>
          Great job taking care of yourself 🌸
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#FAFAFA', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sticky Header */}
      <div style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 100%)', padding: '8px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button
          onClick={handleBack}
          style={{ width: '38px', height: '38px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}
        >
          <ChevronLeft size={20} color="#6D28D9" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1a1a2e' }}>
            {hasExistingLog ? 'Edit Log' : 'Daily Log'}
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#A855F7', fontWeight: 600 }}>
            {isToday ? 'Today · ' : ''}{monthName} {dayNum}, {year}
          </p>
        </div>
        {hasExistingLog && (
          <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
            Editing
          </span>
        )}
      </div>

      {/* Scrollable form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Period Toggle — top of form, most important */}
        <div
          onClick={() => setIsPeriod(p => !p)}
          style={{
            background: isPeriod
              ? 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(252,231,243,0.6))'
              : '#ffffff',
            borderRadius: '18px',
            padding: '14px 18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: `2px solid ${isPeriod ? '#F472B6' : '#F3F4F6'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: isPeriod ? 'linear-gradient(135deg, #F472B6, #EC4899)' : '#F9FAFB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '22px',
            boxShadow: isPeriod ? '0 4px 12px rgba(236,72,153,0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}>
            {isPeriod ? <Droplets size={20} color="white" /> : <span>🩸</span>}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: isPeriod ? '#BE185D' : '#1F2937' }}>
              Period Day
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: isPeriod ? '#F472B6' : '#9CA3AF', fontWeight: 600 }}>
              {isPeriod ? 'Marked ✓ — tap to unmark' : 'Tap to mark this as a period day'}
            </p>
          </div>
          {/* Toggle pill */}
          <div style={{
            width: '46px', height: '26px', borderRadius: '999px',
            background: isPeriod ? '#F472B6' : '#E5E7EB',
            position: 'relative', flexShrink: 0,
            transition: 'background 0.2s ease',
          }}>
            <div style={{
              position: 'absolute', top: '3px',
              left: isPeriod ? '23px' : '3px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'left 0.2s ease',
            }} />
          </div>
        </div>

        {/* Flow Intensity */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🩸</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Flow Intensity</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Optional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {flowOptions.map((option) => {
              const isSelected = flow === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFlow(isSelected ? null : option.value)}
                  style={{
                    padding: '12px 6px',
                    border: `2px solid ${isSelected ? '#EC4899' : '#F3F4F6'}`,
                    borderRadius: '14px',
                    background: isSelected ? 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(252,231,243,0.5))' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Nunito', sans-serif",
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: option.size }}>🩸</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#BE185D' : '#4B5563' }}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', width: '16px', height: '16px', borderRadius: '50%', background: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={9} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cervical Mucus */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🌊</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Cervical Mucus</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Optional</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {cervicalMucusOptions.map((option) => {
              const isSelected = cervicalMucus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setCervicalMucus(isSelected ? null : option.value)}
                  style={{
                    padding: '8px 13px',
                    border: `2px solid ${isSelected ? '#0EA5E9' : '#E5E7EB'}`,
                    borderRadius: '999px',
                    background: isSelected ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    fontFamily: "'Nunito', sans-serif",
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#0369a1' : '#4B5563' }}>{option.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: isSelected ? '#0284c7' : '#9CA3AF' }}>{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>💜</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Mood</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Select all that apply</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {moodOptions.map((option) => {
              const isSelected = moods.has(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleMood(option.value)}
                  style={{
                    padding: '10px 4px',
                    border: `2px solid ${isSelected ? '#A855F7' : '#F3F4F6'}`,
                    borderRadius: '14px',
                    background: isSelected ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(237,233,254,0.5))' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{option.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? '#7C3AED' : '#6B7280' }}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Physical Symptoms */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Physical Symptoms</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {symptomOptions.map((s) => {
              const isSelected = symptoms.has(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleSymptom(s.value)}
                  style={{
                    padding: '7px 13px',
                    border: `2px solid ${isSelected ? '#8B5CF6' : '#E5E7EB'}`,
                    borderRadius: '999px',
                    background: isSelected ? 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '13px' }}>{s.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#6D28D9' : '#6B7280' }}>
                    {s.value}
                  </span>
                  {isSelected && (
                    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={8} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sleep Quality */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🛌</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Sleep Quality</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Optional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {sleepOptions.map((option) => {
              const isSelected = sleepQuality === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSleepQuality(isSelected ? null : option.value)}
                  style={{
                    padding: '10px 4px',
                    border: `2px solid ${isSelected ? '#6D28D9' : '#F3F4F6'}`,
                    borderRadius: '14px',
                    background: isSelected ? 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(237,233,254,0.6))' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{option.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? '#6D28D9' : '#6B7280' }}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy Level */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Energy Level</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Optional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {energyOptions.map((option) => {
              const isSelected = energyLevel === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setEnergyLevel(isSelected ? null : option.value)}
                  style={{
                    padding: '12px 6px',
                    border: `2px solid ${isSelected ? '#F59E0B' : '#F3F4F6'}`,
                    borderRadius: '14px',
                    background: isSelected ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(254,243,199,0.6))' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{option.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#B45309' : '#6B7280' }}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Water Intake */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px' }}>💧</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Water Intake</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Glasses (8 oz)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
              style={{ width: '38px', height: '38px', borderRadius: '12px', border: '1.5px solid #BAE6FD', background: '#F0F9FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Minus size={16} color="#0369a1" />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0369a1', lineHeight: 1 }}>{waterGlasses}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginTop: '2px' }}>glasses today</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} style={{ fontSize: '14px', opacity: i < waterGlasses ? 1 : 0.2 }}>💧</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setWaterGlasses(Math.min(12, waterGlasses + 1))}
              style={{ width: '38px', height: '38px', borderRadius: '12px', border: '1.5px solid #BAE6FD', background: '#F0F9FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Plus size={16} color="#0369a1" />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>📝</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Notes</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Optional</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling today? Any additional notes…"
            rows={3}
            style={{
              width: '100%', border: '2px solid #F3F4F6', borderRadius: '13px',
              padding: '11px 12px', fontSize: '13px', fontFamily: "'Nunito', sans-serif",
              color: '#374151', outline: 'none', resize: 'none', background: '#F9FAFB',
              fontWeight: 600, lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C084FC'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#F3F4F6'; }}
          />
        </div>

        {/* Intimacy */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>❤️</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Intimacy</h3>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Private & offline</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: hadIntimacy ? '12px' : 0 }}>
            <button
              onClick={() => setHadIntimacy(false)}
              style={{
                padding: '10px',
                border: `2px solid ${!hadIntimacy ? '#A855F7' : '#F3F4F6'}`,
                borderRadius: '12px',
                background: !hadIntimacy ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(237,233,254,0.55))' : '#F9FAFB',
                fontSize: '12px',
                fontWeight: 700,
                color: !hadIntimacy ? '#7C3AED' : '#6B7280',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              No Activity
            </button>
            <button
              onClick={() => setHadIntimacy(true)}
              style={{
                padding: '10px',
                border: `2px solid ${hadIntimacy ? '#EC4899' : '#F3F4F6'}`,
                borderRadius: '12px',
                background: hadIntimacy ? 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(252,231,243,0.55))' : '#F9FAFB',
                fontSize: '12px',
                fontWeight: 700,
                color: hadIntimacy ? '#BE185D' : '#6B7280',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Had Activity
            </button>
          </div>

          {hadIntimacy && (
            <>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.2px' }}>
                Protection Method
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
                {protectionOptions.map((option) => {
                  const selected = protectionUsed === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setProtectionUsed(selected ? null : option.value)}
                      style={{
                        padding: '6px 11px',
                        border: `1.5px solid ${selected ? '#EC4899' : '#E5E7EB'}`,
                        borderRadius: '999px',
                        background: selected ? '#FDF2F8' : '#F9FAFB',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: selected ? '#BE185D' : '#6B7280',
                        cursor: 'pointer',
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={intimacyNotes}
                onChange={(e) => setIntimacyNotes(e.target.value)}
                placeholder="Optional note (e.g., timing, comfort, anything to remember)"
                rows={2}
                style={{
                  width: '100%', border: '2px solid #F3F4F6', borderRadius: '13px',
                  padding: '10px 12px', fontSize: '12px', fontFamily: "'Nunito', sans-serif",
                  color: '#374151', outline: 'none', resize: 'none', background: '#F9FAFB',
                  fontWeight: 600, lineHeight: 1.45, boxSizing: 'border-box',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Save button */}
      <div style={{ padding: '10px 16px 14px', background: 'linear-gradient(to top, rgba(250,250,250,1) 60%, rgba(250,250,250,0))', flexShrink: 0 }}>
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '15px 24px',
            background: 'linear-gradient(135deg, #F472B6 0%, #C084FC 50%, #8B5CF6 100%)',
            border: 'none', borderRadius: '999px', color: 'white',
            fontSize: '15px', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 6px 20px rgba(168,85,247,0.4)', fontFamily: "'Nunito', sans-serif",
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <Check size={17} strokeWidth={3} />
          {hasExistingLog ? 'Update Log' : 'Save Log'}
        </button>
      </div>
    </div>
  );
}
