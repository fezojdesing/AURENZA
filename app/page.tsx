"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import CoursesWorkspace from "./courses-workspace";
import TasksWorkspace from "./tasks-workspace";
import NotesWorkspace from "./notes-workspace";
import GradesWorkspace from "./grades-workspace";
import CalendarWorkspace from "./calendar-workspace";
import FilesWorkspace from "./files-workspace";
import SettingsWorkspace from "./settings-workspace";
import BlackboardWorkspace from "./blackboard-workspace";
import {
  Bell, CalendarDays, CheckSquare, ChevronRight, ClipboardList,
  FileText, GraduationCap, LayoutDashboard, Menu, NotebookPen,
  Plus, Search, Settings, Sparkles, Target, X, FolderOpen
} from "lucide-react";

const navigation = [
  { label: "Inicio", icon: LayoutDashboard },
  { label: "Mis materias", icon: GraduationCap },
  { label: "Calendario", icon: CalendarDays },
  { label: "Mis tareas", icon: CheckSquare },
  { label: "Apuntes", icon: NotebookPen },
  { label: "Calificaciones", icon: Target },
  { label: "Archivos", icon: FolderOpen },
  { label: "Blackboard", icon: GraduationCap },
];

const tasks = [
  { title: "Actividad de administración financiera", subject: "Administración financiera", date: "12 nov", status: "Próxima" },
  { title: "Caso práctico de operaciones", subject: "Administración de operaciones", date: "14 nov", status: "En progreso" },
  { title: "Análisis de decisiones", subject: "Análisis de decisiones", date: "16 nov", status: "Pendiente" },
];

export default function Home() {
  const { email, signOut } = useAuth();
  const [active, setActive] = useState("Inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><span className="mark-navy" /><span className="mark-orange" /></div>
          <span className="brand-name">AURENZA</span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X size={19}/></button>
        </div>
        <div className="workspace-label">ESPACIO PERSONAL</div>
        <nav className="nav-list">
          {navigation.map(({label, icon: Icon}) => (
            <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => { setActive(label); setMenuOpen(false); }}>
              <Icon size={18} strokeWidth={1.8}/><span>{label}</span>{active === label && <span className="active-dot"/>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${active === "Configuración" ? "active" : ""}`} onClick={() => setActive("Configuración")}><Settings size={18}/><span>Configuración</span></button>
          <div className="profile">
            <div className="avatar">{email?.charAt(0).toUpperCase() ?? "A"}</div>
            <div className="profile-details"><strong>Mi espacio</strong><small>{email ?? "Cuenta personal"}</small></div>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"/>}

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu size={21}/></button>
          <div className="breadcrumb">Espacio personal <ChevronRight size={14}/> <strong>{active}</strong></div>
          <div className="top-actions">
            <button className="search-button"><Search size={17}/><span>Buscar en AURENZA</span><kbd>⌘ K</kbd></button>
            <button className="icon-button" aria-label="Notificaciones"><Bell size={19}/><i/></button>
            <button className="signout-button" onClick={() => void signOut()}>Cerrar sesión</button><div className="avatar avatar-top">{email?.charAt(0).toUpperCase() ?? "A"}</div>
          </div>
        </header>

        <div className="content">{active === "Mis materias" ? <CoursesWorkspace /> : active === "Mis tareas" ? <TasksWorkspace /> : active === "Apuntes" ? <NotesWorkspace /> : <>
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><Sparkles size={14}/> TU ESPACIO, A TU RITMO</div>
              <h1>Buenos días<span className="orange-period">.</span></h1>
              <p className="intro">Un lugar para organizar tus ideas y avanzar con claridad.</p>
            </div>
            <button className="primary-button"><Plus size={18}/> Nueva actividad</button>
          </div>

          <div className="section-heading"><div><h2>Tu resumen</h2><p>Una mirada rápida a lo que tienes en marcha.</p></div><button className="text-button">Ver actividad <ChevronRight size={15}/></button></div>

          <div className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Actividades pendientes</span><span className="stat-icon navy-soft"><ClipboardList size={18}/></span></div><strong>08</strong><small>En todas tus materias</small></article>
            <article className="stat-card"><div className="stat-top"><span>Próximas entregas</span><span className="stat-icon orange-soft"><CalendarDays size={18}/></span></div><strong>03</strong><small>Durante los próximos 7 días</small></article>
            <article className="stat-card"><div className="stat-top"><span>Progreso semanal</span><span className="stat-icon blue-soft"><Target size={18}/></span></div><strong>68%</strong><div className="progress-track"><span style={{width:"68%"}}/></div></article>
          </div>

          <div className="dashboard-grid">
            <section className="panel tasks-panel">
              <div className="panel-heading"><div><h2>Próximas actividades</h2><p>Ten presente lo que viene.</p></div><button className="round-arrow" aria-label="Ver actividades"><ChevronRight size={18}/></button></div>
              <div className="task-list">
                {tasks.map((task, i) => <article className="task-row" key={task.title}>
                  <div className={`date-tile date-${i}`}><strong>{task.date.split(" ")[0]}</strong><small>{task.date.split(" ")[1]}</small></div>
                  <div className="task-info"><strong>{task.title}</strong><small>{task.subject}</small></div>
                  <span className={`status status-${i}`}>{task.status}</span>
                </article>)}
              </div>
              <button className="panel-link">Ver todas las actividades <ChevronRight size={15}/></button>
            </section>

            <section className="panel calendar-panel">
              <div className="panel-heading"><div><h2>Enfoque de la semana</h2><p>Pequeños avances, grandes resultados.</p></div><span className="focus-icon"><Sparkles size={18}/></span></div>
              <div className="focus-number">04 <span>de 06 tareas completadas</span></div>
              <div className="progress-track large"><span style={{width:"66%"}}/></div>
              <div className="focus-note"><span className="note-dot"/> Vas construyendo un buen ritmo. ¡Sigue así!</div>
              <div className="focus-footer"><FileText size={17}/><span>Tu organización también es parte del progreso.</span></div>
            </section>
          </div>

          <section className="quick-section">
            <div className="section-heading"><div><h2>Accesos rápidos</h2><p>Lo que necesitas, a un paso.</p></div></div>
            <div className="quick-grid">
              <button className="quick-card" onClick={() => setActive("Mis materias")}><span className="quick-icon navy-soft"><GraduationCap size={19}/></span><strong>Mis materias</strong><small>Consulta tus cursos</small><ChevronRight size={16}/></button>
              <button className="quick-card" onClick={() => setActive("Calendario")}><span className="quick-icon orange-soft"><CalendarDays size={19}/></span><strong>Calendario</strong><small>Organiza tus fechas</small><ChevronRight size={16}/></button>
              <button className="quick-card" onClick={() => setActive("Apuntes")}><span className="quick-icon blue-soft"><NotebookPen size={19}/></span><strong>Mis apuntes</strong><small>Guarda tus ideas</small><ChevronRight size={16}/></button>
            </div>
          </section>
          <footer> AURENZA <span>·</span> ORGANIZA · PLANEA · LOGRA <span className="footer-right">Tu espacio, siempre contigo.</span></footer>
          </>}
        </div>
      </section>
    </main>
  );
}
