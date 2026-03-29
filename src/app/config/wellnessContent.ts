export interface WellnessArticle {
  id: string;
  phase: 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal' | 'General';
  title: string;
  emoji: string;
  body: string[];
  tags: string[];
}

export const wellnessArticles: WellnessArticle[] = [
  // ─── MENSTRUAL PHASE ─────────────────────────────────────────────────────────
  {
    id: 'mens-1',
    phase: 'Menstrual',
    title: 'What Happens During Your Period?',
    emoji: '🩸',
    body: [
      'During menstruation, the lining of your uterus (called the endometrium) sheds because pregnancy did not occur. This process is triggered by a drop in estrogen and progesterone levels.',
      'The average period lasts 3–7 days, though cycles vary widely. Light to moderate bleeding is typical on days 1–3, with flow often tapering off towards the end.',
      'Cramping is caused by prostaglandins — hormone-like compounds that cause the uterine muscles to contract. Heat, gentle movement, and magnesium-rich foods can help ease discomfort.',
    ],
    tags: ['period', 'cramping', 'bleeding'],
  },
  {
    id: 'mens-2',
    phase: 'Menstrual',
    title: 'Managing Cramps Naturally',
    emoji: '🛁',
    body: [
      'Applying a warm compress or heating pad to your lower abdomen for 15–20 minutes can relax uterine muscles and reduce cramping as effectively as some over-the-counter pain relievers.',
      'Light movement like yoga, stretching, or a short walk increases blood flow and releases endorphins, which are natural pain modulators.',
      'Foods rich in omega-3 fatty acids (like salmon and walnuts) and magnesium (dark chocolate, leafy greens, nuts) have been shown to reduce prostaglandin production and ease cramping over time.',
    ],
    tags: ['cramps', 'natural remedies', 'pain'],
  },
  {
    id: 'mens-3',
    phase: 'Menstrual',
    title: 'Iron & Nutrition During Menstruation',
    emoji: '🥬',
    body: [
      'Bleeding causes a loss of iron, which can contribute to fatigue. Eating iron-rich foods — such as lentils, spinach, red meat, tofu, and fortified cereals — helps replenish stores.',
      'Pair iron-rich plant foods with vitamin C (citrus fruits, bell peppers) to boost absorption. Avoid tea or coffee immediately after meals as tannins can inhibit iron uptake.',
      'Staying hydrated is equally important. While it may feel counterintuitive, adequate water intake helps reduce bloating and headaches associated with hormonal shifts.',
    ],
    tags: ['nutrition', 'iron', 'fatigue'],
  },
  // ─── FOLLICULAR PHASE ────────────────────────────────────────────────────────
  {
    id: 'fol-1',
    phase: 'Follicular',
    title: 'The Follicular Phase: Rising Energy',
    emoji: '🌱',
    body: [
      'After your period ends, estrogen begins to rise as follicles in your ovaries mature. This typically leads to improved mood, sharper mental clarity, and a natural boost in physical energy.',
      'This is often the best time to tackle complex projects, have important conversations, or start new habits. Your brain is more responsive to learning and memory consolidation.',
      'Exercise performance tends to improve during this phase. Consider adding strength training or higher-intensity cardio to align with your natural hormonal rhythm.',
    ],
    tags: ['energy', 'estrogen', 'mood'],
  },
  {
    id: 'fol-2',
    phase: 'Follicular',
    title: 'Supporting Your Gut Health This Phase',
    emoji: '🥗',
    body: [
      'Rising estrogen during the follicular phase positively influences gut microbiome diversity. This is a great time to incorporate probiotic and prebiotic foods like yogurt, kefir, sauerkraut, and fiber-rich vegetables.',
      'The liver metabolizes excess estrogen, so supporting liver health with cruciferous vegetables (broccoli, cauliflower, kale) and avoiding excessive alcohol helps hormone balance.',
      'Hydration supports nutrient absorption and skin health, which often improves during this phase due to increasing estrogen.',
    ],
    tags: ['gut health', 'nutrition', 'estrogen'],
  },
  // ─── OVULATORY PHASE ─────────────────────────────────────────────────────────
  {
    id: 'ov-1',
    phase: 'Ovulatory',
    title: 'Understanding Ovulation',
    emoji: '⭐',
    body: [
      'Ovulation occurs when a mature egg is released from a follicle in one of your ovaries. This typically happens around day 14 of a 28-day cycle, but varies based on your unique rhythm.',
      'Luteinizing hormone (LH) surges 24–36 hours before ovulation, which is what ovulation predictor kits detect. You may notice increased, slippery, egg-white-like cervical mucus — a natural sign of peak fertility.',
      'The egg is only viable for 12–24 hours after release. However, sperm can survive up to 5 days in the reproductive tract, so the fertile window typically spans 5 days before ovulation to 1 day after.',
    ],
    tags: ['ovulation', 'fertility', 'LH'],
  },
  {
    id: 'ov-2',
    phase: 'Ovulatory',
    title: 'Cervical Mucus & Fertility Signs',
    emoji: '🌊',
    body: [
      'Cervical mucus changes throughout your cycle and is a reliable indicator of fertility. As estrogen rises toward ovulation, mucus becomes more abundant, clear, and stretchy — similar in texture to raw egg whites.',
      'Tracking CM daily (by observing the sensation at the vaginal opening or checking directly) can help identify your fertile window without any technology.',
      'After ovulation, progesterone causes mucus to become sticky, cloudy, or absent again — marking the end of the fertile window. This is the basis of the Billings Ovulation Method.',
    ],
    tags: ['cervical mucus', 'fertility tracking', 'ovulation'],
  },
  // ─── LUTEAL PHASE ────────────────────────────────────────────────────────────
  {
    id: 'lut-1',
    phase: 'Luteal',
    title: 'The Luteal Phase & PMS',
    emoji: '🍂',
    body: [
      'After ovulation, the ruptured follicle transforms into the corpus luteum, which secretes progesterone. This hormone prepares the uterine lining for a potential pregnancy.',
      'If fertilization does not occur, progesterone declines in the last few days of the phase, triggering your period. This hormonal drop is responsible for PMS symptoms like mood changes, bloating, breast tenderness, and sleep disruption.',
      'Not everyone experiences PMS the same way. Tracking your symptoms over several cycles helps identify your personal pattern and distinguish between PMS (cyclical) and PMDD (more severe) or other conditions.',
    ],
    tags: ['PMS', 'progesterone', 'hormones'],
  },
  {
    id: 'lut-2',
    phase: 'Luteal',
    title: 'Managing PMS with Food & Lifestyle',
    emoji: '🍫',
    body: [
      'Magnesium (found in dark chocolate, pumpkin seeds, almonds, and spinach) has been shown in studies to reduce PMS symptoms including mood irritability and bloating.',
      'Reducing sodium intake in the second half of your cycle can minimize fluid retention and bloating. Limiting caffeine and alcohol also helps stabilize mood and sleep.',
      'Regular moderate exercise is one of the most effective interventions for PMS. It increases serotonin, reduces cortisol, and helps the body manage hormonal fluctuations more smoothly.',
    ],
    tags: ['PMS', 'nutrition', 'magnesium'],
  },
  {
    id: 'lut-3',
    phase: 'Luteal',
    title: 'Sleep & the Luteal Phase',
    emoji: '🌙',
    body: [
      'Progesterone has a mildly sedative effect, which can make you feel sleepier during the luteal phase. However, the drop in core body temperature regulation and rising basal body temperature can make sleep lighter and more disrupted.',
      'Prioritize consistent sleep and wake times. Keep your bedroom cool and dark. Limiting screen exposure 1 hour before bed reduces the impact of blue light on melatonin production.',
      'Some people experience more vivid dreams or insomnia in the days just before their period. This is a normal hormonal effect. A short wind-down routine (reading, light stretching, journaling) can help.',
    ],
    tags: ['sleep', 'progesterone', 'PMS'],
  },
  // ─── GENERAL ─────────────────────────────────────────────────────────────────
  {
    id: 'gen-1',
    phase: 'General',
    title: 'How to Read Your Cycle Data',
    emoji: '📊',
    body: [
      'A "normal" cycle can range from 21 to 35 days, and your period can last 2–7 days. Occasional variation of a few days is completely normal and expected — it does not always indicate a problem.',
      'The most meaningful patterns emerge after tracking at least 3–6 cycles. Look for consistency in your cycle day range, the types of symptoms you experience, and their timing relative to your period.',
      'Significant changes — like cycles suddenly becoming much shorter or longer, very heavy bleeding, or pain that disrupts daily life — are worth discussing with a healthcare provider.',
    ],
    tags: ['tracking', 'data', 'patterns'],
  },
  {
    id: 'gen-2',
    phase: 'General',
    title: 'Hydration & Your Hormones',
    emoji: '💧',
    body: [
      'Water is essential for hormone transport throughout the body. Dehydration can amplify symptoms like headaches, fatigue, and cramping that are already associated with the menstrual cycle.',
      'Aim for at least 8 glasses (about 2 liters) of water per day, and more if you are physically active or live in a hot climate. Herbal teas like chamomile, ginger, or peppermint can count toward your intake.',
      'Electrolyte balance matters too — especially during your period when you may lose more fluids. Coconut water, bananas, and lightly salted foods can help replenish key minerals like potassium and sodium.',
    ],
    tags: ['hydration', 'hormones', 'wellness'],
  },
  {
    id: 'gen-3',
    phase: 'General',
    title: 'Stress & Your Menstrual Cycle',
    emoji: '🧘',
    body: [
      'Chronic stress elevates cortisol, which can suppress the hormones needed for ovulation (particularly LH and FSH). This can result in delayed periods, missed ovulation, or irregular cycles.',
      'Short-term stress around ovulation time can delay it by several days, pushing your cycle longer. This is the body\'s adaptive way of avoiding pregnancy during perceived threat.',
      'Practices that activate the parasympathetic nervous system — deep breathing, meditation, gentle yoga, time in nature, adequate sleep — all help buffer the hormonal impact of stress over time.',
    ],
    tags: ['stress', 'cortisol', 'irregular cycle'],
  },
  {
    id: 'gen-4',
    phase: 'General',
    title: 'Exercise Across Your Cycle',
    emoji: '🏋️',
    body: [
      'Your fitness capacity naturally fluctuates throughout your cycle. During the follicular and ovulatory phases, higher estrogen supports strength, endurance, and motivation — ideal for high-intensity workouts.',
      'During the luteal phase and around menstruation, your body may benefit more from yoga, Pilates, walking, or swimming. Listening to these cues rather than pushing through can lead to better long-term performance and recovery.',
      'Tracking your energy levels alongside your workouts across multiple cycles can help you build a personalized training plan that works with your hormones rather than against them.',
    ],
    tags: ['exercise', 'fitness', 'hormones'],
  },
  {
    id: 'gen-5',
    phase: 'General',
    title: 'Perimenopause & Cycle Changes',
    emoji: '🌸',
    body: [
      'Perimenopause is the transition leading up to menopause and can begin as early as the mid-30s, though it most commonly starts in the 40s. It is characterized by hormonal fluctuations and increasing cycle irregularity.',
      'Common experiences include shorter or longer cycles, heavier or lighter periods, new or worsening PMS, hot flashes, sleep changes, and mood shifts. No two people experience this transition the same way.',
      'Tracking symptoms consistently during perimenopause is especially valuable: it gives you concrete data to share with your healthcare provider and helps you distinguish between hormonal changes and other health concerns.',
    ],
    tags: ['perimenopause', 'irregular cycle', 'hormones'],
  },
];
