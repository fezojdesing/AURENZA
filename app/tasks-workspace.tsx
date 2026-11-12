"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, ClipboardList, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type Course = { id: string; name: string; color: string | null };
type Activity = {
  id: string;
  course_id: string | null;
  title: string;
  instructions: string | null;
  rubric: string | null;
  due_date: string | null;
  status: string | null;
  created_at: string | null;
};

type Status = "pending" | "in_progress" | "completed";
const statusLabels: Record<Status, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDueDate(value: string | null) {
  if (!value) return "Sin fecha de entrega";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

export default function TasksWorkspace() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rubric, setRubric] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Status>("pending");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      const [activityResult, courseResult] = await Promise.all([
        supabase.from("activities").select("id,course_id,title,instructions,rubric,due_date,status,created_at").eq("user_id", user.id).order("due_date", { ascending: true, nullsFirst: false }),
        supabase.from("courses").select("id,name,color").eq("user_id", user.id).order("name", { ascending: true }),
      ]);
      if (activityResult.error) throw activityResult.error;
      if (courseResult.error) throw courseResult.error;
      setActivities(activityResult.data ?? []);
      setCourses(courseResult.data ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar tus actividades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  function resetForm() {
    setEditingId(null); setTitle(""); setCourseId(""); setInstructions(""); setRubric(""); setDueDate(""); setStatus("pending");
  }

  function startEdit(activity: Activity) {
    setEditingId(activity.id);
    setTitle(activity.title);
    setCourseId(activity.course_id ?? "");
    setInstructions(activity.instructions ?? "");
    setRubric(activity.rubric ?? "");
    setDueDate(toLocalInput(activity.due_date));
    setStatus((activity.status === "completed" || activity.status === "in_progress" ? activity.status : "pending"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError("");
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Inicia sesión para guardar una actividad.");
      const payload = {
        user_id: user.id,
        course_id: courseId || null,
        title: title.trim(),
        instructions: instructions.trim() || null,
        rubric: rubric.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status,
        updated_at: new Date().toISOString(),
      };
      const result = editingId
        ? await supabase.from("activities").update(payload).eq("id", editingId).eq("user_id", user.id)
        : await supabase.from("activities").insert(payload);
      if (result.error) throw result.error;
      resetForm();
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar la actividad.");
    } finally { setSaving(false); }
  }

  async function changeStatus(activity: Activity, nextStatus: Status) {
    setError("");
    try {
      const { error: updateError } = await getSupabaseClient().from("activities")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", activity.id);
      if (updateError) throw updateError;
      setActivities(current => current.map(item => item.id === activity.id ? { ...item, status: nextStatus } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar el estado.");
    }
  }

  async function deleteActivity(id: string) {
    if (!window.confirm("¿Eliminar esta actividad? Esta acción no se puede deshacer.")) return;
    setError("");
    try {
      const { error: deleteError } = await getSupabaseClient().from("activities").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setActivities(current => current.filter(item => item.id !== id));
      if (editingId === id) resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos eliminar la actividad.");
    }
  }

  const visibleActivities = useMemo(() => activities.filter(activity => filter === "all" || (activity.status ?? "pending") === filter), [activities, filter]);
  const counts = useMemo(() => ({
    all: activities.length,
    pending: activities.filter(item => (item.status ?? "pending") === "pending").length,
    in_progress: activities.filter(item => item.status === "in_progress").length,
    completed: activities.filter(item => item.status === "completed").length,
  }), [activities]);

  return <div className="tasks-workspace">
    <div className="welcome-row">
      <div><div className="eyebrow"><ClipboardList size={14}/> TU TRABAJO, BAJO CONTROL</div><h1>Mis tareas<span className="orange-period">.</span></h1><p className="intro">Registra entregas, organiza instrucciones y da seguimiento a cada actividad.</p></div>
    </div>

    <div className="tasks-layout">
      <section className="panel task-editor-panel">
        <div className="panel-heading"><div><h2>{editingId ? "Editar actividad" : "Nueva actividad"}</h2><p>{editingId ? "Actualiza los detalles de tu entrega." : "Agrega una tarea a tu espacio académico."}</p></div><span className="focus-icon">{editingId ? <Pencil size={18}/> : <Plus size={18}/>}</span></div>
        <form className="task-form" onSubmit={saveActivity}>
          <label htmlFor="activity-title">Nombre de la actividad</label>
          <input id="activity-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Ej. Caso práctico de operaciones" required maxLength={160}/>
          <label htmlFor="activity-course">Materia</label>
          <select id="activity-course" value={courseId} onChange={event => setCourseId(event.target.value)}>
            <option value="">Sin materia asignada</option>
            {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <label htmlFor="activity-due">Fecha y hora de entrega <span>(opcional)</span></label>
          <input id="activity-due" type="datetime-local" value={dueDate} onChange={event => setDueDate(event.target.value)}/>
          <label htmlFor="activity-instructions">Instrucciones <span>(opcional)</span></label>
          <textarea id="activity-instructions" value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="¿Qué debes realizar?" rows={3}/>
          <label htmlFor="activity-rubric">Rúbrica o criterios de evaluación <span>(opcional)</span></label>
          <textarea id="activity-rubric" value={rubric} onChange={event => setRubric(event.target.value)} placeholder="Anota los puntos que se evaluarán" rows={3}/>
          <label htmlFor="activity-status">Estado</label>
          <select id="activity-status" value={status} onChange={event => setStatus(event.target.value as Status)}>
            <option value="pending">Pendiente</option><option value="in_progress">En progreso</option><option value="completed">Completada</option>
          </select>
          <div className="task-form-actions">
            <button className="primary-button glass-button" type="submit" disabled={saving || !title.trim()}><Check size={16}/>{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear actividad"}</button>
            {editingId && <button className="secondary-button" type="button" onClick={resetForm}><X size={15}/> Cancelar</button>}
          </div>
        </form>
      </section>

      <section className="panel task-list-panel">
        <div className="panel-heading"><div><h2>Tu seguimiento</h2><p>{counts.all} {counts.all === 1 ? "actividad registrada" : "actividades registradas"}</p></div><span className="course-count">{String(counts.all).padStart(2,"0")}</span></div>
        <div className="task-filters" aria-label="Filtrar actividades">
          {([{key:"all",label:"Todas"},{key:"pending",label:"Pendientes"},{key:"in_progress",label:"En progreso"},{key:"completed",label:"Completadas"}] as const).map(item => <button key={item.key} type="button" className={filter === item.key ? "task-filter active" : "task-filter"} onClick={() => setFilter(item.key)}>{item.label}<span>{counts[item.key]}</span></button>)}
        </div>
        {loading ? <div className="course-empty">Cargando tus actividades...</div> : visibleActivities.length === 0 ? <div className="course-empty"><span className="empty-icon"><CalendarDays size={22}/></span><strong>{filter === "all" ? "Aún no tienes actividades" : "No hay actividades en esta categoría"}</strong><span>{filter === "all" ? "Crea tu primera actividad para comenzar a organizar tus entregas." : "Cuando registres actividades con este estado, aparecerán aquí."}</span></div> : <div className="activity-list">
          {visibleActivities.map(activity => {
            const course = courses.find(item => item.id === activity.course_id);
            const currentStatus = (activity.status === "completed" || activity.status === "in_progress" ? activity.status : "pending") as Status;
            return <article className="activity-card" key={activity.id}>
              <div className="activity-card-top">
                <div className="activity-main">
                  <strong>{activity.title}</strong>
                  <div className="activity-meta">
                    {course && <span className="activity-course"><i style={{background:course.color || "#34516F"}}/>{course.name}</span>}
                    <span><CalendarDays size={13}/>{formatDueDate(activity.due_date)}</span>
                  </div>
                </div>
                <span className={"activity-status status-" + currentStatus}>{statusLabels[currentStatus]}</span>
              </div>
              {activity.instructions && <p className="activity-description">{activity.instructions}</p>}
              {activity.rubric && <details className="activity-rubric"><summary>Ver rúbrica o criterios</summary><p>{activity.rubric}</p></details>}
              <div className="activity-actions">
                <label className="status-select-label" htmlFor={"status-" + activity.id}>Estado</label>
                <select id={"status-" + activity.id} value={currentStatus} onChange={event => void changeStatus(activity, event.target.value as Status)}>
                  <option value="pending">Pendiente</option><option value="in_progress">En progreso</option><option value="completed">Completada</option>
                </select>
                <button type="button" className="activity-icon-button" onClick={() => startEdit(activity)} aria-label={"Editar " + activity.title} title="Editar"><Pencil size={15}/></button>
                <button type="button" className="activity-icon-button danger" onClick={() => void deleteActivity(activity.id)} aria-label={"Eliminar " + activity.title} title="Eliminar"><Trash2 size={15}/></button>
              </div>
            </article>;
          })}
        </div>}
      </section>
    </div>
    {error && <p className="course-error" role="alert">{error}</p>}
  </div>;
}
