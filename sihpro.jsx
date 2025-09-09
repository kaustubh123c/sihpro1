/*
One-Stop Personalized Career & Education Advisor (Front-end prototype)
Single-file React component (App.jsx) using Tailwind CSS for styling.

Features implemented in this prototype:
- Simple user profile (saved to localStorage)
- Short aptitude & interest quiz (scored, gives stream suggestions)
- Course-to-career cards with basic mapping
- Nearby government colleges directory (mock data + simple search/filter)
- Timeline tracker for important dates (add/remove reminders stored in localStorage)
- Basic personalization: recommendations based on quiz + profile

How to use this file in a React project:
1. Create a React project (Vite or Create React App). Example with Vite:
   npm create vite@latest my-app --template react
   cd my-app
2. Install dependencies (none required for core functionality). To use Tailwind follow Tailwind docs.
3. Replace src/App.jsx with this file content (or import it).
4. Ensure Tailwind is configured, or replace Tailwind classes with plain CSS.
5. Run `npm install` and `npm run dev` or `npm start`.

Notes & next steps (suggested):
- Hook a backend (Node/Express, Flask) with a database (Postgres/Mongo/SQLite) to persist users and colleges.
- Replace mock college data with a geocoded government-college dataset (CSV -> API).
- Add authentication, counselor/admin interfaces, analytics dashboards.

*/

import React, { useEffect, useState } from "react";

// Mock data for courses and careers
const COURSES = [
  {
    id: "ba",
    name: "B.A. (Arts)",
    careers: ["Teacher", "Civil Services", "Content Writer", "Social Worker", "Research"],
    description: "Broad arts & humanities grounding. Good for writing, social sciences, and public service.",
  },
  {
    id: "bsc",
    name: "B.Sc. (Science)",
    careers: ["Researcher", "Lab Technician", "Data Analyst", "Engineer (further study)", "Higher Studies"],
    description: "Science degrees leading to technical and research careers. Good for students strong in maths/science.",
  },
  {
    id: "bcom",
    name: "B.Com.",
    careers: ["Accountant", "Banking", "Finance Executive", "MBA (further study)"],
    description: "Commerce & finance foundation: accounting, banking, and business roles.",
  },
  {
    id: "bba",
    name: "BBA",
    careers: ["Management Trainee", "Entrepreneur", "HR/Marketing Executive"],
    description: "Business administration focused — good for managerial & entrepreneurial paths.",
  },
];

// Mock government colleges (replace with real dataset later)
const MOCK_COLLEGES = [
  { id: 1, name: "Govt. Arts & Science College, Satara", district: "Satara", programs: ["BA", "BSc", "BCom"], hostel: true, internet: true, cutoff: "45%" },
  { id: 2, name: "Dr. Raje Degree College, Pune", district: "Pune", programs: ["BA", "BSc", "BBA"], hostel: false, internet: true, cutoff: "55%" },
  { id: 3, name: "Zilla Parishad College, Solapur", district: "Solapur", programs: ["BA", "BCom"], hostel: true, internet: false, cutoff: "40%" },
  { id: 4, name: "Govt. Science College, Nagpur", district: "Nagpur", programs: ["BSc", "BSc Computer Science"], hostel: true, internet: true, cutoff: "60%" },
];

// Simple quiz questions to map to streams
const QUIZ_QUESTIONS = [
  { id: 1, q: "I enjoy solving math/logic problems.", weights: { science: 2, commerce: 0, arts: 0 } },
  { id: 2, q: "I like reading history, literature, or writing essays.", weights: { science: 0, commerce: 0, arts: 2 } },
  { id: 3, q: "I am interested in business, money, and markets.", weights: { science: 0, commerce: 2, arts: 0 } },
  { id: 4, q: "I prefer hands-on experiments and practical projects.", weights: { science: 2, commerce: 0, arts: 0 } },
  { id: 5, q: "I enjoy public speaking and debating.", weights: { science: 0, commerce: 1, arts: 1 } },
];

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage error", e);
  }
}
function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

