/**
 * Job History & Management Page
 * =============================
 * A dedicated view for browsing, filtering, and managing the full 
 * history of cluster workloads.
 * 
 * Features:
 * - Status Filtering: Categorize jobs by Active, Completed, or Failed.
 * - Workload Cloning: Retry unsuccessful or expired jobs with identical parameters.
 * - Global Search: Integrated via the shared JobTable component.
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useJobs, useSubmitJob } from '../hooks/useJobs'
import { JobTable } from '../components/jobs/JobTable'

export default function JobsPage() {
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { mutate: submit } = useSubmitJob()
  
  // Local UI state for filtering the main list
  const [filter, setFilter] = useState('all')

  /**
   * Re-dispatches a job using the same container image and resource 
   * requirements as a previous execution attempt.
   */
  const handleRetry = (job) => {
    submit({
      image: job.image,
      cpu: job.cpu,
      memory: job.memory,
      gpu: job.gpu,
      timeout_seconds: job.timeout_seconds,
      ...(job.split_by ? { split_by: job.split_by } : {})
    })
  }

  /**
   * Logical filtering based on backend status strings.
   */
  const filteredJobs = jobs?.filter(job => {
    if (filter === 'all') return true
    // Active: Workloads currently occupying or waiting for a node
    if (filter === 'active') return ['running', 'dispatched', 'pending'].includes(job.status)
    // Completed: Successfully finalized terminal states
    if (filter === 'completed') return job.status === 'done'
    // Failed: Terminal error states or execution timeouts
    if (filter === 'failed') return ['failed', 'expired'].includes(job.status)
    return true
  }) || []

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12 max-w-6xl mx-auto">
      {/* Header: Statistics and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary-blue/5 blur-[50px] rounded-full pointer-events-none" />
        <div>
           <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
             Workload History
             <span className="text-primary-blue ml-1 inline-block animate-pulse text-2xl">_</span>
           </h1>
           <p className="text-[11px] text-zinc-500 mt-2 font-black uppercase tracking-[0.3em]">
             {jobs?.length || 0} grid operations detected
           </p>
        </div>
        <Link
          to="/submit"
          className="group relative inline-flex items-center gap-3 bg-primary-blue px-8 py-3 rounded-full text-[13px] font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary-blue/20"
        >
          <Plus size={18} />
          Dispatch New Job
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        </Link>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap gap-3 bg-[#121214] p-1.5 rounded-[1.5rem] border border-white/5 w-fit shadow-2xl">
        {['all', 'active', 'completed', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-8 py-2.5 text-[11px] rounded-2xl font-black transition-all uppercase tracking-[0.2em] relative overflow-hidden ${
              filter === f 
                ? 'text-white bg-black border border-white/10 shadow-inner' 
                : 'text-zinc-600 hover:text-white'
            }`}
          >
            {filter === f && (
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-blue/20 via-transparent to-accent-pink/10 opacity-30" />
            )}
            <span className="relative z-10">{f}</span>
          </button>
        ))}
      </div>

      {/* Paginated / Scrollable Job List Container */}
      <div className="bg-[#121214] rounded-[2.5rem] shadow-4xl border border-white/5 overflow-hidden">
        <JobTable jobs={filteredJobs} loading={jobsLoading} onRetry={handleRetry} />
      </div>
    </div>
  )
}
