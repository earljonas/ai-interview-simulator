from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import os
import json
from datetime import datetime


# App initialization
app = FastAPI()

# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Gemini configuration
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash"
)


# Data Models
class InterviewSetup(BaseModel):
    role: str
    seniority: str
    focus_area: str


class Answer(BaseModel):
    session_id: str
    question_number: int
    question: str
    answer: str


class InterviewSession(BaseModel):
    session_id: str
    setup: InterviewSetup
    questions: List[str]
    conversation_history: List[dict]
    created_at: str

# In-memory storage
sessions = {}

# Routes
@app.post("/api/start-interview")
async def start_interview(setup: InterviewSetup):
    """
    Generate interview questions using Gemini
    """

    session_id = f"session_{datetime.now().timestamp()}"

    prompt = f"""
You are an expert technical interviewer.

Generate 5-7 behavioral interview questions for a {setup.seniority} {setup.role}
with focus on {setup.focus_area}.

Requirements:
1. Relevant to the role and seniority
2. Focus on {setup.focus_area}
3. Assess technical decisions and soft skills
4. Follow STAR method
5. Progressive difficulty

Return ONLY valid JSON.
No markdown.
No explanation.

Format:
["question 1", "question 2", "..."]
"""

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        questions = json.loads(response_text)

        sessions[session_id] = InterviewSession(
            session_id=session_id,
            setup=setup,
            questions=questions,
            conversation_history=[],
            created_at=datetime.now().isoformat()
        )

        return {
            "session_id": session_id,
            "questions": questions,
            "total_questions": len(questions)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating questions: {str(e)}"
        )


@app.post("/api/submit-answer")
async def submit_answer(answer: Answer):
    """
    Evaluate a candidate's answer using Gemini
    """

    if answer.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[answer.session_id]

    evaluation_prompt = f"""
You are evaluating a {session.setup.seniority} {session.setup.role} candidate.

Question:
{answer.question}

Candidate Answer:
{answer.answer}

EVALUATION FRAMEWORK - You are a senior technical interviewer with 10+ years of experience:

1. SCORING (0-10 scale):
   Score based on what IS present, not what's missing:
   - technical_correctness: Accuracy of technical claims, terminology, and concepts
   - clarity: How well-structured and easy to follow the answer is
   - depth: Level of detail, reasoning, and insight demonstrated
   - tradeoff_awareness: Discussion of alternatives, pros/cons, or decision-making process
   - communication: Professional tone, conciseness, and articulation

2. FEEDBACK (2-3 sentences):
   - Address the candidate directly using "you/your"
   - Be honest but constructive - balance what worked with what needs work
   - Focus on the STAR elements if applicable (Situation, Task, Action, Result)
   - Example: "You provided good context about the situation and clearly explained your actions. However, your answer would be stronger with specific metrics showing the impact of your work."

3. STRENGTHS (Find 2-3 concrete strengths):
   Identify specific elements the candidate DID well:
   - Mentioned concrete examples, technologies, or tools
   - Provided relevant business or technical context
   - Demonstrated understanding of the problem space
   - Showed ownership or initiative in their approach
   - Used quantifiable results or data points
   - Exhibited clear logical thinking or problem-solving
   - Communicated technical concepts effectively
   
   Even in weaker answers, find what they included:
   - "You named specific technologies you worked with (React, Node.js)"
   - "You described the business problem your solution addressed"
   - "You explained your role and responsibilities clearly"
   
   Avoid vague praise like "good effort" or "engaging with the question"
   
4. IMPROVEMENTS (3-7 sentences):
   Provide tactical coaching on HOW to improve the answer structure and delivery:
   - Point out missing STAR elements (if relevant)
   - Suggest what types of details to add (metrics, context, alternatives considered)
   - Recommend how to structure the response better
   - Give example phrases they could use: "For instance, you could say: 'The main challenge was...'"
   - Explain what interviewers are looking for in this type of question
   - Be specific about what would elevate this from a good answer to a great one
   
   Do NOT reveal the actual answer - guide them on approach, not content
   Use directive language: "You should add...", "Try opening with...", "Include details about..."

Return ONLY valid JSON.
No markdown.
No explanation.

Format:
{{
  "scores": {{
    "technical_correctness": 0,
    "clarity": 0,
    "depth": 0,
    "tradeoff_awareness": 0,
    "communication": 0
  }},
  "total_score": 0,
  "feedback": "You demonstrated...",
  "strengths": ["You showed clear...", "Your communication was..."],
  "improvements": ["You could improve by...", "Consider adding..."],
  "suggested_answer": "You should start by describing the situation briefly, then explain what specific actions you took. For example, try saying: 'When faced with X, I decided to...' This keeps your answer structured and shows clear thinking."
}}
"""

    try:
        response = model.generate_content(evaluation_prompt)
        response_text = response.text.strip()

        evaluation = json.loads(response_text)

        session.conversation_history.append({
            "question_number": answer.question_number,
            "question": answer.question,
            "answer": answer.answer,
            "evaluation": evaluation
        })

        next_question = None
        if answer.question_number + 1 < len(session.questions):
            next_question = session.questions[answer.question_number + 1]

        return {
            "evaluation": evaluation,
            "question_number": answer.question_number,
            "next_question": next_question
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error evaluating answer: {str(e)}"
        )


