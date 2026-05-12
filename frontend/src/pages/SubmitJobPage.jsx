/**
 * Job Dispatch Portal
 * ===================
 * The primary entry point for researchers to submit computational workloads 
 * to the distributed campus network.
 * 
 * This page serves as a high-level wrapper for the JobSubmitForm, 
 * providing context on the isolation (containerization) and 
 * distribution (parallel chunks) logic of the platform.
 */

import React from 'react'
import JobSubmitForm from '../components/jobs/JobSubmitForm'

export default function SubmitJobPage() {
  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Page Header: Value Proposition and Service Description */}
      <div className="border-b border-border-DEFAULT/50 pb-5">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Submit Job</h1>
        <p className="text-[13px] text-text-secondary mt-2 max-w-2xl leading-relaxed">
          Your code will be packaged into a container and distributed to an available node in the campus grid. 
          For intensive tasks, enable parallel execution to split the workload across multiple physical machines.
        </p>
      </div>

      {/* Main Submission Logic and Form State Management */}
      <JobSubmitForm />
    </div>
  )
}