export default function App() {
  const [profile, setProfile] = useState(() => loadLocal("osa_profile", { name: "", age: "", class: "12", district: "Pune" }));
  const [colleges, setColleges] = useState(() => loadLocal("osa_colleges", MOCK_COLLEGES));

  // Quiz state
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // Timeline reminders
  const [reminders, setReminders] = useState(() => loadLocal("osa_reminders", []));
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");

  useEffect(() => saveLocal("osa_profile", profile), [profile]);
  useEffect(() => saveLocal("osa_reminders", reminders), [reminders]);
  useEffect(() => saveLocal("osa_colleges", colleges), [colleges]);

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  }

  function handleAnswerChange(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: Number(value) }));
  }

  function submitQuiz() {
    // Score aggregation
    const score = { science: 0, commerce: 0, arts: 0 };
    QUIZ_QUESTIONS.forEach((q) => {
      const val = answers[q.id] || 0; // 0-2 scale
      score.science += (q.weights.science || 0) * val;
      score.commerce += (q.weights.commerce || 0) * val;
      score.arts += (q.weights.arts || 0) * val;
    });
    // decide top stream
    const maxStream = Object.keys(score).reduce((a, b) => (score[a] > score[b] ? a : b));
    setQuizResult({ score, top: maxStream });
  }

  function addReminder() {
    if (!newReminderTitle || !newReminderDate) return;
    const r = { id: Date.now(), title: newReminderTitle, date: newReminderDate };
    const next = [...reminders, r].sort((a,b)=> new Date(a.date) - new Date(b.date));
    setReminders(next);
    setNewReminderTitle("");
    setNewReminderDate("");
  }
  function removeReminder(id) {
    setReminders((r) => r.filter((x) => x.id !== id));
  }

  // Simple search for colleges
  const [collegeQuery, setCollegeQuery] = useState("");
  function filteredColleges() {
    const q = collegeQuery.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((c) => c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q) || c.programs.join(" ").toLowerCase().includes(q));
  }

  // Recommendations derived from quiz and profile
  function getRecommendations() {
    if (!quizResult) return [];
    const map = {
      science: ["B.Sc.", "B.Tech (via entrance)", "BCA"],
      commerce: ["B.Com.", "BBA", "BMS"],
      arts: ["B.A.", "B.Des.", "B.Ed (after BA)"],
    };
    const rec = map[quizResult.top] || [];
    // pick colleges that offer the top programs (simple match)
    const matchedColleges = colleges.filter((c) => c.programs.some((p) => rec.some((r) => p.toLowerCase().includes(r.split(' ')[0].toLowerCase()))));
    return { rec, matchedColleges };
  }

  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">One-Stop Career Advisor — Prototype</h1>
          <div className="text-sm text-slate-600">Personalized guidance for students</div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Profile & Quiz */}
          <section className="md:col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Your Profile</h2>
            <div className="space-y-2">
              <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Name" className="w-full p-2 border rounded" />
              <input name="age" value={profile.age} onChange={handleProfileChange} placeholder="Age" className="w-full p-2 border rounded" />
              <select name="class" value={profile.class} onChange={handleProfileChange} className="w-full p-2 border rounded">
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="graduated">Graduated</option>
              </select>
              <input name="district" value={profile.district} onChange={handleProfileChange} placeholder="District" className="w-full p-2 border rounded" />
            </div>

            <hr className="my-4" />

            <h3 className="font-semibold">Aptitude & Interest Quiz</h3>
            <p className="text-sm text-slate-500 mb-2">Answer honestly — 0 = disagree, 1 = neutral, 2 = agree</p>
            <div className="space-y-2">
              {QUIZ_QUESTIONS.map((q) => (
                <div key={q.id} className="p-2 border rounded">
                  <div className="text-sm mb-1">{q.q}</div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1"><input type="radio" name={`q${q.id}`} checked={(answers[q.id]||0)===0} onChange={()=>handleAnswerChange(q.id,0)} /> 0</label>
                    <label className="flex items-center gap-1"><input type="radio" name={`q${q.id}`} checked={(answers[q.id]||0)===1} onChange={()=>handleAnswerChange(q.id,1)} /> 1</label>
                    <label className="flex items-center gap-1"><input type="radio" name={`q${q.id}`} checked={(answers[q.id]||0)===2} onChange={()=>handleAnswerChange(q.id,2)} /> 2</label>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={submitQuiz} className="px-3 py-2 bg-indigo-600 text-white rounded">Submit Quiz</button>
                <button onClick={()=>{setAnswers({}); setQuizResult(null);}} className="px-3 py-2 border rounded">Reset</button>
              </div>

              {quizResult && (
                <div className="mt-3 p-3 bg-indigo-50 rounded">
                  <div className="font-semibold">Top stream: {quizResult.top.toUpperCase()}</div>
                  <div className="text-sm mt-1">Scores — Science: {quizResult.score.science}, Commerce: {quizResult.score.commerce}, Arts: {quizResult.score.arts}</div>
                </div>
              )}
            </div>
          </section>

          {/* Middle column: Courses & Careers */}
          <section className="md:col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Course → Career Mapping</h2>
            <div className="space-y-3">
              {COURSES.map((c) => (
                <div key={c.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-sm text-slate-600">{c.description}</div>
                    </div>
                    <div className="text-xs text-slate-500">Popular careers</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.careers.map((job) => (
                      <div key={job} className="text-xs px-2 py-1 border rounded">{job}</div>
                    ))}
                  </div>
                </div>
              ))}

              {quizResult && (
                <div className="p-3 bg-green-50 rounded">
                  <div className="font-semibold">Personalized recommendations</div>
                  <div className="text-sm mt-1">Suggested programs based on your quiz: {recommendations.rec.join(", ")}</div>
                  <div className="mt-2">
                    <div className="font-semibold">Nearby colleges that match:</div>
                    {recommendations.matchedColleges.length ? (
                      <ul className="list-disc pl-5 text-sm">
                        {recommendations.matchedColleges.map((mc) => (<li key={mc.id}>{mc.name} — {mc.programs.join(", ")}</li>))}
                      </ul>
                    ) : <div className="text-sm text-slate-500">No matches in mock data — add real college data for better results.</div>}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right column: Colleges & Timeline */}
          <section className="md:col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Nearby Government Colleges</h2>
            <div className="flex gap-2 mb-3">
              <input value={collegeQuery} onChange={(e)=>setCollegeQuery(e.target.value)} placeholder="Search by name / district / program" className="flex-1 p-2 border rounded" />
              <button onClick={()=>{setCollegeQuery('')}} className="px-3 py-2 border rounded">Clear</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {filteredColleges().map((col) => (
                <div key={col.id} className="p-2 border rounded">
                  <div className="font-semibold">{col.name}</div>
                  <div className="text-sm text-slate-600">{col.district} • Programs: {col.programs.join(", ")}</div>
                  <div className="text-xs mt-1">Facilities: {col.hostel? 'Hostel' : 'No hostel'}, {col.internet? 'Internet' : 'No internet'}</div>
                </div>
              ))}
            </div>

            <hr className="my-3" />

            <h3 className="font-semibold">Timeline Tracker</h3>
            <div className="text-sm text-slate-500 mb-2">Add important dates (admissions, scholarships, exams)</div>
            <div className="flex gap-2 mb-2">
              <input value={newReminderTitle} onChange={(e)=>setNewReminderTitle(e.target.value)} placeholder="Reminder title" className="flex-1 p-2 border rounded" />
              <input type="date" value={newReminderDate} onChange={(e)=>setNewReminderDate(e.target.value)} className="p-2 border rounded" />
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={addReminder} className="px-3 py-2 bg-emerald-600 text-white rounded">Add</button>
              <button onClick={()=>{setReminders([])}} className="px-3 py-2 border rounded">Clear All</button>
            </div>
            <div className="space-y-1 text-sm">
              {reminders.length ? reminders.map((r)=> (
                <div key={r.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-slate-600">{new Date(r.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs">{ (new Date(r.date) - new Date()) < 0 ? <span className="text-rose-500">Passed</span> : <span className="text-emerald-600">Upcoming</span> }</div>
                    <button onClick={()=>removeReminder(r.id)} className="text-xs text-red-600">Remove</button>
                  </div>
                </div>
              )) : <div className="text-slate-500">No reminders yet.</div>}
            </div>

          </section>
        </main>

        <footer className="mt-6 text-sm text-slate-500">Prototype (front-end only). Ready to connect to a backend for real data & authentication.</footer>
      </div>
    </div>
  );
}
