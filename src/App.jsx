import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LayoutDashboard, Users, KanbanSquare, Building2, UserCog,
  BarChart3, Activity, Search, Plus, Phone, LogOut, X, Trash2,
  ChevronRight, TrendingUp, Wallet, CheckCircle2, CircleDashed,
  Filter, ArrowUpDown, Lock, Menu, DollarSign, Upload, FileText
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
  PieChart, Pie
} from 'recharts'
import { supabase } from './supabase'
import {
  signIn, getMyProfile, listEmployees, listLeads, listClients, recentActivity,
  createLead as qCreateLead, updateLead as qUpdateLead, deleteLead as qDeleteLead,
  updateClient as qUpdateClient, createEmployee as qCreateEmployee,
  deleteClient as qDeleteClient,
  bulkCreateLeads as qBulkCreateLeads
} from './queries'

/* DekSites CRM - production app. UI matches the demo; data and auth are live
   through Supabase. Role rules are enforced by RLS in supabase/schema.sql. */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.dk{
  --paper:#F6F5F1; --surface:#FFFFFF; --ink:#17150F; --soft:#6B675C;
  --line:#E7E3DA; --accent:#F5B800; --accent-2:#D9A200; --accent-soft:#FFF8E1;
  --sidebar:#17150F; --sidebar-2:#2A271F; --sidebar-soft:#A8A496;
  font-family:'Hanken Grotesk',system-ui,sans-serif;
  color:var(--ink); background:var(--paper);
  -webkit-font-smoothing:antialiased; height:100%; min-height:100vh;
}
.num{font-variant-numeric:tabular-nums}
.serif{font-family:'Fraunces',Georgia,serif}
.dk button{font-family:inherit;cursor:pointer;border:none;background:none}
.dk input,.dk select,.dk textarea{font-family:inherit;font-size:14px}

/* layout */
.shell{display:flex;min-height:100vh}
.side{width:248px;flex-shrink:0;background:var(--sidebar);color:#EDEAE0;
  display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:10px;padding:6px 10px 22px}
