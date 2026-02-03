import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ollama } from '@langchain/ollama';
import Groq from 'groq-sdk';
import { validateQuiz, validateFlashcardDeck, validateSyllabus } from './schemas.js';
import cache from './cache.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization - read env at runtime
let ollamaLLM;
let geminiModel;
let groqClient;
let initialized = false;

// Settings store (in-memory for now)
let settings = {
  localOnlyMode: false,
  aiProvider: null // null means use env default
};

export function getSettings() {
  return { ...settings };
}

export function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  initialized = false; // Force re-initialization
  return settings;
}

function getAIProvider() {
  if (settings.localOnlyMode) return 'ollama';
  return settings.aiProvider || process.env.AI_PROVIDER || 'groq';
}

function initializeProviders() {
  if (initialized) return;

  const AI_PROVIDER = getAIProvider();
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (AI_PROVIDER === 'ollama') {
    ollamaLLM = new Ollama({
      model: 'qwen3:8b',
      baseUrl: OLLAMA_BASE_URL,
      temperature: 0.7,
    });
    console.log('🤖 Using Ollama (qwen3:8b) for generation');
  } else if (AI_PROVIDER === 'gemini') {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });
    console.log('🤖 Using Gemini 2.0 Flash for generation');
  } else if (AI_PROVIDER === 'groq') {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
    console.log('🤖 Using Groq (llama-3.3-70b-versatile) for generation');
  }

  initialized = true;
}

/**
 * Generate text using the configured AI provider
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} - The AI response
 */
async function generateText(prompt) {
  const hash = crypto.createHash('md5').update(prompt).digest('hex');
  const cacheKey = `ai_gen_${hash}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('⚡ Using cached AI response');
    return cached;
  }

  initializeProviders();
  const AI_PROVIDER = getAIProvider();

  let response;
  if (AI_PROVIDER === 'gemini') {
    const result = await geminiModel.generateContent(prompt);
    response = result.response.text();
  } else if (AI_PROVIDER === 'groq') {
    const completion = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_completion_tokens: 8192,
    });
    response = completion.choices[0]?.message?.content || '';
  } else {
    response = await ollamaLLM.invoke(prompt);
  }

  cache.set(cacheKey, response, 7200); // 2 hours
  return response;
}

/**
 * Generate text with streaming support
 * @param {string} prompt - The prompt to send to the AI
 * @param {function} onChunk - Callback for each text chunk (chunk: string) => void
 * @returns {Promise<string>} - Complete AI response
 */
async function generateTextStream(prompt, onChunk) {
  initializeProviders();
  const AI_PROVIDER = getAIProvider();

  if (AI_PROVIDER === 'gemini') {
    const result = await geminiModel.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onChunk) onChunk(chunkText);
    }

    return fullText;
  } else {
    // Ollama streaming
    const stream = await ollamaLLM.stream(prompt);
    let fullText = '';

    for await (const chunk of stream) {
      fullText += chunk;
      if (onChunk) onChunk(chunk);
    }

    return fullText;
  }
}

/**
 * Extract JSON from AI response
 */
function extractJSON(response) {
  let jsonStr = response.trim();

  // Remove markdown code blocks
  if (jsonStr.includes('```json')) {
    const start = jsonStr.indexOf('```json') + 7;
    const end = jsonStr.lastIndexOf('```');
    jsonStr = jsonStr.slice(start, end).trim();
  } else if (jsonStr.includes('```')) {
    const start = jsonStr.indexOf('```') + 3;
    const end = jsonStr.lastIndexOf('```');
    jsonStr = jsonStr.slice(start, end).trim();
  }

  // Try to find JSON object in the response
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  // Try to repair truncated JSON by closing unclosed brackets
  try {
    JSON.parse(jsonStr);
  } catch (e) {
    // Count brackets to attempt repair
    let openBraces = 0, openBrackets = 0;
    let inString = false, escapeNext = false;
    
    for (const char of jsonStr) {
      if (escapeNext) { escapeNext = false; continue; }
      if (char === '\\') { escapeNext = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
    
    // Add missing closing brackets/braces
    while (openBrackets > 0) { jsonStr += ']'; openBrackets--; }
    while (openBraces > 0) { jsonStr += '}'; openBraces--; }
  }

  return jsonStr;
}

/**
 * Generate a syllabus from document content
 */
/**
 * Generate syllabus with streaming support
 */
export async function generateSyllabusStream(content, onChunk) {
  try {
    console.log('📚 Generating syllabus with streaming...');

    const prompt = `Analyze the following educational content and create a structured syllabus.

Content:
${content}

Generate a JSON syllabus with this structure:
{
  "title": "Course title",
  "chapters": [
    {
      "title": "Chapter name",
      "topics": ["topic1", "topic2"]
    }
  ]
}

Return ONLY valid JSON, no explanations.`;

    const response = await generateTextStream(prompt, onChunk);
    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);
    const validated = validateSyllabus(data);

    return validated;
  } catch (error) {
    console.error('Error generating syllabus:', error.message);
    throw new Error(`Failed to generate syllabus: ${error.message}`);
  }
}

