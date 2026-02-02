import React, { useState, useEffect } from 'react';
import { Question } from './questions';
import { listServerFiles, loadQuizFromServer, QuizFileHeader } from './storage';

// --- Types ---
type QuizState = 'menu' | 'server_list' | 'playing' | 'results';

// --- Helper Components ---
const Button = ({ onClick, children, variant = 'primary', disabled = false, className = '' }: any) => {
  const baseStyle = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-java-600 hover:bg-java-500 text-white shadow-lg hover:shadow-java-500/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
    outline: "border-2 border-java-600 text-java-500 hover:bg-java-900/20",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20"
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="bg-[#0d1117] text-gray-300 p-4 rounded-md border border-slate-700 overflow-x-auto font-mono text-sm leading-relaxed my-4 shadow-inner">
    <code>{code}</code>
  </pre>
);

// --- Main Component ---
export default function App() {
  const [gameState, setGameState] = useState<QuizState>('menu');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [history, setHistory] = useState<{ qId: number; correct: boolean }[]>([]);
  
  // Server List State
  const [serverFiles, setServerFiles] = useState<QuizFileHeader[]>([]);

  const currentQuestion = activeQuestions[currentQIndex];
  const isLastQuestion = activeQuestions.length > 0 && currentQIndex === activeQuestions.length - 1;

  // Refresh list when entering server_list view
  useEffect(() => {
    if (gameState === 'server_list') {
      const fetchFiles = async () => {
        const files = await listServerFiles();
        setServerFiles(files);
      };
      fetchFiles();
    }
  }, [gameState]);

  // --- Logic: Generate Quiz (Now Server Side) ---


  // --- Logic: Load Quiz from Server List ---
  const handleSelectFile = async (id: string) => {
    const questions = await loadQuizFromServer(id);
    if (questions && questions.length > 0) {
      setActiveQuestions(questions);
      startQuiz();
    } else {
      alert("Could not load file from server. Is the Node server running?");
    }
  };

  const startQuiz = () => {
    setCurrentQIndex(0);
    setScore(0);
    setHistory([]);
    resetQuestionState();
    setGameState('playing');
  };

  // --- Logic: Gameplay ---
  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
      setHistory(prev => [...prev, { qId: currentQuestion.id, correct: true }]);
    } else {
      setHistory(prev => [...prev, { qId: currentQuestion.id, correct: false }]);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setGameState('results');
    } else {
      setCurrentQIndex(prev => prev + 1);
      resetQuestionState();
    }
  };


  // --- Views ---

  const MenuView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 space-y-8 animate-fade-in">
      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-java-500 to-purple-400 bg-clip-text text-transparent pb-2">
        Java Core Master
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">
        AI-Powered Certification Prep.
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-sm">

        <Button onClick={() => setGameState('server_list')} variant="secondary" className="text-xl py-4 w-full">
           View Saved Quizzes
        </Button>
      </div>
    </div>
  );



  const ServerListView = () => (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="bg-slate-800 p-2 rounded-lg text-2xl">📂</span>
          Saved Quizzes
        </h2>
        <Button onClick={() => setGameState('menu')} variant="secondary" className="px-4 py-2">Back to Menu</Button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden min-h-[300px] flex flex-col">
        {serverFiles.length === 0 ? (
          <div className="flex-1 p-12 text-center flex flex-col items-center justify-center gap-4 text-slate-500">
            <svg className="w-20 h-20 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
            <p className="text-xl font-medium text-slate-400">Chưa có bài kiểm tra nào</p>
            <p className="text-sm">Generate a quiz to see it here.</p>
            <p className="text-xs text-red-400/50 mt-2">(Ensure Node server is running on port 3000)</p>

          </div>
        ) : (
          <div className="divide-y divide-slate-700">
             {serverFiles.map((file) => (
               <div key={file.id} className="p-5 hover:bg-slate-700/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="bg-java-900/40 p-3 rounded-lg text-java-400 group-hover:text-java-300 transition-colors">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-java-100 group-hover:text-white cursor-pointer" onClick={() => handleSelectFile(file.id)}>
                        {file.id}
                      </h3>
                      <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {new Date(file.timestamp).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {file.questionCount} Questions
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleSelectFile(file.id)} variant="outline" className="px-5 py-2 text-sm w-full md:w-auto shrink-0">
                    Open File
                  </Button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );

  const QuizView = () => (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen flex flex-col justify-center">
      <div className="flex justify-between items-center mb-8 text-slate-400 text-sm font-mono">
        <span>Question {currentQIndex + 1} / {activeQuestions.length}</span>
        <Button onClick={() => setGameState('server_list')} variant="secondary" className="px-3 py-1 text-xs">Exit</Button>
      </div>

      <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-java-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${((currentQIndex + 1) / activeQuestions.length) * 100}%` }}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-2xl mb-8">
        <h2 className="text-xl md:text-2xl font-medium mb-4 text-slate-100">
          {currentQuestion?.question}
        </h2>
        
        {currentQuestion?.code && <CodeBlock code={currentQuestion.code} />}

        <div className="grid grid-cols-1 gap-3 mt-6">
          {currentQuestion?.options.map((opt, idx) => {
            let stateStyle = "bg-slate-700/50 hover:bg-slate-700 border-slate-600";
            if (selectedAnswer !== null) {
               if (idx === currentQuestion.correctAnswer) {
                 stateStyle = "bg-green-500/20 border-green-500 text-green-100";
               } else if (idx === selectedAnswer) {
                 stateStyle = "bg-red-500/20 border-red-500 text-red-100";
               } else {
                 stateStyle = "opacity-50 cursor-not-allowed border-transparent";
               }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className={`p-4 rounded-lg border text-left transition-all ${stateStyle}`}
              >
                <span className="font-mono text-xs mr-3 opacity-50">[{String.fromCharCode(65 + idx)}]</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 min-h-[80px]">
        <div className="flex-1 w-full">
          {selectedAnswer !== null && (
            <div className="animate-fade-in space-y-4">
              <div className={`text-lg font-medium ${selectedAnswer === currentQuestion.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                {selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Incorrect."}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setShowExplanation(!showExplanation)} className="text-sm text-java-400 underline">
                   {showExplanation ? "Hide Info" : "Show Info"}
                 </button>
              </div>
              {(showExplanation) && (
                <div className="bg-slate-900/50 p-4 rounded border border-slate-700/50 text-sm text-slate-300 mt-2">
                   {showExplanation && <p>{currentQuestion.explanation}</p>}
                </div>
              )}
            </div>
          )}
        </div>
        <Button onClick={handleNext} disabled={selectedAnswer === null}>
          {isLastQuestion ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );

  const ResultsView = () => {
    const percentage = Math.round((score / activeQuestions.length) * 100);
    const passed = percentage >= 65;

    return (
      <div className="max-w-3xl mx-auto p-6 min-h-screen flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="mb-8">
          <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</div>
          <div className="text-slate-400 text-xl">Score: {score} / {activeQuestions.length}</div>
        </div>
        <div className="w-full bg-slate-800 rounded-xl overflow-hidden mb-8 text-left">
           <div className="p-4 bg-slate-900 border-b border-slate-700 font-semibold text-slate-300">Incorrect Answers</div>
           <div className="max-h-96 overflow-y-auto">
             {history.filter(h => !h.correct).length === 0 ? (
               <div className="p-8 text-center text-slate-500 italic">Perfect!</div>
             ) : (
               history.map((h, i) => {
                 if (h.correct) return null;
                 const q = activeQuestions.find(qu => qu.id === h.qId);
                 if (!q) return null;
                 return (
                   <div key={i} className="p-4 border-b border-slate-700/50">
                     <div className="text-sm text-slate-400">Q: {q.question}</div>
                     <div className="text-xs font-mono text-green-400">Ans: {q.options[q.correctAnswer]}</div>
                   </div>
                 );
               })
             )}
           </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setGameState('server_list')} variant="secondary">Back to Files</Button>
          <Button onClick={() => setGameState('menu')} variant="primary">Main Menu</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      {gameState === 'menu' && <MenuView />}

      {gameState === 'server_list' && <ServerListView />}
      {gameState === 'playing' && <QuizView />}
      {gameState === 'results' && <ResultsView />}
    </div>
  );
}