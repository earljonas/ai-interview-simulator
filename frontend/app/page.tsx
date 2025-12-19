// app/page.tsx - Interview Setup Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    seniority: '',
    focus_area: ''
  });

  const roles = ['Frontend', 'Backend', 'Fullstack', 'Data Engineer', 'AI/ML Engineer', 'DevOps', 'Mobile'];
  const seniorities = ['Junior', 'Mid', 'Senior', 'Lead'];
  const focusAreas = {
    'Frontend': ['React/Next.js', 'UI/UX Design', 'Performance Optimization', 'State Management'],
    'Backend': ['APIs', 'Database Design', 'Microservices', 'System Design'],
    'Fullstack': ['Full System Design', 'API Integration', 'DevOps', 'Architecture'],
    'Data Engineer': ['Data Pipelines', 'ETL', 'Data Warehousing', 'Big Data'],
    'AI/ML Engineer': ['ML Modeling', 'Model Deployment', 'Data Processing', 'MLOps'],
    'DevOps': ['CI/CD', 'Cloud Infrastructure', 'Containerization', 'Monitoring'],
    'Mobile': ['Cross-platform', 'Native Development', 'App Architecture', 'Performance']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/start-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const data = await response.json();
      
      // Store session data in localStorage
      localStorage.setItem('currentInterview', JSON.stringify({
        session_id: data.session_id,
        questions: data.questions,
        setup: formData,
        current_question: 0
      }));

      router.push('/interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Interview Simulator
          </h1>
          <p className="text-gray-600">
            Practice behavioral interviews with AI-powered feedback
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Your Role
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, focus_area: '' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a role...</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Seniority Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seniority Level
            </label>
            <select
              required
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose seniority...</option>
              {seniorities.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Focus Area Selection */}
          {formData.role && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Focus Area
              </label>
              <select
                required
                value={formData.focus_area}
                onChange={(e) => setFormData({ ...formData, focus_area: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose focus area...</option>
                {focusAreas[formData.role as keyof typeof focusAreas]?.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.role || !formData.seniority || !formData.focus_area}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Starting Interview...' : 'Start Interview'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">What to expect:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              5-7 behavioral questions tailored to your role
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              AI feedback on each answer with scores
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              Final report with improvement suggestions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}