export async function generateSyllabus(content) {
  try {
    console.log('📚 Generating syllabus...');

    const prompt = `Analyze the following educational content and create a structured syllabus.

Content:
${content}

Generate ONLY a valid JSON object with this exact structure (no extra text):
{
  "title": "Course Title",
  "chapters": [
    {
      "title": "Chapter 1 Name",
      "topics": [
        {
          "title": "Topic Name"
        }
      ]
    }
  ]
}

CRITICAL RULES:
- Return ONLY the JSON object, no explanation or extra text
- Use double quotes for all strings
- Keep titles concise (under 50 characters)
- Extract 3-5 main chapters from the content
- Each chapter should have 2-4 topics`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parsing failed. Raw response:', jsonStr.substring(0, 200));
      throw new Error(`Invalid JSON from AI: ${parseError.message}`);
    }

    const validated = validateSyllabus(parsed);
    console.log('✅ Syllabus generated successfully');
    return validated;
  } catch (error) {
    console.error('Error generating syllabus:', error.message);
    throw new Error(`Failed to generate syllabus: ${error.message}`);
  }
}

/**
 * Generate quiz questions from document content
 */
export async function generateQuiz(content, topic = null, difficulty = 'medium', questionCount = 5) {
  try {
    console.log(`📝 Generating ${difficulty} quiz with ${questionCount} questions...`);

    const topicText = topic ? `Focus on the topic: "${topic}".` : '';

    const prompt = `Create a ${difficulty} difficulty quiz from the following content. ${topicText}

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Generate exactly ${questionCount} questions
- Each question must have exactly 4 options
- correctIndex is 0-3 (index of the correct option)
- Questions should test understanding, not just memorization
- Explanations should be clear and educational
- Difficulty: ${difficulty}`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);

    const parsed = JSON.parse(jsonStr);
    const validated = validateQuiz(parsed);

    console.log(`✅ Generated ${validated.questions.length} quiz questions`);
    return validated;
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

/**
 * Generate flashcards from document content
 */
export async function generateFlashcards(content, cardCount = 10) {
  try {
    console.log(`🎴 Generating ${cardCount} flashcards...`);

    const prompt = `Extract key terms and concepts from the following content and create flashcards for studying.

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Flashcard Deck Title",
  "cards": [
    {
      "term": "Key Term or Concept",
      "definition": "Clear, concise definition",
      "example": "Optional example or use case"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Generate approximately ${cardCount} flashcards
- Focus on the most important concepts
- Definitions should be clear and concise
- Include examples where they add value
- Cover different aspects of the content`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);

    const parsed = JSON.parse(jsonStr);
    const validated = validateFlashcardDeck(parsed);

    console.log(`✅ Generated ${validated.cards.length} flashcards`);
    return validated;
  } catch (error) {
    console.error('Error generating flashcards:', error.message);
    throw new Error(`Failed to generate flashcards: ${error.message}`);
  }
}

/**
 * Generate comprehensive syllabus from PDF content with topic metadata
 * Enhanced for detailed course syllabus analysis
 */
