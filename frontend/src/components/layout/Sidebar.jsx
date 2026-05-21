/**
 * Main Application Sidebar
 * ========================
 * The primary navigation anchor for the easycompute dashboard. 
 * Handles routing links, user identity display, and session termination.
 * 
 * Layouts:
 * - Desktop: Sticky sidebar with support for full/collapsed states.
 * - Mobile: Top-bar branding with overflow navigation (if implemented).
 */

import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Activity, Network, LogOut, Terminal, Cpu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { logout, user } = useAuth()
  
  // Local state for toggling between broad and compact desktop views
  const [collapsed, setCollapsed] = React.useState(false)

  /**
   * Primary site-wide navigation map.
   */
  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/submit', icon: PlusCircle, label: 'Submit job' },
    { to: '/jobs', icon: Activity, label: 'Job history' },
    { to: '/contribute', icon: Cpu, label: 'Contribute' },
  ]

  return (
    <>
      {/* Mobile-Only Header Bar */}
      <div className="md:hidden h-14 w-full bg-bg-sidebar border-b border-border-DEFAULT fixed top-0 z-40 flex items-center px-4">
        <Cpu size={20} className="text-primary-blue mr-3" />
        <span className="font-semibold text-text-primary">easycompute</span>
      </div>

      {/* Primary Desktop / Heavy Tablet Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen transition-all duration-300
        bg-bg-sidebar border-r border-border-DEFAULT
        ${collapsed ? 'w-16' : 'w-[220px]'}
        hidden md:flex flex-col
      `}>
        {/* Branding Area: App Logo and Versioning */}
        <div className="flex flex-col px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-black/40 rounded shadow-inner flex items-center justify-center shrink-0 border border-primary-blue shadow-[0_0_15px_rgba(26,86,219,0.3)]">
              <Cpu size={16} className="text-primary-blue" />
            </div>
            {!collapsed && (
              <span className="font-bold text-text-primary text-xl tracking-tight truncate">easycompute</span>
            )}
          </div>
          {!collapsed && (
             <div className="pl-[2.75rem]">
               <span className="text-[10px] font-mono text-text-secondary bg-black/40 px-1.5 py-0.5 rounded border border-border-DEFAULT">v1.0 · BETA</span>
             </div>
          )}
        </div>

        {/* Global Navigation Engine */}
        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group border border-transparent
                ${isActive
                   // Active State: Glass background with primary-blue neon accent
                  ? 'bg-primary-blue/10 text-text-primary border-l-[2px] !border-l-primary-blue shadow-[inset_0_0_20px_rgba(26,86,219,0.05)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover hover:border-border-DEFAULT'
                }`
              }
            >
              <link.icon size={18} className={`shrink-0 transition-colors ${window.location.pathname.startsWith(link.to) ? 'text-primary-blue' : 'text-text-secondary group-hover:text-text-primary'}`} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* UX: Breadcrumb/Shell Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center gap-3 px-5 py-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors border-t border-border-DEFAULT/50 hover:bg-bg-hover"
        >
          <Terminal size={18} />
          {!collapsed && <span>Toggle Sidebar</span>}
        </button>

        {/* Identity & Session Management Section */}
        <div className="p-3 border-t border-border-DEFAULT/50 bg-bg-card/30">
          {user && (
            <div className={`flex items-center gap-3 px-2 mb-4 mt-2 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center shrink-0 border border-primary-blue/30 relative">
                 {/* Real-time status indicator (pulsing mint dot) */}
                 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent-mint rounded-full border-2 border-bg-sidebar"></span>
                 <span className="text-sm font-medium text-primary-blue">
                   {user.email?.[0]?.toUpperCase() || 'U'}
                 </span>
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
                     <p className="text-[11px] text-text-muted capitalize">Node: online</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={logout}
            className={`flex items-center gap-3 p-2 rounded-lg text-sm font-medium text-text-muted hover:text-accent-red hover:bg-[#2d0f0f]/50 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
            title="Sign out"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
