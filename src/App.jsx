import React, { useState, useEffect } from 'react';
import { Clipboard, AlertCircle, CheckCircle, Clock, FileText, Stamp, Briefcase, RefreshCcw } from 'lucide-react';

/* THE BUREAUCRACY 
  A game about following instructions exactly, even when they are annoying.
*/

// --- Utility: Random Generators ---

const generateID = () => Math.random().toString(36).substr(2, 9).toUpperCase();

const DEPARTMENTS = [
  "Department of Redundancy Department",
  "Bureau of Unnecessary Paperwork",
  "Ministry of Silly Walks & Forms",
  "Division of Infinite Loops",
  "Committee for Form Validation",
];

// --- Form Logic & Rules ---

// Helper to check if a number is prime
const isPrime = (num) => {
  for(let i = 2, s = Math.sqrt(num); i <= s; i++)
    if(num % i === 0) return false; 
  return num > 1;
};

// Field Generators
const generateTextField = () => {
  const types = [
    {
      label: "Applicant Name",
      instruction: "Must be in ALL CAPS",
      placeholder: "John Doe",
      validate: (val) => val && val === val.toUpperCase() && val.length > 0,
      errorMsg: "Name is not uppercase!"
    },
    {
      label: "Favorite Color",
      instruction: "Do NOT type a color. Type 'VOID' instead.",
      placeholder: "Blue...",
      validate: (val) => val === "VOID",
      errorMsg: "You typed a color (or something else). Type VOID."
    },
    {
      label: "Mother's Maiden Name",
      instruction: "Enter the number of characters in the label (20).",
      placeholder: "???",
      validate: (val) => val === "20",
      errorMsg: "Count the letters in 'Mother's Maiden Name'."
    },
    {
      label: "Emergency Code",
      instruction: "Type 'AGREE' backwards.",
      placeholder: "Code...",
      validate: (val) => val === "EERGA",
      errorMsg: "That is not AGREE backwards."
    }
  ];
  return types[Math.floor(Math.random() * types.length)];
};

const generateNumberField = () => {
  const types = [
    {
      label: "Age",
      instruction: "Must be an odd number greater than 50.",
      placeholder: "0",
      validate: (val) => { const n = parseInt(val); return !isNaN(n) && n > 50 && n % 2 !== 0; },
      errorMsg: "Age must be odd and > 50."
    },
    {
      label: "Years of Experience",
      instruction: "Enter a negative number.",
      placeholder: "0",
      validate: (val) => parseInt(val) < 0,
      errorMsg: "We require negative experience."
    },
    {
      label: "Reference ID",
      instruction: "Enter the current year + 5.",
      placeholder: "Year",
      validate: (val) => parseInt(val) === new Date().getFullYear() + 5,
      errorMsg: "Math error. Year + 5."
    }
  ];
  return types[Math.floor(Math.random() * types.length)];
};

const generateSelectField = () => {
  const types = [
    {
      label: "Reason for Visit",
      options: ["Business", "Pleasure", "Audit", "Espionage"],
      instruction: "Select the option that starts with 'E'.",
      validate: (val) => val === "Espionage",
      errorMsg: "Select the one starting with E."
    },
    {
      label: "Clearance Level",
      options: ["Level 1", "Level 2", "Level 3", "Top Secret"],
      instruction: "Select the LAST option.",
      validate: (val) => val === "Top Secret",
      errorMsg: "Select the last option."
    },
    {
      label: "Coffee Preference",
      options: ["Black", "Latte", "None", "Water"],
      instruction: "Select 'Water'. Coffee is for closers.",
      validate: (val) => val === "Water",
      errorMsg: "You are not a closer. Select Water."
    }
  ];
  return types[Math.floor(Math.random() * types.length)];
};

const generateCheckboxField = () => {
  const types = [
    {
      label: "I am a Robot",
      instruction: "Check this box.",
      validate: (val) => val === true,
      errorMsg: "You must admit you are a robot."
    },
    {
      label: "Subscribe to Newsletter",
      instruction: "Do NOT check this box.",
      validate: (val) => val === false,
      errorMsg: "Do not subscribe!"
    },
    {
      label: "Terms of Service",
      instruction: "Check this box if 2 + 2 = 4.",
      validate: (val) => val === true,
      errorMsg: "Math is fundamental. Check the box."
    }
  ];
  return types[Math.floor(Math.random() * types.length)];
};

// Level Generator
const generateForm = (difficulty) => {
  const fields = [];
  const fieldTypes = [generateTextField, generateNumberField, generateSelectField, generateCheckboxField];
  
  // Difficulty determines number of fields (3 to 6)
  const numFields = Math.min(3 + Math.floor(difficulty / 2), 6);
  
  for (let i = 0; i < numFields; i++) {
    const randomType = fieldTypes[Math.floor(Math.random() * fieldTypes.length)];
    const fieldConfig = randomType();
    
    fields.push({
      id: generateID(),
      ...fieldConfig,
      value: fieldConfig.options ? fieldConfig.options[0] : (fieldConfig.label.includes("Checkbox") || fieldConfig.instruction.includes("box") ? false : "")
    });
  }
  
  return {
    id: generateID(),
    department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
    fields: fields
  };
};