export async function generateSyllabusFromPDF(content) {
  try {
    console.log('📚 Generating syllabus from PDF...');

    const prompt = `Analyze this educational content and create a structured syllabus.

Content:
${content.substring(0, 15000)}

Generate a JSON object with this structure:
{
  "title": "Course Title",
  "description": "Brief course overview (2-3 sentences)",
  "objectives": ["Learning objective 1", "Learning objective 2"],
  "totalStudyTime": "Estimated total hours",
  "topics": [
    {
      "id": "topic-1",
      "weekNumber": 1,
      "title": "Topic Title",
      "description": "What this topic covers (2-3 sentences)",
      "content": "Detailed content summary with key concepts (1-2 paragraphs)",
      "difficulty": "beginner|intermediate|advanced",
      "studyTime": "Time estimate (e.g., 2 hours)",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "examWeight": 10
    }
  ]
}

RULES:
- Return ONLY valid JSON, no markdown, no extra text
- Include 5-10 topics covering the main content
- Each topic should have meaningful descriptions
- examWeight percentages should sum to approximately 100
- Keep responses concise but informative`;

    const response = await generateText(prompt);
    console.log('📝 AI response length:', response.length);
    
    const jsonStr = extractJSON(response);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parsing failed. Raw response:', response.substring(0, 500));
      throw new Error(`Invalid JSON from AI: ${parseError.message}`);
    }
    
    // Ensure topics have IDs and week numbers
    if (parsed.topics) {
      parsed.topics = parsed.topics.map((topic, index) => ({
        ...topic,
        id: topic.id || `topic-${index + 1}`,
        weekNumber: topic.weekNumber || index + 1
      }));
    }

    console.log(`✅ Generated syllabus with ${parsed.topics?.length || 0} topics`);
    return parsed;
  } catch (error) {
    console.error('Error generating PDF syllabus:', error.message);
    throw new Error(`Failed to generate syllabus: ${error.message}`);
  }
}

/**
 * Generate exam mode compressed revision for a topic
 */
export async function generateExamRevision(content, topic = null) {
  try {
    console.log('🎯 Generating exam revision summary...');

    const topicText = topic ? `Focus specifically on: "${topic}"` : '';

    const prompt = `Create a compressed exam revision summary for quick last-minute review.

Content:
${content.substring(0, 10000)}

${topicText}

Generate a JSON object with this structure:
{
  "title": "Revision: Topic Name",
  "quickSummary": "2-3 sentence overview of the most important points",
  "mustRemember": [
    "Critical point 1 that WILL be on the exam",
    "Critical point 2",
    "Critical point 3"
  ],
  "formulas": [
    {"name": "Formula name", "formula": "The actual formula", "when": "When to use it"}
  ],
  "definitions": [
    {"term": "Key term", "definition": "Concise definition"}
  ],
  "commonMistakes": [
    "Mistake students often make"
  ],
  "mnemonics": [
    {"topic": "What it helps remember", "mnemonic": "The memory aid"}
  ],
  "quickQuiz": [
    {"q": "Quick question?", "a": "Short answer"}
  ]
}

RULES:
- Be extremely concise - this is for last-minute revision
- Focus on exam-likely content
- Include 3-5 items per section
- Return ONLY valid JSON`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    console.log('✅ Generated exam revision summary');
    return parsed;
  } catch (error) {
    console.error('Error generating exam revision:', error.message);
    throw new Error(`Failed to generate exam revision: ${error.message}`);
  }
}

/**
 * Generate rapid revision quiz (harder, faster)
 */
export async function generateRapidQuiz(content, topic = null) {
  try {
    console.log('⚡ Generating rapid revision quiz...');

    const topicText = topic ? `Focus on: "${topic}"` : '';

    const prompt = `Create a rapid-fire exam revision quiz with challenging questions.

Content:
${content.substring(0, 8000)}

${topicText}

Generate a JSON object:
{
  "title": "Rapid Quiz: Topic",
  "timeLimit": 5,
  "questions": [
    {
      "question": "Quick but challenging question?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Brief explanation",
      "difficulty": "hard"
    }
  ]
}

RULES:
- 10 questions, mix of difficulties (mostly medium-hard)
- Questions should test deep understanding, not just recall
- Include some tricky questions with similar-looking options
- Return ONLY valid JSON`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return parsed;
  } catch (error) {
    console.error('Error generating rapid quiz:', error.message);
    throw new Error(`Failed to generate rapid quiz: ${error.message}`);
  }
}

/**
 * Generate YouTube search queries for a topic
 */
export async function generateYouTubeQueries(topic, subjectContext = '') {
  try {
    console.log(`🎬 Generating YouTube queries for: ${topic}`);

    const prompt = `Generate YouTube search queries to find educational videos about this topic.

Topic: ${topic}
Subject Context: ${subjectContext}

Generate a JSON object:
{
  "queries": [
    {
      "query": "search query for youtube",
      "type": "explanation|tutorial|example|crash-course",
      "description": "What this video would cover"
    }
  ]
}

Generate 4-5 diverse queries:
- One for basic explanation
- One for worked examples
- One for crash course/summary
- One for advanced concepts
Return ONLY valid JSON`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return parsed.queries || [];
  } catch (error) {
    console.error('Error generating YouTube queries:', error.message);
    return [{ query: `${topic} explained`, type: 'explanation', description: 'General explanation' }];
  }
}

