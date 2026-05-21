/**
 * Dashboard Overview Page
 * =======================
 * The primary mission control view for the easycompute platform.
 * Displays high-level metrics, active compute nodes, recent job history, 
 * and a system activity timeline.
 * 
 * Data sources:
 * - useJobs: Polls the backend for all job statuses.
 * - useAvailableNodes: Fetches the current set of online workers.
 */

import React, { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, RotateCcw } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useJobs, useSubmitJob } from '../hooks/useJobs'
import { useAvailableNodes } from '../hooks/useNodes'
import { JobTable } from '../components/jobs/JobTable'
import { NodeGrid } from '../components/nodes/index'

/**
 * Utility: Generates random historical data for aesthetic sparkline charts.
 */
const generateSparklineData = (count, max) =>
  Array.from({ length: count }).map((_, i) => ({
    value: Math.max(10, Math.floor(Math.random() * max) + (i * 2))
  }))

/**
 * Reusable Metric Widget.
 * Displays a large number, a title, subtext, and an optional sparkline chart.
 */
function MetricCard({ title, value, subtext, color, data, borderClass, pulseValue }) {
  const displayValue = value || 0;
  
  return (
    <div className={`bg-bg-card border border-border-DEFAULT rounded-xl p-5 relative overflow-hidden group shadow-lg transition-all duration-300 hover:border-border-accent ${borderClass}`}>
       {/* Ambient pulsing glow for critical "live" metrics */}
       {pulseValue && displayValue > 0 && (
         <div className="absolute top-1/2 left-[20%] -translate-y-1/2 w-24 h-24 bg-primary-blue/10 blur-[40px] rounded-full animate-pulse z-0 pointer-events-none" />
       )}
       
      <div className="relative z-10 flex flex-col h-full justify-between">
        <h3 className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">{title}</h3>
        
        <div className="flex items-end justify-between">
          <div>
            <div className={`text-[48px] md:text-[52px] font-bold leading-none tracking-tighter ${color} ${pulseValue && displayValue > 0 ? 'drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]' : ''}`}>
              {displayValue}
            </div>
            {subtext && <p className="text-[10px] text-text-muted mt-2 tracking-wide truncate max-w-[120px] uppercase font-bold">{subtext}</p>}
          </div>
          
          {/* Miniature Area Chart (Sparkline) */}
          {data && (
            <div className="w-[100px] h-[50px] opacity-80 mix-blend-screen -mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill={`url(#color-${title})`}
                    isAnimationActive={false}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Vertical timeline of the most recent system-wide events (status changes, completions).
 */
function ActivityFeed({ jobs }) {
  if (!jobs || jobs.length === 0) return (
     <div className="text-[13px] text-text-muted py-8 text-center italic border border-dashed border-border-DEFAULT rounded-xl">No recent activity</div>
  )
  
  // Transform the raw job list into a simplified event feed
  const events = jobs.slice(0, 10).map(j => ({
    id: j.id,
    type: j.status,
    desc: j.status === 'done' ? `Job completed successfully` : 
          j.status === 'running' ? `Job started execution` :
          j.status === 'failed' ? `Job execution failed` : `Job submitted to queue`,
    time: j.created_at,
    color: j.status === 'done' ? 'bg-accent-mint' :
           j.status === 'running' ? 'bg-primary-blue' :
           j.status === 'failed' ? 'bg-accent-red' : 'bg-zinc-700'
  }))

  return (
    <div className="space-y-5">
      {events.map((event, i) => (
        <div key={`${event.id}-${i}`} className="flex items-start gap-4 animate-in slide-in-from-left-2 duration-300">
          <div className="relative mt-1.5 flex flex-col items-center">
            {/* Timeline dot */}
            <div className={`w-2 h-2 rounded-full ${event.color} z-10 shadow-[0_0_8px_currentColor]`} />
            {/* Thread line connecting events */}
            {i !== events.length - 1 && (
              <div className="w-px h-12 bg-border-DEFAULT mt-2" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-[14px] text-text-primary font-medium">{event.desc}</p>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[11px] text-primary-accent bg-primary-blue/10 px-1.5 rounded font-bold font-mono tracking-tighter uppercase">{event.id.slice(0,8)}</span>
               <span className="text-[11px] text-text-muted font-bold uppercase tracking-widest">
                 {new Date(event.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: nodes, isLoading: nodesLoading } = useAvailableNodes()
  const { mutate: submit } = useSubmitJob()
  
  // State for a live-updating clock in the header
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Derived metrics from current data slices
  const total     = jobs?.length || 0
  const running   = jobs?.filter((j) => j.status === 'running' || j.status === 'dispatched').length || 0
  const completed = jobs?.filter((j) => j.status === 'done').length || 0
  const activeNodes = nodes?.length || 0

  /**
   * Quick-retry handler for failed jobs.
   */
  const handleRetry = (job) => {
    submit({
      image: job.image,
      cpu: job.cpu,
      memory: job.memory,
      gpu: job.gpu,
      timeout_seconds: job.timeout_seconds,
    })
  }
  
  // Memoize dummy data for sparkline consistency across re-renders
  const totalData = React.useMemo(() => generateSparklineData(14, 100), [])
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header: Title and Live Clock */}
      <div className="flex items-center justify-between border-b border-border-DEFAULT/50 pb-5">
        <div>
           <h1 className="text-3xl font-black text-text-primary tracking-tighter uppercase italic">Overview</h1>
           <p className="text-[11px] text-text-muted mt-1 font-bold tracking-[0.2em] uppercase flex items-center gap-2 opacity-80">
              <Clock size={12}/>
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} &bull; {now.toLocaleTimeString('en-US', { hour12: false })}
           </p>
        </div>
        <Link
          to="/submit"
          className="text-[13px] text-white transition-all font-black border-2 border-primary-blue px-6 py-2.5 rounded-full bg-primary-blue shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 uppercase tracking-widest active:scale-95"
        >
          Submit job
        </Link>
      </div>

      {/* TOP ROW: High-level system metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Jobs" 
          value={total} 
          color="text-white" 
          data={totalData} 
          borderClass="bg-gradient-to-br from-white/[0.03] to-transparent" 
        />
        <MetricCard 
          title="Running Now" 
          value={running} 
          color="text-primary-blue" 
          borderClass="bg-gradient-to-br from-primary-blue/[0.05] to-transparent" 
          pulseValue={true}
        />
        <MetricCard 
          title="Completed" 
          value={completed} 
          color="text-accent-mint" 
          borderClass="bg-gradient-to-br from-accent-mint/[0.05] to-transparent" 
        />
        <MetricCard 
          title="Active Nodes" 
          value={activeNodes} 
          color="text-accent-pink" 
          subtext="across network"
          borderClass="bg-gradient-to-br from-accent-pink/[0.05] to-transparent" 
        />
      </div>

      {/* MAIN CONTENT: Recent history and worker pool */}
      <div className="space-y-12">
        {/* Section: Sub-list of the most recent jobs */}
        <div className="flex flex-col space-y-4">
           <div className="flex items-center justify-between px-1">
             <h2 className="text-[12px] font-black text-text-muted uppercase tracking-[0.3em]">Recent Jobs</h2>
             <Link to="/jobs" className="text-[11px] text-primary-blue hover:text-white uppercase font-black tracking-widest transition-colors flex items-center gap-1">
                View all &rarr;
             </Link>
           </div>
           
           {!jobsLoading && (!jobs || jobs.length === 0) ? (
             <div className="bg-bg-card border border-border-DEFAULT rounded-[2.5rem] flex flex-col items-center justify-center py-20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-primary-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:scale-110 duration-500">
                 <CheckCircle size={32} className="text-text-muted" />
               </div>
               <p className="text-text-primary font-bold text-[18px] mb-2 relative z-10">Clear Queue</p>
               <Link
                 to="/submit"
                 className="text-[13px] text-primary-blue hover:text-white hover:underline transition-colors uppercase font-black tracking-widest relative z-10"
               >
                 Submit your first job &rarr;
               </Link>
             </div>
           ) : (
             <div className="rounded-[2.5rem] shadow-4xl border border-white/5 overflow-hidden">
                <JobTable jobs={jobs?.slice(0,5)} loading={jobsLoading} onRetry={handleRetry} />
             </div>
           )}
        </div>

        {/* Section: Real-time visualization of contributing nodes */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between h-5 px-1">
            <h2 className="text-[12px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
              Node pool
              {activeNodes > 0 && (
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
                </div>
              )}
            </h2>
            <button
              onClick={() => {
                // Manual re-fetch for cache synchronization
                queryClient.invalidateQueries({ queryKey: ['nodes'] })
                queryClient.invalidateQueries({ queryKey: ['jobs'] })
              }}
              className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-2 uppercase font-black tracking-widest"
            >
              <RotateCcw size={12} />
              Re-Sync
            </button>
          </div>
          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
             <NodeGrid nodes={nodes} loading={nodesLoading} />
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: System activity and SLAs */}
      <div className="mt-12 pt-12 border-t border-border-DEFAULT/50 grid grid-cols-1 md:grid-cols-[1fr_400px] gap-12">
        {/* Timeline representation of job transitions */}
        <div>
          <h2 className="text-[12px] font-black text-text-muted uppercase tracking-[0.3em] mb-8">System Activity</h2>
          <div className="bg-bg-card border border-border-DEFAULT rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-blue/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary-blue/10 transition-colors" />
             <ActivityFeed jobs={jobs} />
          </div>
        </div>
        
        {/* Uptime and performance summary */}
        <div className="hidden md:block">
           <h2 className="text-[12px] font-black text-text-muted uppercase tracking-[0.3em] mb-8">Efficiency</h2>
           <div className="bg-bg-card border border-border-DEFAULT rounded-2xl p-8 flex flex-col justify-center items-center shadow-2xl border-t-accent-pink/30">
              <div className="text-[44px] font-black text-text-primary tracking-tighter">98.4%</div>
              <p className="text-[11px] text-accent-pink font-bold uppercase tracking-widest mt-1">Uptime SLA</p>
              <div className="w-full h-[6px] bg-white/5 rounded-full mt-6 overflow-hidden">
                 <div className="h-full bg-accent-pink w-[98%]" />
              </div>
           </div>
        </div>
      </div>
      
      {/* Scrollbar overrides for denser layout components */}
      <style>{`
         .custom-scrollbar::-webkit-scrollbar {
           width: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-track {
           background: transparent;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb {
           background: #27272A;
           border-radius: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
           background: #3F3F46;
         }
      `}</style>
    </div>
  )
}
