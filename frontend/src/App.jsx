import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Upload, FileText, Bot, User, CheckCircle2, Terminal, Activity, Zap, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch uploaded file list on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get('http://localhost:8000/files');
      setFileList(res.data.files);
    } catch (err) {
      console.error('Failed to fetch file list');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus('Syncing document into Neural Chroma Vault...');
    try {
      const res = await axios.post('http://localhost:8000/upload', formData);
      setUploadStatus(res.data.message);
      setFile(null);
      fetchFiles();
    } catch (err) {
      setUploadStatus('Upload failed. Check backend console.');
    }
  };

  const handleDelete = async (filename) => {
    try {
      await axios.delete(`http://localhost:8000/files/${filename}`);
      fetchFiles();
      setUploadStatus(`Removed ${filename} from vault.`);
    } catch (err) {
      console.error('Failed to delete file');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/chat', { question: userMessage.text });
      const botMessage = { sender: 'bot', text: res.data.answer, sources: res.data.sources };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error fetching response. Ensure at least one PDF is in the vault.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#05050a] text-purple-100 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Sidebar Document Vault */}
      <aside className="w-88 bg-[#0a0a12]/90 backdrop-blur-2xl p-6 flex flex-col border-r border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.05)] overflow-y-auto">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-fuchsia-500 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-widest bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-500 bg-clip-text text-transparent uppercase">
              Vortex AI
            </h1>
            <p className="text-[10px] text-purple-400/80 font-bold tracking-widest uppercase">Multi-Doc Vault v2.5</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-purple-400/70 mb-2 block flex items-center gap-1.5">
              <Terminal size={12} /> Add Document
            </label>
            <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-4 text-center transition bg-purple-950/10 relative group cursor-pointer shadow-inner">
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 group-hover:scale-110 transition duration-300">
                  <Upload className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-xs font-medium text-purple-200 truncate max-w-[200px]">
                  {file ? file.name : "Select PDF Document"}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleUpload} 
            disabled={!file}
            className={`w-full py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl transition duration-300 ${
              file 
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer' 
                : 'bg-slate-900/80 text-purple-900 cursor-not-allowed border border-purple-950'
            }`}
          >
            <FileText size={16} /> Sync to Vault
          </button>

          {uploadStatus && (
            <div className="p-3 rounded-xl text-xs bg-purple-950/60 border border-purple-500/30 text-purple-200 flex items-start gap-2 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{uploadStatus}</p>
            </div>
          )}

          {/* Document Library List */}
          <div className="pt-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-purple-400/70 mb-2.5 block">
              Active Vault Files ({fileList.length})
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {fileList.length === 0 ? (
                <p className="text-xs text-purple-500 italic p-2 bg-purple-950/10 rounded-xl text-center border border-purple-900/20">
                  No documents in vault.
                </p>
              ) : (
                fileList.map((filename, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#05050a]/80 border border-purple-500/20 px-3 py-2.5 rounded-xl text-xs text-purple-200 shadow-inner group">
                    <span className="truncate max-w-[170px]" title={filename}>{filename}</span>
                    <button 
                      onClick={() => handleDelete(filename)}
                      className="text-purple-400 hover:text-red-400 p-1 transition cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-purple-500/10 flex items-center justify-center gap-2 text-[11px] text-purple-400/80 font-medium">
          <Zap size={13} className="text-fuchsia-400 animate-bounce" /> Multi-Doc RAG • 100% Private
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col bg-[#05050a] relative overflow-hidden">
        
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <header className="h-16 bg-[#0a0a12]/40 backdrop-blur-xl px-8 border-b border-purple-500/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.9)] animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-200/90 font-mono">
              VAULT STATUS: {fileList.length} DOCUMENT(S) ACTIVE
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-4 py-1.5 rounded-full">
            <span className="text-[10px] text-fuchsia-300 font-mono font-bold tracking-widest uppercase mr-1">NEURAL PULSE</span>
            <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce"></span>
            <span className="w-1 h-5 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 z-10">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-fuchsia-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Bot size={30} className="animate-pulse" />
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              {msg.sender === 'bot' && (
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                  <Bot size={20} />
                </div>
              )}
              
              <div className={`max-w-2xl rounded-2xl px-6 py-4 shadow-2xl ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium rounded-tr-xs shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                  : 'bg-[#0a0a12]/90 border border-purple-500/20 text-purple-100 rounded-tl-xs backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.6)]'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{msg.text}</p>
                ) : (
                  <div className="text-purple-100 text-sm leading-relaxed space-y-2.5 [&_strong]:font-bold [&_strong]:text-fuchsia-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-purple-500/20 text-[11px] text-purple-300/80 flex items-center gap-2 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.9)]"></span>
                    <span>SOURCE_REFERENCE: {msg.sources.join(', ')}</span>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0 text-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.2)]">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 items-center animate-fadeIn">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                <Bot size={20} />
              </div>
              <div className="bg-[#0a0a12]/90 border border-purple-500/20 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.1)] backdrop-blur-xl">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs text-purple-300 font-mono uppercase tracking-widest">Searching multi-doc vault...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-[#0a0a12]/40 backdrop-blur-xl border-t border-purple-500/20 z-10">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask anything across all documents in your Vortex vault..." 
              className="flex-1 bg-[#05050a]/90 border border-purple-500/30 rounded-2xl px-5.5 py-4 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-purple-100 placeholder-purple-800 shadow-inner transition font-mono" 
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className={`px-6 rounded-2xl flex items-center justify-center transition shadow-2xl ${
                input.trim() 
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold shadow-[0_0_25px_rgba(168,85,247,0.5)] cursor-pointer scale-102' 
                  : 'bg-slate-900/80 text-purple-950 cursor-not-allowed border border-purple-950'
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}

export default App;