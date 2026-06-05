import { CourtMood } from '@/types'

export interface CourtroomPhase {
  phase: 'intro' | 'opening' | 'crossExam' | 'emotional' | 'closing' | 'verdict'
  title: string
  description: string
  duration: number // ms
  messageCount: number
}

export const courtroomPhases: Record<string, CourtroomPhase> = {
  intro: {
    phase: 'intro',
    title: 'Case Introduction',
    description: 'The judge enters and the case is presented',
    duration: 3000,
    messageCount: 1,
  },
  opening: {
    phase: 'opening',
    title: 'Opening Statements',
    description: 'Both lawyers present their client\'s case',
    duration: 4000,
    messageCount: 2,
  },
  crossExam: {
    phase: 'crossExam',
    title: 'Cross Examination',
    description: 'Lawyers challenge contradictions and inconsistencies',
    duration: 5000,
    messageCount: 3,
  },
  emotional: {
    phase: 'emotional',
    title: 'Emotional Evidence',
    description: 'The deeper emotional impact is revealed',
    duration: 4000,
    messageCount: 2,
  },
  closing: {
    phase: 'closing',
    title: 'Closing Arguments',
    description: 'Final statements before the verdict',
    duration: 3000,
    messageCount: 2,
  },
  verdict: {
    phase: 'verdict',
    title: 'The Verdict',
    description: 'The judge delivers the final ruling',
    duration: 5000,
    messageCount: 1,
  },
}

export const phaseSequence: CourtroomPhase[] = [
  courtroomPhases.intro,
  courtroomPhases.opening,
  courtroomPhases.crossExam,
  courtroomPhases.emotional,
  courtroomPhases.closing,
  courtroomPhases.verdict,
]

// Get next phase
export function getNextPhase(currentPhase: string): CourtroomPhase | null {
  const currentIndex = phaseSequence.findIndex(p => p.phase === currentPhase)
  if (currentIndex === -1 || currentIndex === phaseSequence.length - 1) return null
  return phaseSequence[currentIndex + 1]
}

// Audience reactions system
export interface AudienceReaction {
  reaction: string
  intensity: 'subtle' | 'moderate' | 'intense'
  trigger: 'contradiction' | 'emotional' | 'savage' | 'awkward' | 'tension'
}

export const audienceReactions: Record<string, AudienceReaction[]> = {
  contradiction: [
    { reaction: 'That argument just fell apart.', intensity: 'subtle', trigger: 'contradiction' },
    { reaction: 'Did they just contradict themselves?', intensity: 'moderate', trigger: 'contradiction' },
    { reaction: 'The inconsistency is undeniable.', intensity: 'subtle', trigger: 'contradiction' },
    { reaction: 'Courtroom tension rising.', intensity: 'moderate', trigger: 'contradiction' },
  ],
  emotional: [
    { reaction: 'That actually hit deep.', intensity: 'moderate', trigger: 'emotional' },
    { reaction: 'The defendant is visibly uncomfortable.', intensity: 'moderate', trigger: 'emotional' },
    { reaction: 'This relationship is in critical condition.', intensity: 'intense', trigger: 'emotional' },
    { reaction: 'That emotional wound is real.', intensity: 'moderate', trigger: 'emotional' },
  ],
  savage: [
    { reaction: 'That was devastating.', intensity: 'intense', trigger: 'savage' },
    { reaction: 'Objection: That was too savage.', intensity: 'moderate', trigger: 'savage' },
    { reaction: 'The courtroom gasps in unison.', intensity: 'intense', trigger: 'savage' },
    { reaction: 'No survivors from that statement.', intensity: 'intense', trigger: 'savage' },
  ],
  awkward: [
    { reaction: 'Silence. Pure silence.', intensity: 'subtle', trigger: 'awkward' },
    { reaction: 'That awkwardness is palpable.', intensity: 'moderate', trigger: 'awkward' },
    { reaction: 'The defendant shuffles uncomfortably.', intensity: 'subtle', trigger: 'awkward' },
  ],
  tension: [
    { reaction: 'The tension is suffocating.', intensity: 'intense', trigger: 'tension' },
    { reaction: 'Both parties refuse to make eye contact.', intensity: 'moderate', trigger: 'tension' },
    { reaction: 'This is a critical moment.', intensity: 'moderate', trigger: 'tension' },
  ],
}

export function generateAudienceReaction(
  trigger: 'contradiction' | 'emotional' | 'savage' | 'awkward' | 'tension',
  mood: CourtMood
): AudienceReaction | null {
  // Skip reactions on serious mood
  if (mood === 'serious') return null

  const reactions = audienceReactions[trigger] || []
  if (reactions.length === 0) return null

  return reactions[Math.floor(Math.random() * reactions.length)]
}

// Determine if a reaction should be triggered
export function shouldTriggerReaction(
  argument: string,
  opposingArgument: string,
  mood: CourtMood
): 'contradiction' | 'emotional' | 'savage' | 'awkward' | 'tension' | null {
  // Never trigger on serious
  if (mood === 'serious') return null

  // Check for emotional keywords
  const emotionalKeywords = ['hurt', 'betrayed', 'abandoned', 'lonely', 'trust']
  if (emotionalKeywords.some(kw => argument.toLowerCase().includes(kw))) {
    return Math.random() > 0.6 ? 'emotional' : null
  }

  // Check for contradictions
  if ((argument.includes('always') && opposingArgument.includes('never')) ||
      (argument.includes('never') && opposingArgument.includes('always'))) {
    return 'contradiction'
  }

  // Savage mode has more aggressive reactions
  if (mood === 'savage' && Math.random() > 0.7) {
    return 'savage'
  }

  // Cinema drama has tension reactions
  if (mood === 'drama' && Math.random() > 0.6) {
    return 'tension'
  }

  return null
}

export { }
