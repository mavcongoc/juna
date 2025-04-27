export type TechniqueCategory = "cognitive" | "emotional" | "behavioral" | "relational" | "mindfulness" | "growth"

export type Technique = {
  id: string
  name: string
  description: string
  category: TechniqueCategory
  steps?: {
    id: string
    description: string
  }[]
}

export const therapeuticTechniques: Technique[] = [
  {
    id: "probability-assessment",
    name: "Probability Assessment",
    description: "Rate the actual likelihood of feared outcomes and identify more probable scenarios.",
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Identify the feared outcome" },
      { id: "step-2", description: "Rate its likelihood on a scale of 0-100%" },
      { id: "step-3", description: "List evidence for and against this outcome" },
      { id: "step-4", description: "Reassess the probability based on evidence" },
    ],
  },
  {
    id: "decatastrophizing",
    name: "Decatastrophizing",
    description: 'Ask yourself: "What\'s the worst that could happen? How would I cope if it did?"',
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Identify the catastrophic thought" },
      { id: "step-2", description: 'Ask "What\'s the worst that could happen?"' },
      { id: "step-3", description: 'Ask "How would I cope if it did happen?"' },
      { id: "step-4", description: 'Ask "What\'s the most likely outcome?"' },
    ],
  },
  {
    id: "spectrum-thinking",
    name: "Spectrum Thinking",
    description: "Practice identifying the gray areas and nuances in situations rather than extremes.",
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Identify the black-and-white thought" },
      { id: "step-2", description: "Create a spectrum from 0-10 for the situation" },
      { id: "step-3", description: "Place the current situation on that spectrum" },
      { id: "step-4", description: "Identify examples across the entire spectrum" },
    ],
  },
  {
    id: "structured-reflection",
    name: "Structured Reflection",
    description: "Set aside dedicated time for reflection using prompts to guide your thinking process.",
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Schedule 10-15 minutes of quiet time" },
      { id: "step-2", description: "Choose a reflection prompt" },
      { id: "step-3", description: "Write or think deeply about your response" },
      { id: "step-4", description: "Identify insights or patterns from your reflection" },
    ],
  },
  {
    id: "emotional-awareness",
    name: "Emotional Awareness Practice",
    description:
      "Set aside 5 minutes daily to check in with your emotions. Name them specifically and note where you feel them in your body.",
    category: "emotional",
    steps: [
      { id: "step-1", description: "Pause and take three deep breaths" },
      { id: "step-2", description: "Scan your body for physical sensations" },
      { id: "step-3", description: "Name the emotions you're experiencing" },
      { id: "step-4", description: "Note where in your body you feel each emotion" },
    ],
  },
  {
    id: "emotion-regulation-window",
    name: "Emotion Regulation Window",
    description:
      'Practice identifying when you\'re moving outside your "window of tolerance" and apply grounding techniques before emotions become overwhelming.',
    category: "emotional",
    steps: [
      { id: "step-1", description: "Learn to recognize early signs of emotional activation" },
      { id: "step-2", description: 'Identify your personal "window of tolerance"' },
      { id: "step-3", description: "Apply grounding techniques when nearing the edges" },
      { id: "step-4", description: "Gradually expand your window through practice" },
    ],
  },
  {
    id: "emotional-labeling",
    name: "Emotional Labeling",
    description:
      'Practice naming your emotions with greater specificity. Instead of "bad," try identifying if you\'re feeling disappointed, frustrated, or anxious.',
    category: "emotional",
    steps: [
      { id: "step-1", description: "Notice when you use vague emotional terms" },
      { id: "step-2", description: "Expand your emotional vocabulary" },
      { id: "step-3", description: "Practice naming specific emotions" },
      { id: "step-4", description: "Note how specific labeling affects your experience" },
    ],
  },
  {
    id: "emotion-tracking",
    name: "Emotion Tracking",
    description: "Keep a daily log of your emotions and the situations that trigger them to identify patterns.",
    category: "emotional",
    steps: [
      { id: "step-1", description: "Create a simple emotion tracking system" },
      { id: "step-2", description: "Record emotions, triggers, and intensity (1-10)" },
      { id: "step-3", description: "Track daily for at least two weeks" },
      { id: "step-4", description: "Review to identify patterns and triggers" },
    ],
  },
  {
    id: "three-column-technique",
    name: "Three-Column Technique",
    description:
      "When you notice a negative thought, write it down in the first column. In the second column, identify the cognitive distortion. In the third column, write a more balanced alternative thought.",
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Write down the negative thought" },
      { id: "step-2", description: "Identify the cognitive distortion" },
      { id: "step-3", description: "Create a balanced alternative thought" },
      { id: "step-4", description: "Notice how the new thought affects your feelings" },
    ],
  },
  {
    id: "mood-boosting-activity",
    name: "Mood Boosting Activity",
    description:
      "Create a list of activities that reliably improve your mood. When feeling low, choose one activity from your list.",
    category: "behavioral",
    steps: [
      { id: "step-1", description: "Create a list of 10+ mood-boosting activities" },
      { id: "step-2", description: "Rate each activity for effectiveness (1-10)" },
      { id: "step-3", description: "Choose activities based on current energy level" },
      { id: "step-4", description: "Track mood before and after the activity" },
    ],
  },
  {
    id: "gratitude-practice",
    name: "Gratitude Practice",
    description:
      "End each day by writing down three specific things you're grateful for, including why they matter to you.",
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Set a daily reminder for your practice" },
      { id: "step-2", description: "Write three specific things you're grateful for" },
      { id: "step-3", description: "Include why each matters to you personally" },
      { id: "step-4", description: "Notice how this practice affects your outlook" },
    ],
  },
  {
    id: "five-minute-rule",
    name: "Five-Minute Rule",
    description:
      "Try the 5-minute rule: commit to working on the task for just 5 minutes, then reassess if you want to continue.",
    category: "behavioral",
    steps: [
      { id: "step-1", description: "Choose a task you're procrastinating on" },
      { id: "step-2", description: "Set a timer for exactly 5 minutes" },
      { id: "step-3", description: "Work on the task until the timer rings" },
      { id: "step-4", description: "Decide if you want to continue or stop" },
    ],
  },
  {
    id: "self-compassion",
    name: "Self-Compassion Practice",
    description:
      "Practice self-compassion by speaking to yourself as you would to a good friend facing the same situation.",
    category: "emotional",
    steps: [
      { id: "step-1", description: "Notice self-critical thoughts" },
      { id: "step-2", description: 'Ask "What would I say to a friend in this situation?"' },
      { id: "step-3", description: "Direct those compassionate words to yourself" },
      { id: "step-4", description: "Place a hand on your heart while doing this" },
    ],
  },
  {
    id: "grounding-exercise",
    name: "Grounding Exercise",
    description:
      "When feeling frozen or overwhelmed, practice the 5-4-3-2-1 technique: identify 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
    category: "mindfulness",
    steps: [
      { id: "step-1", description: "Name 5 things you can see" },
      { id: "step-2", description: "Name 4 things you can touch or feel" },
      { id: "step-3", description: "Name 3 things you can hear" },
      { id: "step-4", description: "Name 2 things you can smell" },
      { id: "step-5", description: "Name 1 thing you can taste" },
    ],
  },
  {
    id: "action-steps",
    name: "Action Steps",
    description:
      "Break overwhelming tasks into very small, concrete steps. Complete just one tiny step to build momentum.",
    category: "behavioral",
    steps: [
      { id: "step-1", description: "Identify an overwhelming task" },
      { id: "step-2", description: "Break it down into 5-10 tiny steps" },
      { id: "step-3", description: "Make each step concrete and specific" },
      { id: "step-4", description: "Complete just one step to build momentum" },
    ],
  },
  {
    id: "peak-experiences",
    name: "Peak Experiences Exercise",
    description:
      "Journal about moments when you felt most alive, engaged, and fulfilled. Look for patterns in these experiences.",
    category: "growth",
    steps: [
      { id: "step-1", description: "List 5-10 peak experiences from your life" },
      { id: "step-2", description: "Describe what made each special" },
      { id: "step-3", description: "Identify common elements across experiences" },
      { id: "step-4", description: "Consider how to create more such moments" },
    ],
  },
  {
    id: "values-clarification",
    name: "Values Clarification",
    description:
      "Create a values clarification list by ranking what matters most to you and reflecting on how your current life aligns with these values.",
    category: "growth",
    steps: [
      { id: "step-1", description: "Brainstorm 10-15 core values" },
      { id: "step-2", description: "Narrow down to your top 5 values" },
      { id: "step-3", description: "Rate how well your life aligns with each (1-10)" },
      { id: "step-4", description: "Identify one action to better honor each value" },
    ],
  },
  {
    id: "dear-man",
    name: "DEAR MAN Technique",
    description:
      'Practice the "DEAR MAN" technique: Describe the situation, Express feelings, Assert needs, Reinforce positive outcomes, stay Mindful, Appear confident, Negotiate if needed.',
    category: "relational",
    steps: [
      { id: "step-1", description: "Describe the situation factually" },
      { id: "step-2", description: 'Express your feelings using "I" statements' },
      { id: "step-3", description: "Assert what you need clearly" },
      { id: "step-4", description: "Reinforce by explaining positive outcomes" },
      { id: "step-5", description: "Stay Mindful and focused on your objective" },
      { id: "step-6", description: "Appear confident through body language" },
      { id: "step-7", description: "Negotiate if needed to find middle ground" },
    ],
  },
  {
    id: "constructive-conflict",
    name: "Constructive Conflict Approach",
    description:
      'Try the "Constructive Conflict" approach: Express your perspective using "I" statements, validate the other person\'s feelings, and focus on finding mutually acceptable solutions.',
    category: "relational",
    steps: [
      { id: "step-1", description: 'Use "I" statements to express your perspective' },
      { id: "step-2", description: "Validate the other person's feelings" },
      { id: "step-3", description: "Focus on the issue, not the person" },
      { id: "step-4", description: "Brainstorm mutually acceptable solutions" },
    ],
  },
  {
    id: "resilience-toolkit",
    name: "Resilience Toolkit",
    description:
      'Create a "resilience toolkit" by listing specific strategies that have helped you cope with challenges in the past. Include people you can reach out to, activities that calm you, and perspectives that help you reframe difficulties.',
    category: "growth",
    steps: [
      { id: "step-1", description: "List 3-5 supportive people you can contact" },
      { id: "step-2", description: "Identify 5+ activities that calm or center you" },
      { id: "step-3", description: "Write down helpful perspectives or mantras" },
      { id: "step-4", description: "Keep this toolkit easily accessible" },
    ],
  },
  {
    id: "mindset-reinforcement",
    name: "Mindset Reinforcement",
    description:
      'When you notice yourself slipping into old thought patterns, pause and ask: "What would my growth mindset say about this situation?" Write down both perspectives to strengthen your awareness.',
    category: "cognitive",
    steps: [
      { id: "step-1", description: "Notice when you slip into fixed mindset thinking" },
      { id: "step-2", description: "Pause and write down the fixed mindset thought" },
      { id: "step-3", description: 'Ask "What would my growth mindset say?"' },
      { id: "step-4", description: "Write the growth mindset perspective" },
    ],
  },
]
