"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Award, Pencil, Plus, Trash2, X } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type Course={id:string;name:string;color:string|null};
type Grade={id:string;course_id:string|null;title:string;grade:number;weight:number|null;graded_at:string|null};

export default function GradesWorkspace(){
  const [courses,setCourses]=useState<Course[]>([]);
  const [grades,setGrades]=useState<Grade[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [editingId,setEditingId]=useState<string|null>(null);
  const [title,setTitle]=useState("");
  const [courseId,setCourseId]=useState("");
  const [grade,setGrade]=useState("10");
  const [weight,setWeight]=useState("");
  const [gradedAt,setGradedAt]=useState(new Date().toISOString().slice(0,10));

  async function loadData(){
    setLoading(true);setError("");
    try{
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      const [gradeResult,courseResult]=await Promise.all([
        supabase.from("grades").select("id,course_id,title,grade,weight,graded_at").eq("user_id",user.id).order("graded_at",{ascending:false}),
        supabase.from("courses").select("id,name,color").eq("user_id",user.id).order("name"),
      ]);
      if(gradeResult.error)throw gradeResult.error;
      if(courseResult.error)throw courseResult.error;
      setGrades(gradeResult.data??[]);setCourses(courseResult.data??[]);
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos cargar tus calificaciones.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void loadData();},[]);

  function resetForm(){setEditingId(null);setTitle("");setCourseId("");setGrade("10");setWeight("");setGradedAt(new Date().toISOString().slice(0,10));}
  function editItem(item:Grade){setEditingId(item.id);setTitle(item.title);setCourseId(item.course_id??"");setGrade(String(item.grade));setWeight(item.weight===null?"":String(item.weight));setGradedAt(item.graded_at??"");window.scrollTo({top:0,behavior:"smooth"});}

  async function saveGrade(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const numericGrade=Number(grade),numericWeight=weight.trim()===""?null:Number(weight);
    if(!title.trim()||!Number.isFinite(numericGrade)||numericGrade<0||numericGrade>10)return;
    if(numericWeight!==null&&(!Number.isFinite(numericWeight)||numericWeight<0||numericWeight>100)){setError("El porcentaje debe estar entre 0 y 100.");return;}
    setSaving(true);setError("");
    try{
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error("Inicia sesión para guardar una calificación.");
      const payload={user_id:user.id,course_id:courseId||null,title:title.trim(),grade:numericGrade,weight:numericWeight,graded_at:gradedAt||null};
      const result=editingId?await supabase.from("grades").update(payload).eq("id",editingId).eq("user_id",user.id):await supabase.from("grades").insert(payload);
      if(result.error)throw result.error;
      resetForm();await loadData();
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos guardar la calificación.");}
    finally{setSaving(false);}
  }

  async function deleteGrade(id:string){
    if(!window.confirm("¿Eliminar este registro de calificación?"))return;
    try{
      const {error:deleteError}=await getSupabaseClient().from("grades").delete().eq("id",id);
      if(deleteError)throw deleteError;
      setGrades(current=>current.filter(item=>item.id!==id));
      if(editingId===id)resetForm();
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos eliminar el registro.");}
  }

  const average=useMemo(()=>grades.length?grades.reduce((sum,item)=>sum+Number(item.grade),0)/grades.length:null,[grades]);
  const courseSummaries=useMemo(()=>courses.map(course=>{
    const items=grades.filter(item=>item.course_id===course.id);
    const avg=items.length?items.reduce((sum,item)=>sum+Number(item.grade),0)/items.length:null;
    return {...course,count:items.length,average:avg};
  }),[courses,grades]);

  return <div className="grades-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><Award size={14}/> TU ESFUERZO TAMBIÉN CUENTA</div><h1>Calificaciones<span className="orange-period">.</span></h1><p className="intro">Registra tus resultados y observa cómo avanzas en cada materia.</p></div></div>
    <div className="grade-summary-grid">
      <article className="stat-card"><div className="stat-top"><span>Promedio registrado</span><span className="stat-icon navy-soft"><Award size={17}/></span></div><strong>{average===null?"—":average.toFixed(1)}</strong><small>Escala de 0 a 10 · promedio simple</small></article>
      <article className="stat-card"><div className="stat-top"><span>Evaluaciones</span><span className="stat-icon orange-soft"><Pencil size={17}/></span></div><strong>{String(grades.length).padStart(2,"0")}</strong><small>Registros guardados</small></article>
      <article className="stat-card"><div className="stat-top"><span>Materias con resultados</span><span className="stat-icon blue-soft"><Award size={17}/></span></div><strong>{courseSummaries.filter(item=>item.count>0).length}</strong><small>De {courses.length} materias registradas</small></article>
    </div>
    <div className="grades-layout">
      <section className="panel grade-form-panel">
        <div className="panel-heading"><div><h2>{editingId?"Editar calificación":"Nuevo registro"}</h2><p>Guarda el resultado de una evaluación.</p></div><span className="focus-icon"><Plus size={18}/></span></div>
        <form className="grade-form" onSubmit={saveGrade}>
          <label htmlFor="grade-title">Evaluación o actividad</label><input id="grade-title" value={title} onChange={event=>setTitle(event.target.value)} placeholder="Ej. Examen parcial" required maxLength={120}/>
          <label htmlFor="grade-course">Materia</label><select id="grade-course" value={courseId} onChange={event=>setCourseId(event.target.value)}><option value="">Sin materia asignada</option>{courses.map(course=><option key={course.id} value={course.id}>{course.name}</option>)}</select>
          <label htmlFor="grade-value">Calificación (0 a 10)</label><input id="grade-value" type="number" min="0" max="10" step="0.1" value={grade} onChange={event=>setGrade(event.target.value)} required/>
          <label htmlFor="grade-weight">Porcentaje de la evaluación <span>(opcional)</span></label><input id="grade-weight" type="number" min="0" max="100" step="0.1" value={weight} onChange={event=>setWeight(event.target.value)} placeholder="Ej. 30"/>
          <label htmlFor="grade-date">Fecha</label><input id="grade-date" type="date" value={gradedAt} onChange={event=>setGradedAt(event.target.value)}/>
          <div className="grade-form-actions"><button className="primary-button" type="submit" disabled={saving||!title.trim()}><Plus size={16}/>{saving?"Guardando...":editingId?"Guardar cambios":"Guardar calificación"}</button>{editingId&&<button className="secondary-button" type="button" onClick={resetForm}><X size={15}/> Cancelar</button>}</div>
        </form>
      </section>
      <section className="panel grade-list-panel">
        <div className="panel-heading"><div><h2>Resultados por materia</h2><p>Consulta tus promedios y evaluaciones.</p></div><span className="course-count">{String(grades.length).padStart(2,"0")}</span></div>
        {loading?<div className="course-empty">Cargando calificaciones...</div>:grades.length===0?<div className="course-empty"><span className="empty-icon"><Award size={22}/></span><strong>Aún no hay calificaciones</strong><span>Registra tu primera evaluación para comenzar a llevar tu promedio.</span></div>:<div className="grade-list">
          {courseSummaries.filter(item=>item.count>0).map(item=><div className="grade-course-summary" key={item.id}><span className="course-swatch" style={{background:item.color||"#34516F"}}/><strong>{item.name}</strong><span>{item.average?.toFixed(1)} / 10</span><small>{item.count} {item.count===1?"evaluación":"evaluaciones"}</small></div>)}
          <div className="grade-records">{grades.map(item=><article className="grade-record" key={item.id}><div><strong>{item.title}</strong><small>{courses.find(course=>course.id===item.course_id)?.name??"Sin materia"} · {item.graded_at?new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",year:"numeric"}).format(new Date(item.graded_at+"T12:00:00")):"Sin fecha"}{item.weight!==null?" · "+String(item.weight)+"%":""}</small></div><b>{Number(item.grade).toFixed(1)}</b><button className="activity-icon-button" onClick={()=>editItem(item)} aria-label={"Editar "+item.title}><Pencil size={14}/></button><button className="activity-icon-button danger" onClick={()=>void deleteGrade(item.id)} aria-label={"Eliminar "+item.title}><Trash2 size={14}/></button></article>)}</div>
        </div>}
      </section>
    </div>
    {error&&<p className="course-error" role="alert">{error}</p>}
  </div>;
}
