import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Question } from '../models/Activity.js';
import { Subject, Chapter, Topic } from '../models/Curriculum.js';
import { AIConversation } from '../models/Misc.js';

export class AIService {
  /**
   * Dynamically generates and saves CBSE/NCERT curriculum (Subjects, Chapters, Topics)
   * for a given class level using Gemini API (with deterministic NCERT fallback).
   */
  static async generateCurriculumForClass(classLevel: number): Promise<boolean> {
    const hasApiKey = !!env.AI_API_KEY;
    let curriculumData: any = null;

    if (hasApiKey) {
      try {
        const prompt = `You are a CBSE/NCERT Curriculum Director for Indian schools.
Generate a structured curriculum for Class ${classLevel} covering Mathematics, Science, Environmental Studies, and English.
Return pure JSON without markdown backticks matching this structure:
{
  "subjects": [
    {
      "name": "Mathematics",
      "code": "math",
      "icon": "Calculator",
      "chapters": [
        {
          "name": "Chapter Title",
          "sequence": 1,
          "description": "Chapter summary",
          "topics": [
            { "name": "Topic Title", "sequence": 1, "description": "Topic details" }
          ]
        }
      ]
    }
  ]
}`;

        let rawResponse = '';
        if (env.AI_PROVIDER === 'openai') {
          const res = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: env.AI_MODEL || 'gpt-4-turbo',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1500,
            },
            {
              headers: { Authorization: `Bearer ${env.AI_API_KEY}`, 'Content-Type': 'application/json' },
              timeout: 10000,
            }
          );
          rawResponse = res.data.choices[0].message.content;
        } else {
          // Default Gemini
          const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${env.AI_API_KEY}`,
            {
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
            },
            { timeout: 10000 }
          );
          rawResponse = res.data.candidates[0].content.parts[0].text;
        }

        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          curriculumData = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        logger.error(`⚠️ Gemini API Curriculum Generation error: ${(err as Error).message}. Using NCERT fallback dataset.`);
      }
    }

    if (!curriculumData || !curriculumData.subjects) {
      curriculumData = this.getLocalCurriculumData(classLevel);
    }

    try {
      for (const sub of curriculumData.subjects) {
        let subjectDoc = await Subject.findOne({ code: sub.code.toLowerCase() });
        if (!subjectDoc) {
          subjectDoc = new Subject({
            name: sub.name,
            code: sub.code.toLowerCase(),
            icon: sub.icon || 'Book',
            isActive: true,
          });
          await subjectDoc.save();
        }

        if (sub.chapters && Array.isArray(sub.chapters)) {
          for (const ch of sub.chapters) {
            let chapterDoc = await Chapter.findOne({ subjectId: subjectDoc._id, sequence: ch.sequence });
            if (!chapterDoc) {
              chapterDoc = new Chapter({
                subjectId: subjectDoc._id,
                name: ch.name,
                sequence: ch.sequence,
                description: ch.description || '',
              });
              await chapterDoc.save();
            }

            if (ch.topics && Array.isArray(ch.topics)) {
              for (const top of ch.topics) {
                const existingTopic = await Topic.findOne({ chapterId: chapterDoc._id, sequence: top.sequence });
                if (!existingTopic) {
                  const topicDoc = new Topic({
                    chapterId: chapterDoc._id,
                    name: top.name,
                    sequence: top.sequence,
                    description: top.description || '',
                  });
                  await topicDoc.save();
                }
              }
            }
          }
        }
      }
      return true;
    } catch (dbErr) {
      logger.error(`❌ DB error saving AI curriculum for Class ${classLevel}: ${(dbErr as Error).message}`);
      return false;
    }
  }

  private static getLocalCurriculumData(classLevel: number) {
    return {
      subjects: [
        {
          name: 'Mathematics',
          code: 'math',
          icon: 'Calculator',
          chapters: [
            {
              name: `Class ${classLevel} Numbers & Arithmetic`,
              sequence: 1,
              description: `Master fundamental operations and problem solving for Class ${classLevel}`,
              topics: [
                { name: 'Number Sense & Place Value', sequence: 1, description: 'Understanding digits and expanded forms' },
                { name: 'Addition & Subtraction Quests', sequence: 2, description: 'Speed math and carrying techniques' },
                { name: 'Multiplication & Division', sequence: 3, description: 'Tables, factors, and step-by-step algorithms' },
              ],
            },
            {
              name: `Class ${classLevel} Geometry & Measurement`,
              sequence: 2,
              description: 'Shapes, perimeter, area, and volume concepts',
              topics: [
                { name: 'Shapes & Angles', sequence: 1, description: '2D/3D shapes, lines, and right angles' },
                { name: 'Perimeter & Area', sequence: 2, description: 'Calculating boundaries and grid units' },
              ],
            },
          ],
        },
        {
          name: 'Science & EVS',
          code: 'science',
          icon: 'Microscope',
          chapters: [
            {
              name: `Class ${classLevel} Living World & Plants`,
              sequence: 1,
              description: 'Explore ecosystems, habitats, and photosynthesis',
              topics: [
                { name: 'Plant Life & Photosynthesis', sequence: 1, description: 'How leaves produce food using sunlight' },
                { name: 'Animal Adaptations', sequence: 2, description: 'Survival mechanisms in diverse environments' },
              ],
            },
            {
              name: `Class ${classLevel} Matter & Energy`,
              sequence: 2,
              description: 'States of matter, water cycle, and simple machines',
              topics: [
                { name: 'Solids, Liquids & Gases', sequence: 1, description: 'Molecules, melting, and evaporation' },
                { name: 'The Water Cycle', sequence: 2, description: 'Evaporation, condensation, and precipitation' },
              ],
            },
          ],
        },
        {
          name: 'English & Grammar',
          code: 'english',
          icon: 'BookOpen',
          chapters: [
            {
              name: `Class ${classLevel} Grammar & Vocabulary`,
              sequence: 1,
              description: 'Parts of speech, sentence building, and vocabulary',
              topics: [
                { name: 'Nouns, Verbs & Adjectives', sequence: 1, description: 'Identifying action and naming words' },
                { name: 'Tenses & Sentence Structure', sequence: 2, description: 'Past, present, and future tenses' },
              ],
            },
          ],
        },
      ],
    };
  }

  /**
   * Explains why a student got a question wrong, using child-friendly language.
   */
  static async explainWrongAnswer(
    studentId: string,
    questionId: string,
    selectedAnswer: any,
    classLevel: number,
    language: 'en' | 'hi'
  ): Promise<string> {
    const question = await Question.findById(questionId);
    if (!question) {
      return language === 'hi'
        ? 'Mujhe is prashn ke baare mein jaankari nahi mili.'
        : 'I could not find information regarding this question.';
    }

    const hasApiKey = !!env.AI_API_KEY;
    const systemPrompt = `You are a friendly, encouraging AI Tutor named Guruji for LearnQuest India.
Your student is in Class ${classLevel}. Explain the concept in a child-friendly, positive way.
Focus on explaining why the correct answer is correct and how to think about the problem step-by-step.
Do NOT give the direct answer immediately if possible; guide their intuition.
Keep it simple.
Preferred Language for explanation: ${language === 'hi' ? 'Hindi / Hinglish (use English terms in Hindi structure)' : 'English'}.
Question: "${question.questionText}"
Student selected option: "${selectedAnswer}"
Correct answer explanation: "${question.explanation || 'Refer to topic concept'}"`;

    if (hasApiKey) {
      try {
        let responseText = '';
        if (env.AI_PROVIDER === 'openai') {
          const res = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: env.AI_MODEL || 'gpt-4-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Explain this to me please!' },
              ],
              max_tokens: 300,
            },
            {
              headers: {
                Authorization: `Bearer ${env.AI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            }
          );
          responseText = res.data.choices[0].message.content.trim();
        } else if (env.AI_PROVIDER === 'gemini') {
          // Gemini API call format
          const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${env.AI_API_KEY}`,
            {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nExplain this to me please!` }],
                },
              ],
            },
            { timeout: 5000 }
          );
          responseText = res.data.candidates[0].content.parts[0].text.trim();
        }
        
        // Save conversation thread in database
        const conversation = new AIConversation({
          studentId,
          questionId,
          contextType: 'wrong_answer_help',
          messages: [
            { role: 'system', content: systemPrompt, timestamp: new Date() },
            { role: 'assistant', content: responseText, timestamp: new Date() },
          ],
        });
        await conversation.save();
        
        return responseText;
      } catch (error) {
        logger.error(`⚠️ AI Tutor API call failed: ${(error as Error).message}. Using local fallback explanation.`);
      }
    }

    // Local rule-based explanation fallback (if API fails or keys are missing)
    return this.getLocalExplanation(question, selectedAnswer, language, classLevel);
  }

  private static getLocalExplanation(question: any, selectedAnswer: any, language: 'en' | 'hi', classLevel: number): string {
    const isHindi = language === 'hi';
    const explanationText = question.explanation || 'Always verify the key principles of the topic!';
    const hintsList = question.hints && question.hints.length > 0 
      ? question.hints.map((h: string) => `- ${h}`).join('\n')
      : isHindi ? '- Sahi option dhyan se padhein.' : '- Read the choices carefully.';

    if (isHindi) {
      return `### 💡 Guruji's Tips (Class ${classLevel})

**Koi baat nahi!** Seekhna ek quest (adventure) hai. Aao dekhein is prashn ko kaise solve karna hai:

**Aapka chuna hua uttar:** "${selectedAnswer}"
**Sahi tarika:**
${explanationText}

**Aapke liye Hints:**
${hintsList}

*Koshish karte rahein, aap agali baar zaroor sahi uttar denge!* 💪`;
    } else {
      return `### 💡 Guruji's Tutoring Tips (Class ${classLevel})

**No worries!** Learning is a continuous quest. Let's see how we can tackle this question:

**Your answer choice:** "${selectedAnswer}"
**Concept explanation:**
${explanationText}

**Hints for your next try:**
${hintsList}

*Keep going! Practice makes perfect.* 💪`;
    }
  }

  /**
   * General AI conversation handler for the Student chat panel
   */
  static async askTutor(studentId: string, query: string, classLevel: number, language: 'en' | 'hi'): Promise<string> {
    const hasApiKey = !!env.AI_API_KEY;
    const systemPrompt = `You are a friendly, encouraging AI Tutor named Guruji for LearnQuest India.
The student is in Class ${classLevel}. Answer their question in a helpful, educational, child-safe, age-appropriate manner.
Preferred language is: ${language === 'hi' ? 'Hindi / Hinglish' : 'English'}.
Keep explanations concise, easy to read, and split into bullet points if helpful.`;

    if (hasApiKey) {
      try {
        let responseText = '';
        if (env.AI_PROVIDER === 'openai') {
          const res = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: env.AI_MODEL || 'gpt-4-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query },
              ],
              max_tokens: 250,
            },
            {
              headers: {
                Authorization: `Bearer ${env.AI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            }
          );
          responseText = res.data.choices[0].message.content.trim();
        } else if (env.AI_PROVIDER === 'gemini') {
          const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${env.AI_API_KEY}`,
            {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nStudent Query: ${query}` }],
                },
              ],
            },
            { timeout: 5000 }
          );
          responseText = res.data.candidates[0].content.parts[0].text.trim();
        }

        // Save conversation thread
        await AIConversation.create({
          studentId,
          contextType: 'revision',
          messages: [
            { role: 'user', content: query, timestamp: new Date() },
            { role: 'assistant', content: responseText, timestamp: new Date() },
          ],
        });

        return responseText;
      } catch (error) {
        logger.error(`⚠️ AI Tutor API call failed: ${(error as Error).message}`);
      }
    }

    // Local chat fallback
    if (language === 'hi') {
      return `Mere pyare Class ${classLevel} ke sathi! Mujhe abhi local mode mein chalaya ja raha hai (AI API keys server par set nahi hain). 

Aap is topic ki pre-loaded video reels ya curriculum questions dekh sakte hain. Padhai jaari rakhein!`;
    } else {
      return `Dear Class ${classLevel} student! I am currently running in local offline mode (AI API keys are not configured on the server). 

Please check your dashboard recommended list or watch curriculum reels to review your subjects. Keep questing!`;
    }
  }

  /**
   * Auto-generates an educational learning reel using Gemini 1.5 Flash
   */
  static async autoGenerateReel(
    classLevel: number,
    subjectName: string = 'Science',
    topicName: string = 'Photosynthesis & Plant Food'
  ) {
    const hasApiKey = !!env.AI_API_KEY;
    let reelData: any = null;

    if (hasApiKey) {
      try {
        const prompt = `You are an educational video producer for LearnQuest India.
Generate a short 9:16 portrait video reel content object for Class ${classLevel} on Subject "${subjectName}" and Topic "${topicName}".
Return pure JSON without markdown backticks matching this structure:
{
  "title": "Reel Title",
  "description": "Short catchy summary of the concept",
  "scriptNarration": "Narrator text to be read aloud",
  "checkpoints": [
    {
      "timestampSeconds": 5,
      "questionText": "Quick test question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Why this option is correct"
    }
  ]
}`;

        let rawResponse = '';
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${env.AI_API_KEY}`,
          { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
          { timeout: 10000 }
        );
        rawResponse = res.data.candidates[0].content.parts[0].text;
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reelData = JSON.parse(jsonMatch[0]);
        }
      } catch (err: any) {
        logger.error(`⚠️ Gemini Reel Generation error: ${err.message}`);
      }
    }

    if (!reelData) {
      reelData = {
        title: `${topicName} - Class ${classLevel} Concept`,
        description: `Learn the fundamentals of ${topicName} in Class ${classLevel} ${subjectName}!`,
        scriptNarration: `Welcome to Class ${classLevel} ${subjectName}! Today we are mastering ${topicName}. Watch carefully and answer the interactive checkpoint questions!`,
        checkpoints: [
          {
            timestampSeconds: 5,
            questionText: `What is the core concept of ${topicName}?`,
            options: ['Understanding core principles', 'Random guess', 'Skip concept', 'None of these'],
            correctOptionIndex: 0,
            explanation: 'Core principles help build a strong foundation!',
          },
        ],
      };
    }

    return reelData;
  }
}
