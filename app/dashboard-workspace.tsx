"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardList, GraduationCap, NotebookPen, Plus, Sparkles, Target } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type Activity={id:string;title:string;course_id:string|null;due_date:string|null;status:string|null};
type Course={id:string;name:string};
type Props={onNavigate:(section:string)=>void};

export default function DashboardWorkspace({onNavigate}:Props){
  const [activities,setActivities]=useState<Activity[]>([]);
  const [courses,setCourses]=useState<Course[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    async function load(){
      try{
        const supabase=getSupabaseClient();
        const {data:{user},error:userError}=await supabase.auth.getUser();
        if(userError)throw userError;
        if(!user)throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
        const [activityResult,courseResult]=await Promise.all([
          supabase.from("activities").select("id,title,course_id,due_date,status").eq("user_id",user.id).order("due_date",{ascending:true,nullsFirst:false}),
          supabase.from("courses").select("id,name").eq("user_id",user.id),
        ]);
        if(activityResult.error)throw activityResult.error;
        if(courseResult.error)throw courseResult.error;
        setActivities(activityResult.data??[]);setCourses(courseResult.data??[]);
      }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos cargar tu resumen.");}
      finally{setLoading(false);}
    }
    void load();
  },[]);
  const pending=activities.filter(item=>item.status!=="completed");
  const nextSeven=activities.filter(item=>item.due_date&&new Date(item.due_date).getTime()>=Date.now()&&new Date(item.due_date).getTime()<=Date.now()+7*86400000&&item.status!=="completed");
  const completed=activities.filter(item=>item.status==="completed").length;
  const progress=activities.length?Math.round(completed/activities.length*100):0;
  const nextActivities=useMemo(()=>pending.slice(0,4),[activities]);
  const greeting=useMemo(()=>{const hour=new Date().getHours();return hour<12?"Buenos días":hour<19?"Buenas tardes":"Buenas noches";},[]);
  return <div className="dashboard-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> TU ESPACIO, A TU RITMO</div><h1>{greeting}<span className="orange-period">.</span></h1><p className="intro">Un lugar para organizar tus ideas y avanzar con claridad.</p></div><button className="primary-button" onClick={()=>onNavigate("Mis tareas")}><Plus size={18}/> Nueva actividad</button></div>
    <div className="section-heading"><div><h2>Tu resumen</h2><p>Una mirada real a lo que tienes en marcha.</p></div><button className="text-button" onClick={()=>onNavigate("Mis tareas")}>Ver actividades <span>›</span></button></div>
    <div className="stats-grid">
      <article className="stat-card"><div className="stat-top"><span>Actividades pendientes</span><span className="stat-icon navy-soft"><ClipboardList size={18}/></span></div><strong>{loading?"—":String(pending.length).padStart(2,"0")}</strong><small>En todas tus materias</small></article>
      <article className="stat-card"><div className="stat-top"><span>Próximas entregas</span><span className="stat-icon orange-soft"><CalendarDays size={18}/></span></div><strong>{loading?"—":String(nextSeven.length).padStart(2,"0")}</strong><small>Durante los próximos 7 días</small></article>
      <article className="stat-card"><div className="stat-top"><span>Actividades completadas</span><span className="stat-icon blue-soft"><Target size={18}/></span></div><strong>{loading?"—":progress+"%"}</strong><div className="progress-track"><span style={{width:progress+"%"}}/></div></article>
    </div>
    <div className="dashboard-grid">
      <section className="panel tasks-panel"><div className="panel-heading"><div><h2>Próximas actividades</h2><p>Lo que requiere tu atención.</p></div><span className="focus-icon"><CalendarDays size={17}/></span></div>
        {loading?<div className="course-empty">Cargando tu resumen...</div>:nextActivities.length===0?<div className="course-empty compact-empty"><span className="empty-icon"><CheckCircle2 size={21}/></span><strong>Todo al día por ahora</strong><span>Cuando registres nuevas entregas, aparecerán aquí.</span></div>:<div className="task-list">{nextActivities.map((task,index)=>{const course=courses.find(item=>item.id===task.course_id);const due=task.due_date?new Date(task.due_date):null;return <article className="task-row" key={task.id}><div className={"date-tile date-"+(index%3)}><strong>{due?new Intl.DateTimeFormat("es-MX",{day:"2-digit"}).format(due):"—"}</strong><small>{due?new Intl.DateTimeFormat("es-MX",{month:"short"}).format(due):"Sin fecha"}</small></div><div className="task-info"><strong>{task.title}</strong><small>{course?.name??"Sin materia asignada"}</small></div><span className={"status status-"+(task.status==="in_progress"?1:2)}>{task.status==="in_progress"?"En progreso":"Pendiente"}</span></article>;})}</div>}
        <button className="panel-link" onClick={()=>onNavigate("Mis tareas")}>Ver todas las actividades <span>›</span></button>
      </section>
      <section className="panel calendar-panel"><div className="panel-heading"><div><h2>Tu espacio académico</h2><p>Una vista de tu organización.</p></div><span className="focus-icon"><Sparkles size={17}/></span></div><div className="focus-number">{String(courses.length).padStart(2,"0")} <span>materias registradas</span></div><div className="progress-track large"><span style={{width:progress+"%"}}/></div><div className="focus-note"><span className="note-dot"/>{completed} actividades completadas de {activities.length}</div><div className="focus-footer"><GraduationCap size={17}/><span>Organiza tus cursos y avanza a tu propio ritmo.</span></div></section>
    </div>
    <section className="quick-section"><div className="section-heading"><div><h2>Accesos rápidos</h2><p>Lo que necesitas, a un paso.</p></div></div><div className="quick-grid">
      <button className="quick-card" onClick={()=>onNavigate("Mis materias")}><span className="quick-icon navy-soft"><GraduationCap size={19}/></span><strong>Mis materias</strong><small>{courses.length} cursos</small><span>›</span></button>
      <button className="quick-card" onClick={()=>onNavigate("Calendario")}><span className="quick-icon orange-soft"><CalendarDays size={19}/></span><strong>Calendario</strong><small>Organiza tus fechas</small><span>›</span></button>
      <button className="quick-card" onClick={()=>onNavigate("Apuntes")}><span className="quick-icon blue-soft"><NotebookPen size={19}/></span><strong>Mis apuntes</strong><small>Guarda tus ideas</small><span>›</span></button>
    </div></section>
    {error&&<p className="course-error" role="alert">{error}</p>}
    <footer>AURENZA <span>·</span> ORGANIZA · PLANEA · LOGRA <span className="footer-right">Tu espacio, siempre contigo.</span></footer>
  </div>;
}
