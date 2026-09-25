import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Sparkles, 
  Send, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  ServerOff,
  Copy,
  Check
} from 'lucide-react';

interface ToolCall {
  name: string;
  args: Record<string, any>;
  failed: boolean;
}

interface UnavailableServer {
  address: string;
  reason: string;
}

interface AskResponse {
  answer: string;
  tool_calls: ToolCall[];
  unavailable: UnavailableServer[];
  model: string;
  answered_at: string;
}

export const AskPanel: React.FC = () => {
  const { isDark } = useTheme();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<{ status?: number; message: string; reason?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const samplePrompts = [
    'What is the recent resale price of a 4-room flat in Tampines?',
    'Search address and postal code for 101 Ang Mo Kio Ave 3',
    'What walking route is available from 1.3698,103.8400 to 1.3500,103.8500?',
    'What are the most recent 3-room HDB transactions under $450,000 in Bedok?',
  ];

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 500 || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({
          status: res.status,
          message: data.error || 'Failed to process request',
          reason: data.reason,
        });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError({
        status: 500,
        message: err.message || 'Network error connecting to /api/ask',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAnswer = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ask Housing &amp; Map Agent
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Autonomous Gemini 3.8 Flash agent powered by live Model Context Protocol (MCP) servers (OneMap SG &amp; data.gov.sg).
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MCP Connected</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAsk} className="mt-6 space-y-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              rows={3}
              maxLength={500}
              placeholder="Ask anything about Singapore HDB resale prices, addresses, or travel routes (max 500 chars)..."
              disabled={loading}
              className={`w-full p-4 rounded-xl border text-sm resize-none focus:outline-none transition-all ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-inner'
              }`}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-3">
              <span className={`text-[11px] font-mono ${
                question.length > 450 
                  ? 'text-amber-500 font-bold' 
                  : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {question.length}/500
              </span>
              <button
                type="submit"
                disabled={loading || !question.trim() || question.length > 500}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  loading 
                    ? 'bg-rose-500 animate-pulse' 
                    : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Agent Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className={`text-[11px] font-medium mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Try:
            </span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(p)}
                disabled={loading}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-rose-500/50 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 shadow-2xs'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error Card */}
      {error && (
        <div className={`p-5 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
          isDark 
            ? 'bg-rose-950/30 border-rose-900/60 text-rose-200' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>Request Failed</span>
                {error.status && (
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    HTTP {error.status}
                  </span>
                )}
              </div>
              <p className="text-xs">{error.message}</p>
              {error.reason && (
                <p className="text-[11px] font-mono text-rose-400/90 mt-1">Reason: {error.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Answer & Results Section */}
      {result && (
        <div className={`rounded-2xl border overflow-hidden transition-colors animate-in fade-in duration-300 ${
          isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Top Result Banner */}
          <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'
          }`}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                <Sparkles className="w-4 h-4" />
                Agent Response
              </span>
              <span className="text-slate-400">•</span>
              <span className={`text-[11px] font-mono flex items-center gap-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                {result.model}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-mono flex items-center gap-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {new Date(result.answered_at).toLocaleTimeString()}
              </span>
              <button
                onClick={copyAnswer}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Copy Answer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Answer Body */}
          <div className="p-6">
            <div className={`prose max-w-none text-sm leading-relaxed whitespace-pre-wrap ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {result.answer}
            </div>
          </div>

          {/* Tools Called Section */}
          <div className={`px-6 py-5 border-t space-y-3 ${
            isDark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Wrench className="w-3.5 h-3.5 text-rose-500" />
                <span>Tools Called by Agent ({result.tool_calls?.length || 0})</span>
              </h3>
            </div>

            {result.tool_calls && result.tool_calls.length > 0 ? (
              <div className="space-y-2">
                {result.tool_calls.map((call, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs transition-colors ${
                      isDark 
                        ? 'bg-slate-900/80 border-slate-700/80' 
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-500 font-mono font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-rose-500 text-xs">
                          {call.name}
                        </span>
                      </div>

                      {call.failed ? (
                        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Success
                        </span>
                      )}
                    </div>

                    {/* Arguments */}
                    <div className="mt-2.5">
                      <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Arguments
                      </div>
                      <pre className={`p-2 rounded-lg font-mono text-[11px] overflow-x-auto ${
                        isDark 
                          ? 'bg-slate-950/70 text-slate-300 border border-slate-800' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {JSON.stringify(call.args, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-3 rounded-xl border text-xs italic ${
                isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                No MCP tools were required to answer this inquiry.
              </div>
            )}

            {/* Unavailable MCP Servers in Grey */}
            {result.unavailable && result.unavailable.length > 0 && (
              <div className="pt-2">
                <div className={`text-[11px] font-medium flex items-center gap-1.5 mb-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <ServerOff className="w-3.5 h-3.5" />
                  <span>Unavailable MCP Servers ({result.unavailable.length})</span>
                </div>
                <div className="space-y-1.5">
                  {result.unavailable.map((unav, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1 transition-colors ${
                        isDark 
                          ? 'bg-slate-900/40 border-slate-800 text-slate-500' 
                          : 'bg-slate-100/70 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="truncate">{unav.address}</span>
                      <span className="text-[10px] italic shrink-0 text-slate-400">
                        ({unav.reason})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
