# AI Relationship Court ⚖️

A cinematic, entertaining web app where AI lawyers and a dramatic judge settle relationship disputes. Features witty dialogue, dramatic animations, and shareable verdicts.

## ⚙️ CORE ENGINE

This project includes a **complete core engine** for AI courtroom orchestration:

- **Single AI Orchestrator** - One decision point for all AI actions
- **Courtroom Memory System** - Persistent state tracking all case context
- **Conversation Flow Engine** - Manages turns, phases, and progression
- **Structured Responses** - JSON format enables flexible UI/UX
- **Emotional Intelligence** - Tracks emotional signals and intensity
- **User Participation** - Regular "Speak or Continue" options

### Documentation

Start here based on your role:

- **👨‍💼 Project Manager**: Read [CORE_ENGINE.md](./CORE_ENGINE.md) for system overview
- **👨‍💻 Developer (Integration)**: Start with [QUICKSTART.md](./QUICKSTART.md) then [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **🤖 AI/ML Engineer**: See [AI_INTEGRATION_SPEC.md](./AI_INTEGRATION_SPEC.md) for Gemini integration
- **🎨 UI/UX Designer**: Check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for component examples
- **📊 Product**: Review [VERDICT_SYSTEM.md](./VERDICT_SYSTEM.md) for verdict generation

### Quick Start

```bash
# 1. Install dependencies
npm install zustand

# 2. Run dev server
npm run dev

# 3. See QUICKSTART.md for implementation example
```

---

## 🎬 Features

- **Landing Page**: Stylish dark courtroom aesthetic with hero section
- **Case Setup**: Define case title, names, arguments, and courtroom mood (Savage/Funny/Serious/Drama)
- **AI Courtroom**: Dramatic conversation between two AI lawyers and a judge
- **Verdict Card**: Shareable results with survival chance, toxicity score, and red flags
- **Smooth Animations**: Framer Motion animations for message entries, typing indicators, and transitions
- **Responsive Design**: Mobile-first UI optimized for all screen sizes

## 🎨 Design

- Dark luxury aesthetic with cinematic atmosphere
- Red (#e63946) and gold (#f77f00) accent colors
- Netflix courtroom drama + meme culture vibe
- Smooth glass-morphism effects
- Animated backgrounds and glowing elements

## 🛠️ Tech Stack

- **Next.js 14+**: React framework with App Router
- **React 18+**: Component library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Advanced animations
- **PostCSS & Autoprefixer**: CSS processing

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── setup/             # Case setup page
│   ├── courtroom/         # AI courtroom simulation
│   ├── verdict/           # Verdict display page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── TypingAnimation.tsx
│   ├── LawyerBubble.tsx
│   ├── JudgePanel.tsx
│   ├── ObjectionPopup.tsx
│   ├── VerdictCard.tsx
│   └── CourtroomLayout.tsx
├── types/                 # TypeScript type definitions
│   └── index.ts
└── utils/                 # Utility functions
    └── mockDialogues.ts   # Mock AI responses and verdicts
```

## 🎭 Courtroom Moods

- **Savage** 🔥: Harsh, witty dialogue with no mercy
- **Funny** 😂: Humorous takes and meme references
- **Serious** 🎓: Professional courtroom tone
- **Cinema Drama** 🎬: Theatrical, emotional arguments

## 🎯 Usage Flow

1. **Landing Page**: User reads intro and clicks "START CASE"
2. **Setup Page**: User fills in case details and selects courtroom mood
3. **Courtroom**: AI lawyers present arguments, judge makes interjections
4. **Verdict**: Judge renders verdict with relationship survival percentage
5. **Share**: User can download or share verdict card

## 🔮 Future Enhancements

- Real AI API integration (OpenAI, Anthropic, etc.)
- Voice-to-text argument input
- 3D animated courtroom with character models
- Save and view past cases
- Multiplayer mode (real people arguing)
- Sound effects and courtroom ambience audio
- Custom character avatars
- Social sharing with dynamic OG images

## 📝 Mock Responses

Currently uses mock dialogue templates for each courtroom mood. The `mockDialogues.ts` file contains predefined responses that can be easily replaced with real API calls.

## 🎬 Animations

- Message slide-in animations
- Typing text animations
- Objection popup with bounce effect
- Judge glow intensification
- Smooth page transitions
- Background pulsing glows

## 🚀 Deployment

Ready to deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- Any Node.js hosting

```bash
npm run build
```

## 📄 License

Creative Commons - Free to use and modify

## 🎬 Credits

"Netflix courtroom drama meets meme culture meets AI roleplay"

---

**Remember**: This is for entertainment purposes only. Do not actually base relationship decisions on AI judge verdicts. (Unless they say you're right. 😂)
