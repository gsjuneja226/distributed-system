/**
 * Global Application Shell
 * ========================
 * The master layout component that wraps all authenticated routes.
 * 
 * Logic:
 * - Persistent Sidebar: Provides high-level navigation.
 * - Dynamic Content: Uses React Router's <Outlet /> to render the active page.
 * - Responsive Viewport: Handles mobile padding and desktop sidebar integration.
 */

import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg-page text-text-primary">
      {/* Navigation Layer */}
      <Sidebar />
      
      {/* Content Layer */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 lg:px-8">
          {/* React Router Outlet for child pages */}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
