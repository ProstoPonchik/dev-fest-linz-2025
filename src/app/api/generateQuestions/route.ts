import { NextRequest, NextResponse } from 'next/server';

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

interface ParsedQuestion {
  question: string;
  hint: string;
  answer: string;
  interestLink: string;
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, topic, difficulty = 'medium', studentContext } = await request.json();

    console.log('[generateQuestions] Request received:', { studentId, topic, difficulty });

    if (!topic) {
      console.error('[generateQuestions] Missing topic');
      return NextResponse.json(
        { error: 'topic is required' },
        { status: 400 }
      );
    }

    // Use provided context or create default
    const context: StudentContext = studentContext || {
      name: 'Student',
      subject: 'General',
      level: 'Beginner',
      learningStyle: 'examples',
      interests: ['general knowledge'],
      goals: 'improve understanding',
      avgEngagement: 2,
      avgUnderstanding: 2,
      emotionalState: 'neutral',
      recentTopics: []
    };

    console.log('[generateQuestions] Using context:', context.name);

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[generateQuestions] API key present:', !!apiKey);
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log('[generateQuestions] Using mock mode (no API key)');
      // Return mock questions if no API key configured
      return NextResponse.json({
        questions: generateMockQuestions(topic, context),
        source: 'mock'
      });
    }

    // Call Gemini API
    console.log('[generateQuestions] Building prompt...');
    const prompt = buildPrompt(topic, context, difficulty);
    
    console.log('[generateQuestions] Calling Gemini API...');
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
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateQuestions] Gemini API error:', response.status, errorText);
      return NextResponse.json({
        questions: generateMockQuestions(topic, context),
        source: 'mock_fallback',
        error: `API error: ${response.status}`
      });
    }

    console.log('[generateQuestions] Gemini API success, parsing response...');

    const data = await response.json();
    console.log('[generateQuestions] Gemini response data:', JSON.stringify(data, null, 2));
    
    // Check if content was blocked or no candidates returned
    if (!data.candidates || data.candidates.length === 0) {
      console.log('[generateQuestions] No candidates returned, using mock questions');
      const questions = generateMockQuestions(topic, context);
      return NextResponse.json({
        questions,
        source: 'mock',
        reason: 'Content blocked or no response from Gemini',
        context: {
          name: context.name,
          avgEngagement: context.avgEngagement,
          avgUnderstanding: context.avgUnderstanding
        }
      });
    }
    
    // Check if parts exist in the response
    const parts = data.candidates[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0]?.text) {
      console.log('[generateQuestions] No text in response, finish reason:', data.candidates[0]?.finishReason);
      const questions = generateMockQuestions(topic, context);
      return NextResponse.json({
        questions,
        source: 'mock',
        reason: `Gemini returned empty response (${data.candidates[0]?.finishReason || 'unknown reason'})`,
        context: {
          name: context.name,
          avgEngagement: context.avgEngagement,
          avgUnderstanding: context.avgUnderstanding
        }
      });
    }
    
    const generatedText = parts[0].text;
    console.log('[generateQuestions] Generated text length:', generatedText.length);
    
    // Parse the response
    const questions = parseQuestionsFromResponse(generatedText);
    console.log('[generateQuestions] Parsed', questions.length, 'questions');

    return NextResponse.json({
      questions,
      source: 'gemini',
      context: {
        avgEngagement: context.avgEngagement,
        avgUnderstanding: context.avgUnderstanding,
        emotionalState: context.emotionalState
      }
    });

  } catch (error) {
    console.error('[generateQuestions] ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions', details: String(error) },
      { status: 500 }
    );
  }
}