// --- Components ---

const ProgressBar = ({ value, max, color = "bg-green-600", label }) => (
  <div className="flex flex-col w-full mb-2">
    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
      <span>{label}</span>
      <span>{Math.round((value / max) * 100)}%</span>
    </div>
    <div className="h-4 w-full bg-stone-300 border-2 border-stone-600 overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-300`} 
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      />
    </div>
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
  const [sanity, setSanity] = useState(100);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [currentForm, setCurrentForm] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'success', message: string }
  const [stampAnim, setStampAnim] = useState(null); // 'approved' | 'rejected'

  // Game Loop Timer
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setSanity(100);
    setScore(0);
    setTimer(45); // Initial time
    loadNewForm(0);
  };

  const loadNewForm = (difficulty) => {
    const newForm = generateForm(difficulty);
    setCurrentForm(newForm);
    
    // Initialize values
    const initialValues = {};
    newForm.fields.forEach(f => {
      // Checkboxes default to false, selects default to first option, text defaults to empty string
      if (f.label.includes("Checkbox") || f.instruction.includes("box")) {
          initialValues[f.id] = false;
      } else if (f.options) {
          initialValues[f.id] = f.options[0];
      } else {
          initialValues[f.id] = "";
      }
    });
    setFormValues(initialValues);
    setFeedback(null);
    setStampAnim(null);
  };

  const handleInputChange = (id, value) => {
    setFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleTimeOut = () => {
    setFeedback({ type: 'error', message: "TIMEOUT! STRIKE INCURRED." });
    setSanity(prev => prev - 20);
    if (sanity - 20 <= 0) {
      endGame();
    } else {
      // Penalty time logic or forced new form
      loadNewForm(score);
      setTimer(30);
    }
  };

  const validateForm = () => {
    if (!currentForm) return;

    let isValid = true;
    let firstError = "";

    for (const field of currentForm.fields) {
      const userVal = formValues[field.id];
      // Special check for Select elements to ensure they match logic even if user didn't change default
      if (!field.validate(userVal)) {
        isValid = false;
        firstError = field.errorMsg;
        break;
      }
    }

    if (isValid) {
      // SUCCESS
      setScore(prev => prev + 1);
      setSanity(prev => Math.min(100, prev + 10)); // Heal sanity
      setTimer(prev => Math.min(60, prev + 15)); // Add time
      setStampAnim('approved');
      setFeedback({ type: 'success', message: "FORM APPROVED. NEXT." });
      
      setTimeout(() => {
        loadNewForm(score + 1);
      }, 800);

    } else {
      // FAILURE
      setSanity(prev => prev - 15);
      setFeedback({ type: 'error', message: `REJECTED: ${firstError}` });
      setStampAnim('rejected');
      
      if (sanity - 15 <= 0) {
        setTimeout(endGame, 500);
      } else {
         // Clear stamp after a bit so they can retry or see they failed
         setTimeout(() => setStampAnim(null), 1000);
      }
    }
  };

  const endGame = () => {
    setGameState('gameOver');
  };

  // --- RENDERERS ---

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-stone-200 text-stone-900 font-mono flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-100 border-4 border-stone-800 p-8 shadow-2xl relative">
            <div className="absolute -top-6 -left-6 bg-red-800 text-white p-2 rotate-12 border-2 border-white shadow-lg font-bold text-xl">
                URGENT
            </div>
          <div className="text-center mb-8">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-stone-700" />
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">The Bureaucracy</h1>
            <p className="text-stone-600 italic">"Accuracy is mandatory. Sanity is optional."</p>
          </div>
          
          <div className="space-y-4 mb-8 text-sm border-t-2 border-b-2 border-stone-300 py-4">
            <p className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-700"/> Follow the RED instructions exactly.</p>
            <p className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-700"/> Ignore your common sense.</p>
            <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-blue-700"/> Do not let the timer expire.</p>
          </div>

          <button 
            onClick={startGame}
            className="w-full bg-stone-800 text-stone-100 py-4 text-xl font-bold hover:bg-stone-700 transition-colors border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            CLOCK IN
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-red-900 text-stone-100 font-mono flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-100 text-stone-900 border-4 border-black p-8 shadow-2xl text-center">
            <div className="mb-6">
                <Stamp className="w-24 h-24 mx-auto text-red-600 rotate-12 opacity-80" />
            </div>
            <h2 className="text-5xl font-black text-red-700 mb-2 uppercase">FIRED</h2>
            <p className="text-xl mb-6 font-bold">You lost your mind.</p>
            
            <div className="bg-stone-200 p-4 mb-6 border-2 border-stone-400">
                <p className="text-sm uppercase text-stone-500">Total Forms Processed</p>
                <p className="text-4xl font-black">{score}</p>
            </div>

            <button 
                onClick={() => setGameState('menu')}
                className="w-full bg-stone-800 text-white py-3 font-bold hover:bg-stone-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
                REAPPLY FOR JOB
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-300 font-mono p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-[#f0f0e0] border-2 border-stone-400 shadow-2xl relative min-h-[600px] flex flex-col">
        
        {/* HEADER BAR */}
        <div className="bg-stone-800 text-stone-100 p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="font-bold tracking-widest">FORM-OS v1.0</span>
            </div>
            <div className="text-xs text-stone-400">ID: {currentForm?.id}</div>
        </div>

        {/* STATS BAR */}
        <div className="bg-stone-200 p-4 border-b-4 border-stone-300 flex gap-6 sticky top-0 z-10">
            <div className="flex-1">
                <ProgressBar value={sanity} max={100} label="Sanity" color={sanity < 30 ? "bg-red-600" : "bg-blue-600"} />
            </div>
            <div className="flex-1">
                <ProgressBar value={timer} max={60} label="Time Limit" color={timer < 10 ? "bg-red-500 animate-pulse" : "bg-amber-500"} />
            </div>
            <div className="flex flex-col items-center justify-center border-l-2 border-stone-400 pl-4">
                <span className="text-xs font-bold uppercase text-stone-500">Score</span>
                <span className="text-2xl font-black leading-none">{score}</span>
            </div>
        </div>

        {/* MAIN FORM AREA */}
        <div className="p-6 md:p-8 flex-1 relative overflow-hidden">
            
            {/* STAMP ANIMATION OVERLAY */}
            {stampAnim && (
                <div className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-200`}>
                    <div className={`
                        border-[10px] rounded-lg p-4 text-6xl font-black uppercase -rotate-12 opacity-90
                        ${stampAnim === 'approved' ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'}
                    `}>
                        {stampAnim}
                    </div>
                </div>
            )}

            <div className="mb-6 border-b-2 border-stone-300 pb-2">
                <h2 className="text-xl font-bold uppercase text-stone-800">{currentForm?.department}</h2>
                <p className="text-xs text-stone-500">Please complete all fields accurately. Errors will be punished.</p>
            </div>

            <div className="space-y-6">
                {currentForm?.fields.map((field) => (
                    <div key={field.id} className="bg-white p-4 border border-stone-300 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <label className="font-bold text-stone-800 text-lg">{field.label}</label>
                            {/* THE TRICKY PART: The Instruction */}
                            <div className="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 border border-red-200 max-w-[50%] text-right leading-tight">
                                {field.instruction}
                            </div>
                        </div>

                        {/* INPUT RENDERER */}
                        {field.options ? (
                            <select 
                                className="w-full bg-stone-50 border-2 border-stone-400 p-2 font-mono focus:outline-none focus:border-stone-800 focus:bg-white transition-colors"
                                value={formValues[field.id] || field.options[0]}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                            >
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : typeof formValues[field.id] === 'boolean' || field.label.includes("Checkbox") ? (
                            <div className="flex items-center gap-3 mt-2">
                                <input 
                                    type="checkbox" 
                                    id={field.id}
                                    className="w-6 h-6 border-2 border-stone-400 text-stone-800 focus:ring-stone-800"
                                    checked={!!formValues[field.id]}
                                    onChange={(e) => handleInputChange(field.id, e.target.checked)}
                                />
                                <label htmlFor={field.id} className="text-sm text-stone-500">I confirm the above.</label>
                            </div>
                        ) : (
                            <input 
                                type="text"
                                className="w-full bg-stone-50 border-b-2 border-stone-400 p-2 font-mono focus:outline-none focus:border-stone-800 focus:bg-white transition-colors"
                                placeholder={field.placeholder}
                                value={formValues[field.id] || ""}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* FEEDBACK MSG */}
            {feedback && (
                <div className={`mt-6 p-3 text-center font-bold text-sm uppercase tracking-wide border-2 ${feedback.type === 'error' ? 'bg-red-100 text-red-800 border-red-800' : 'bg-green-100 text-green-800 border-green-800'}`}>
                    {feedback.message}
                </div>
            )}

            {/* ACTION BAR */}
            <div className="mt-8 pt-4 border-t-2 border-stone-300 flex justify-end gap-4">
                <button 
                    onClick={() => {
                        setSanity(prev => prev - 10);
                        loadNewForm(score);
                    }}
                    className="px-4 py-2 text-stone-500 font-bold text-xs uppercase hover:text-stone-800 flex items-center gap-2"
                >
                    <RefreshCcw className="w-3 h-3" /> Skip (Penalty)
                </button>
                <button 
                    onClick={validateForm}
                    className="bg-stone-800 text-white px-8 py-3 font-bold text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                >
                    <Stamp className="w-5 h-5" /> Submit Form
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}