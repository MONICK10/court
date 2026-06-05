import { DialogueOption, CourtMood } from '@/types'

export const mockDialogues: Record<CourtMood, DialogueOption[]> = {
  savage: [
    {
      speaker: 'lawyerA',
      text: 'Your honor, disappearing for 5 hours without explanation is emotional terrorism.',
    },
    {
      speaker: 'lawyerB',
      text: 'Objection. My client was working, not training to become Batman.',
    },
    {
      speaker: 'judge',
      text: 'Noted. The court acknowledges emotional damage but recognizes employment is valid.',
    },
    {
      speaker: 'lawyerA',
      text: 'A simple text takes 3 seconds. 5 hours? That\'s malicious intent.',
    },
    {
      speaker: 'lawyerB',
      text: 'My client is not attached to their phone like a barnacle on a rock.',
    },
    {
      speaker: 'judge',
      text: 'The court finds this...concerning but not criminal.',
    },
  ],
  funny: [
    {
      speaker: 'lawyerA',
      text: 'Your honor, my client suffered a critical WiFi disconnection. This is discrimination.',
    },
    {
      speaker: 'lawyerB',
      text: 'Objection: WiFi is not a human right, despite what the Millennial Defense Council claims.',
    },
    {
      speaker: 'judge',
      text: 'The court has seen worse crimes on dating apps. We\'re dismissing this.',
    },
    {
      speaker: 'lawyerA',
      text: 'But the green dot was ON! We had EVIDENCE!',
    },
    {
      speaker: 'lawyerB',
      text: 'Your honor, the green dot is a LIE. A green dot fabrication.',
    },
    {
      speaker: 'judge',
      text: 'Bailiff, please disable all instant messengers. Court is adjourned.',
    },
  ],
  serious: [
    {
      speaker: 'lawyerA',
      text: 'The evidence clearly shows a pattern of disengagement and emotional unavailability.',
    },
    {
      speaker: 'lawyerB',
      text: 'The defense acknowledges communication gaps but disputes the severity of allegations.',
    },
    {
      speaker: 'judge',
      text: 'Both parties must take responsibility for establishing healthy communication patterns.',
    },
    {
      speaker: 'lawyerA',
      text: 'Trust has been compromised through repeated incidents.',
    },
    {
      speaker: 'lawyerB',
      text: 'The defendant seeks reconciliation through tangible behavioral change.',
    },
    {
      speaker: 'judge',
      text: 'This court recommends commitment to restoration of mutual respect and understanding.',
    },
  ],
  drama: [
    {
      speaker: 'lawyerA',
      text: '*slams hand on desk* This is not merely negligence, your honor. It\'s betrayal.',
    },
    {
      speaker: 'lawyerB',
      text: '*stands slowly* My client stands falsely accused of crimes against the heart.',
    },
    {
      speaker: 'judge',
      text: '*leans back dramatically* The weight of love rests heavy in this courtroom today.',
    },
    {
      speaker: 'lawyerA',
      text: 'Three years of memories... shattered by a single moment of carelessness.',
    },
    {
      speaker: 'lawyerB',
      text: 'And yet, redemption is not impossible. The defendant wishes to rebuild...',
    },
    {
      speaker: 'judge',
      text: 'Will love triumph over doubt? Will trust be restored? The verdict approaches.',
    },
  ],
}

export const verdictTemplates = [
  {
    winner: 'A' as const,
    verdict: 'The court finds in favor of {personA}. {personB}, you need to work on your communication skills.',
    redFlags: ['Selective amnesia', 'Communication avoidance', 'Emotional unavailability'],
    toxicityScore: 65,
    survivalChance: 45,
  },
  {
    winner: 'B' as const,
    verdict: 'The court finds in favor of {personB}. {personA}, perhaps you\'re being a bit too demanding.',
    redFlags: ['Unrealistic expectations', 'Control tendencies', 'Perfectionism'],
    toxicityScore: 52,
    survivalChance: 62,
  },
  {
    winner: 'draw' as const,
    verdict: 'The court finds both parties equally at fault. You\'re both just confused. That\'s actually love.',
    redFlags: ['Mutual dysfunction', 'Communication breakdown', 'Unresolved conflicts'],
    toxicityScore: 58,
    survivalChance: 55,
  },
]

export function generateMockResponse(
  speaker: 'judge' | 'lawyerA' | 'lawyerB',
  mood: CourtMood
): string {
  const dialogues = mockDialogues[mood]
  const filtered = dialogues.filter((d) => d.speaker === speaker)
  if (filtered.length === 0) return "The court is silent."
  return filtered[Math.floor(Math.random() * filtered.length)].text
}

export function generateVerdict(personA: string, personB: string): {
  winner: 'A' | 'B' | 'draw'
  winnerPercentage: number
  verdict: string
  redFlags: string[]
  toxicityScore: number
  survivalChance: number
} {
  const template = verdictTemplates[Math.floor(Math.random() * verdictTemplates.length)]
  
  return {
    winner: template.winner,
    winnerPercentage: template.winner === 'A' ? 65 : template.winner === 'B' ? 70 : 50,
    verdict: template.verdict
      .replace('{personA}', personA)
      .replace('{personB}', personB),
    redFlags: template.redFlags,
    toxicityScore: template.toxicityScore + Math.floor(Math.random() * 20),
    survivalChance: template.survivalChance + Math.floor(Math.random() * 20),
  }
}
