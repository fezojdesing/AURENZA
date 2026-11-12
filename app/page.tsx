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
import DashboardWorkspace from "./dashboard-workspace";
import {
  CalendarDays, CheckSquare, ChevronRight, ClipboardList,
  FileText, GraduationCap, LayoutDashboard, Menu, NotebookPen,
  Plus, Settings, ShieldCheck, Sparkles, Target, X, FolderOpen
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
          <button className={`nav-item ${active === "Configuración" ? "active" : ""}`} onClick={() => { setActive("Configuración"); setMenuOpen(false); }}><Settings size={18}/><span>Configuración</span></button>
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
            <div className="privacy-indicator" aria-label="Espacio privado"><ShieldCheck size={16}/><span>Espacio privado</span></div>
            <button className="signout-button" onClick={() => void signOut()}>Cerrar sesión</button><div className="avatar avatar-top">{email?.charAt(0).toUpperCase() ?? "A"}</div>
          </div>
        </header>

        <div className="content">{active === "Mis materias" ? <CoursesWorkspace /> : active === "Mis tareas" ? <TasksWorkspace /> : active === "Apuntes" ? <NotesWorkspace /> : active === "Calificaciones" ? <GradesWorkspace /> : active === "Calendario" ? <CalendarWorkspace /> : active === "Archivos" ? <FilesWorkspace /> : active === "Configuración" ? <SettingsWorkspace /> : active === "Blackboard" ? <BlackboardWorkspace /> : <DashboardWorkspace onNavigate={setActive} />}</div>
      </section>
    </main>
  );
}
