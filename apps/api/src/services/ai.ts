import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Question } from '../models/Activity.js';
import { AIConversation } from '../models/Misc.js';

export class AIService {
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
}
