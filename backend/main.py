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

# -----------------------------
# App initialization
# -----------------------------

app = FastAPI()

# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Gemini configuration
# -----------------------------

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash"
)

# -----------------------------
# Data Models
# -----------------------------

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


# -----------------------------
# In-memory storage
# -----------------------------

sessions = {}

# -----------------------------
# Routes
# -----------------------------

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

Scoring Criteria (0-20 each):
- technical_correctness
- clarity
- depth
- tradeoff_awareness
- communication

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
  "feedback": "",
  "strengths": ["", ""],
  "improvements": ["", ""],
  "suggested_answer": ""
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
        if answer.question_number < len(session.questions):
            next_question = session.questions[answer.question_number]

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

Average Scores:
- Technical: {avg_scores['technical_correctness']}/20
- Clarity: {avg_scores['clarity']}/20
- Depth: {avg_scores['depth']}/20
- Tradeoffs: {avg_scores['tradeoff_awareness']}/20
- Communication: {avg_scores['communication']}/20

Total Score: {total_avg}/100
Focus Area: {session.setup.focus_area}

Return ONLY valid JSON.
No markdown.
No explanation.

Format:
{{
  "overall_performance": "",
  "key_strengths": ["", "", ""],
  "areas_for_improvement": ["", "", ""],
  "actionable_next_steps": ["", "", ""],
  "readiness_level": "",
  "recommended_resources": ["", ""]
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
    return {"message": "AI Interview Simulator API (Gemini)"}


# Run with:
# uvicorn main:app --reload