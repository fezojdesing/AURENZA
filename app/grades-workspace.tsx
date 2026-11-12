"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Award, Pencil, Plus, Trash2, X, GraduationCap } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type Course={id:string;name:string;color:string|null;term:number|null};
type Grade={id:string;course_id:string|null;title:string;grade:number;weight:number|null;graded_at:string|null};
type CourseSummary=Course&{items:Grade[];weightTotal:number;finalGrade:number|null;complete:boolean};
function localDateInput(){const now=new Date();return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");}

export default function GradesWorkspace(){
  const [courses,setCourses]=useState<Course[]>([]);
  const [grades,setGrades]=useState<Grade[]>([]);
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
  const [editingId,setEditingId]=useState<string|null>(null);const [title,setTitle]=useState("");const [courseId,setCourseId]=useState("");
  const [grade,setGrade]=useState("10");const [weight,setWeight]=useState("");const [gradedAt,setGradedAt]=useState(localDateInput);

  async function loadData(){
    setLoading(true);setError("");
    try{
      const supabase=getSupabaseClient();const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;if(!user)throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      const [gr,cr]=await Promise.all([
        supabase.from("grades").select("id,course_id,title,grade,weight,graded_at").eq("user_id",user.id).order("graded_at",{ascending:false}),
        supabase.from("courses").select("id,name,color,term").eq("user_id",user.id).order("name")
      ]);
      if(gr.error)throw gr.error;if(cr.error)throw cr.error;setGrades(gr.data??[]);setCourses(cr.data??[]);
    }catch(e){setError(e instanceof Error?e.message:"No pudimos cargar tus calificaciones.");}finally{setLoading(false);}
  }
  useEffect(()=>{void loadData();},[]);
  function resetForm(){setEditingId(null);setTitle("");setCourseId("");setGrade("10");setWeight("");setGradedAt(localDateInput());}
  function editItem(item:Grade){setEditingId(item.id);setTitle(item.title);setCourseId(item.course_id??"");setGrade(String(item.grade));setWeight(item.weight===null?"":String(item.weight));setGradedAt(item.graded_at??"");window.scrollTo({top:0,behavior:"smooth"});}
  async function saveGrade(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const n=Number(grade),w=weight.trim()===""?null:Number(weight);
    if(!title.trim()||!courseId){setError("Asigna cada evaluación a una materia para calcular sus promedios.");return;}
    if(!Number.isFinite(n)||n<0||n>10)return;
    if(w===null||!Number.isFinite(w)||w<=0||w>100){setError("Indica la ponderación de esta evaluación (mayor que 0 y hasta 100%).");return;}
    setSaving(true);setError("");
    try{
      const supabase=getSupabaseClient();const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;if(!user)throw new Error("Inicia sesión para guardar una calificación.");
      const payload={user_id:user.id,course_id:courseId,title:title.trim(),grade:n,weight:w,graded_at:gradedAt||null};
      const result=editingId?await supabase.from("grades").update(payload).eq("id",editingId).eq("user_id",user.id):await supabase.from("grades").insert(payload);
      if(result.error)throw result.error;resetForm();await loadData();
    }catch(e){setError(e instanceof Error?e.message:"No pudimos guardar la calificación.");}finally{setSaving(false);}
  }
  async function deleteGrade(id:string){
    if(!window.confirm("¿Eliminar esta evaluación?"))return;
    try{const {error:e}=await getSupabaseClient().from("grades").delete().eq("id",id);if(e)throw e;setGrades(v=>v.filter(x=>x.id!==id));if(editingId===id)resetForm();}
    catch(e){setError(e instanceof Error?e.message:"No pudimos eliminar el registro.");}
  }
  const summaries=useMemo<CourseSummary[]>(()=>courses.map(course=>{
    const items=grades.filter(g=>g.course_id===course.id);const weightTotal=items.reduce((s,g)=>s+Number(g.weight??0),0);
    const complete=items.length>0&&items.every(g=>g.weight!==null)&&Math.abs(weightTotal-100)<0.001;
    const finalGrade=complete?items.reduce((s,g)=>s+Number(g.grade)*Number(g.weight)/100,0):null;
    return {...course,items,weightTotal,complete,finalGrade};
  }),[courses,grades]);
  const terms=useMemo(()=>Array.from({length:5},(_,i)=>{
    const term=i+1;const subjects=summaries.filter(s=>s.term===term);const completed=subjects.filter(s=>s.complete&&s.finalGrade!==null);
    const allComplete=subjects.length>0&&completed.length===subjects.length;
    return {term,subjects,average:allComplete?completed.reduce((s,c)=>s+(c.finalGrade??0),0)/subjects.length:null,allComplete};
  }),[summaries]);
  const completedTerms=terms.filter(t=>t.allComplete&&t.average!==null);
  const generalAverage=completedTerms.length===5?completedTerms.reduce((s,t)=>s+(t.average??0),0)/5:null;
  const unassigned=summaries.filter(s=>s.term===null).length;

  return <div className="grades-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><Award size={14}/> TU ESFUERZO TAMBIÉN CUENTA</div><h1>Calificaciones<span className="orange-period">.</span></h1><p className="intro">Controla las ponderaciones, el promedio de cada materia y tu avance en los cinco cuatrimestres.</p></div></div>
    <div className="grade-summary-grid">
      <article className="stat-card"><div className="stat-top"><span>Promedio general</span><span className="stat-icon navy-soft"><Award size={17}/></span></div><strong>{generalAverage===null?"—":(generalAverage*10).toFixed(1)}</strong><small>{generalAverage===null?completedTerms.length+" de 5 cuatrimestres completos":"Escala de 0 a 10 · "+(generalAverage*10).toFixed(1)+"/10"}</small></article>
      <article className="stat-card"><div className="stat-top"><span>Evaluaciones</span><span className="stat-icon orange-soft"><Pencil size={17}/></span></div><strong>{String(grades.length).padStart(2,"0")}</strong><small>Registros guardados</small></article>
      <article className="stat-card"><div className="stat-top"><span>Materias asignadas</span><span className="stat-icon blue-soft"><GraduationCap size={17}/></span></div><strong>{summaries.filter(s=>s.term!==null).length}</strong><small>{unassigned?unassigned+" sin cuatrimestre":"De "+courses.length+" materias"}</small></article>
    </div>
    <section className="panel" style={{marginBottom:22}}>
      <div className="panel-heading"><div><h2>Tu avance académico</h2><p>Promedio por cuatrimestre y resultado acumulado.</p></div><span className="course-count">{completedTerms.length}/05</span></div>
      <div className="grade-summary-grid">{terms.map(t=><article className="stat-card" key={t.term}><div className="stat-top"><span>{["Primer","Segundo","Tercer","Cuarto","Quinto"][t.term-1]} cuatrimestre</span><span className="stat-icon navy-soft">{t.allComplete?"✓":t.subjects.length?String(t.subjects.length):"—"}</span></div><strong>{t.average===null?"—":(t.average*10).toFixed(1)}</strong><small>{t.subjects.length===0?"Sin materias asignadas":t.allComplete?t.subjects.length+" materias · completo":t.subjects.length+" materias · "+t.subjects.filter(s=>s.complete).length+" con ponderación completa"}</small></article>)}</div>
      <p className="intro" style={{marginTop:12,fontSize:13}}>El promedio general se mostrará cuando los cinco cuatrimestres tengan materias asignadas y todas sus ponderaciones sumen 100%.</p>
    </section>
    <div className="grades-layout">
      <section className="panel grade-form-panel">
        <div className="panel-heading"><div><h2>{editingId?"Editar evaluación":"Nueva evaluación"}</h2><p>Registra la calificación y el porcentaje que representa.</p></div><span className="focus-icon"><Plus size={18}/></span></div>
        <form className="grade-form" onSubmit={saveGrade}>
          <label htmlFor="grade-title">Evaluación o actividad</label><input id="grade-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Examen parcial" required maxLength={120}/>
          <label htmlFor="grade-course">Materia</label><select id="grade-course" value={courseId} onChange={e=>setCourseId(e.target.value)} required><option value="">Selecciona una materia</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}{c.term?" · Cuatrimestre "+c.term:""}</option>)}</select>
          <label htmlFor="grade-value">Calificación obtenida (0 a 10)</label><input id="grade-value" type="number" min="0" max="10" step="0.1" value={grade} onChange={e=>setGrade(e.target.value)} required/>
          <label htmlFor="grade-weight">Ponderación de esta evaluación (%)</label><input id="grade-weight" type="number" min="0.1" max="100" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Ej. 30" required/>
          <label htmlFor="grade-date">Fecha</label><input id="grade-date" type="date" value={gradedAt} onChange={e=>setGradedAt(e.target.value)}/>
          <div className="grade-form-actions"><button className="primary-button" type="submit" disabled={saving||!title.trim()||!courseId}><Plus size={16}/>{saving?"Guardando...":editingId?"Guardar cambios":"Guardar evaluación"}</button>{editingId&&<button className="secondary-button" type="button" onClick={resetForm}><X size={15}/> Cancelar</button>}</div>
        </form>
      </section>
      <section className="panel grade-list-panel">
        <div className="panel-heading"><div><h2>Materias y evaluaciones</h2><p>La calificación final se calcula cuando las ponderaciones suman 100%.</p></div><span className="course-count">{String(grades.length).padStart(2,"0")}</span></div>
        {loading?<div className="course-empty">Cargando calificaciones...</div>:courses.length===0?<div className="course-empty"><span className="empty-icon"><Award size={22}/></span><strong>Aún no hay materias</strong><span>Primero agrega tus materias y asígnales su cuatrimestre.</span></div>:<div className="grade-list">
          {summaries.map(s=><article className="panel" key={s.id} style={{padding:16,marginBottom:12}}>
            <div className="grade-course-summary"><span className="course-swatch" style={{background:s.color||"#34516F"}}/><strong>{s.name}</strong><span>{s.finalGrade===null?"En progreso":(s.finalGrade*10).toFixed(1)+" / 10"}</span></div>
            <small>{s.term?"Cuatrimestre "+s.term:"Asigna un cuatrimestre en Mis materias"} · {s.items.length} evaluaciones · {s.weightTotal.toFixed(1)}% de 100%</small>
            {s.weightTotal>100.001?<p className="course-error">La ponderación supera el 100%. Ajusta los porcentajes.</p>:s.complete?<p className="intro" style={{fontSize:12,marginTop:6}}>Ponderación completa · calificación final calculada</p>:<p className="intro" style={{fontSize:12,marginTop:6}}>Faltan {(100-s.weightTotal).toFixed(1)} puntos porcentuales para completar la materia.</p>}
            {s.items.map(item=><div className="grade-record" key={item.id}><div><strong>{item.title}</strong><small>{item.weight}% · {item.graded_at?new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",year:"numeric"}).format(new Date(item.graded_at+"T12:00:00")):"Sin fecha"}</small></div><b>{Number(item.grade).toFixed(1)}</b><button className="activity-icon-button" onClick={()=>editItem(item)} aria-label={"Editar "+item.title}><Pencil size={14}/></button><button className="activity-icon-button danger" onClick={()=>void deleteGrade(item.id)} aria-label={"Eliminar "+item.title}><Trash2 size={14}/></button></div>)}
          </article>)}
        </div>}
      </section>
    </div>
    {error&&<p className="course-error" role="alert">{error}</p>}
  </div>;
}
