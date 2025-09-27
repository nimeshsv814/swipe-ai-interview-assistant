// src/services/aiService.js
import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const API_BASE_URL = 'https://api.openai.com/v1';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async generateQuestion(candidateInfo, difficulty, questionIndex) {
    try {
      const prompt = this.createQuestionPrompt(candidateInfo, difficulty, questionIndex);

      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced technical interviewer for a full-stack developer position. Generate challenging but fair interview questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating question:', error);
      return this.getFallbackQuestion(difficulty, questionIndex);
    }
  }

  async scoreAnswer(question, answer, difficulty) {
    try {
      const prompt = this.createScoringPrompt(question, answer, difficulty);

      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Score answers objectively based on technical accuracy, completeness, and understanding. Return a score from 0-100.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const scoreText = response.data.choices[0].message.content.trim();
      const scoreMatch = scoreText.match(/(\d+)/);
      return scoreMatch ? parseInt(scoreMatch[1]) : 50;
    } catch (error) {
      console.error('Error scoring answer:', error);
      return this.getFallbackScore(difficulty);
    }
  }

  async generateFinalEvaluation(candidateInfo, questionAnswers) {
    try {
      const prompt = this.createEvaluationPrompt(candidateInfo, questionAnswers);

      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Provide a comprehensive evaluation of the candidate based on their interview performance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.5,
      });

      const evaluation = response.data.choices[0].message.content.trim();
      const scores = questionAnswers.map(qa => qa.score || 50);
      const totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

      return {
        totalScore,
        summary: evaluation,
      };
    } catch (error) {
      console.error('Error generating evaluation:', error);
      return this.getFallbackEvaluation(questionAnswers);
    }
  }

  createQuestionPrompt(candidateInfo, difficulty, questionIndex) {
    const difficultyMap = {
      easy: 'junior level',
      medium: 'mid-level',
      hard: 'senior level'
    };

    const topics = [
      'React fundamentals and hooks',
      'JavaScript ES6+ features',
      'Node.js and Express',
      'Database design and queries',
      'API design and integration',
      'System design and architecture'
    ];

    return `Generate a ${difficultyMap[difficulty]} full-stack developer interview question for a candidate named ${candidateInfo.name}. 
    This is question ${questionIndex + 1} of 6. 
    Focus on: ${topics[questionIndex] || 'general full-stack development'}.
    The question should be:
    - Specific and technical
    - Appropriate for ${difficulty} level
    - Answerable within ${difficulty === 'easy' ? '20' : difficulty === 'medium' ? '60' : '120'} seconds
    - Focused on practical application

    Just return the question, nothing else.`;
  }

  createScoringPrompt(question, answer, difficulty) {
    return `Score this interview answer on a scale of 0-100:

    Question: ${question}
    Answer: ${answer}
    Difficulty Level: ${difficulty}

    Consider:
    - Technical accuracy
    - Completeness of answer
    - Understanding demonstrated
    - Clarity of explanation

    Return only the numeric score (0-100).`;
  }

  createEvaluationPrompt(candidateInfo, questionAnswers) {
    const qaText = questionAnswers.map((qa, index) => 
      `Q${index + 1}: ${qa.question}
A${index + 1}: ${qa.answer}
Score: ${qa.score}/100`
    ).join('');

    return `Provide a comprehensive evaluation for candidate ${candidateInfo.name} based on their interview performance:

    ${qaText}

    Please provide:
    1. Overall performance summary (2-3 sentences)
    2. Strengths identified
    3. Areas for improvement
    4. Recommendation (hire/no hire/maybe with specific conditions)

    Keep the evaluation professional and constructive.`;
  }

  getFallbackQuestion(difficulty, questionIndex) {
    const fallbackQuestions = {
      easy: [
        'What is the difference between let, const, and var in JavaScript?',
        'Explain what React hooks are and give an example of useState.',
      ],
      medium: [
        'How would you optimize a React component that renders a large list?',
        'Explain the difference between SQL and NoSQL databases with examples.',
      ],
      hard: [
        'Design a system architecture for a real-time chat application.',
        'How would you implement authentication and authorization in a full-stack application?',
      ]
    };

    const questions = fallbackQuestions[difficulty] || fallbackQuestions.easy;
    return questions[questionIndex % questions.length];
  }

  getFallbackScore(difficulty) {
    const baseScores = { easy: 60, medium: 55, hard: 50 };
    return baseScores[difficulty] + Math.floor(Math.random() * 20);
  }

  getFallbackEvaluation(questionAnswers) {
    const scores = questionAnswers.map(qa => qa.score || 50);
    const totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    return {
      totalScore,
      summary: `Candidate completed the interview with an average score of ${totalScore}/100. Performance varied across different topics. Recommend further evaluation based on specific role requirements.`,
    };
  }
}

export const aiService = new AIService();