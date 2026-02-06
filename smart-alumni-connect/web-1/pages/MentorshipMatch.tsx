
import React, { useState, useRef, useEffect } from 'react';
import { analyzeAudioMentorship } from '../services/geminiService';
import { MOCK_ALUMNI } from '../constants';
import { Alum } from '../types';

interface Props {
  onChatStart: (alum: Alum) => void;
}

const MentorshipMatch: React.FC<Props> = ({ onChatStart }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [matches, setMatches] = useState<(Alum & { score: number, vibe: string[] })[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const supportedMimeType = useRef<string>('audio/webm');

  useEffect(() => {
    // Detect supported mime types for cross-browser compatibility (Safari vs Chrome)
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        supportedMimeType.current = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        supportedMimeType.current = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        supportedMimeType.current = 'audio/ogg';
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    // Check if we are in a secure context (localhost or https)
    if (!window.isSecureContext) {
      alert("Microphone access requires a Secure Context (HTTPS or localhost). Please check your URL.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = { mimeType: supportedMimeType.current };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: supportedMimeType.current });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAnalysisResult(null);
      setMatches([]);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Recording error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone permission was denied. Please enable it in your browser settings.");
      } else {
        alert(`Mic Error: ${err.message || "Could not start recording"}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      const base64 = await blobToBase64(blob);
      const result = await analyzeAudioMentorship(base64, supportedMimeType.current);
      setAnalysisResult(result);

      const scoredMatches = MOCK_ALUMNI.map(alum => {
        const keywordMatches = (result.keywords || []).filter((kw: string) => 
          alum.skills.some(s => s.toLowerCase().includes(kw.toLowerCase())) ||
          alum.industry.toLowerCase().includes(kw.toLowerCase())
        ).length;
        
        const score = Math.min(99, (result.matchingScoreHint || 50) + (keywordMatches * 10));
        return {
          ...alum,
          score,
          vibe: [result.personalityTraits?.[0] || 'Ambitious', alum.industry]
        };
      }).sort((a, b) => b.score - a.score);

      setMatches(scoredMatches.slice(0, 3));
    } catch (error) {
      console.error("Processing error:", error);
      alert("AI Analysis failed. Check if your API Key is valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto pb-24">
      <header className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-100 mb-2">
          Multimodal AI Engine
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">Vibe Check.</h1>
        <p className="text-slate-500 text-xl font-light max-w-2xl mx-auto">
          Recording your professional aura. Our AI decodes your intent to find the elite mentors who speak your language.
        </p>
      </header>

      {/* Recording Interface */}
      <section className="flex flex-col items-center py-10">
        <div className="relative">
          {isRecording && (
            <>
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping -z-10" />
              <div className="absolute inset-[-20px] bg-indigo-500/10 rounded-full animate-pulse -z-20" />
            </>
          )}
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
            className={`w-48 h-48 rounded-[3.5rem] flex flex-col items-center justify-center transition-all shadow-[0_40px_100px_rgba(79,70,229,0.2)] hover:shadow-[0_40px_120px_rgba(79,70,229,0.4)] relative overflow-hidden ${
              isRecording 
                ? 'bg-red-500 scale-110' 
                : 'bg-indigo-600 hover:scale-105 active:scale-95'
            } disabled:opacity-50 disabled:scale-100 group`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-5xl mb-3 relative z-10">{isRecording ? '⏹️' : '🎙️'}</span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white relative z-10">
              {isRecording ? `00:${recordingTime.toString().padStart(2, '0')}` : 'Listen to Vibe'}
            </span>
          </button>
        </div>
        
        <p className="mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          {isRecording ? 'Capturing professional signature...' : isAnalyzing ? 'Neural Processing Active...' : 'Speak for 10s about your struggle'}
        </p>
      </section>

      {/* Analysis Output & Results */}
      {isAnalyzing ? (
        <div className="max-w-md mx-auto space-y-8 text-center py-10">
          <div className="flex justify-center gap-1 h-8 items-end">
            {[1,2,3,4,5,4,3,2,1].map((h, i) => (
              <div key={i} className="w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ height: `${h * 20}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-indigo-600 font-bold text-sm">Decoding semantic patterns...</p>
        </div>
      ) : matches.length > 0 && (
        <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center">
            {analysisResult && (
              <div className="bg-slate-950 text-white p-10 rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] w-full md:w-auto min-w-[350px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">✨</div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Acoustic Fingerprint</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">Detected Intent</p>
                    <p className="text-xl font-light italic text-white/90 leading-relaxed truncate">"{analysisResult.transcript}"</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords && analysisResult.keywords.map((kw: string) => (
                      <span key={kw} className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[9px] font-black uppercase border border-indigo-500/20 text-indigo-300">{kw}</span>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Tone Analysis</p>
                    <p className="text-2xl font-black tracking-tighter">{analysisResult.personalityTraits?.join(' & ')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em]">Top Pairings Found</h2>
            <div className="h-0.5 w-24 bg-slate-100 mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {matches.map((alum, idx) => (
              <div key={alum.id} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${idx === 0 ? 'from-indigo-500 to-pink-500' : 'from-slate-200 to-slate-300'} rounded-[3.5rem] blur opacity-20 group-hover:opacity-100 transition duration-1000`}></div>
                <div className="relative bg-white rounded-[3.2rem] p-10 border border-slate-100 flex flex-col items-center text-center shadow-sm group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  
                  <div className="relative mb-8">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden p-1 bg-gradient-to-br from-indigo-100 to-pink-100">
                      <img src={alum.avatar} className="w-full h-full rounded-[2.3rem] object-cover ring-4 ring-white" alt={alum.name} />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-950 rounded-2xl flex flex-col items-center justify-center border-[6px] border-white shadow-2xl group-hover:rotate-6 transition-transform">
                      <span className="text-[8px] font-black text-indigo-400 uppercase leading-none mb-1">Match</span>
                      <span className="text-lg font-black text-white">{alum.score}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{alum.name}</h3>
                    <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">{alum.role}</p>
                    <p className="text-slate-400 text-xs font-medium">@{alum.company}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {alum.vibe.map(v => (
                      <span key={v} className="px-4 py-1.5 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{v}</span>
                    ))}
                  </div>

                  <button 
                    onClick={() => onChatStart(alum)}
                    className="w-full py-5 bg-slate-950 text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    🚀 Initiate Sync
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && !isRecording && !isAnalyzing && (
        <div className="flex justify-center opacity-30">
          <div className="w-1 h-12 bg-slate-100 rounded-full" />
        </div>
      )}
    </div>
  );
};

export default MentorshipMatch;