@app.post("/api/complete-interview")
async def complete_interview(session_id: str):
    """
    Generate final interview report
    """

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    if not session.conversation_history:
        raise HTTPException(status_code=400, detail="No answers submitted")

    score_buckets = {
        "technical_correctness": [],
        "clarity": [],
        "depth": [],
        "tradeoff_awareness": [],
        "communication": []
    }

    for entry in session.conversation_history:
        for key, value in entry["evaluation"]["scores"].items():
            score_buckets[key].append(value)

    avg_scores = {
        key: sum(values) / len(values)
        for key, values in score_buckets.items()
    }

    total_avg = sum(avg_scores.values())

    summary_prompt = f"""
Interview Summary for a {session.setup.seniority} {session.setup.role}

Average Scores (out of 10):
- Technical: {avg_scores['technical_correctness']:.1f}/10
- Clarity: {avg_scores['clarity']:.1f}/10
- Depth: {avg_scores['depth']:.1f}/10
- Tradeoffs: {avg_scores['tradeoff_awareness']:.1f}/10
- Communication: {avg_scores['communication']:.1f}/10

Total Score: {total_avg:.1f}/50
Focus Area: {session.setup.focus_area}

CRITICAL RULES:
1. Write directly to the user using "you" and "your"
2. Be supportive and constructive
3. Key strengths must highlight what they did well
4. Areas for improvement should be specific and actionable
5. Next steps should be concrete actions they can take today
6. Readiness level should be honest but encouraging

Return ONLY valid JSON.
No markdown.
No explanation.

Format:
{{
  "overall_performance": "You showed strong communication throughout...",
  "key_strengths": ["You consistently used the STAR method", "Your technical explanations were clear", "You demonstrated self-awareness"],
  "areas_for_improvement": ["You could strengthen your answers by including specific metrics", "Consider discussing tradeoffs more explicitly", "Practice providing concrete examples"],
  "actionable_next_steps": ["Prepare 5 stories with clear metrics and outcomes", "Practice the STAR method out loud", "Record yourself answering questions to improve delivery"],
  "readiness_level": "Ready for interviews",
  "recommended_resources": ["Practice more system design scenarios", "Review common behavioral question patterns", "Study the STAR method in depth"]
}}
"""

    try:
        response = model.generate_content(summary_prompt)
        response_text = response.text.strip()

        final_report = json.loads(response_text)

        return {
            "session_id": session_id,
            "average_scores": avg_scores,
            "total_score": total_avg,
            "final_report": final_report,
            "question_details": session.conversation_history
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating final report: {str(e)}"
        )


@app.get("/")
async def root():
    return {"message": "Checkkk!!!"}