function buildPrompt(topic: string, context: StudentContext, difficulty: string): string {
  return `You are an expert tutor creating personalized questions for a student.

**Student Profile:**
- Name: ${context.name}
- Subject: ${context.subject} (${context.level} level)
- Learning Style: ${context.learningStyle}
- Interests: ${context.interests.join(', ')}
- Goals: ${context.goals}
- Recent emotional state: ${context.emotionalState}
- Average engagement: ${context.avgEngagement.toFixed(1)}/3
- Average understanding: ${context.avgUnderstanding.toFixed(1)}/4

**Recent Topics Covered:**
${context.recentTopics.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

**Task:**
Generate 5 ${difficulty} difficulty questions about "${topic}" that:
1. Match the student's ${context.level} level
2. Incorporate their interests (${context.interests.join(', ')})
3. Use ${context.learningStyle} teaching approach
4. ${context.avgEngagement < 2 ? 'Are more engaging and interactive' : 'Build on their high engagement'}
5. ${context.avgUnderstanding < 2 ? 'Include more scaffolding and hints' : 'Challenge them appropriately'}

**Format each question as:**
QUESTION: [the question text]
HINT: [a helpful hint that doesn't give away the answer]
ANSWER: [the correct answer with brief explanation]
INTEREST_LINK: [how this connects to their interests: ${context.interests[0] || 'general knowledge'}]
---

Generate exactly 5 questions following this format.`;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*\((.*?)\)\*\*/g, '$1')  // Remove **()** formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')      // Remove ** bold
    .replace(/\*(.*?)\*/g, '$1')          // Remove * italic
    .replace(/`(.*?)`/g, '$1')            // Remove ` code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')   // Remove [text](link) -> text
    .trim();
}

function parseQuestionsFromResponse(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const blocks = text.split('---').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const question: Partial<ParsedQuestion> = {};

    for (const line of lines) {
      if (line.startsWith('QUESTION:')) {
        question.question = cleanMarkdown(line.replace('QUESTION:', '').trim());
      } else if (line.startsWith('HINT:')) {
        question.hint = cleanMarkdown(line.replace('HINT:', '').trim());
      } else if (line.startsWith('ANSWER:')) {
        question.answer = cleanMarkdown(line.replace('ANSWER:', '').trim());
      } else if (line.startsWith('INTEREST_LINK:')) {
        question.interestLink = cleanMarkdown(line.replace('INTEREST_LINK:', '').trim());
      }
    }

    if (question.question && question.answer && question.hint && question.interestLink) {
      questions.push(question as ParsedQuestion);
    }
  }

  return questions.length > 0 ? questions : generateFallbackQuestions();
}

function generateMockQuestions(topic: string, context: StudentContext): ParsedQuestion[] {
  const interest = context.interests[0] || 'real-world applications';
  
  return [
    {
      question: `How would you explain ${topic} to someone interested in ${interest}?`,
      hint: `Think about practical examples from ${interest} that demonstrate this concept.`,
      answer: `[Answer would connect ${topic} to ${interest} with specific examples]`,
      interestLink: `This relates directly to ${interest} because...`
    },
    {
      question: `Can you identify a real-world problem in ${interest} that ${topic} could help solve?`,
      hint: `Consider recent developments or challenges in ${interest}.`,
      answer: `[Answer showing practical application of ${topic} in ${interest}]`,
      interestLink: `${interest} professionals use ${topic} to...`
    },
    {
      question: `What's the most important concept in ${topic} for understanding ${context.goals}?`,
      hint: `Focus on fundamental principles that build toward your goal.`,
      answer: `[Answer connecting ${topic} to student's goals]`,
      interestLink: `This foundational knowledge helps with ${context.goals} by...`
    },
    {
      question: `If you were teaching ${topic} to someone with your background in ${interest}, where would you start?`,
      hint: `Think about what you already know from ${interest} that could help.`,
      answer: `[Answer leveraging existing knowledge from ${interest}]`,
      interestLink: `Your experience with ${interest} gives you insight into...`
    },
    {
      question: `How might ${topic} evolve in the next 5 years, especially in relation to ${interest}?`,
      hint: `Consider current trends and future possibilities.`,
      answer: `[Answer exploring future developments and applications]`,
      interestLink: `The intersection of ${topic} and ${interest} is evolving toward...`
    }
  ];
}

function generateFallbackQuestions(): ParsedQuestion[] {
  return [
    {
      question: 'What are the key concepts we should explore in this topic?',
      hint: 'Think about foundational ideas first.',
      answer: '[Core concepts with explanations]',
      interestLink: 'These concepts connect to practical applications...'
    },
    {
      question: 'How does this relate to what we learned previously?',
      hint: 'Look for patterns and connections.',
      answer: '[Connections to prior knowledge]',
      interestLink: 'Building on previous lessons helps you see the bigger picture...'
    },
    {
      question: 'What real-world problems does this help solve?',
      hint: 'Consider everyday applications.',
      answer: '[Practical applications]',
      interestLink: 'This is used in various fields including...'
    }
  ];
}
