// app/interview/page.tsx - Interview Session Page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Evaluation {
  scores: {
    technical_correctness: number;
    clarity: number;
    depth: number;
    tradeoff_awareness: number;
    communication: number;
  };
  total_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggested_answer: string;
}

export default function InterviewPage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
  const data = localStorage.getItem('currentInterview');
  if (!data) {
    router.push('/');
    return;
  }

  const parsed = JSON.parse(data);

  // Initialize current_question if missing
  if (parsed.current_question === undefined) {
    parsed.current_question = 0;
    localStorage.setItem('currentInterview', JSON.stringify(parsed));
  }

  setSessionData(parsed);
}, [router]);


  if (!sessionData) return null;

  const currentQuestion = sessionData.questions[sessionData.current_question];
  const isLastQuestion = sessionData.current_question >= sessionData.questions.length - 1;

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          question_number: sessionData.current_question,
          question: currentQuestion,
          answer: currentAnswer
        })
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();
      setEvaluation(data.evaluation);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    const nextQuestionIndex = sessionData.current_question + 1;
    
    if (nextQuestionIndex >= sessionData.questions.length) {
      // Interview complete, go to results
      router.push('/results');
    } else {
      // Move to next question
      const updatedSession = {
        ...sessionData,
        current_question: nextQuestionIndex
      };
      localStorage.setItem('currentInterview', JSON.stringify(updatedSession));
      setSessionData(updatedSession);
      setCurrentAnswer('');
      setEvaluation(null);
      setShowFeedback(false);
    }
  };

  const ScoreBar = ({ label, score }: { label: string; score: number }) => {
    const percentage = (score / 20) * 100;
    const color = percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{score}/20</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Question {sessionData.current_question + 1} of {sessionData.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {sessionData.setup.role} - {sessionData.setup.seniority}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((sessionData.current_question + 1) / sessionData.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              BEHAVIORAL QUESTION
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentQuestion}
            </h2>
          </div>

          {!showFeedback ? (
            <>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Use the STAR method: Situation, Task, Action, Result..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !currentAnswer.trim()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Submit Answer'}
                </button>
              </div>
            </>
          ) : (
            evaluation && (
              <div className="space-y-6">
                {/* Scores */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Scores</h3>
                  <ScoreBar label="Technical Correctness" score={evaluation.scores.technical_correctness} />
                  <ScoreBar label="Clarity of Explanation" score={evaluation.scores.clarity} />
                  <ScoreBar label="Depth of Reasoning" score={evaluation.scores.depth} />
                  <ScoreBar label="Tradeoff Awareness" score={evaluation.scores.tradeoff_awareness} />
                  <ScoreBar label="Communication Quality" score={evaluation.scores.communication} />
                  
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Score</span>
                      <span className="text-2xl font-bold text-indigo-600">{evaluation.total_score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Feedback</h3>
                  <p className="text-gray-700">{evaluation.feedback}</p>
                </div>

                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-bold text-green-700 mb-2">✓ Strengths</h3>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="text-green-600 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div>
                  <h3 className="text-lg font-bold text-orange-700 mb-2">→ Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {evaluation.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="text-orange-600 mr-2">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Answer */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">💡 Suggested Improvement</h3>
                  <p className="text-gray-700">{evaluation.suggested_answer}</p>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    {isLastQuestion ? 'View Final Results' : 'Next Question'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Tips Card */}
        {!showFeedback && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Tips for a Strong Answer</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><strong>Situation:</strong> Set the context briefly</li>
              <li><strong>Task:</strong> Explain what needed to be done</li>
              <li><strong>Action:</strong> Describe your specific actions</li>
              <li><strong>Result:</strong> Share the outcome with metrics if possible</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}