/**
 * Job Submission Form
 * ===================
 * The primary interface for dispatching containers to the grid.
 * 
 * Features:
 * - Resource Presets: Pre-configured CPU/Memory profiles (Light, Standard, Heavy).
 * - Parallel Orchestration: Option to split jobs into shards for multi-node execution.
 * - Live Templates: Real-time code previews for Dockerfiles and shard mapping.
 * - Advanced Config: Fine-grained control over GPU, Timeouts, and Env Vars.
 */

import React, { useState } from 'react'
import { ChevronDown, Box, Settings, Zap, RotateCcw, ChevronRight, Shield, LayoutGrid, CheckCircle } from 'lucide-react'
import { Button, CodeBlock, Badge, Spinner } from '../ui/index'
import { useSubmitJob } from '../../hooks/useJobs'

// Reference template for a standard Job Dockerfile
const DOCKERFILE_TEMPLATE = `FROM python:3.11-slim
WORKDIR /job
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY script.py .
CMD ["python", "script.py"]
# Write all outputs to /job/output/`

// Reference template for accessing shard variables in user scripts
const SPLIT_VARS_TEMPLATE = `# For split jobs, read from env:
import os
start = int(os.environ.get("CHUNK_START", 0))
end   = int(os.environ.get("CHUNK_END", 100000))
idx   = int(os.environ.get("CHUNK_INDEX", 0))
total = int(os.environ.get("CHUNK_TOTAL", 1))`

