import React, { useState, useEffect, useRef } from 'react';

const App = () => {
    // STATE
    const [hasConsent, setHasConsent] = useState(false);
    const [modalOpen, setModalOpen] = useState(true);
    const [uiStage, setUiStage] = useState('IDLE'); 
    
    // API & CHAT
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Load Key from Vite Environment (Professional Way)
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

    // =========================================================================
    // 👨‍💻 MEMBER 1 AREA: WEBCAM INITIALIZATION
    // =========================================================================
    useEffect(() => {
        if (hasConsent && window.webgazer) {
            
            // --- [START] MEMBER 1 CODE ---
            window.webgazer.setRegression('ridge')
                .setGazeListener((data, clock) => { 
                    if (data) {
                        handleGazeData(data); // Calls Member 2's Logic
                    }
                })
                .begin();
            // --- [END] MEMBER 1 CODE ---

            window.webgazer.showVideoPreview(true)
                .showPredictionPoints(false)
                .showFaceOverlay(false)
                .showFaceFeedbackBox(false);

            setTimeout(() => {
                const vidContainer = document.getElementById('webgazerVideoContainer');
                if (vidContainer) {
                    vidContainer.style.top = '25px'; 
                    vidContainer.style.right = '25px'; 
                    vidContainer.style.left = 'auto'; 
                    vidContainer.style.display = 'block';
                }
            }, 1000);

        } else {
            if (window.webgazer) { try { window.webgazer.end(); } catch(e){} }
            const vid = document.getElementById('webgazerVideoContainer');
            if(vid) vid.style.display = 'none';
        }
    }, [hasConsent]);

    // =========================================================================
    // 👨‍💻 MEMBER 2 AREA: CONFUSION DETECTION LOGIC
    // =========================================================================
    const handleGazeData = (data) => {
        const x = data.x;
        const y = data.y;
        // --- [START] MEMBER 2 CODE ---
        // Example: setUiStage('NUDGE') if confused
        // --- [END] MEMBER 2 CODE ---
    };

    // =========================================================================
    // 👨‍💻 MEMBER 3 AREA: CHATBOT & GEMINI
    // =========================================================================
    
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.onstart = () => setIsSpeaking(true);
            u.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(u);
        }
    };

    const callGemini = async (userText) => {
        if (!apiKey) {
            console.warn("API Key missing.");
            return "Error: No API Key found in .env file";
        }
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        const context = `You are a helpful assistant for a checkout page. Total: $216.90. Tax: $12.40. Fee: $5.50. Keep answers short. User Question: ${userText}`;
        
        try {
            const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] }) });
            const data = await res.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (e) { 
            console.error("API Error", e);
            return null; 
        }
    };

    const sendMessage = async () => {
        if (!inputValue.trim()) return;
        const userText = inputValue;
        setMessages(prev => [...prev, { type: 'user', text: userText }]);
        setInputValue("");
        setIsLoading(true);

        let reply = await callGemini(userText);
        
        if (!reply) {
            await new Promise(r => setTimeout(r, 800)); 
            reply = "I'm having trouble connecting. The total is $216.90.";
        }

        setIsLoading(false);
        setMessages(prev => [...prev, { type: 'bot', text: reply }]);
        speak(reply);
    };

    useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

    // UI Handlers
    const handleAllow = () => { setHasConsent(true); setModalOpen(false); };
    const handleDeny = () => { setHasConsent(false); setModalOpen(false); };

    return (
        <div style={{width:'100%', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>

            {/* CONSENT MODAL */}
            {modalOpen && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}>
                    <div style={{background:'#1e293b', padding:'40px', borderRadius:'20px', textAlign:'center', width:'400px', border:'1px solid #475569'}}>
                        <h1 style={{fontSize:'50px', margin:0}}>🛡️</h1>
                        <h2>Enable Guardian AI?</h2>
                        <p style={{color:'#94a3b8', marginBottom:'25px'}}>We use your camera locally to assist you if you get confused. <br/><br/><strong>Allow access for the full demo experience.</strong></p>
                        <button style={{background:'#4f46e5', color:'white', border:'none', padding:'14px', borderRadius:'8px', cursor:'pointer', width:'100%', fontWeight:'600'}} onClick={handleAllow}>Allow Access</button>
                        <button style={{background:'transparent', color:'#94a3b8', border:'1px solid #334155', padding:'10px', borderRadius:'8px', cursor:'pointer', width:'100%', marginTop:'10px'}} onClick={handleDeny}>No thanks</button>
                    </div>
                </div>
            )}

            {/* MAIN UI */}
            {!modalOpen && (
                <>
                    {/* DEMO TRIGGER */}
                    {hasConsent && (
                        <div style={{position:'absolute', top:30, left:80, zIndex:100}}>
                            <button onClick={() => setUiStage(uiStage==='IDLE'?'NUDGE':'IDLE')} style={{background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold'}}>
                                {uiStage==='IDLE' ? '⚠️ Simulate Confusion' : '↺ Reset'}
                            </button>
                        </div>
                    )}

                    <div className="glass-panel">
                        <div>
                            <h2>Payment Details</h2>
                            <input className="field" type="text" placeholder="Cardholder Name" />
                            <input className="field" type="text" placeholder="Card Number" />
                            <div style={{display:'flex', gap:'15px'}}>
                                <input className="field" type="text" placeholder="MM/YY" />
                                <input className="field" type="text" placeholder="CVC" />
                            </div>
                        </div>

                        <div>
                            <h2>Order Summary</h2>
                            <div style={{background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative'}}>
                                
                                {/* NUDGE POPUP */}
                                {hasConsent && uiStage === 'NUDGE' && (
                                    <div className="nudge-alert">
                                        <div style={{fontSize:'14px', color:'#f1f5f9', fontWeight:'500'}}>
                                            <strong>Need help with the price?</strong><br/>
                                            <span style={{fontSize:'12px', opacity:0.8}}>We noticed you paused here.</span>
                                        </div>
                                        <button style={{background:'#4f46e5', color:'white', border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer', width:'100%', fontWeight:'600', fontSize:'13px'}} onClick={() => { setUiStage('CHAT'); setMessages([{type:'bot', text:'Hi! I saw you hesitating on the total. Can I explain the taxes or fees?'}]); }}>Yes, Explain Costs</button>
                                    </div>
                                )}

                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', color:'#e2e8f0'}}><span>Subtotal</span><span>$199.00</span></div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', color:'#e2e8f0'}}><span>Service Fee</span><span>$5.50</span></div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', color:'#e2e8f0'}}><span>Tax (5%)</span><span>$12.40</span></div>
                                <div style={{color: '#f9f871', fontWeight: '800', fontSize: '24px', marginTop: '25px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px'}}><span>Total Due</span><span>$216.90</span></div>
                            </div>
                            <button style={{width:'100%', padding:'16px', background:'#10b981', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', fontSize:'16px', cursor:'pointer', marginTop:'20px'}}>Pay Securely</button>
                        </div>
                    </div>
                </>
            )}

            {/* CHATBOT UI */}
            {hasConsent && uiStage === 'CHAT' && (
                <div className="chatbot-container">
                    <div className="chat-card">
                        <div style={{background:'#4f46e5', padding:'18px', display:'flex', alignItems:'center', gap:'12px', color:'white'}}>
                            <span>🤖 Guardian AI</span>
                            <span style={{marginLeft:'auto', cursor:'pointer'}} onClick={() => setUiStage('IDLE')}>✕</span>
                        </div>
                        <div className="chat-body" ref={scrollRef}>
                            {messages.map((m, i) => (
                                <div key={i} className={`msg ${m.type}`}>{m.text}</div>
                            ))}
                            {isLoading && <div className="msg bot" style={{fontStyle:'italic'}}>Thinking...</div>}
                        </div>
                        <div style={{padding:'15px', borderTop:'1px solid #334155', display:'flex', background:'#1e293b'}}>
                            <input style={{background:'transparent', border:'none', color:'white', flex:1, outline:'none', fontSize:'14px'}} placeholder="Ask a question..." value={inputValue} onChange={(e)=>setInputValue(e.target.value)} onKeyPress={(e)=>e.key==='Enter'&&sendMessage()} autoFocus />
                            <button onClick={sendMessage} style={{background:'#4f46e5', border:'none', color:'white', borderRadius:'8px', width:'40px', cursor:'pointer'}}>➤</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;