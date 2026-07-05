import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FileText, Target, MessageSquare, UploadCloud, 
  CheckCircle2, AlertCircle, XCircle, ChevronRight, Briefcase, 
  Award, TrendingUp, User, Send, Loader2, Sparkles, X
} from 'lucide-react';

const MOCK_COMPANIES = {
  Google: { diff: 'Extreme', prep: '12-16 weeks', salary: '$150k - $250k', techFocus: 'Algorithms, System Design', readinessOffset: -20 },
  Microsoft: { diff: 'Hard', prep: '10-14 weeks', salary: '$140k - $220k', techFocus: 'C#, Cloud, System Design', readinessOffset: -15 },
  Amazon: { diff: 'Hard', prep: '10-14 weeks', salary: '$130k - $200k', techFocus: 'Leadership Principles, Scaling', readinessOffset: -15 },
  TCS: { diff: 'Medium', prep: '4-6 weeks', salary: '$70k - $100k', techFocus: 'Java, SQL, Aptitude', readinessOffset: +15 },
  Infosys: { diff: 'Medium', prep: '4-6 weeks', salary: '$70k - $100k', techFocus: 'Core Computing, Logic', readinessOffset: +15 },
  Zoho: { diff: 'Hard', prep: '8-10 weeks', salary: '$90k - $140k', techFocus: 'C/C++, Data Structures', readinessOffset: 0 },
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [atsScore, setAtsScore] = useState(0);
  const [resumeAnalyzed, setResumeAnalyzed] = useState(false);
  const [missingSkills, setMissingSkills] = useState([]);
  const [targetCompany, setTargetCompany] = useState('Google');
  const [readinessScore, setReadinessScore] = useState(40);
  const [isExamining, setIsExamining] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [heatmapStats, setHeatmapStats] = useState(null);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Mentor. How can I help you with your career prep today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    // Calculate compound readiness score
    let base = 30; // base score
    if (resumeAnalyzed) base += (atsScore * 0.4); // up to 40 points from ATS
    
    // Adjust based on company
    const compSettings = MOCK_COMPANIES[targetCompany];
    if (compSettings) {
      base += compSettings.readinessOffset;
    }
    
    // clamp between 5 and 98
    setReadinessScore(Math.min(98, Math.max(5, Math.floor(base))));
  }, [atsScore, resumeAnalyzed, targetCompany]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setResumeText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleResumeUpload = (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      alert("Please upload a file or paste your resume text first.");
      return;
    }
    
    setIsExamining(true);

    setTimeout(() => {
      const lowerReq = resumeText.toLowerCase();
      const companyFocus = MOCK_COMPANIES[targetCompany].techFocus.toLowerCase().split(', ');
      
      const allSkills = ['react', 'node', 'system design', 'kubernetes', 'graphql', 'aws ec2', 'java', 'sql', 'c++', 'c#', 'cloud', 'algorithms', 'leadership', 'scaling', 'python', 'javascript', 'html', 'css', 'go', 'docker', 'machine learning', 'ai', 'data structures'];
      
      const foundSkills = allSkills.filter(skill => lowerReq.includes(skill.toLowerCase()));
      const curMissingSkills = [];
      const requiredKeywords = [...companyFocus, ...allSkills.slice(0, 5)];
      
      requiredKeywords.forEach(req => {
        if (!lowerReq.includes(req.toLowerCase())) {
          curMissingSkills.push(req);
        }
      });
      
      const missingUniq = [...new Set(curMissingSkills)];
      const matchScore = Math.min(99, Math.floor(40 + (foundSkills.length * 5) - (missingUniq.length * 2)));
      const finalScore = Math.max(15, matchScore);

      // --- Calculate Heatmap Stats ---
      const expKeywords = ['experience', 'led', 'managed', 'developed', 'built', 'years', 'senior', 'architected', 'spearheaded', 'metrics', 'increased', 'decreased'];
      const projKeywords = ['project', 'github', 'deployed', 'repository', 'application', 'scale', 'users', 'hackathon', 'award', 'implemented'];
      
      const countKw = (list) => list.reduce((count, w) => count + (lowerReq.split(w).length - 1), 0);
      
      const expCount = countKw(expKeywords);
      const projCount = countKw(projKeywords);
      const skillsScore = Math.min(100, Math.floor((foundSkills.length / requiredKeywords.length) * 100));
      const expScore = Math.min(100, Math.floor((expCount / 8) * 100)); // arbitrary max of 8 hits for 100%
      const projScore = Math.min(100, Math.floor((projCount / 5) * 100));

      const categorize = (perc) => {
        if (perc >= 80) return { status: 'Excellent', color: 'bg-green-500' };
        if (perc >= 60) return { status: 'Good', color: 'bg-blue-500' };
        if (perc >= 40) return { status: 'Average', color: 'bg-yellow-500' };
        return { status: 'Critical', color: 'bg-red-500' };
      };

      setHeatmapStats([
        { label: 'Experience Breakdown', score: expScore, ...categorize(expScore) },
        { label: 'Skills Alignment', score: skillsScore, ...categorize(skillsScore) },
        { label: 'Project Impact', score: projScore, ...categorize(projScore) },
      ]);

      setAtsScore(finalScore);
      setMissingSkills(missingUniq.length > 0 ? missingUniq.slice(0, 5) : ['None! Great job']);
      setResumeAnalyzed(true);
      setIsExamining(false);
      
      // Auto trigger chat message
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've analyzed your actual resume! Your parsed ATS score is ${finalScore}%. ${missingUniq.length > 0 ? `I noticed you're missing some critical skills like ${missingUniq[0]} for ${targetCompany}.` : 'Your resume looks incredibly strong!'} Want me to suggest a learning path?`
      }]);
    }, 1500);
  };

  const handleSendMessage = (e, explicitPrompt = null) => {
    if (e) e.preventDefault();
    const text = explicitPrompt || chatInput;
    if (!text.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setIsTyping(true);

    // Mock API response contextually
    setTimeout(() => {
      let reply = "I can definitely help with that. Are you focusing on algorithms or system design right now?";
      const lower = text.toLowerCase();
      if (lower.includes('resume') || lower.includes('ats')) {
        reply = `Your current ATS score is ${atsScore}%. To improve it for ${targetCompany}, try adding keywords like: ${missingSkills.join(', ')}.`;
      } else if (lower.includes('learn') || lower.includes('next')) {
        reply = `Since aiming for ${targetCompany}, I'd suggest focusing on ${MOCK_COMPANIES[targetCompany].techFocus}. Want a 4-week roadmap?`;
      } else if (lower.includes('roadmap')) {
        reply = "Check out the Company Readiness tab! I've pre-filled a suggested 4-week sprint for you.";
        setActiveTab('company');
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-100 bg-[#0a0a0a]">
      {/* Sidebar Navigation */}
      <aside className="w-72 glass border-r border-white/5 flex flex-col p-6 z-10 transition-all">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-300">
            PathPilot
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview Dashboard' },
            { id: 'resume', icon: FileText, label: 'Resume Lab' },
            { id: 'company', icon: Target, label: 'Company Readiness' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-white/10 text-white font-medium shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 overflow-hidden flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Guest User</p>
              <p className="text-xs text-green-400">Online & Ready</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <header className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Welcome back to PathPilot.</h2>
                <p className="text-gray-400">Here's a snapshot of your career readiness trajectory.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Progress Ring */}
                <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="text-lg font-medium text-gray-300 mb-6">Placement Readiness</h3>
                  
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" className="stroke-gray-800" strokeWidth="8" fill="none" />
                      <circle 
                        cx="80" cy="80" r="70" 
                        className="stroke-purple-500 transition-all duration-1000 ease-out" 
                        strokeWidth="8" fill="none" 
                        strokeDasharray={2 * Math.PI * 70} 
                        strokeDashoffset={2 * Math.PI * 70 * (1 - readinessScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white">{readinessScore}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 text-center">
                    Target: <span className="text-purple-400 font-medium">{targetCompany}</span>
                  </p>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  <div className="glass-card p-6 flex flex-col justify-between hover:border-blue-500/30 transition-all">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h4 className="text-gray-400 text-sm font-medium">Profile Strength</h4>
                      <p className="text-2xl font-bold mt-1">{resumeAnalyzed ? 'Optimized' : 'Needs Review'}</p>
                    </div>
                    {atsScore > 0 && <p className="text-sm text-green-400 mt-4 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> ATS: {atsScore}%</p>}
                  </div>
                  
                  <div className="glass-card p-6 flex flex-col justify-between hover:border-yellow-500/30 transition-all">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4">
                        <Award className="w-5 h-5" />
                      </div>
                      <h4 className="text-gray-400 text-sm font-medium">Technical Confidence</h4>
                      <p className="text-2xl font-bold mt-1">Intermediate</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Top Skill: React</p>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" /> Placement Progress Timeline
                </h3>
                
                <div className="relative">
                  <div className="absolute top-4 left-6 w-[2px] h-[calc(100%-2rem)] bg-gray-800 -z-0"></div>
                  
                  {[
                    { title: 'Resume Uploaded', desc: 'Initialize profile with base ATS score', done: resumeAnalyzed },
                    { title: 'ATS Threshold Crossed', desc: 'Score > 75% for automated filtering', done: atsScore > 75 },
                    { title: 'Core Skills Mastered', desc: 'Complete 80% of generated roadmap', done: false },
                    { title: 'Mock Passed', desc: 'Clear AI technical mock interview', done: false },
                    { title: 'Interview Ready', desc: 'Ready for target company applications', done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 relative z-10 mb-8 last:mb-0 group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-[#0a0a0a] transition-colors duration-300 ${step.done ? 'bg-purple-600' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                        {step.done ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span className="text-gray-400 font-medium">{i+1}</span>}
                      </div>
                      <div className="pt-2">
                        <h4 className={`text-lg font-semibold ${step.done ? 'text-white' : 'text-gray-300'}`}>{step.title}</h4>
                        <p className="text-gray-500 mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESUME LAB */}
          {activeTab === 'resume' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <header className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Resume Lab</h2>
                  <p className="text-gray-400">Analyze via AI and visualize your ATS compatibility.</p>
                </div>
                {resumeAnalyzed && (
                  <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-lg">
                    <span className="text-purple-400 font-medium">ATS Match:</span>
                    <span className={`text-2xl font-bold ${atsScore > 75 ? 'text-green-400' : 'text-yellow-400'}`}>{atsScore}%</span>
                  </div>
                )}
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="glass-card p-1 border-dashed border-2 border-white/10 hover:border-purple-500/50 transition-colors">
                  <div className="bg-black/20 m-1 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <UploadCloud className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Upload or Paste Resume</h3>
                    <p className="text-gray-400 text-sm mb-4 max-w-sm">Upload a .txt/.md file or paste raw text below to generate a real ATS breakdown based on your own content.</p>
                    
                    <input 
                      type="file" 
                      accept=".txt,.md,.rtf,.html,.csv"
                      onChange={handleFileUpload}
                      className="mb-6 block w-full max-w-xs text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />

                    <div className="w-full mb-6">
                      <div className="text-xs text-gray-500 mb-2 text-left">Or paste raw text:</div>
                      <textarea 
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 resize-none h-32"
                        placeholder="Paste your resume content here..."
                      ></textarea>
                    </div>

                    <button 
                      onClick={handleResumeUpload}
                      disabled={isExamining || (!resumeText.trim())}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isExamining ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Analyze Resume Now'}
                    </button>
                  </div>
                </div>

                {/* Results Section */}
                <div className="flex flex-col gap-6">
                  {resumeAnalyzed ? (
                    <>
                      <div className="glass-card p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" /> Quality Heatmap
                        </h3>
                        <div className="space-y-4">
                          {(heatmapStats || []).map((sec, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-300">{sec.label}</span>
                                <span className={sec.color.replace('bg-', 'text-') + ' font-medium'}>{sec.status}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${sec.color} rounded-full transition-all duration-1000`} style={{ width: `${sec.score}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="glass-card p-6 flex-1">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-purple-400" /> Missing Keywords
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">Based on engineering roles at {targetCompany}, you are missing these high-impact terms:</p>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded-md text-sm font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="glass-card p-8 flex flex-col items-center justify-center text-center h-full opacity-50 relative overflow-hidden">
                       <FileText className="w-16 h-16 text-gray-600 mb-4" />
                       <h3 className="text-lg font-medium text-gray-400">Awaiting Resume</h3>
                       <p className="text-sm text-gray-500 mt-2">Upload a file to see your heatmap and ATS score.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPANY READINESS & ROADMAP */}
          {activeTab === 'company' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
               <header className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Company Readiness</h2>
                <p className="text-gray-400">Tailor your preparation to specific tech giants.</p>
              </header>

              <div className="glass-card p-6 mb-8 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Target Company</p>
                    <select 
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="bg-transparent text-xl font-bold text-white focus:outline-none border-b border-dashed border-gray-600 hover:border-purple-400 pb-1 cursor-pointer"
                    >
                      {Object.keys(MOCK_COMPANIES).map(c => <option key={c} value={c} className="bg-gray-900 text-base">{c}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-8">
                   <div>
                     <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Difficulty</p>
                     <p className="font-semibold text-orange-400">{MOCK_COMPANIES[targetCompany].diff}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Avg. Salary</p>
                     <p className="font-semibold text-green-400">{MOCK_COMPANIES[targetCompany].salary}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Prep Time</p>
                     <p className="font-semibold text-blue-400">{MOCK_COMPANIES[targetCompany].prep}</p>
                   </div>
                </div>
              </div>

              <div className="glass-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">4-Week Structured Roadmap</h3>
                  <span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                    Focus: {MOCK_COMPANIES[targetCompany].techFocus}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {[
                    { w: 'Week 1', title: 'Resume overhaul & Core concepts', tasks: ['Tweak resume keywords (ATS > 75%)', 'Review basic Data Structures'] },
                    { w: 'Week 2', title: 'Targeted Skill Acquisition', tasks: ['Deep dive into ' + MOCK_COMPANIES[targetCompany].techFocus.split(',')[0], 'Build a mini-project'] },
                    { w: 'Week 3', title: 'Mock Interviews & LeetCode', tasks: ['Perform AI Mock Interview', 'Solve 15 ' + targetCompany + ' tagged questions'] },
                    { w: 'Week 4', title: 'System Design & HR Prep', tasks: ['Review scaling principles', 'Prepare STAR method answers'] },
                  ].map((week, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
                      <div className="flex justify-between mb-3">
                        <h4 className="font-bold text-gray-200">{week.w}: <span className="text-gray-400 font-normal">{week.title}</span></h4>
                      </div>
                      <div className="space-y-2">
                        {week.tasks.map((t, j) => (
                          <label key={j} className="flex items-start gap-3 cursor-pointer group">
                             <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-black/50" />
                             <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FLOATING AI MENTOR CHATBOT */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Toggle Button */}
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 hover:scale-110 transition-transform duration-300 border border-white/20"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Chat Window */}
        <div className={`transition-all duration-300 origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100 mb-0' : 'scale-75 opacity-0 pointer-events-none mb-[-20px]'} 
          w-[360px] h-[500px] glass-card flex flex-col overflow-hidden border border-white/10 shadow-2xl shadow-black/50`}>
          
          {/* Header */}
          <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">PathPilot AI Mentor</h3>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="relative z-10 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-sm' 
                  : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap hidden-scrollbar">
            {["Analyze my resume", "Improve ATS score", "What should I learn next?"].map((prompt, i) => (
              <button 
                key={i}
                onClick={(e) => handleSendMessage(e, prompt)}
                className="text-xs px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 rounded-full transition-colors text-gray-400 whitespace-nowrap shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 bg-black/20">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your mentor anything..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 text-white placeholder-gray-500"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-1 top-1 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-purple-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
