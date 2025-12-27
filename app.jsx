import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// 📦 COMPONENT: CHECKOUT FORM (The UI with Confusion Zones)
// ============================================================================
const CheckoutForm = ({ onZonesReady, confusion }) => {
  const priceRef = useRef(null);
  const termsRef = useRef(null);
  const payRef = useRef(null);

  useEffect(() => {
    const updateZones = () => {
      // Calculate screen positions of the zones
      const zones = [
        { id: 'price-summary', ...priceRef.current?.getBoundingClientRect().toJSON() },
        { id: 'terms-cond', ...termsRef.current?.getBoundingClientRect().toJSON() },
        { id: 'pay-button', ...payRef.current?.getBoundingClientRect().toJSON() },
      ];
      onZonesReady(zones);
    };

    updateZones();
    window.addEventListener('resize', updateZones);
    return () => window.removeEventListener('resize', updateZones);
  }, [onZonesReady]);

  // Highlight logic based on the 'confusion' prop
  const getHighlightClass = (id) => 
    confusion?.isConfused && confusion.zoneId === id 
      ? "ring-4 ring-yellow-400 ring-offset-2 transition-all duration-500 shadow-2xl scale-[1.02]" 
      : "transition-all duration-500";

  return (
    <div className="glass-panel grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full">
      {/* Left Column: Form Fields */}
      <div className="space-y-6 text-gray-800">
        <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Cardholder Name" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50" />
          <input type="text" placeholder="Card Number" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50" />
          <div className="flex gap-4">
            <input type="text" placeholder="MM/YY" className="w-1/2 p-3 border border-gray-300 rounded-lg outline-none bg-white/50" />
            <input type="text" placeholder="CVC" className="w-1/2 p-3 border border-gray-300 rounded-lg outline-none bg-white/50" />
          </div>
        </div>

        {/* ZONE: Terms and Conditions */}
        <div ref={termsRef} id="terms-cond" className={`p-4 rounded-xl border border-gray-200 bg-gray-50/80 ${getHighlightClass('terms-cond')}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 h-4 w-4 text-indigo-600" />
            <span className="text-sm text-gray-600">
              I agree to the <span className="text-indigo-600 underline">Terms of Service</span>, including the non-refundable processing fee of $12.40.
            </span>
          </label>
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="space-y-6 bg-indigo-50/80 p-6 rounded-2xl border border-indigo-100">
        <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
        
        {/* ZONE: Price Summary */}
        <div ref={priceRef} id="price-summary" className={`space-y-3 ${getHighlightClass('price-summary')}`}>
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>$120.00</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Service Fee (Variable)</span>
            <span>$15.50</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (Estimated)</span>
            <span>$8.40</span>
          </div>
          <hr className="border-indigo-200 my-2" />
          <div className="flex justify-between text-2xl font-extrabold text-indigo-900">
            <span>Total</span>
            <span>$143.90</span>
          </div>
        </div>

        {/* ZONE: Pay Button */}
        <button 
          ref={payRef}
          id="pay-button"
          className={`w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 active:scale-95 transition-transform ${getHighlightClass('pay-button')}`}
        >
          Pay $143.90
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 🚀 MAIN APP COMPONENT (Logic + WebGazer + Chatbot)
// ============================================================================
const App = () => {
  // STATE
  const [hasConsent, setHasConsent] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);
  
  // LOGIC STATE
  const [zones, setZones] = useState([]); // Stores positions from CheckoutForm
  const [confusionState, setConfusionState] = useState({ isConfused: false, zoneId: null });
  const [uiStage, setUiStage] = useState('IDLE'); // IDLE | NUDGE | CHAT

  // API & CHAT STATE
  const [apiKey, setApiKey] = useState(""); 
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // 1. LOAD API KEY
  useEffect(() => {
    fetch('key.env')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        for (let line of lines) {
          if (line.trim().startsWith('GOOGLE_API_KEY=')) {
            setApiKey(line.split('=')[1].trim());
            console.log("🔑 API Key loaded");
          }
        }
      })
      .catch(err => console.error("Error loading key.env:", err));
  }, []);

  // 2. WEBGAZER SETUP
  useEffect(() => {
    if (hasConsent && window.webgazer) {
      window.webgazer.setRegression('ridge')
        .setGazeListener((data, clock) => { 
          if (data) handleGazeData(data);
        })
        .begin();

      window.webgazer.showVideoPreview(true)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false);

      // Position the video preview
      setTimeout(() => {
        const vidContainer = document.getElementById('webgazerVideoContainer');
        if (vidContainer) {
          vidContainer.style.top = '25px'; 
          vidContainer.style.right = '25px'; 
          vidContainer.style.left = 'auto';
          vidContainer.style.border = '3px solid white';
          vidContainer.style.borderRadius = '16px';
        }
      }, 1000);
    } else {
      if (window.webgazer) { try { window.webgazer.end(); } catch(e){} }
      const vid = document.getElementById('webgazerVideoContainer');
      if(vid) vid.style.display = 'none';
    }
  }, [hasConsent]);

  // 3. CONFUSION LOGIC
  const handleGazeData = (data) => {
    // In a real app, calculate dwell time here.
    // For this integration, we rely on the manual "Simulate" button 
    // or you could add intersection logic using the 'zones' state.
  };

  // 4. CHATBOT FUNCTIONS
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
  };

  const callGemini = async (userText) => {
    if (!apiKey) return "API Key missing. Please check key.env file.";
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const context = `You are a helpful assistant for a checkout page. Total: $143.90. Tax: $8.40. Fee: $15.50. Keep answers short and reassuring. User Question: ${userText}`;
    
    try {
      const res = await fetch(url, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] }) 
      });
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) { return "I'm having trouble connecting right now."; }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const userText = inputValue;
    setMessages(prev => [...prev, { type: 'user', text: userText }]);
    setInputValue("");
    setIsLoading(true);

    let reply = await callGemini(userText);
    if (!reply) reply = "I couldn't process that. Check your connection.";

    setIsLoading(false);
    setMessages(prev => [...prev, { type: 'bot', text: reply }]);
    speak(reply);
  };

  useEffect(() => { 
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages, isLoading]);

  // UI HELPERS
  const triggerSimulation = () => {
    if (uiStage === 'IDLE') {
      setUiStage('NUDGE');
      setConfusionState({ isConfused: true, zoneId: 'price-summary' }); // Highlight Price
    } else {
      setUiStage('IDLE');
      setConfusionState({ isConfused: false, zoneId: null });
    }
  };

  const handleNudgeYes = () => {
    setUiStage('CHAT');
    setMessages([{type:'bot', text:'Hi! I saw you looking at the total price. Do you have questions about the taxes or service fees?'}]);
    // Keep highlight active during chat or remove it? Let's remove it to clean up UI.
    setConfusionState({ isConfused: false, zoneId: null });
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center relative overflow-hidden bg-gradient-to-br from-[#845ec2] via-[#d65db1] to-[#ffc75f]">
      
      {/* GLOBAL STYLES FOR CHAT/NUDGE */}
      <style>{`
        .nudge-alert { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .msg { padding: 12px 16px; border-radius: 12px; font-size: 14px; color: white; margin-bottom: 8px; max-width: 85%; }
        .msg.bot { background: #334155; align-self: flex-start; }
        .msg.user { background: #4f46e5; align-self: flex-end; margin-left: auto; }
      `}</style>

      {/* CONSENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[2000] p-4">
          <div className="bg-slate-800 p-8 rounded-2xl text-center max-w-sm border border-slate-600 shadow-2xl">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Enable Guardian AI?</h2>
            <p className="text-slate-400 mb-6">We use your camera locally to detect if you get confused during checkout.</p>
            <button onClick={() => { setHasConsent(true); setModalOpen(false); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Allow Access</button>
            <button onClick={() => { setHasConsent(false); setModalOpen(false); }} className="w-full mt-3 text-slate-400 hover:text-white py-2">No thanks</button>
          </div>
        </div>
      )}

      {/* SIMULATION BUTTON */}
      {hasConsent && (
        <div className="absolute top-8 left-8 z-[100]">
          <button 
            onClick={triggerSimulation} 
            className="bg-white/20 backdrop-blur text-white font-semibold py-2 px-4 rounded-full hover:bg-white/30 transition-all shadow-lg border border-white/30"
          >
            {uiStage === 'IDLE' ? '⚠️ Simulate Confusion' : '↺ Reset Demo'}
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!modalOpen && (
        <div className="relative">
          
          {/* THE CHECKOUT FORM */}
          <CheckoutForm onZonesReady={setZones} confusion={confusionState} />

          {/* NUDGE POPUP (Positioned relative to the Price Summary zone approximately) */}
          {hasConsent && uiStage === 'NUDGE' && (
            <div className="nudge-alert absolute -top-24 -right-4 bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-2xl w-72 z-50 flex flex-col gap-3">
              <div className="text-sm font-medium text-slate-100">
                <strong>Wait, confused about the price?</strong>
                <div className="text-xs text-slate-400 mt-1">We noticed you hesitating here.</div>
              </div>
              <button 
                onClick={handleNudgeYes}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
              >
                Yes, Explain Costs
              </button>
              {/* Little arrow at bottom */}
              <div className="absolute -bottom-2 left-8 w-4 h-4 bg-slate-800 border-b border-r border-slate-600 transform rotate-45"></div>
            </div>
          )}

        </div>
      )}

      {/* CHATBOT UI */}
      {hasConsent && uiStage === 'CHAT' && (
        <div className="fixed bottom-8 right-8 z-[200] w-96 animate-[bounceUp_0.6s_ease]">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
            {/* Header */}
            <div className="bg-indigo-600 p-4 flex items-center justify-between text-white font-bold">
              <span className="flex items-center gap-2">🤖 Guardian AI</span>
              <button onClick={() => setUiStage('IDLE')} className="hover:text-indigo-200">✕</button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col bg-slate-900" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.type}`}>{m.text}</div>
              ))}
              {isLoading && <div className="msg bot italic text-slate-400">Thinking...</div>}
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
              <input 
                className="flex-1 bg-slate-700 border-none rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ask a question..." 
                value={inputValue} 
                onChange={(e)=>setInputValue(e.target.value)} 
                onKeyPress={(e)=>e.key==='Enter'&&sendMessage()} 
                autoFocus 
              />
              <button onClick={sendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors">➤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;