.brand .mark{width:30px;height:30px;border-radius:8px;background:var(--accent);
  display:grid;place-items:center;color:#1A1A1A;font-weight:700;font-size:15px}
.brand .wm{font-size:19px;font-weight:600;letter-spacing:-.01em}
.nav{display:flex;flex-direction:column;gap:2px;flex:1}
.nav-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--sidebar-soft);padding:14px 10px 6px}
.nav>button{display:block;width:100%;padding:0}
.nav a{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:9px;
  color:#D7D3C7;font-size:14px;font-weight:500;transition:.12s;width:100%;text-align:left}
.nav a:hover{background:var(--sidebar-2);color:#fff}
.nav a.on{background:var(--accent);color:#1A1A1A}
.nav a .lk{margin-left:auto;font-size:11px;opacity:.6;display:flex;align-items:center;gap:3px}
.me{margin-top:auto;border-top:1px solid #34302660;padding-top:14px;
  display:flex;align-items:center;gap:10px}
.me .av{width:34px;height:34px;border-radius:50%;background:var(--sidebar-2);
  display:grid;place-items:center;font-weight:600;font-size:13px;color:#fff}
.me .nm{font-size:13.5px;font-weight:600;line-height:1.2}
.me .rl{font-size:11.5px;color:var(--sidebar-soft);text-transform:capitalize}
.me button{margin-left:auto;color:var(--sidebar-soft);padding:6px;border-radius:7px}
.me button:hover{color:#fff;background:var(--sidebar-2)}

.main{flex:1;min-width:0;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:16px;padding:20px 30px;
  border-bottom:1px solid var(--line);background:var(--surface);position:sticky;top:0;z-index:20}
.top h1{font-size:20px;font-weight:600;letter-spacing:-.01em}
.top .sub{font-size:13px;color:var(--soft);margin-top:1px}
.top .sp{flex:1}
.content{padding:26px 30px 60px;max-width:1240px;width:100%}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:9px;
  font-size:13.5px;font-weight:600;transition:.12s}
.dk .btn-pri{background:var(--accent);color:#1A1A1A}
.dk .btn-pri:hover{background:var(--accent-2)}
.dk .btn-gh{background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.dk .btn-gh:hover{border-color:#cfcabf;background:#fbfaf7}
.btn-sm{padding:6px 11px;font-size:12.5px}

/* cards */
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px}
.card .lab{font-size:12.5px;color:var(--soft);font-weight:500;display:flex;
  align-items:center;gap:7px}
.card .ic{width:26px;height:26px;border-radius:7px;background:var(--accent-soft);
  color:var(--accent);display:grid;place-items:center}
.card .val{font-size:30px;font-weight:500;margin-top:12px;letter-spacing:-.02em}
.card .delta{font-size:12px;color:var(--soft);margin-top:4px}

.grid2{display:grid;grid-template-columns:1.45fr 1fr;gap:18px}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.panel .ph{padding:16px 18px;border-bottom:1px solid var(--line);
  display:flex;align-items:center;gap:10px}
.panel .ph h3{font-size:15px;font-weight:600}
.panel .ph .sp{flex:1}
.panel .pb{padding:6px 0}

/* activity feed */
.feed{display:flex;flex-direction:column}
.fi{display:flex;gap:12px;padding:11px 18px;align-items:flex-start}
.fi:hover{background:#faf9f6}
.fi .dot{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;margin-top:1px}
.fi .tx{font-size:13.5px;line-height:1.4}
.fi .tx b{font-weight:600}
.fi .mt{font-size:12px;color:var(--soft);margin-top:2px}

/* tables */
.tbl-wrap{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow-x:auto}
.tools{display:flex;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line);
  align-items:center;flex-wrap:wrap}
.srch{display:flex;align-items:center;gap:8px;background:var(--paper);
  border:1px solid var(--line);border-radius:9px;padding:8px 11px;flex:1;min-width:200px}
.srch input{border:none;background:none;outline:none;width:100%;color:var(--ink)}
.sel{background:var(--paper);border:1px solid var(--line);border-radius:9px;
  padding:8px 11px;color:var(--ink);outline:none;cursor:pointer}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;
  color:var(--soft);font-weight:600;padding:11px 16px;border-bottom:1px solid var(--line);
  cursor:pointer;user-select:none;white-space:nowrap}
th .sg{display:inline-flex;align-items:center;gap:4px}
td{padding:13px 16px;font-size:13.5px;border-bottom:1px solid #f0eee7;vertical-align:middle}
tr:last-child td{border-bottom:none}
tbody tr{cursor:pointer;transition:.1s}
tbody tr:hover{background:#faf9f6}
.bn{font-weight:600}
.muted{color:var(--soft)}

/* status chip */
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;
  font-size:12px;font-weight:600;white-space:nowrap}
.chip .cd{width:6px;height:6px;border-radius:50%}

/* kanban */
.kb{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;padding-bottom:8px}
.col{background:var(--surface);border:1px solid var(--line);border-radius:13px;
  display:flex;flex-direction:column;min-height:200px}
.col .ch{padding:12px 13px;border-bottom:1px solid var(--line);display:flex;
  align-items:center;gap:8px;font-size:13px;font-weight:600}
.col .ch .ct{margin-left:auto;font-size:12px;color:var(--soft);background:var(--paper);
  padding:1px 8px;border-radius:10px}
.col .cb{padding:10px;display:flex;flex-direction:column;gap:9px;flex:1}
.kc{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:11px;cursor:pointer}
.kc:hover{border-color:#cfcabf}
.kc .kn{font-size:13.5px;font-weight:600}
.kc .km{font-size:12px;color:var(--soft);margin-top:3px;display:flex;align-items:center;gap:5px}
.kc select{margin-top:9px;width:100%;border:1px solid var(--line);border-radius:7px;
  padding:5px 7px;background:var(--surface);color:var(--ink);font-size:12px}

/* drawer */
.scrim{position:fixed;inset:0;background:#1715091f;backdrop-filter:blur(2px);z-index:40}
.drawer{position:fixed;top:0;right:0;height:100vh;width:480px;max-width:92vw;
  background:var(--surface);z-index:50;box-shadow:-12px 0 40px #17150915;
  display:flex;flex-direction:column;animation:slide .22s ease}
@keyframes slide{from{transform:translateX(30px);opacity:.4}to{transform:none;opacity:1}}
.dh{padding:20px 22px;border-bottom:1px solid var(--line);display:flex;align-items:flex-start;gap:12px}
.dh h2{font-size:18px;font-weight:600;letter-spacing:-.01em}
.dh .x{margin-left:auto;color:var(--soft);padding:6px;border-radius:8px}
.dh .x:hover{background:var(--paper);color:var(--ink)}
.db{padding:20px 22px;overflow-y:auto;flex:1}
.fld{margin-bottom:15px}
.fld label{font-size:12px;font-weight:600;color:var(--soft);display:block;margin-bottom:5px}
.fld input,.fld select,.fld textarea{width:100%;border:1px solid var(--line);border-radius:9px;
  padding:9px 11px;background:var(--surface);color:var(--ink);outline:none}
.fld input:focus,.fld select:focus,.fld textarea:focus{border-color:var(--accent)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.tl{margin-top:8px;display:flex;flex-direction:column;gap:0}
.tle{display:flex;gap:11px;padding:9px 0;border-bottom:1px solid #f0eee7}
.tle .tld{width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:6px;flex-shrink:0}
.tle .tlt{font-size:13px}
.tle .tlm{font-size:11.5px;color:var(--soft);margin-top:1px}
.df{padding:16px 22px;border-top:1px solid var(--line);display:flex;gap:10px}

/* reports */
.rgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:6px}

/* login */
.login{min-height:100vh;display:grid;place-items:center;padding:24px;
  background:radial-gradient(120% 120% at 80% 0%,#1f1c14 0%,#17150F 55%)}
.lcard{width:100%;max-width:420px}
.lbrand{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:8px}
.lbrand .mark{width:40px;height:40px;border-radius:11px;background:var(--accent);
  display:grid;place-items:center;color:#1A1A1A;font-weight:700;font-size:20px}
.lbrand .wm{font-size:26px;font-weight:600;color:#fff;letter-spacing:-.01em}
.lsub{text-align:center;color:#A8A496;font-size:13.5px;margin-bottom:26px}
.lbox{background:var(--surface);border-radius:16px;padding:22px}
.lbox h3{font-size:15px;font-weight:600;margin-bottom:4px}
.lbox p.h{font-size:12.5px;color:var(--soft);margin-bottom:16px}
.acct{display:flex;align-items:center;gap:12px;width:100%;text-align:left;
  border:1px solid var(--line);border-radius:11px;padding:12px;margin-bottom:9px;transition:.12s}
.acct:hover{border-color:var(--accent);background:var(--accent-soft)}
.acct .av{width:36px;height:36px;border-radius:9px;background:var(--ink);color:#fff;
  display:grid;place-items:center;font-weight:600;font-size:14px}
.acct .nm{font-size:14px;font-weight:600}
.acct .rl{font-size:12px;color:var(--soft);text-transform:capitalize}
.acct .go{margin-left:auto;color:var(--soft)}
.lnote{font-size:11.5px;color:#807c70;text-align:center;margin-top:18px;line-height:1.5}

.sectitle{font-size:13px;font-weight:600;color:var(--soft);text-transform:uppercase;
  letter-spacing:.05em;margin:4px 2px 12px}
.empty{padding:40px;text-align:center;color:var(--soft);font-size:14px}
.lockbar{display:flex;align-items:center;gap:9px;background:#fbf6ea;border:1px solid #efe3c4;
  color:#7a5b12;padding:10px 14px;border-radius:11px;font-size:13px;margin-bottom:18px}

/* hamburger */
.menu-btn{display:none;color:var(--ink);padding:6px;border-radius:8px}
.menu-btn:hover{background:var(--paper)}
.overlay{display:none}

@media(max-width:1100px){
  .cards{grid-template-columns:repeat(3,1fr)}
  .grid2,.rgrid{grid-template-columns:1fr}
  .kpis{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:1000px){
  .side{position:fixed;left:-260px;top:0;height:100vh;z-index:50;transition:left .22s ease;width:248px}
  .side.side-open{left:0}
  .overlay{display:none;position:fixed;inset:0;background:#17150940;z-index:45}
  .overlay.show{display:block}
  .menu-btn{display:flex}
  .cards{grid-template-columns:repeat(2,1fr)}
  .kb{grid-template-columns:repeat(7,minmax(120px,1fr));overflow-x:auto}
}
@media(max-width:600px){
  .content{padding:16px}
  .top{padding:14px 16px}
  .cards{grid-template-columns:1fr}
  .frow{grid-template-columns:1fr}
  .kb{grid-template-columns:repeat(7,minmax(100px,1fr));overflow-x:auto}
  .drawer{width:100vw;max-width:100vw}
}
`

const STATUS = {
  new:               { label: 'New',           c: '#64748B' },
  attempted_contact: { label: 'Attempted',     c: '#B45309' },
  contacted:         { label: 'Contacted',      c: '#2563EB' },
  follow_up_needed:  { label: 'Follow Up',      c: '#EA580C' },
  proposal_sent:     { label: 'Meeting Booked',  c: '#0891B2' },
  closed_lost:       { label: 'Closed Lost',    c: '#BE123C' },
  closed_won:        { label: 'Closed Won',     c: '#0F7A5A' },
}
const PIPE_ORDER = ['new','attempted_contact','contacted','follow_up_needed','proposal_sent','closed_lost','closed_won']
const TIERS = {
  tier_01: { name: 'Tier 01 - Essentials',          one: 500, mo: 50  },
  tier_02: { name: 'Tier 02 - AEO',  one: 0, mo: 1500 },
}
// Commission splits: fixed dollar amounts per tier.
// "self" = when setter and closer are the same person (50% of total).
const COMMISSION = {
  tier_01: { type:'one_time', setter:100, closer:150, self:250, dek:250 },
  tier_02: { type:'monthly',  setter:350, closer:400, self:750, dek:750 },
}
function getCommission(client) {
  const c = COMMISSION[client.tier]
  if (!c) return { setter:0, closer:0, dek:0, type:'one_time' }
  const selfClose = client.lead_responsible === client.closer_responsible
  return {
    setter: selfClose ? c.self : c.setter,
    closer: selfClose ? 0 : c.closer,
    dek: c.dek,
    type: c.type,
    selfClose,
  }
}
const ACTION_ICON = {
  call_made:      { I: Phone,        bg:'#E8F0FE', c:'#2563EB' },
  status_changed: { I: ArrowUpDown,  bg:'#FFF8E1', c:'#D9A200' },
  note_added:     { I: CircleDashed, bg:'#FFF1E0', c:'#B45309' },
  client_created: { I: Building2,    bg:'#FFF8E1', c:'#D9A200' },
  lead_created:   { I: Plus,         bg:'#EEF0F2', c:'#475569' },
}

const money = n => '$' + Number(n||0).toLocaleString()
const initials = s => (s||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
// Formats US 10-digit numbers as (XXX) XXX-XXXX while typing. Leaves
// anything else (extensions, intl numbers, partial input) untouched.
function formatPhone(v){
  const digits = (v||'').replace(/\D/g,'')
  if(digits.length===0) return ''
  if(digits.length<=3) return '('+digits
  if(digits.length<=6) return '('+digits.slice(0,3)+') '+digits.slice(3)
  if(digits.length<=10) return '('+digits.slice(0,3)+') '+digits.slice(3,6)+'-'+digits.slice(6)
  return v // longer than 10 digits, leave as typed (could be intl/ext)
}
const today = new Date().toISOString().slice(0,10)
function relTime(iso){
  const diff = (Date.now() - new Date(iso).getTime())/1000
  if (diff < 60) return 'just now'
  const h = diff/3600
  if (h < 1) return Math.round(diff/60)+'m ago'
  if (h < 24) return Math.round(h)+'h ago'
  return Math.round(h/24)+'d ago'
}
function fmtDate(d){ if(!d) return '-'; const x=new Date(d); return x.toLocaleDateString('en-US',{month:'short',day:'numeric'}) }
function Chip({status}){
  const s = STATUS[status] || STATUS.new
  return <span className="chip" style={{background:s.c+'18',color:s.c}}>
    <span className="cd" style={{background:s.c}}/>{s.label}</span>
}
function Splash(){
  return <div className="dk"><style>{STYLES}</style>
    <div className="login"><div style={{color:'#A8A496',fontSize:14}}>Loading...</div></div></div>
}

export default function App(){
  const [booting,setBooting]=useState(true)
  const [user,setUser]=useState(null)
  const [authError,setAuthError]=useState('')
  const [view,setView]=useState('dashboard')
  const [leads,setLeads]=useState([])
  const [clients,setClients]=useState([])
  const [activity,setActivity]=useState([])
  const [employees,setEmployees]=useState([])
  const [dataError,setDataError]=useState('')
  const [selected,setSelected]=useState(null)
  const [adding,setAdding]=useState(false)
  const [bulkImport,setBulkImport]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [repFilter,setRepFilter]=useState('all')

  const isOwner = user?.role === 'owner'
  const empMap = useMemo(()=>Object.fromEntries(employees.map(e=>[e.id,e.full_name])),[employees])
  const nameOf = id => empMap[id] ?? 'Unassigned'
  const visibleLeads = isOwner && repFilter !== 'all' ? leads.filter(l => l.assigned_to === repFilter) : leads
  const visibleActivity = activity

  const loadAll = useCallback(async()=>{
    try{
      const [l,c,a,e] = await Promise.all([listLeads(),listClients(),recentActivity(),listEmployees()])
      setLeads(l); setClients(c); setActivity(a); setEmployees(e); setDataError('')
    }catch(err){ setDataError(err.message||String(err)) }
  },[])

  const loadProfile = useCallback(async()=>{
    try{
      const p = await getMyProfile()
      if(!p){ setAuthError('Signed in, but no profile row exists for this account yet. The owner needs to finish setup.'); return }
      setUser({id:p.id,name:p.full_name,role:p.role}); setAuthError('')
      await loadAll()
    }catch(err){ setAuthError(err.message||String(err)) }
  },[loadAll])

  useEffect(()=>{
    let sub
    ;(async()=>{
      try{
        const { data:{ session } } = await supabase.auth.getSession()
        if(session) await loadProfile()
      } finally { setBooting(false) }
      const res = supabase.auth.onAuthStateChange((_evt,sess)=>{
        if(sess) loadProfile()
        else { setUser(null); setLeads([]); setClients([]); setActivity([]); setEmployees([]) }
      })
      sub = res.data.subscription
    })()
    return ()=>{ sub && sub.unsubscribe() }
  },[loadProfile])

  async function patchLead(id,patch){
    try{ await qUpdateLead(id,patch); await loadAll(); setSelected(s=> s&&s.id===id ? {...s,...patch} : s) }
    catch(err){ setDataError(err.message||String(err)) }
  }
  async function addLead(form){
    try{ await qCreateLead(form); await loadAll(); setAdding(false) }
    catch(err){ setDataError(err.message||String(err)) }
  }
  async function removeLead(id){
    try{ await qDeleteLead(id); await loadAll(); setSelected(null) }
    catch(err){ setDataError('Delete blocked: '+(err.message||err)) }
  }
  async function patchClient(id,patch){
    try{ await qUpdateClient(id,patch); await loadAll() }
    catch(err){ setDataError(err.message||String(err)) }
  }
  async function removeClient(id){
    try{ await qDeleteClient(id); await loadAll() }
    catch(err){ setDataError('Delete blocked: '+(err.message||err)) }
  }
  async function addEmployee(form){ await qCreateEmployee(form); await loadAll() }
  async function bulkAddLeads(leads){
    try{ await qBulkCreateLeads(leads); await loadAll(); setBulkImport(false) }
    catch(err){ setDataError(err.message||String(err)) }
  }

  if(booting) return <Splash/>
  if(!user) return <Login onSignIn={signIn} error={authError}/>

  const NAV_TITLES = {
    dashboard: isOwner ? ['Dashboard','Company performance at a glance'] : ['My Dashboard','Your pipeline and numbers'],
    leads:     ['Leads', isOwner ? 'Every lead in the pipeline' : 'Leads assigned to you'],
    pipeline:  ['Pipeline','Move work through the stages'],
    clients:   ['Active Clients', isOwner ? 'Manage tiers, fees and build status' : 'Read-only client roster'],
    company:   ['Company Overview','Shared board, view only'],
    team:      ['Team','Employees and their numbers'],
    reports:   ['Reports','Sales, client success and performance'],
    activity:  ['Activity', isOwner ? 'Everything happening across the team' : 'Your activity log'],
    scripts:   ['Cold Call Scripts', isOwner ? 'Add and manage scripts for the team' : 'Reference scripts for your calls'],
    payroll:   ['Payroll','Commission breakdown by rep'],
  }
  const [title,sub] = NAV_TITLES[view]

  return (
    <div className="dk">
      <style>{STYLES}</style>
      <div className="shell">
        <div className={'overlay'+(menuOpen?' show':'')} onClick={()=>setMenuOpen(false)}/>
        <aside className={'side'+(menuOpen?' side-open':'')}>
          <div className="brand"><div className="mark serif">D</div><div className="wm">DekSites</div></div>
          <nav className="nav">
            <div className="nav-label">Workspace</div>
            <NavItem id="dashboard" icon={LayoutDashboard} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Dashboard</NavItem>
            <NavItem id="leads" icon={Users} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Leads</NavItem>
            <NavItem id="pipeline" icon={KanbanSquare} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Pipeline</NavItem>
            <NavItem id="clients" icon={Building2} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Clients</NavItem>
            <div className="nav-label">Company</div>
            <NavItem id="company" icon={Building2} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Overview</NavItem>
            <NavItem id="activity" icon={Activity} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Activity</NavItem>
            <NavItem id="scripts" icon={FileText} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Scripts</NavItem>
            <NavItem id="payroll" icon={DollarSign} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Payroll</NavItem>
            {isOwner && <>
              <div className="nav-label">Admin</div>
              <NavItem id="team" icon={UserCog} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Team</NavItem>
              <NavItem id="reports" icon={BarChart3} view={view} set={v=>{setView(v);setMenuOpen(false)}}>Reports</NavItem>
            </>}
          </nav>
          <div className="me">
            <div className="av">{initials(user.name)}</div>
            <div><div className="nm">{user.name}</div><div className="rl">{user.role}</div></div>
            <button onClick={()=>supabase.auth.signOut()} title="Sign out"><LogOut size={17}/></button>
          </div>
        </aside>
        <div className="main">
          <header className="top">
            <button className="menu-btn" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={22}/></button>
            <div><h1>{title}</h1><div className="sub">{sub}</div></div>
            <div className="sp"/>
            {(view==='leads'||view==='pipeline'||view==='dashboard') && <>
              {isOwner && <button className="btn btn-gh" onClick={()=>setBulkImport(true)}><Upload size={16}/>Import</button>}
              <button className="btn btn-pri" onClick={()=>setAdding(true)}><Plus size={16}/>Add lead</button>
            </>}
          </header>
          <main className="content">
            {dataError && <div className="lockbar" style={{background:'#fdecec',borderColor:'#f3c0c0',color:'#9c2a2a'}}>{dataError}</div>}
            {view==='dashboard' && <Dashboard {...{isOwner,user,visibleLeads,clients,visibleActivity,nameOf,leads}}/>}
            {view==='leads' && <Leads {...{visibleLeads,nameOf,setSelected,isOwner,repFilter,setRepFilter,employees}}/>}
            {view==='pipeline' && <Pipeline {...{visibleLeads,nameOf,patchLead,setSelected,isOwner,repFilter,setRepFilter,employees}}/>}
            {view==='clients' && <Clients {...{clients,nameOf,isOwner,patchClient,removeClient}}/>}
            {view==='company' && <Company {...{leads,clients,nameOf}}/>}
            {view==='activity' && <ActivityView {...{visibleActivity,nameOf}}/>}
            {view==='scripts' && <Scripts isOwner={isOwner}/>}
            {view==='team' && isOwner && <Team {...{leads,clients,activity,employees,isOwner,onAddEmployee:addEmployee}}/>}
            {view==='reports' && isOwner && <Reports {...{leads,clients,activity,employees}}/>}
            {view==='payroll' && <Payroll {...{clients,employees,nameOf}}/>}
          </main>
        </div>
      </div>
      {selected && <LeadDrawer lead={selected} {...{nameOf,patchLead,removeLead,isOwner,activity,employees}} onClose={()=>setSelected(null)} />}
      {adding && <AddLead onClose={()=>setAdding(false)} onSave={addLead} myId={user.id} isOwner={isOwner} employees={employees} />}
      {bulkImport && <BulkImport onClose={()=>setBulkImport(false)} onImport={bulkAddLeads} employees={employees} />}
    </div>
  )
}

function NavItem({id,icon:Icon,view,set,children}){
  return <button className={'nav-a '+(view===id?'on':'')} onClick={()=>set(id)}>
    <a className={view===id?'on':''}><Icon size={17}/>{children}</a></button>
}

// ---------- Login ----------
function Login({onSignIn,error}){
  const [email,setEmail]=useState('')
  const [pw,setPw]=useState('')
  const [busy,setBusy]=useState(false)
  const [err,setErr]=useState('')
  async function submit(){
    if(!email||!pw) return
    setBusy(true);setErr('')
    try{ await onSignIn(email.trim(),pw) }
    catch(e){ setErr(e.message||'Sign in failed') }
    finally{ setBusy(false) }
  }
  return (
    <div className="dk"><style>{STYLES}</style>
      <div className="login"><div className="lcard">
        <div className="lbrand"><div className="mark serif">D</div><div className="wm">DekSites</div></div>
        <div className="lsub">Sales CRM</div>
        <div className="lbox">
          <h3>Sign in</h3>
          <p className="h">Use your DekSites account.</p>
          <div className="fld"><label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="you@deksites.com"/></div>
          <div className="fld"><label>Password</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="password"/></div>
          {(err||error) && <div style={{color:'#c0392b',fontSize:13,marginBottom:10}}>{err||error}</div>}
          <button className="btn btn-pri" style={{width:'100%',justifyContent:'center'}} disabled={busy} onClick={submit}>{busy?'Signing in...':'Sign in'}</button>
          <div className="lnote">Accounts are created by the owner. New here? Ask Dek to add you.</div>
        </div>
      </div></div>
    </div>
  )
}

// ---------- Dashboard ----------
function Dashboard({isOwner,user,visibleLeads,clients,visibleActivity,nameOf,leads}){
  const m = useMemo(()=>{
    const active = visibleLeads.filter(l=>!['closed_won','closed_lost'].includes(l.status)).length
    const won = visibleLeads.filter(l=>l.status==='closed_won').length
    const myClients = isOwner ? clients : clients.filter(c=>c.closer_responsible===user.id || c.lead_responsible===user.id)
    const mrr = myClients.reduce((s,c)=>s+Number(c.monthly_fee||0),0)
    const one = myClients.reduce((s,c)=>s+Number(c.one_time_fee||0),0)
    const calls = visibleActivity.filter(a=>a.action_type==='call_made').length
    const dueFollow = visibleLeads.filter(l=>l.next_followup_date && l.next_followup_date<=today && !['closed_won','closed_lost'].includes(l.status)).length
    // commission per role
    let monthlyEarn = 0, oneTimeEarn = 0
    const myDeals = []
    clients.forEach(c=>{
      const cm = getCommission(c)
      const isSetter = c.lead_responsible === user.id
      const isCloser = c.closer_responsible === user.id
      if (!isSetter && !isCloser) return
      let earn = 0
      if (cm.selfClose && isSetter) {
        earn = cm.setter // self-close amount
      } else {
        if (isSetter) earn += cm.setter
        if (isCloser) earn += cm.closer
      }
      if (cm.type === 'monthly') monthlyEarn += earn
      else oneTimeEarn += earn
      if (earn > 0) myDeals.push({ ...c, earn, cm })
    })
    return { total:visibleLeads.length, active, won, mrr, one, calls, dueFollow, monthlyEarn, oneTimeEarn, myDeals }
  },[visibleLeads,clients,visibleActivity,isOwner,user])

  const cards = isOwner ? [
    ['Total Leads', m.total, Users, ''],
    ['Active Leads', m.active, TrendingUp, 'in pipeline now'],
    ['Closed Clients', m.won, CheckCircle2, ''],
    ['Monthly Recurring', money(m.mrr), Wallet, 'MRR'],
    ['One-Time Revenue', money(m.one), Wallet, 'build fees'],
  ] : [
    ['Leads Assigned', m.total, Users, ''],
    ['Active Leads', m.active, TrendingUp, 'working now'],
    ['Deals Closed', m.won, CheckCircle2, ''],
    ['Monthly Earnings', money(m.monthlyEarn)+'/mo', DollarSign, 'recurring commission'],
    ['One-Time Earnings', money(m.oneTimeEarn), Wallet, 'build commission'],
  ]

  // pipeline bar
  const pipe = PIPE_ORDER.filter(s=>!s.startsWith('closed')).map(s=>({
    s, label:STATUS[s].label, n:visibleLeads.filter(l=>l.status===s).length, c:STATUS[s].c
  }))

  return <>
    <div className="cards">
      {cards.map(([lab,val,Ic,delta])=>(
        <div className="card" key={lab}>
          <div className="lab"><span className="ic"><Ic size={15}/></span>{lab}</div>
          <div className="val num serif">{val}</div>
          {delta && <div className="delta">{delta}</div>}
        </div>
      ))}
    </div>

    <div className="grid2">
      <div className="panel">
        <div className="ph"><h3>Pipeline by stage</h3></div>
        <div style={{padding:'18px'}}>
          {pipe.every(p=>p.n===0) ? <div className="empty">No active leads</div> :
            pipe.map(p=>(
              <div key={p.s} style={{marginBottom:13}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:5}}>
                  <span style={{fontWeight:600}}>{p.label}</span><span className="muted num">{p.n}</span>
                </div>
                <div style={{height:9,background:'#f0eee7',borderRadius:6,overflow:'hidden'}}>
                  <div style={{height:'100%',width:Math.max(4,p.n/Math.max(...pipe.map(x=>x.n),1)*100)+'%',background:p.c,borderRadius:6}}/>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="panel">
        <div className="ph"><h3>{isOwner?'Team activity':'Your activity'}</h3></div>
        <div className="feed">
          {visibleActivity.slice(0,7).map(a=>{
            const ic = ACTION_ICON[a.action_type] || ACTION_ICON.lead_created
            return <div className="fi" key={a.id}>
              <div className="dot" style={{background:ic.bg,color:ic.c}}><ic.I size={15}/></div>
              <div><div className="tx"><b>{nameOf(a.actor)}</b> {a.description}</div>
                <div className="mt">{relTime(a.created_at)}</div></div>
            </div>
          })}
          {visibleActivity.length===0 && <div className="empty">No activity yet</div>}
        </div>
      </div>
    </div>

    {!isOwner && m.myDeals.length > 0 && <>
      <div className="sectitle" style={{marginTop:22}}>Your earnings breakdown</div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Client</th><th>Tier</th><th>Your role</th><th>Your cut</th></tr></thead>
          <tbody>
            {m.myDeals.map(c=>{
              const isSetter = c.lead_responsible === user.id
              const isCloser = c.closer_responsible === user.id
              const role = c.cm.selfClose ? 'Set + closed' : [isSetter&&'Setter',isCloser&&'Closer'].filter(Boolean).join(' + ')
              return <tr key={c.id} style={{cursor:'default'}}>
                <td className="bn">{c.business_name}</td>
                <td>{c.tier ? TIERS[c.tier].name.split(' - ')[0] : '-'}</td>
                <td className="muted">{role}</td>
                <td className="num" style={{color:'var(--accent-2)',fontWeight:600}}>{money(c.earn)}{c.cm.type==='monthly'?'/mo':''}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </>}
  </>
}

// ---------- Leads table ----------
function Leads({visibleLeads,nameOf,setSelected,isOwner,repFilter,setRepFilter,employees}){
  const [q,setQ] = useState('')
  const [filter,setFilter] = useState('all')
  const [webFilter,setWebFilter] = useState('all')
  const [sort,setSort] = useState({k:'updated',dir:'desc'})

  const rows = useMemo(()=>{
    let r = visibleLeads.filter(l=>{
      const hit = (l.business_name+' '+(l.phone||'')).toLowerCase().includes(q.toLowerCase())
      const fok = filter==='all' || l.status===filter
      const wok = webFilter==='all' || (webFilter==='yes' ? l.website_exists : !l.website_exists)
      return hit && fok && wok
    })
    const sgn = sort.dir==='asc'?1:-1
    r = [...r].sort((a,b)=>{
      let av,bv
      if(sort.k==='business'){av=a.business_name;bv=b.business_name}
      else if(sort.k==='status'){av=PIPE_ORDER.indexOf(a.status);bv=PIPE_ORDER.indexOf(b.status)}
      else if(sort.k==='followup'){av=a.next_followup_date||'';bv=b.next_followup_date||''}
      else {av=a.created_at;bv=b.created_at}
      return av<bv?-sgn:av>bv?sgn:0
    })
    return r
  },[visibleLeads,q,filter,webFilter,sort])

  const th = (k,label)=>(
    <th onClick={()=>setSort(s=>({k,dir:s.k===k&&s.dir==='asc'?'desc':'asc'}))}>
      <span className="sg">{label}<ArrowUpDown size={12} opacity={sort.k===k?1:.35}/></span></th>
  )

  return <div className="tbl-wrap">
    <div className="tools">
      <div className="srch"><Search size={16} className="muted"/>
        <input placeholder="Search business, phone" value={q} onChange={e=>setQ(e.target.value)}/></div>
      {isOwner && <select className="sel" value={repFilter} onChange={e=>setRepFilter(e.target.value)}>
        <option value="all">All reps</option>
        {employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}
      </select>}
      <select className="sel" value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="all">All statuses</option>
        {PIPE_ORDER.map(s=><option key={s} value={s}>{STATUS[s].label}</option>)}
      </select>
      <select className="sel" value={webFilter} onChange={e=>setWebFilter(e.target.value)}>
        <option value="all">Website: All</option>
        <option value="yes">Has website</option>
        <option value="no">No website</option>
      </select>
    </div>
    {rows.length===0 ? <div className="empty">No leads match.</div> :
    <table>
      <thead><tr>
        {th('business','Business')}
        <th>Phone</th>
        <th>Website</th>
        <th>State</th>
        <th>City</th>
        {th('status','Status')}
        {isOwner && <th>Setter</th>}
        {isOwner && <th>Closer</th>}
      </tr></thead>
      <tbody>
        {rows.map(l=>(
          <tr key={l.id} onClick={()=>setSelected(l)}>
            <td className="bn">{l.business_name}</td>
            <td className="muted num">{l.phone||'-'}</td>
            <td className="muted">{l.website_exists?'Yes':'No'}</td>
            <td className="muted">{l.state||'-'}</td>
            <td className="muted">{l.city||'-'}</td>
            <td><Chip status={l.status}/></td>
            {isOwner && <td className="muted">{nameOf(l.created_by)}</td>}
            {isOwner && <td className="muted">{nameOf(l.assigned_to)}</td>}
          </tr>
        ))}
      </tbody>
    </table>}
  </div>
}

// ---------- Pipeline / kanban ----------
function Pipeline({visibleLeads,nameOf,patchLead,setSelected,isOwner,repFilter,setRepFilter,employees}){
  return <>
    {isOwner && <div style={{marginBottom:14}}>
      <select className="sel" value={repFilter} onChange={e=>setRepFilter(e.target.value)}>
        <option value="all">All reps</option>
        {employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}
      </select>
    </div>}
    <div className="kb">
    {PIPE_ORDER.map(s=>{
      const items = visibleLeads.filter(l=>l.status===s)
      return <div className="col" key={s}>
        <div className="ch"><span className="cd" style={{width:8,height:8,borderRadius:'50%',background:STATUS[s].c,display:'inline-block'}}/>{STATUS[s].label}<span className="ct num">{items.length}</span></div>
        <div className="cb">
          {items.map(l=>(
            <div className="kc" key={l.id} onClick={()=>setSelected(l)}>
              <div className="kn">{l.business_name}</div>
              <select value={l.status} onClick={e=>e.stopPropagation()} onChange={e=>patchLead(l.id,{status:e.target.value})}>
                {PIPE_ORDER.map(o=><option key={o} value={o}>{STATUS[o].label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    })}
  </div>
  </>
}

// ---------- Clients ----------
function Clients({clients,nameOf,isOwner,patchClient,removeClient}){
  const [edit,setEdit] = useState(null)
  return <>
    {!isOwner && <div className="lockbar"><Lock size={15}/>Read-only. Only the owner can edit client tiers and fees.</div>}
    <div className="tbl-wrap">
      {clients.length===0 ? <div className="empty">No clients yet. Close a lead to convert it.</div> :
      <table>
        <thead><tr><th>Client</th><th>Tier</th><th>Monthly</th><th>Build</th><th>Closer</th><th>Build status</th>{isOwner&&<th></th>}</tr></thead>
        <tbody>
          {clients.map(c=>(
            <tr key={c.id} style={{cursor:'default'}}>
              <td className="bn">{c.business_name}<div className="muted" style={{fontWeight:400,fontSize:12}}>{c.website_url||'-'}</div></td>
              <td>{c.tier ? TIERS[c.tier].name.split(' - ')[0] : <span className="chip" style={{background:'#FEF3C7',color:'#92400E'}}>Set tier</span>}</td>
              <td className="num">{money(c.monthly_fee)}</td>
              <td className="num">{money(c.one_time_fee)}</td>
              <td className="muted">{nameOf(c.closer_responsible)}</td>
              <td><span className="chip" style={{background:'#EEF0F2',color:'#475569'}}>{c.website_status.replace('_',' ')}</span></td>
              {isOwner && <td style={{display:'flex',gap:6}}>
                <button className="btn btn-gh btn-sm" onClick={()=>setEdit(c)}>Edit</button>
                <button className="btn btn-gh btn-sm" style={{color:'#BE123C'}} onClick={()=>{if(window.confirm('Delete '+c.business_name+'? This removes their MRR and revenue from all reports.'))removeClient(c.id)}}><Trash2 size={13}/></button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
    {edit && <ClientEdit client={edit} onClose={()=>setEdit(null)} onSave={p=>{patchClient(edit.id,p);setEdit(null)}}/>}
  </>
}

function ClientEdit({client,onClose,onSave}){
  const [f,setF] = useState({tier:client.tier||'tier_01', website_status:client.website_status, launch_date:client.launch_date, notes:client.notes})
  const set=(k,v)=>setF(s=>({...s,[k]:v}))
  return <>
    <div className="scrim" onClick={onClose}/>
    <div className="drawer">
      <div className="dh"><div><h2>{client.business_name}</h2><div className="muted" style={{fontSize:13,marginTop:2}}>Set tier and build status</div></div>
        <button className="x" onClick={onClose}><X size={20}/></button></div>
      <div className="db">
        <div className="fld"><label>Plan tier</label>
          <select value={f.tier} onChange={e=>set('tier',e.target.value)}>
            {Object.entries(TIERS).map(([k,v])=><option key={k} value={k}>{v.name} ({money(v.one)} + {money(v.mo)}/mo)</option>)}
          </select></div>
        <div className="frow">
          <div className="fld"><label>Monthly fee</label><input value={money(TIERS[f.tier].mo)} disabled/></div>
          <div className="fld"><label>Build fee</label><input value={money(TIERS[f.tier].one)} disabled/></div>
        </div>
        <div className="fld"><label>Build status</label>
          <select value={f.website_status} onChange={e=>set('website_status',e.target.value)}>
            {['not_started','in_progress','review','launched'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select></div>
        <div className="fld"><label>Launch date</label><input type="date" value={f.launch_date} onChange={e=>set('launch_date',e.target.value)}/></div>
        <div className="fld"><label>Notes</label><textarea rows={3} value={f.notes} onChange={e=>set('notes',e.target.value)}/></div>
      </div>
      <div className="df">
        <button className="btn btn-pri" onClick={()=>onSave({tier:f.tier,monthly_fee:TIERS[f.tier].mo,one_time_fee:TIERS[f.tier].one,website_status:f.website_status,launch_date:f.launch_date,notes:f.notes})}>Save</button>
        <button className="btn btn-gh" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </>
}

// ---------- Company overview (read-only) ----------
function Company({leads,clients,nameOf}){
  const mrr = clients.reduce((s,c)=>s+Number(c.monthly_fee||0),0)
  const build = clients.reduce((s,c)=>s+Number(c.one_time_fee||0),0)
  return <>
    <div className="lockbar"><Lock size={15}/>Shared company board. Everyone can view, nobody edits here.</div>
    <div className="cards" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
      <div className="card"><div className="lab"><span className="ic"><Wallet size={15}/></span>Monthly Recurring</div><div className="val serif num">{money(mrr)}</div></div>
      <div className="card"><div className="lab"><span className="ic"><TrendingUp size={15}/></span>Total Build Revenue</div><div className="val serif num">{money(build)}</div></div>
      <div className="card"><div className="lab"><span className="ic"><Building2 size={15}/></span>Active Clients</div><div className="val serif num">{clients.length}</div></div>
    </div>
    <div className="sectitle">Active clients</div>
    <div className="tbl-wrap" style={{marginBottom:22}}>
      <table><thead><tr><th>Client</th><th>Tier</th><th>Lead gen</th><th>Closer</th><th>Website</th></tr></thead>
        <tbody>{clients.map(c=>(
          <tr key={c.id} style={{cursor:'default'}}>
            <td className="bn">{c.business_name}</td>
            <td>{c.tier?TIERS[c.tier].name.split(' - ')[0]:'-'}</td>
            <td className="muted">{nameOf(c.lead_responsible)}</td>
            <td className="muted">{nameOf(c.closer_responsible)}</td>
            <td><span className="chip" style={{background:'#EEF0F2',color:'#475569'}}>{c.website_status.replace('_',' ')}</span></td>
          </tr>))}</tbody></table>
    </div>

    <div className="sectitle">Team notes</div>
    <div className="panel" style={{marginBottom:22}}>
      <div style={{padding:'18px 22px'}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Team meetings / sales training</div>
        <div style={{fontSize:14,color:'var(--ink)',lineHeight:1.6}}>Every <b>Saturday</b> and <b>Wednesday</b></div>
      </div>
    </div>

    <div className="panel" style={{marginBottom:22}}>
      <div className="ph"><h3>Commission splits</h3></div>
      <div style={{padding:'16px 22px'}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:'var(--accent-2)'}}>Essentials (one-time)</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:6}}>
          <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:9,padding:12,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600}} className="serif num">$250</div>
            <div style={{fontSize:12,color:'var(--soft)',marginTop:2}}>Dek</div>
          </div>
          <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:9,padding:12,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600}} className="serif num">$150</div>
            <div style={{fontSize:12,color:'var(--soft)',marginTop:2}}>Closer</div>
          </div>
          <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:9,padding:12,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600}} className="serif num">$100</div>
            <div style={{fontSize:12,color:'var(--soft)',marginTop:2}}>Setter</div>
          </div>
        </div>
        <div style={{fontSize:12,color:'var(--soft)',marginBottom:20,fontStyle:'italic'}}>If you close your own deals you get 50%</div>

        <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:'var(--accent-2)'}}>AEO (monthly)</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:6}}>
          <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:9,padding:12,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600}} className="serif num">$750</div>
            <div style={{fontSize:12,color:'var(--soft)',marginTop:2}}>Dek</div>
          </div>
          <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:9,padding:12,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600}} className="serif num">$400</div>
            <div style={{fontSize:12,color:'var(--soft)',marginTop:2}}>Closer</div>
          </div>
          <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:9,padding:12,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:600}} className="serif num">$350</div>
            <div style={{fontSize:12,color:'var(--soft)',marginTop:2}}>Setter</div>
          </div>
        </div>
        <div style={{fontSize:12,color:'var(--soft)',fontStyle:'italic'}}>If you close your own deals you get 50%</div>
      </div>
    </div>

    <div className="panel">
      <div style={{padding:'18px 22px'}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Stripe payment link</div>
        <div style={{fontSize:13,marginBottom:6}}>Essentials customers:</div>
        <a href="https://buy.stripe.com/3cI9AUfrham3cNmcRW2ZO00" target="_blank" rel="noopener noreferrer"
          style={{fontSize:13,color:'var(--accent-2)',wordBreak:'break-all'}}>
          https://buy.stripe.com/3cI9AUfrham3cNmcRW2ZO00
        </a>
      </div>
    </div>
  </>
}

// ---------- Activity ----------
function ActivityView({visibleActivity,nameOf}){
  return <div className="panel">
    <div className="feed">
      {visibleActivity.map(a=>{
        const ic = ACTION_ICON[a.action_type] || ACTION_ICON.lead_created
        return <div className="fi" key={a.id}>
          <div className="dot" style={{background:ic.bg,color:ic.c}}><ic.I size={15}/></div>
          <div><div className="tx"><b>{nameOf(a.actor)}</b> {a.description}</div><div className="mt">{relTime(a.created_at)}</div></div>
        </div>
      })}
      {visibleActivity.length===0 && <div className="empty">No activity logged yet.</div>}
    </div>
  </div>
}

// ---------- Team (owner) ----------
function AddEmployee({onClose,onCreate}){
  const [f,setF]=useState({full_name:'',email:'',username:'',password:''})
  const [busy,setBusy]=useState(false)
  const [err,setErr]=useState('')
  const set=(k,v)=>setF(s=>({...s,[k]:v}))
  async function save(){
    if(!f.full_name||!f.email||!f.password) return
    setBusy(true);setErr('')
    try{ await onCreate(f); onClose() }
    catch(e){ setErr(e.message||'Could not create employee. Is the create-employee function deployed?') }
    finally{ setBusy(false) }
  }
  return <>
    <div className="scrim" onClick={onClose}/>
    <div className="drawer">
      <div className="dh"><div><h2>New employee</h2><div className="muted" style={{fontSize:13,marginTop:2}}>Creates a login and a profile</div></div>
        <button className="x" onClick={onClose}><X size={20}/></button></div>
      <div className="db">
        <div className="fld"><label>Full name *</label><input value={f.full_name} onChange={e=>set('full_name',e.target.value)}/></div>
        <div className="fld"><label>Email *</label><input type="email" value={f.email} onChange={e=>set('email',e.target.value)}/></div>
        <div className="fld"><label>Username</label><input value={f.username} onChange={e=>set('username',e.target.value)}/></div>
        <div className="fld"><label>Temporary password *</label><input value={f.password} onChange={e=>set('password',e.target.value)} placeholder="they can change it later"/></div>
        {err && <div style={{color:'#c0392b',fontSize:13}}>{err}</div>}
      </div>
      <div className="df">
        <button className="btn btn-pri" disabled={busy} onClick={save}>{busy?'Creating...':'Create employee'}</button>
        <button className="btn btn-gh" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </>
}

function Team({leads,clients,activity,employees,isOwner,onAddEmployee}){
  const [addEmp,setAddEmp]=useState(false)
  const rows = employees.filter(e=>e.role==='employee').map(e=>{
    const mine = leads.filter(l=>l.assigned_to===e.id)
    const calls = activity.filter(a=>a.actor===e.id && a.action_type==='call_made').length
    const due = mine.filter(l=>l.next_followup_date && l.next_followup_date<=today && !['closed_won','closed_lost'].includes(l.status)).length
    const won = mine.filter(l=>l.status==='closed_won').length
    const rev = clients.filter(c=>c.closer_responsible===e.id).reduce((s,c)=>s+Number(c.monthly_fee||0)+Number(c.one_time_fee||0),0)
    return { e, assigned:mine.length, calls, due, won, rev }
  })
  return <>
    {isOwner && <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
      <button className="btn btn-pri" onClick={()=>setAddEmp(true)}><Plus size={16}/>Add employee</button></div>}
    <div className="tbl-wrap">
      {rows.length===0 ? <div className="empty">No employees yet. Add your first rep.</div> :
      <table><thead><tr><th>Employee</th><th>Leads</th><th>Calls</th><th>Follow-ups due</th><th>Closed</th><th>Revenue</th></tr></thead>
        <tbody>{rows.map(r=>(
          <tr key={r.e.id} style={{cursor:'default'}}>
            <td className="bn">{r.e.full_name}</td>
            <td className="num">{r.assigned}</td>
            <td className="num">{r.calls}</td>
            <td className="num">{r.due}</td>
            <td className="num">{r.won}</td>
            <td className="num" style={{fontWeight:600}}>{money(r.rev)}</td>
          </tr>))}</tbody></table>}
    </div>
    {addEmp && <AddEmployee onClose={()=>setAddEmp(false)} onCreate={onAddEmployee}/>}
  </>
}

// ---------- Reports (owner) ----------
function Reports({leads,clients,activity,employees}){
  const byStatus = PIPE_ORDER.map(s=>({name:STATUS[s].label,n:leads.filter(l=>l.status===s).length,c:STATUS[s].c}))
  const contacted = leads.filter(l=>!['new','attempted_contact'].includes(l.status)).length
  const won = leads.filter(l=>l.status==='closed_won').length
  const conv = leads.length ? Math.round(won/leads.length*100) : 0
  const mrr = clients.reduce((s,c)=>s+Number(c.monthly_fee||0),0)
  const tierSplit = Object.keys(TIERS).map(t=>({name:TIERS[t].name.split(' - ')[0],value:clients.filter(c=>c.tier===t).length,c:t==='tier_01'?'#94A3B8':'#F5B800'}))
  const perRep = employees.filter(e=>e.role==='employee').map(e=>({
    name:e.full_name, revenue:clients.filter(c=>c.closer_responsible===e.id).reduce((s,c)=>s+Number(c.monthly_fee||0)+Number(c.one_time_fee||0),0)
  }))

  return <>
    <div className="kpis">
      {[['Leads created',leads.length],['Leads contacted',contacted],['Conversion rate',conv+'%'],['Active MRR',money(mrr)]].map(([l,v])=>(
        <div className="card" key={l}><div className="lab">{l}</div><div className="val serif num" style={{fontSize:26}}>{v}</div></div>
      ))}
    </div>
    <div className="rgrid">
      <div className="panel">
        <div className="ph"><h3>Leads by status</h3></div>
        <div style={{padding:18,height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus} layout="vertical" margin={{left:10,right:20}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="name" width={92} tick={{fontSize:12,fill:'#6B675C'}} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{fill:'#f0eee7'}} contentStyle={{borderRadius:10,border:'1px solid #E7E3DA',fontSize:13}}/>
              <Bar dataKey="n" radius={[0,6,6,0]} barSize={16}>
                {byStatus.map((d,i)=><Cell key={i} fill={d.c}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel">
        <div className="ph"><h3>Clients by tier</h3></div>
        <div style={{padding:18,height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tierSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {tierSplit.map((d,i)=><Cell key={i} fill={d.c}/>)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:10,border:'1px solid #E7E3DA',fontSize:13}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:18,justifyContent:'center',marginTop:4}}>
            {tierSplit.map(t=><div key={t.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5}}>
              <span style={{width:9,height:9,borderRadius:'50%',background:t.c}}/>{t.name} ({t.value})</div>)}
          </div>
        </div>
      </div>
      <div className="panel" style={{gridColumn:'1 / -1'}}>
        <div className="ph"><h3>Revenue closed by rep</h3></div>
        <div style={{padding:18,height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perRep} margin={{left:0,right:10}}>
              <XAxis dataKey="name" tick={{fontSize:12,fill:'#6B675C'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:'#6B675C'}} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{fill:'#f0eee7'}} formatter={v=>money(v)} contentStyle={{borderRadius:10,border:'1px solid #E7E3DA',fontSize:13}}/>
              <Bar dataKey="revenue" fill="#F5B800" radius={[6,6,0,0]} barSize={46}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </>
}

// ---------- Scripts ----------
function Scripts({isOwner}){
  return <>
    {!isOwner && <div className="lockbar"><Lock size={15}/>View only. Scripts are managed by the owner.</div>}

    <div className="panel" style={{marginBottom:20}}>
      <div className="ph"><h3>Tier 01 - Cold Call Script</h3><div className="sp"/><span className="chip" style={{background:'var(--accent-soft)',color:'var(--accent-2)'}}>Essentials</span></div>
      <div style={{padding:'20px 22px',fontSize:14,lineHeight:1.75}}>

        <div style={{background:'var(--paper)',borderRadius:10,padding:14,marginBottom:18,border:'1px solid var(--line)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--soft)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Opening</div>
          <p><b>"Hello, is this <span style={{color:'var(--accent-2)'}}>(company name)</span>?"</b></p>
          <p style={{color:'var(--soft)',fontSize:13,fontStyle:'italic',marginTop:4}}>Let them introduce themselves and the company.</p>
        </div>

        <div style={{background:'var(--paper)',borderRadius:10,padding:14,marginBottom:18,border:'1px solid var(--line)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--soft)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Hook</div>
          <p><b>"Hey <span style={{color:'var(--accent-2)'}}>(customer name)</span>! I have a quick question for you. I was just looking for your website so I can see what services you provided but I couldn't find it?"</b></p>
          <p style={{color:'var(--soft)',fontSize:13,fontStyle:'italic',marginTop:4}}>Pause and wait for response.</p>
        </div>

        <div style={{background:'var(--paper)',borderRadius:10,padding:14,marginBottom:18,border:'1px solid var(--line)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--soft)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Transition</div>
          <p><b>"No worries, I figured based on your reviews you guys did good work.</b></p>
          <p style={{marginTop:8}}><b>This is <span style={{color:'var(--accent-2)'}}>(your name)</span> with DekSites, I have some pretty cool news, I went ahead and already built you a fully functioning website.</b></p>
          <p style={{marginTop:8}}><b>Now to be fair, I don't know if this would make sense for you at the moment, but that's the reason I was calling. I can give you a quick demo tomorrow or <span style={{color:'var(--accent-2)'}}>(next day)</span>, and just show you how it looks at no cost. Are you more of an afternoon person or morning person?"</b></p>
        </div>

        <div style={{background:'var(--paper)',borderRadius:10,padding:14,marginBottom:18,border:'1px solid var(--line)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--soft)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Objection handling</div>
          <p><b>"Totally fair, I know you're busy. Can I send you over the website so you can poke around with it?"</b></p>

          <div style={{marginTop:14,paddingLeft:14,borderLeft:'3px solid var(--accent)'}}>
            <div style={{fontSize:12,fontWeight:600,color:'#0F7A5A',marginBottom:4}}>If yes:</div>
            <p><b>"I'll fire it over right now, and let's grab 10 minutes <span style={{color:'var(--accent-2)'}}>(tomorrow)</span> so I can show you the couple of features you'd miss just clicking around. Does morning or afternoon work for you?"</b></p>
          </div>

          <div style={{marginTop:14,paddingLeft:14,borderLeft:'3px solid #BE123C'}}>
            <div style={{fontSize:12,fontWeight:600,color:'#BE123C',marginBottom:4}}>If no:</div>
            <p><b>"I understand, I know most people in the past have looked into websites but it's always been too pricy or they haven't had the time. Which one is it for you?"</b></p>
            <p style={{color:'var(--soft)',fontSize:13,fontStyle:'italic',marginTop:6}}>Customer explains reasoning.</p>
            <p style={{color:'var(--soft)',fontSize:13,marginTop:6}}><b>"Too pricy"</b> = value conversation. Anchor against the $4K-$8K agency quote.</p>
            <p style={{color:'var(--soft)',fontSize:13}}><b>"No time"</b> = friction conversation. You do everything, they do nothing.</p>
          </div>
        </div>

        <div style={{background:'var(--paper)',borderRadius:10,padding:14,border:'1px solid var(--line)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--soft)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Soft close / follow-up</div>
          <p><b>"Okay, let's just do this. I am going to send you over the website so you can poke around and I'll follow up with you in a few days to see where your head is at. Does <span style={{color:'var(--accent-2)'}}>(x day)</span> work or <span style={{color:'var(--accent-2)'}}>(y day)</span>?"</b></p>
        </div>

      </div>
    </div>
  </>
}

// ---------- Payroll ----------
function Payroll({clients,employees,nameOf}){
  // Compute per-rep earnings across both roles (setter and closer)
  const reps = employees.filter(e=>e.role==='employee').map(e=>{
    let monthlyEarn = 0, oneTimeEarn = 0, dealCount = 0
    clients.forEach(c=>{
      const cm = getCommission(c)
      const isSetter = c.lead_responsible === e.id
      const isCloser = c.closer_responsible === e.id
      if (!isSetter && !isCloser) return
      let earn = 0
      if (cm.selfClose && isSetter) { earn = cm.setter }
      else { if (isSetter) earn += cm.setter; if (isCloser) earn += cm.closer }
      if (earn > 0) dealCount++
      if (cm.type === 'monthly') monthlyEarn += earn; else oneTimeEarn += earn
    })
    return { e, monthlyEarn, oneTimeEarn, dealCount }
  })
  const totalMo = reps.reduce((s,r)=>s+r.monthlyEarn,0)
  const totalOne = reps.reduce((s,r)=>s+r.oneTimeEarn,0)
  const companyMrr = clients.reduce((s,c)=>s+Number(c.monthly_fee||0),0)
  const companyBuild = clients.reduce((s,c)=>s+Number(c.one_time_fee||0),0)

  return <>
    <div className="cards" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
      <div className="card"><div className="lab"><span className="ic"><Wallet size={15}/></span>Company MRR</div><div className="val serif num">{money(companyMrr)}</div></div>
      <div className="card"><div className="lab"><span className="ic"><DollarSign size={15}/></span>Monthly payroll</div><div className="val serif num" style={{color:'#B45309'}}>{money(totalMo)}</div><div className="delta">rep commissions/mo</div></div>
      <div className="card"><div className="lab"><span className="ic"><TrendingUp size={15}/></span>Net monthly</div><div className="val serif num" style={{color:'var(--accent-2)'}}>{money(companyMrr - totalMo)}</div><div className="delta">after commissions</div></div>
      <div className="card"><div className="lab"><span className="ic"><Wallet size={15}/></span>Build payroll</div><div className="val serif num">{money(totalOne)}</div><div className="delta">one-time owed</div></div>
    </div>

    <div className="sectitle">Commission by rep</div>
    <div className="tbl-wrap" style={{marginBottom:22}}>
      <table>
        <thead><tr><th>Rep</th><th>Deals involved</th><th>Monthly earnings</th><th>One-time earnings</th></tr></thead>
        <tbody>
          {reps.map(r=>(
            <tr key={r.e.id} style={{cursor:'default'}}>
              <td className="bn">{r.e.full_name}</td>
              <td className="num">{r.dealCount}</td>
              <td className="num">{money(r.monthlyEarn)}/mo</td>
              <td className="num">{money(r.oneTimeEarn)}</td>
            </tr>
          ))}
          {reps.length===0 && <tr><td colSpan={4} className="empty">No employees yet.</td></tr>}
        </tbody>
      </table>
    </div>

    <div className="sectitle">Client-level detail</div>
    <div className="tbl-wrap">
      <table>
        <thead><tr><th>Client</th><th>Tier</th><th>Setter</th><th>Closer</th><th>Self-closed</th><th>Setter payout</th><th>Closer payout</th><th>Dek keeps</th></tr></thead>
        <tbody>
          {clients.map(c=>{
            const cm = getCommission(c)
            const isOwnerSetter = employees.find(e=>e.id===c.lead_responsible)?.role === 'owner'
            const isOwnerCloser = employees.find(e=>e.id===c.closer_responsible)?.role === 'owner'
            return <tr key={c.id} style={{cursor:'default'}}>
              <td className="bn">{c.business_name}</td>
              <td>{c.tier ? TIERS[c.tier].name.split(' - ')[0] : '-'}</td>
              <td className="muted">{nameOf(c.lead_responsible)}</td>
              <td className="muted">{nameOf(c.closer_responsible)}</td>
              <td className="muted">{cm.selfClose ? 'Yes' : 'No'}</td>
              <td className="num" style={{color:isOwnerSetter?'var(--soft)':'#B45309'}}>{isOwnerSetter ? '-' : money(cm.setter)}{cm.type==='monthly'&&!isOwnerSetter?'/mo':''}</td>
              <td className="num" style={{color:isOwnerCloser||cm.selfClose?'var(--soft)':'#B45309'}}>{isOwnerCloser||cm.selfClose ? '-' : money(cm.closer)}{cm.type==='monthly'&&!isOwnerCloser&&!cm.selfClose?'/mo':''}</td>
              <td className="num" style={{fontWeight:600}}>{money(cm.dek)}{cm.type==='monthly'?'/mo':''}</td>
            </tr>}
          )}
          {clients.length===0 && <tr><td colSpan={8} className="empty">No clients yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </>
}

// ---------- Lead drawer ----------
function LeadDrawer({lead,nameOf,patchLead,removeLead,isOwner,activity,onClose,employees}){
  const [tab,setTab] = useState('details')
  const [f,setF] = useState(lead)
  useEffect(()=>setF(lead),[lead])
  const set=(k,v)=>setF(s=>({...s,[k]:v}))
  const save=()=>patchLead(lead.id,{
    contact_name:f.contact_name,phone:f.phone,email:f.email,website_url:f.website_url,
    website_exists:f.website_exists,lead_source:f.lead_source,status:f.status,state:f.state,city:f.city,
    next_followup_date:f.next_followup_date,last_contact_date:f.last_contact_date,notes:f.notes,
    assigned_to:f.assigned_to
  })
  const history = activity.filter(a=>a.description.includes(lead.business_name))

  return <>
    <div className="scrim" onClick={onClose}/>
    <div className="drawer">
      <div className="dh">
        <div><h2>{lead.business_name}</h2><div style={{marginTop:6}}><Chip status={f.status}/></div></div>
        <button className="x" onClick={onClose}><X size={20}/></button>
      </div>
      <div style={{display:'flex',gap:4,padding:'12px 22px 0'}}>
        {['details','timeline'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'7px 13px',borderRadius:8,fontSize:13,fontWeight:600,
            background:tab===t?'#FFF8E1':'transparent',color:tab===t?'#D9A200':'#6B675C',textTransform:'capitalize'}}>{t}</button>
        ))}
      </div>
      <div className="db">
        {tab==='details' ? <>
          <div className="fld"><label>Status</label>
            <select value={f.status} onChange={e=>set('status',e.target.value)}>
              {PIPE_ORDER.map(s=><option key={s} value={s}>{STATUS[s].label}</option>)}</select></div>
          <div className="fld"><label>Phone</label><input value={f.phone||''} onChange={e=>set('phone',formatPhone(e.target.value))}/></div>
          <div className="fld"><label>Email</label><input value={f.email||''} onChange={e=>set('email',e.target.value)}/></div>
          <div className="frow">
            <div className="fld"><label>Has website</label>
              <select value={f.website_exists?'yes':'no'} onChange={e=>set('website_exists',e.target.value==='yes')}>
                <option value="no">No</option><option value="yes">Yes</option></select></div>
            <div className="fld"><label>Lead source</label><input value={f.lead_source||''} onChange={e=>set('lead_source',e.target.value)}/></div>
          </div>
          <div className="frow">
            <div className="fld"><label>State</label><input value={f.state||''} onChange={e=>set('state',e.target.value)} placeholder="e.g. NV"/></div>
            <div className="fld"><label>City</label><input value={f.city||''} onChange={e=>set('city',e.target.value)} placeholder="e.g. Las Vegas"/></div>
          </div>
          {f.website_exists && <div className="fld"><label>Website URL</label><input value={f.website_url||''} onChange={e=>set('website_url',e.target.value)}/></div>}
          <div className="frow">
            <div className="fld"><label>Last contact</label><input type="date" value={f.last_contact_date||''} onChange={e=>set('last_contact_date',e.target.value)}/></div>
            <div className="fld"><label>Next follow-up</label><input type="date" value={f.next_followup_date||''} onChange={e=>set('next_followup_date',e.target.value)}/></div>
          </div>
          <div className="fld"><label>Notes</label><textarea rows={4} value={f.notes||''} onChange={e=>set('notes',e.target.value)}/></div>
          <div className="fld"><label>Closer</label>
            <select value={f.assigned_to||''} onChange={e=>set('assigned_to',e.target.value)}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select></div>
        </> : <>
          <div className="tl">
            {history.length===0 ? <div className="empty">No history yet.</div> :
              history.map(a=>(
                <div className="tle" key={a.id}><div className="tld"/>
                  <div><div className="tlt">{a.description}</div><div className="tlm">{nameOf(a.actor)} · {relTime(a.created_at)}</div></div>
                </div>
              ))}
          </div>
        </>}
      </div>
      <div className="df">
        <button className="btn btn-pri" onClick={()=>{save();onClose()}}>Save changes</button>
        {isOwner && <button className="btn btn-gh" style={{color:'#BE123C',marginLeft:'auto'}} onClick={()=>removeLead(lead.id)}><Trash2 size={15}/>Delete</button>}
      </div>
    </div>
  </>
}

// ---------- Bulk import ----------
function BulkImport({onClose,onImport,employees}){
  const [assignTo,setAssignTo]=useState(employees[0]?.id||'')
  const [raw,setRaw]=useState('')
  const [parsed,setParsed]=useState([])
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)

  function parse(text){
    if(!text.trim()){setParsed([]);return}
    const lines=text.trim().split('\n').filter(l=>l.trim())
    const sep=lines[0].includes('\t')?'\t':','
    // detect if first row is a header
    const firstCols=lines[0].split(sep).map(c=>c.trim().toLowerCase())
    const headerWords=['business','name','phone','email','contact','notes']
    const hasHeader=firstCols.some(c=>headerWords.some(h=>c.includes(h)))
    const dataLines=hasHeader?lines.slice(1):lines
    const rows=dataLines.map(line=>{
      const cols=line.split(sep).map(c=>c.trim().replace(/^["']|["']$/g,''))
      return {
        business_name:cols[0]||'',
        phone:cols[1]||'',
        website_exists:(cols[2]||'').toLowerCase().trim(),
        state:cols[3]||'',
        city:cols[4]||'',
        notes:cols[5]||''
      }
    }).filter(r=>r.business_name)
    setParsed(rows)
  }

  function handleFile(e){
    const file=e.target.files?.[0]
    if(!file)return
    const reader=new FileReader()
    reader.onload=(ev)=>{const text=ev.target?.result||'';setRaw(text);parse(text)}
    reader.readAsText(file)
  }

  function handlePaste(text){setRaw(text);parse(text)}

  async function submit(){
    if(!parsed.length||!assignTo)return
    setBusy(true);setError('')
    try{
      const leads=parsed.map(r=>({
        business_name:r.business_name,
        phone:r.phone?formatPhone(r.phone):null,
        state:r.state||null,
        city:r.city||null,
        notes:r.notes||null,
        website_exists:['yes','y','true','1'].includes(r.website_exists),
        lead_source:'Bulk import',
        status:'new',
        assigned_to:assignTo,
        created_by:assignTo
      }))
      await onImport(leads)
    }catch(err){setError(err.message||String(err))}
    finally{setBusy(false)}
  }

  return <>
    <div className="scrim" onClick={onClose}/>
    <div className="drawer">
      <div className="dh"><div><h2>Import leads</h2><div className="muted" style={{fontSize:13,marginTop:2}}>Paste from Google Sheets or upload a CSV</div></div>
        <button className="x" onClick={onClose}><X size={20}/></button></div>
      <div className="db">
        <div className="fld"><label>Assign to (setter + closer)</label>
          <select value={assignTo} onChange={e=>setAssignTo(e.target.value)}>
            {employees.map(e=><option key={e.id} value={e.id}>{e.full_name}{e.role==='owner'?' (you)':''}</option>)}
          </select></div>

        <div style={{background:'var(--paper)',border:'1px solid var(--line)',borderRadius:11,padding:14,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--soft)',marginBottom:8}}>Expected columns (in order)</div>
          <div style={{fontSize:13}}>Business Name, Phone, Has Website, State, City, Notes</div>
          <div style={{fontSize:12,color:'var(--soft)',marginTop:4}}>First column (Business Name) is required. Others are optional. Has Website = Yes or No. Header row auto-detected and skipped.</div>
        </div>

        <div className="fld">
          <label>Paste rows from spreadsheet</label>
          <textarea rows={8} value={raw} onChange={e=>{handlePaste(e.target.value)}}
            placeholder={"Diamonds Auto Body\t(702) 929-0730\tNo\tNV\tLas Vegas\tInterested in Tier 01\nHeavy Duty Collision\t(702) 555-0192\tNo\tNV\tLas Vegas\t"}
            style={{fontFamily:'monospace',fontSize:12}}/>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <div style={{flex:1,height:1,background:'var(--line)'}}/>
          <span style={{fontSize:12,color:'var(--soft)'}}>or</span>
          <div style={{flex:1,height:1,background:'var(--line)'}}/>
        </div>

        <div className="fld">
          <label>Upload CSV file</label>
          <input type="file" accept=".csv,.tsv,.txt" onChange={handleFile} style={{fontSize:13}}/>
        </div>

        {parsed.length > 0 && <>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8,marginTop:8}}>{parsed.length} lead{parsed.length!==1?'s':''} ready to import</div>
          <div style={{maxHeight:240,overflowY:'auto',border:'1px solid var(--line)',borderRadius:10}}>
            <table>
              <thead><tr><th>Business</th><th>Phone</th><th>Website</th><th>State</th><th>City</th></tr></thead>
              <tbody>
                {parsed.slice(0,50).map((r,i)=>(
                  <tr key={i} style={{cursor:'default'}}>
                    <td className="bn" style={{fontSize:12}}>{r.business_name}</td>
                    <td style={{fontSize:12}} className="muted num">{r.phone||'-'}</td>
                    <td style={{fontSize:12}} className="muted">{['yes','y','true','1'].includes(r.website_exists)?'Yes':'No'}</td>
                    <td style={{fontSize:12}} className="muted">{r.state||'-'}</td>
                    <td style={{fontSize:12}} className="muted">{r.city||'-'}</td>
                  </tr>
                ))}
                {parsed.length>50 && <tr><td colSpan={5} style={{fontSize:12,color:'var(--soft)',textAlign:'center'}}>...and {parsed.length-50} more</td></tr>}
              </tbody>
            </table>
          </div>
        </>}

        {error && <div style={{color:'#c0392b',fontSize:13,marginTop:10}}>{error}</div>}
      </div>
      <div className="df">
        <button className="btn btn-pri" disabled={!parsed.length||busy} style={{opacity:parsed.length&&!busy?1:.5}}
          onClick={submit}>{busy?'Importing...':'Import '+parsed.length+' lead'+(parsed.length!==1?'s':'')}</button>
        <button className="btn btn-gh" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </>
}

// ---------- Add lead ----------
function AddLead({onClose,onSave,myId,isOwner,employees}){
  const [f,setF] = useState({business_name:'',phone:'',email:'',website_exists:false,website_url:'',
    lead_source:'Cold call',assigned_to:myId,status:'new',state:'',city:'',notes:''})
  const set=(k,v)=>setF(s=>({...s,[k]:v}))
  return <>
    <div className="scrim" onClick={onClose}/>
    <div className="drawer">
      <div className="dh"><div><h2>New lead</h2><div className="muted" style={{fontSize:13,marginTop:2}}>Add a prospect to the pipeline</div></div>
        <button className="x" onClick={onClose}><X size={20}/></button></div>
      <div className="db">
        <div className="fld"><label>Business name *</label><input value={f.business_name} onChange={e=>set('business_name',e.target.value)} placeholder="e.g. Crescent Auto Glass"/></div>
        <div className="frow">
          <div className="fld"><label>Phone</label><input value={f.phone} onChange={e=>set('phone',formatPhone(e.target.value))}/></div>
          <div className="fld"><label>Email</label><input value={f.email} onChange={e=>set('email',e.target.value)}/></div>
        </div>
        <div className="frow">
          <div className="fld"><label>Has website</label><select value={f.website_exists?'yes':'no'} onChange={e=>set('website_exists',e.target.value==='yes')}><option value="no">No</option><option value="yes">Yes</option></select></div>
          <div className="fld"><label>Lead source</label><input value={f.lead_source} onChange={e=>set('lead_source',e.target.value)}/></div>
        </div>
        <div className="frow">
          <div className="fld"><label>State</label><input value={f.state} onChange={e=>set('state',e.target.value)} placeholder="e.g. NV"/></div>
          <div className="fld"><label>City</label><input value={f.city} onChange={e=>set('city',e.target.value)} placeholder="e.g. Las Vegas"/></div>
        </div>
        <div className="frow">
          <div className="fld"><label>Setter</label><input value={(employees.find(e=>e.id===myId)||{}).full_name||'You'} disabled style={{background:'var(--paper)',color:'var(--soft)'}}/></div>
          <div className="fld"><label>Closer</label>
            <select value={f.assigned_to} onChange={e=>set('assigned_to',e.target.value)}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}</select></div>
        </div>
        <div className="fld"><label>Notes</label><textarea rows={3} value={f.notes} onChange={e=>set('notes',e.target.value)}/></div>
      </div>
      <div className="df">
        <button className="btn btn-pri" disabled={!f.business_name} style={{opacity:f.business_name?1:.5}} onClick={()=>onSave(f)}>Create lead</button>
        <button className="btn btn-gh" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </>
}
