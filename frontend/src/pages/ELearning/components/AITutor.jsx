import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, Loader2, Sparkles } from 'lucide-react';
import api from '../../../utils/api';

const AITutor = ({ embedded = false, context = '' }) => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: embedded 
        ? `Hello! I can help you with your studies${context ? ` in ${context}` : ''}. Ask me anything!` 
        : 'Hello! I am your AI Study Buddy. Ask me anything about your chapters or topics, and I will explain them to you!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai-tutor/ask', { 
        question: userMessage.content,
        context: context 
      });
      const aiMessage = { role: 'ai', content: data.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error while processing your request. Please try again later.';
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col ${embedded ? 'h-[600px] rounded-xl border border-slate-200' : 'h-[calc(100vh-6rem)]'} bg-slate-50`}>
      {/* Header Section */}
      {!embedded && (
      <div className="text-center py-8 px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">24/7 Study Help Made Easy</h1>
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <span className="flex items-center gap-1">
            <Bot size={20} className="text-indigo-600" />
            <span className="font-semibold text-indigo-600">AI Tutor</span> for Quick Answers
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <User size={20} className="text-amber-600" />
            <span className="font-semibold text-amber-600">Human Tutors</span> for Deep Understanding
          </span>
        </div>
      </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
              }`}>
                {msg.role === 'ai' ? <Bot size={24} /> : <User size={24} />}
              </div>
              
              <div className={`rounded-2xl p-4 max-w-[80%] ${
                msg.role === 'ai' 
                  ? 'bg-white shadow-sm border border-slate-100 text-slate-700' 
                  : 'bg-indigo-600 text-white'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={24} />
              </div>
              <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-4 flex items-center gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <button 
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Attach file (Coming Soon)"
            >
              <Paperclip size={20} />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl px-6 py-3 font-medium transition-colors flex items-center gap-2"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
