/**
 * Grid Contribution Portal
 * ========================
 * The "Join the Grid" page provides instructions and tools for users to 
 * contribute their own hardware (laptops, servers) as compute nodes.
 * 
 * Flow:
 * 1. Agent Deployment: Script-based installation of the easycompute daemon.
 * 2. Grid Authentication: Linking physical hardware to a user account via JWT.
 * 3. Status Verification: Diagnostic commands to confirm connectivity.
 */

import React, { useState } from 'react'
import { CodeBlock, Badge } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { Copy, Check, Terminal, ShieldCheck, Activity, ExternalLink } from 'lucide-react'

export default function ContributePage() {
  // Retrieve the current user's session token for the CLI authentication step
  const { token } = useAuth()
  const [copied, setCopied] = useState(false)

  /**
   * Copies the current session JWT to the clipboard.
   * This token is required by the agent during the authentication module.
   */
  const handleCopy = () => {
    if (!token) return
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-12 max-w-5xl pb-16 animate-in fade-in duration-700">
      {/* Page Header: Value Proposition and Security Disclaimer */}
      <div className="border-b border-white/5 pb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-4 mb-6">
           <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
             Join the Grid
             <span className="text-purple-500 ml-1 inline-block animate-pulse text-2xl">_</span>
           </h1>
           <Badge color="blue">vGrid 4.2 Stable</Badge>
        </div>
        <p className="text-[15px] text-zinc-500 mt-2 font-medium leading-relaxed max-w-3xl">
          Securely contribute your idle compute resources to a distributed network of researchers. 
          easycompute nodes run in high-isolation sandboxes with zero host access, ensuring your security while you earn power credits.
        </p>
      </div>

      <div className="space-y-10 relative">
         {/* Visual timeline vertical connector line */}
         <div className="absolute left-[39px] top-10 bottom-20 w-px bg-gradient-to-b from-purple-500 via-zinc-800 to-transparent" />

        {/* Module 01: Host Preparation and Installation */}
        <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative group transition-all hover:bg-[#151517] hover:border-purple-500/20">
          <div className="flex gap-10">
            <div className="mt-1 shrink-0 relative z-10">
              <div className="w-[80px] h-[80px] rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center text-purple-500 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                 <Terminal size={32} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                 <p className="text-[11px] font-black text-zinc-600 group-hover:text-purple-500 transition-colors tracking-[0.4em] uppercase">Module 01</p>
                 <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Agent Deployment</h2>
               <p className="text-[14px] text-zinc-500 mb-8 leading-relaxed max-w-2xl font-medium">
                 Follow the setup instructions in the GitHub repository to initialize the easycompute agent on your machine. You'll need <span className="text-zinc-300">Python 3.10+</span> and <span className="text-zinc-300">Docker Desktop</span> running before you begin.
               </p>
               
               {/* GitHub repo link */}
               <a
                 href="https://github.com/Madhav-Kochhar7/easycompute"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-3 px-6 py-3.5 mb-8 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[13px] font-black uppercase tracking-widest hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group/link"
               >
                 <ExternalLink size={16} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                 View Setup Guide on GitHub
               </a>

               {/* Quick reference commands */}
               <div className="grid grid-cols-1 gap-6">
                 <div>
                   <label className="block text-[10px] text-zinc-600 mb-3 font-black uppercase tracking-[0.2em] px-1">1 — Clone & Navigate</label>
                   <CodeBlock 
                     code={`git clone https://github.com/Madhav-Kochhar7/easycompute.git\ncd easycompute/agent`}
                     language="bash" 
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] text-zinc-600 mb-3 font-black uppercase tracking-[0.2em] px-1">2 — Initialize Environment</label>
                   <CodeBlock 
                     code={`python -m venv venv\n.\\venv\\Scripts\\Activate.ps1   # Windows\nsource venv/bin/activate        # macOS / Linux\npip install -r requirements.txt`}
                     language="powershell" 
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] text-zinc-600 mb-3 font-black uppercase tracking-[0.2em] px-1">3 — Start the Agent</label>
                   <CodeBlock 
                     code="py agent.py" 
                     language="powershell" 
                   />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Module 02: Infrastructure Security and Keys */}
        <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative group transition-all hover:bg-[#151517] hover:border-purple-500/20">
          <div className="flex gap-10">
            <div className="mt-1 shrink-0 relative z-10">
              <div className="w-[80px] h-[80px] rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-purple-500 transition-colors duration-500 shadow-2xl">
                 <ShieldCheck size={32} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                 <p className="text-[11px] font-black text-zinc-600 group-hover:text-purple-500 transition-colors tracking-[0.4em] uppercase">Module 02</p>
                 <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Grid Authentication</h2>
              <p className="text-[14px] text-zinc-500 mb-8 leading-relaxed max-w-2xl font-medium">
                Assign your unique infrastructure token to the local agent. This links your physical node to your account for credit tracking and job targeting.
              </p>
              
              <div className="flex flex-col gap-6">
                {/* Visual UI for obtaining the user's private token */}
                <div className="flex items-center justify-between bg-black/40 rounded-2xl border border-white/5 p-6 group/token relative overflow-hidden transition-all hover:bg-black/60">
                    <div className="absolute inset-y-0 left-0 w-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col relative z-10">
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Infrastructure Key</span>
                       <span className="text-zinc-400 text-xs font-medium">Securely links your hardware to your account.</span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                         copied ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-xl shadow-white/5'
                      }`}
                    >
                      {copied ? (
                        <><Check size={16} /> Copied!</>
                      ) : (
                        <><Copy size={16} /> Get My Token</>
                      )}
                    </button>
                </div>

                {/* Example environment configuration for the agent */}
                <div className="bg-black/50 rounded-2xl border border-white/5 overflow-hidden">
                   <div className="px-5 py-3 bg-zinc-900/50 border-b border-white/5 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Environment Overrides (.env)</span>
                   </div>
                    <CodeBlock 
                      code={`SCHEDULER_URL=http://${window.location.hostname}:8000\nUSER_TOKEN=YOUR_PRIVATE_TOKEN_HERE`}
                      language="env" 
                    />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 03: Telemetry and Health Verification */}
        <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative group transition-all hover:bg-[#151517] hover:border-purple-500/20">
          <div className="flex gap-10">
            <div className="mt-1 shrink-0 relative z-10">
              <div className="w-[80px] h-[80px] rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 transition-colors duration-500 shadow-2xl">
                 <Activity size={32} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                 <p className="text-[11px] font-black text-zinc-600 group-hover:text-emerald-500 transition-colors tracking-[0.4em] uppercase">Module 03</p>
                 <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Status verification</h2>
              <p className="text-[14px] text-zinc-500 mb-8 leading-relaxed max-w-2xl font-medium">
                Monitor the agent's stdout to verify successful grid integration. Once active, your machine will appear in the cluster health overview.
              </p>
              
              <div>
                <label className="block text-[10px] text-zinc-600 mb-3 font-black uppercase tracking-[0.2em] px-1">Health Check Diagnostics</label>
                <CodeBlock 
                  code={`# Verify daemon status\nsudo systemctl status easycompute\n\n# Observe live dispatch cycles\nsudo journalctl -u easycompute -f`}
                  language="bash" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