export default function JobSubmitForm() {
  // TanStack Mutation hook for job submission
  const { mutate: submit, isPending } = useSubmitJob()

  // Form State
  const [image, setImage] = useState('')
  const [cpu, setCpu] = useState(2)
  const [memory, setMemory] = useState('4g')
  const [gpu, setGpu] = useState(false)
  const [timeout, setTimeoutVal] = useState(3600)
  const [numChunks, setNumChunks] = useState(4)
  const [strategy, setStrategy] = useState('distributed')
  const [advOpen, setAdvOpen] = useState(false)
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [preset, setPreset] = useState(1)

  // Pre-defined resource configurations
  const presets = [
    { name: 'Light', cpu: 1, mem: '2g', desc: 'Web apps, scripts' },
    { name: 'Standard', cpu: 4, mem: '8g', desc: 'CI/CD, API' },
    { name: 'Heavy', cpu: 8, mem: '16g', desc: 'ML Training, Big Data' }
  ]

  /**
   * Constructs the final API payload based on form state and sharding options.
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!image) return
    const payload = { 
      image, cpu, memory, gpu, 
      timeout_seconds: timeout 
    }
    // Inject splitting configuration if multi-node is enabled
    if (splitEnabled) {
      payload.split_by = { strategy, num_chunks: numChunks }
    }
    submit(payload)
  }

  /**
   * Quickly applies a preset configuration to the form state.
   */
  const applyPreset = (p, i) => {
    setCpu(p.cpu)
    setMemory(p.mem)
    setPreset(i)
  }

  return (
    <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          {/* Section: Core Container Identity */}
          <div className="space-y-6">
            <label className="block text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 px-1">Container Image</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-purple-500 transition-colors">
                <Box size={20} />
              </div>
              <input
                type="text"
                placeholder="e.g. library/ubuntu:latest"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-[#121214] border border-white/5 rounded-3xl pl-14 pr-6 py-5 text-[15px] text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 transition-all font-mono shadow-2xl"
                required
              />
            </div>
            
            {/* Section: Resource Profile */}
            <div className="pt-8">
               <label className="block text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 px-1">Resource Profile</label>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {presets.map((p, i) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p, i)}
                      className={`relative flex flex-col p-6 rounded-3xl border transition-all text-left group overflow-hidden ${
                        preset === i 
                        ? 'border-purple-500/50 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.1)]' 
                        : 'border-white/5 bg-[#121214] hover:border-zinc-700'
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-125 ${preset === i ? 'opacity-100' : 'opacity-0'}`} />
                      <p className={`text-[15px] font-black tracking-tight mb-2 ${preset === i ? 'text-purple-400' : 'text-white'}`}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-4">{p.cpu} vCPU &bull; {p.mem}</p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{p.desc}</p>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Section: Parallel Orchestration (Sharding) */}
          <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
             
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-[15px] font-black text-white uppercase tracking-tight">Parallel Orchestration</h3>
                   <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Multi-node execution</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSplitEnabled(!splitEnabled)}
                  className={`w-14 h-7 relative flex items-center rounded-full transition-all cursor-pointer border-2 ${splitEnabled ? 'bg-purple-500/20 border-purple-500/50' : 'bg-black border-white/10'}`}
                >
                  <span className={`absolute left-1 w-4 h-4 rounded-full transition-all shadow-xl ${splitEnabled ? 'translate-x-7 bg-purple-400 shadow-purple-500/50' : 'translate-x-0 bg-zinc-600'}`} />
                </button>
             </div>

             <div className={`transition-all duration-700 ease-in-out overflow-hidden ${splitEnabled ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none scale-95'}`}>
                <div className="space-y-10">
                   <div>
                      <label className="flex items-center justify-between mb-6 group-hover:text-white transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Distribution Strategy</span>
                        <Badge color={strategy === 'distributed' ? 'blue' : 'gray'}>{strategy}</Badge>
                      </label>
                      <div className="flex p-2 bg-black rounded-2xl border border-white/5 shadow-inner">
                         {['distributed', 'concentrated'].map((val) => (
                           <button
                             key={val}
                             type="button"
                             onClick={() => setStrategy(val)}
                             className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                               strategy === val 
                               ? 'bg-zinc-800 text-white shadow-2xl border border-white/5' 
                               : 'text-zinc-500 hover:text-zinc-300'
                             }`}
                           >
                             {val}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div>
                      <label className="flex items-center justify-between mb-6">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Target Shards</span>
                        <span className="text-[11px] font-mono text-purple-400 font-black tracking-tighter">{numChunks} CLUSTERS</span>
                      </label>
                      <div className="grid grid-cols-4 gap-4">
                         {[2, 4, 8, 16].map((n) => (
                           <button
                             key={n}
                             type="button"
                             onClick={() => setNumChunks(n)}
                             className={`h-14 rounded-2xl text-[13px] font-black transition-all border-2 ${
                               numChunks === n 
                               ? 'border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-xl' 
                               : 'border-white/5 bg-black text-zinc-500 hover:border-zinc-800'
                             }`}
                           >
                             {n}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Section: Advanced Settings Toggle */}
          <div className="border border-white/5 rounded-3xl bg-[#121214]/50 overflow-hidden transition-all duration-500 group">
             <button
               type="button"
               onClick={() => setAdvOpen(!advOpen)}
               className="w-full flex items-center justify-between p-6 hover:bg-[#121214] transition-colors outline-none"
             >
               <div className="flex items-center gap-4">
                  <Settings size={20} className={advOpen ? 'text-purple-400' : 'text-zinc-600'} />
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-zinc-500 group-hover:text-zinc-400 transition-colors">Advanced Orchestration</span>
               </div>
               <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${advOpen ? 'bg-purple-500/10 rotate-180 shadow-inner' : 'bg-black'}`}>
                 <ChevronDown size={18} className={advOpen ? 'text-purple-400' : 'text-zinc-700'} />
               </div>
             </button>
             
             <div className={`transition-all duration-700 ease-in-out ${advOpen ? 'max-h-[600px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 px-1">Timeout Policy (sec)</label>
                      <input
                        type="number"
                        value={timeout}
                        onChange={(e) => setTimeoutVal(Number(e.target.value))}
                        className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-purple-500/30 transition-all font-mono"
                      />
                   </div>
                   <div className="flex items-end">
                      <div className="w-full">
                        <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 px-1">GPU Acceleration</label>
                        <button
                          type="button"
                          onClick={() => setGpu(!gpu)}
                          className={`w-full h-[56px] rounded-2xl border-2 flex items-center justify-between px-6 transition-all ${gpu ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-black border-white/5 text-zinc-600 hover:border-zinc-800'}`}
                        >
                           <span className="text-[13px] font-black uppercase tracking-widest">Enable Compute</span>
                           {gpu ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-zinc-800" />}
                        </button>
                      </div>
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 px-1">Runtime Environment Inject (JSON)</label>
                      <textarea
                        placeholder='{"ENV_VAR": "value"}'
                        className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-[13px] text-zinc-400 font-mono focus:outline-none focus:border-purple-500/30 resize-none h-28 italic scrollbar-hide"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar: Status and Live Previews */}
        <div className="space-y-8 lg:sticky lg:top-28 self-start">
           {/* Submission Protocol Infographic */}
           <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-8 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
              <h3 className="text-[13px] font-black text-white mb-8 flex items-center gap-4 uppercase tracking-[0.2em]">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#8B5CF6] animate-pulse"/>
                Protocol
              </h3>
              <div className="space-y-6">
                {[
                  'Image resolution & verification',
                  'Distributed shard allocation',
                  'Sandboxed execution layer',
                  'Encrypted output retrieval',
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-start group/step">
                    <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-white/5 text-zinc-600 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 group-hover/step:border-purple-500/50 group-hover/step:text-purple-400 transition-all">
                      0{i + 1}
                    </div>
                    <p className="text-[13px] text-zinc-500 font-bold leading-relaxed group-hover/step:text-zinc-300 transition-colors uppercase tracking-tight">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
           </div>

           {/* Dockerfile Preview */}
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Runtime Config</p>
                 <Badge color="gray">Dockerfile</Badge>
              </div>
              <CodeBlock code={DOCKERFILE_TEMPLATE} language="dockerfile" />
           </div>
           
           {/* Shard Mapper Preview (Visible only when splitting is enabled) */}
           <div className={`space-y-4 transition-all duration-700 ${splitEnabled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="flex items-center justify-between px-2">
                 <p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.3em]">Shard Mapper</p>
                 <Badge color="blue">vGrid4</Badge>
              </div>
              <CodeBlock code={SPLIT_VARS_TEMPLATE} language="python" />
           </div>

           {/* Final Submission Button */}
           <div className="pt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !image}
                className="w-full h-[72px] !rounded-[2rem] !text-[16px] !font-black uppercase tracking-[0.25em] !shadow-[0_25px_50px_rgba(139,92,246,0.3)] hover:!shadow-[0_30px_60px_rgba(139,92,246,0.5)] active:!scale-95 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {isPending ? (
                    <>
                      <Spinner size="sm" />
                      Wait...
                    </>
                  ) : (
                    <>
                      Dispatch
                      <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                </div>
              </Button>
              <div className="flex items-center justify-center gap-3 mt-6 text-zinc-600">
                <Shield size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Verified Cluster Node v4.2</p>
              </div>
           </div>
        </div>
      </form>

      {/* Embedded styles for specific component behaviors */}
      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272A; border-radius: 4px; }
      `}</style>
    </div>
  )
}
