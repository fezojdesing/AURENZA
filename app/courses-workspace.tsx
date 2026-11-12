"use client";

import { useEffect, useState, type FormEvent } from "react";
import { GraduationCap, Plus, X } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type Course = { id: string; name: string; description: string | null; color: string | null };

export default function CoursesWorkspace() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#27496D");

  async function loadCourses() {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      const { data, error: queryError } = await supabase.from("courses")
        .select("id, name, description, color").eq("user_id", user.id).order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setCourses(data ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar tus materias.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadCourses(); }, []);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Inicia sesión para guardar una materia.");
      const { error: insertError } = await supabase.from("courses").insert({
        user_id: user.id, name: name.trim(), description: description.trim() || null, color
      });
      if (insertError) throw insertError;
      setName(""); setDescription(""); setColor("#27496D");
      await loadCourses();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar la materia.");
    } finally { setSaving(false); }
  }

  async function deleteCourse(id: string) {
    if (!window.confirm("¿Eliminar esta materia? Las actividades y calificaciones vinculadas se conservarán, pero quedarán sin materia asignada.")) return;
    try {
      const { error: deleteError } = await getSupabaseClient().from("courses").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setCourses(current => current.filter(course => course.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos eliminar la materia.");
    }
  }

  return <div className="courses-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><GraduationCap size={14}/> ORGANIZA TU VIDA ACADÉMICA</div><h1>Mis materias<span className="orange-period">.</span></h1><p className="intro">Administra tus cursos y mantén todo en un mismo lugar.</p></div></div>
    <div className="courses-layout">
      <section className="panel course-form-panel">
        <div className="panel-heading"><div><h2>Nueva materia</h2><p>Agrega un curso a tu espacio personal.</p></div><span className="focus-icon"><Plus size={18}/></span></div>
        <form className="course-form" onSubmit={createCourse}>
          <label htmlFor="course-name">Nombre de la materia</label>
          <input id="course-name" value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Administración financiera" required maxLength={100}/>
          <label htmlFor="course-description">Descripción <span>(opcional)</span></label>
          <textarea id="course-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Agrega una breve descripción" rows={3}/>
          <label htmlFor="course-color">Color identificador</label>
          <div className="color-control"><input id="course-color" type="color" value={color} onChange={event => setColor(event.target.value)}/><span>{color.toUpperCase()}</span></div>
          <button className="primary-button glass-button" type="submit" disabled={saving || !name.trim()}><Plus size={17}/>{saving ? "Guardando..." : "Guardar materia"}</button>
        </form>
        {error && <p className="course-error" role="alert">{error}</p>}
      </section>
      <section className="panel course-list-panel">
        <div className="panel-heading"><div><h2>Tus materias</h2><p>{courses.length} {courses.length === 1 ? "materia registrada" : "materias registradas"}</p></div><span className="course-count">{courses.length.toString().padStart(2,"0")}</span></div>
        {loading ? <div className="course-empty">Cargando tus materias...</div> : courses.length === 0 ? <div className="course-empty"><span className="empty-icon"><GraduationCap size={23}/></span><strong>Aún no tienes materias</strong><span>Agrega tu primera materia para comenzar a organizar tus actividades.</span></div> : <div className="course-list">{courses.map(course => <article className="course-item" key={course.id}><span className="course-swatch" style={{backgroundColor:course.color || "#27496D"}}/><div className="course-item-copy"><strong>{course.name}</strong><small>{course.description || "Sin descripción"}</small></div><button className="delete-course" type="button" onClick={() => void deleteCourse(course.id)} aria-label={`Eliminar ${course.name}`} title="Eliminar materia"><X size={16}/></button></article>)}</div>}
      </section>
    </div>
  </div>;
}