/**
 * Analyze quiz scores to identify weak topics
 */
export function analyzeWeakTopics(quizHistory, topics) {
  const topicScores = {};

  // Aggregate scores by topic
  for (const quiz of quizHistory) {
    const topic = quiz.topic || 'general';
    if (!topicScores[topic]) {
      topicScores[topic] = { correct: 0, total: 0, attempts: 0 };
    }
    topicScores[topic].correct += quiz.score || 0;
    topicScores[topic].total += quiz.total || 0;
    topicScores[topic].attempts += 1;
  }

  // Calculate percentages and identify weak areas
  const analysis = [];
  for (const [topic, data] of Object.entries(topicScores)) {
    const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const topicInfo = topics?.find(t => t.title === topic || t.id === topic);

    analysis.push({
      topic,
      topicId: topicInfo?.id,
      percentage,
      attempts: data.attempts,
      correct: data.correct,
      total: data.total,
      status: percentage >= 80 ? 'strong' : percentage >= 60 ? 'moderate' : 'weak',
      recommendation: percentage < 60
        ? 'Needs more practice - review fundamentals'
        : percentage < 80
          ? 'Good progress - focus on edge cases'
          : 'Well understood - maintain with occasional review',
      priority: percentage < 60 ? 'high' : percentage < 80 ? 'medium' : 'low'
    });
  }

  // Sort by percentage (weakest first)
  analysis.sort((a, b) => a.percentage - b.percentage);

  return {
    weakTopics: analysis.filter(a => a.status === 'weak'),
    moderateTopics: analysis.filter(a => a.status === 'moderate'),
    strongTopics: analysis.filter(a => a.status === 'strong'),
    allTopics: analysis,
    overallScore: analysis.length > 0
      ? Math.round(analysis.reduce((sum, a) => sum + a.percentage, 0) / analysis.length)
      : 0,
    recommendations: analysis.filter(a => a.status === 'weak').map(a => ({
      topic: a.topic,
      action: `Review "${a.topic}" - currently at ${a.percentage}%`
    }))
  };
}

/**
 * Generate study plan based on exam date and available time
 */
export async function generateStudyPlan(topics, examDate, dailyHours, weakTopics = []) {
  try {
    console.log('📅 Generating personalized study plan...');

    const daysUntilExam = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    const totalHours = daysUntilExam * dailyHours;

    const prompt = `Create a study plan for an upcoming exam.

Topics to cover:
${JSON.stringify(topics.map(t => ({
      title: t.title,
      difficulty: t.difficulty,
      importance: t.importance,
      studyTime: t.studyTime,
      examWeight: t.examWeight
    })), null, 2)}

Weak topics that need extra attention:
${weakTopics.map(w => w.topic).join(', ') || 'None identified yet'}

Exam Date: ${examDate}
Days until exam: ${daysUntilExam}
Daily study hours available: ${dailyHours}
Total hours available: ${totalHours}

Generate a JSON study plan:
{
  "overview": {
    "totalDays": ${daysUntilExam},
    "totalHours": ${totalHours},
    "strategy": "Brief strategy description"
  },
  "phases": [
    {
      "name": "Phase name",
      "days": "Day 1-3",
      "focus": "What to focus on",
      "topics": ["topic1", "topic2"],
      "goals": ["goal1", "goal2"]
    }
  ],
  "dailySchedule": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "topics": [
        {"topic": "Topic name", "duration": "1 hour", "activity": "Read + Notes"}
      ],
      "totalHours": ${dailyHours}
    }
  ],
  "tips": ["Study tip 1", "Study tip 2"]
}

RULES:
- Prioritize weak topics and high-importance topics
- Leave last 1-2 days for revision only
- Include breaks and varied activities
- Return ONLY valid JSON`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    console.log('✅ Generated study plan');
    return parsed;
  } catch (error) {
    console.error('Error generating study plan:', error.message);
    throw new Error(`Failed to generate study plan: ${error.message}`);
  }
}
