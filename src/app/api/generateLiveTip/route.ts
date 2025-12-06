import { NextRequest, NextResponse } from 'next/server';

type TipType = 'EASY' | 'PRACTICE' | 'CHECK';

interface StudentContext {
  name: string;
  subject: string;
  level: string;
  learningStyle: string;
  interests: string[];
  goals: string;
  avgEngagement: number;
  avgUnderstanding: number;
  emotionalState: string;
  recentTopics: string[];
}

function buildTipPrompt(currentTopic: string, tipType: TipType, context: StudentContext): string {
  const baseContext = `
Student Profile:
- Name: ${context.name}
- Subject: ${context.subject} (${context.level})
- Learning Style: ${context.learningStyle}
- Interests: ${context.interests.join(', ')}
- Goals: ${context.goals}
- Current Engagement: ${context.avgEngagement}/3
- Understanding Level: ${context.avgUnderstanding}/4
- Recent Emotional State: ${context.emotionalState}

Current Topic: ${currentTopic}
`;

  switch (tipType) {
    case 'EASY':
      return `${baseContext}

Generate an easy-to-understand explanation for "${currentTopic}" tailored to this student.

Requirements:
1. Use simple language appropriate for ${context.level} level
2. Connect to their interests: ${context.interests.slice(0, 2).join(', ')}
3. Use analogies from their hobbies/interests
4. Break down into 3-4 simple steps
5. Include a memorable key point
6. Keep it conversational and encouraging

Format your response as a clear, structured explanation without markdown symbols.`;

    case 'PRACTICE':
      return `${baseContext}

Create a practice question about "${currentTopic}" that connects to this student's interests.

Requirements:
1. Make it relevant to their interests: ${context.interests.slice(0, 2).join(', ')}
2. Appropriate difficulty for ${context.level} level
3. Include 2-3 helpful hints
4. Add follow-up questions to deepen understanding
5. Make it fun and engaging
6. Learning style: ${context.learningStyle}

Format as: Question, then Hints, then Follow-up questions. No markdown symbols.`;

    case 'CHECK':
      return `${baseContext}

Create a comprehension check for "${currentTopic}" to assess the student's understanding.

Requirements:
1. 3 progressive questions (basic → application → deeper thinking)
2. Include what to listen for in their answers
3. Provide guidance for common misunderstandings
4. Suggest strategies if they're struggling
5. Appropriate for ${context.level} level and ${context.learningStyle} learning style

Format as structured questions with guidance for the tutor. No markdown symbols.`;
  }
}

const generateMockTip = (currentTopic: string, tipType: TipType): string => {
  switch (tipType) {
    case 'EASY':
      return `**Easy Explanation for "${currentTopic}"**

Think of it like this: Imagine you're building with LEGO blocks...

**Simple Analogy:**
Just like how each LEGO piece connects to make something bigger, ${currentTopic.toLowerCase()} works by connecting smaller ideas together.

**Step-by-step breakdown:**
1. First, let's understand the basic building block
2. Then, we see how these blocks connect
3. Finally, we put it all together

**Key Point to Remember:**
The most important thing about ${currentTopic.toLowerCase()} is that it follows a simple pattern once you see it.

**Try saying this:**
"Think about something you already know well - this works in a similar way!"`;

    case 'PRACTICE':
      return `**Practice Question for "${currentTopic}"**

Here's a fun problem that connects to your interests:

**Question:**
Imagine you're [using their hobby/interest] and you need to apply ${currentTopic.toLowerCase()}.

For example: "If you were organizing your video game collection, how would you use this concept to sort them efficiently?"

**Hints if needed:**
- Start by identifying what you already know
- Break it down into smaller steps
- Check your answer by working backwards

**Follow-up questions:**
1. Can you think of another example from your daily life?
2. What would happen if you changed one part of the problem?
3. How would you explain this to a friend?`;

    case 'CHECK':
      return `**Comprehension Check for "${currentTopic}"**

Let's make sure we're on the same page!

**Quick Check Questions:**

1. **In your own words:** Can you explain what ${currentTopic.toLowerCase()} means?
   - Listen for: Key terms, basic understanding, connections to previous topics

2. **Show me:** Can you give me an example of ${currentTopic.toLowerCase()}?
   - Look for: Practical application, creativity, accuracy

3. **What if:** What would happen if [change one variable]?
   - Assess: Deeper understanding, ability to predict outcomes

**Signs of good understanding:**
- Uses correct terminology naturally
- Can create their own examples
- Asks thoughtful follow-up questions

**If struggling, try:**
- Go back to the visual/analogy
- Break into smaller pieces
- Use a different example`;

    default:
      return `Tips for ${currentTopic}`;
  }
};

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*\((.*?)\)\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, currentTopic, tipType, studentContext } = await request.json();

    if (!currentTopic || !tipType) {
      return NextResponse.json(
        { error: 'currentTopic and tipType are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const useMock = !apiKey;

    console.log('[generateLiveTip] Request:', { currentTopic, tipType, useMock });

    if (useMock) {
      const content = generateMockTip(currentTopic, tipType as TipType);
      return NextResponse.json({ content, source: 'mock' });
    }

    // Use provided context or defaults
    const context: StudentContext = studentContext || {
      name: 'Student',
      subject: 'General',
      level: 'Intermediate',
      learningStyle: 'practice',
      interests: ['learning', 'problem-solving'],
      goals: 'Master the subject',
      avgEngagement: 2,
      avgUnderstanding: 2.5,
      emotionalState: 'neutral',
      recentTopics: []
    };

    // Build prompt and call Gemini
    const prompt = buildTipPrompt(currentTopic, tipType as TipType, context);
    
    console.log('[generateLiveTip] Calling Gemini API...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateLiveTip] Gemini API error:', response.status, errorText);
      const fallback = generateMockTip(currentTopic, tipType as TipType);
      return NextResponse.json({ content: fallback, source: 'mock', reason: 'API error' });
    }

    const data = await response.json();
    console.log('[generateLiveTip] Response received');

    // Check for valid response
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0]?.text) {
      console.log('[generateLiveTip] No text in response, using mock');
      const fallback = generateMockTip(currentTopic, tipType as TipType);
      return NextResponse.json({ content: fallback, source: 'mock', reason: 'Empty response' });
    }

    const rawContent = parts[0].text;
    const content = cleanMarkdown(rawContent);

    return NextResponse.json({ content, source: 'gemini' });
  } catch (error) {
    console.error('[generateLiveTip] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate live tip' },
      { status: 500 }
    );
  }
}
