"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FileText, Folder, FolderPlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type FolderItem = { id: string; name: string };
type Note = { id: string; folder_id: string | null; title: string; content: string | null; updated_at: string | null };

export default function NotesWorkspace() {
  const [folders,setFolders]=useState<FolderItem[]>([]);
  const [notes,setNotes]=useState<Note[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [folderName,setFolderName]=useState("");
  const [selectedFolder,setSelectedFolder]=useState("all");
  const [activeNote,setActiveNote]=useState<string|null>(null);
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const [saving,setSaving]=useState(false);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError) throw userError;
      if(!user) throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      const [folderResult,noteResult]=await Promise.all([
        supabase.from("folders").select("id,name").eq("user_id",user.id).order("name"),
        supabase.from("notes").select("id,folder_id,title,content,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}),
      ]);
      if(folderResult.error) throw folderResult.error;
      if(noteResult.error) throw noteResult.error;
      setFolders(folderResult.data??[]); setNotes(noteResult.data??[]);
    } catch(caught) {
      setError(caught instanceof Error?caught.message:"No pudimos cargar tus apuntes.");
    } finally {setLoading(false);}
  }

  useEffect(()=>{void loadData();},[]);

  async function createFolder(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!folderName.trim()) return;
    setError("");
    try {
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError) throw userError;
      if(!user) throw new Error("Inicia sesión para crear una carpeta.");
      const {data,error:insertError}=await supabase.from("folders").insert({user_id:user.id,name:folderName.trim()}).select("id,name").single();
      if(insertError) throw insertError;
      setFolders(current=>[...current,data].sort((a,b)=>a.name.localeCompare(b.name)));
      setSelectedFolder(data.id); setFolderName("");
    } catch(caught) {setError(caught instanceof Error?caught.message:"No pudimos crear la carpeta.");}
  }

  function openNote(note?:Note) {
    setActiveNote(note?.id??"new");
    setTitle(note?.title??"");
    setBody(note?.content??"");
  }

  async function saveNote(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!title.trim()) return;
    setSaving(true);setError("");
    try {
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError) throw userError;
      if(!user) throw new Error("Inicia sesión para guardar un apunte.");
      const payload={user_id:user.id,folder_id:selectedFolder==="all"?null:selectedFolder,title:title.trim(),content:body,updated_at:new Date().toISOString()};
      const result=activeNote&&activeNote!=="new"
        ? await supabase.from("notes").update(payload).eq("id",activeNote).eq("user_id",user.id)
        : await supabase.from("notes").insert(payload);
      if(result.error) throw result.error;
      setActiveNote(null);setTitle("");setBody("");
      await loadData();
    } catch(caught) {setError(caught instanceof Error?caught.message:"No pudimos guardar el apunte.");}
    finally {setSaving(false);}
  }

  async function deleteNote(id:string) {
    if(!window.confirm("¿Eliminar este apunte?")) return;
    try {
      const {error:deleteError}=await getSupabaseClient().from("notes").delete().eq("id",id);
      if(deleteError) throw deleteError;
      setNotes(current=>current.filter(note=>note.id!==id));
      if(activeNote===id) setActiveNote(null);
    } catch(caught) {setError(caught instanceof Error?caught.message:"No pudimos eliminar el apunte.");}
  }

  async function deleteFolder(folder:FolderItem) {
    if(!window.confirm("¿Eliminar la carpeta "+folder.name+"? Los apuntes se conservarán sin carpeta.")) return;
    try {
      const {error:deleteError}=await getSupabaseClient().from("folders").delete().eq("id",folder.id);
      if(deleteError) throw deleteError;
      setFolders(current=>current.filter(item=>item.id!==folder.id));
      setNotes(current=>current.map(note=>note.folder_id===folder.id?{...note,folder_id:null}:note));
      if(selectedFolder===folder.id) setSelectedFolder("all");
    } catch(caught) {setError(caught instanceof Error?caught.message:"No pudimos eliminar la carpeta.");}
  }

  const visibleNotes=useMemo(()=>notes.filter(note=>selectedFolder==="all"||note.folder_id===selectedFolder),[notes,selectedFolder]);
  const selectedNote=activeNote&&activeNote!=="new"?notes.find(note=>note.id===activeNote):undefined;

  return <div className="notes-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><FileText size={14}/> IDEAS QUE MERECEN SU ESPACIO</div><h1>Mis apuntes<span className="orange-period">.</span></h1><p className="intro">Guarda tus notas de clase, ideas y materiales en un solo lugar.</p></div><button className="primary-button" onClick={()=>openNote()}><Plus size={17}/> Nuevo apunte</button></div>
    <div className="notes-layout">
      <aside className="panel notes-sidebar">
        <div className="panel-heading"><div><h2>Carpetas</h2><p>Organiza tus apuntes por tema.</p></div><span className="focus-icon"><Folder size={17}/></span></div>
        <button className={selectedFolder==="all"?"folder-row selected":"folder-row"} onClick={()=>setSelectedFolder("all")}><FileText size={16}/> Todos los apuntes <span>{notes.length}</span></button>
        {folders.map(folder=><div className="folder-line" key={folder.id}><button className={selectedFolder===folder.id?"folder-row selected":"folder-row"} onClick={()=>setSelectedFolder(folder.id)}><Folder size={16}/>{folder.name}<span>{notes.filter(note=>note.folder_id===folder.id).length}</span></button><button className="folder-delete" onClick={()=>void deleteFolder(folder)} aria-label={"Eliminar carpeta "+folder.name}><X size={13}/></button></div>)}
        <form className="folder-create" onSubmit={createFolder}><input value={folderName} onChange={event=>setFolderName(event.target.value)} placeholder="Nombre de carpeta" aria-label="Nombre de carpeta" maxLength={60}/><button type="submit" disabled={!folderName.trim()} aria-label="Crear carpeta"><FolderPlus size={16}/></button></form>
      </aside>
      <section className="panel notes-list-panel">
        {activeNote!==null ? <form className="note-editor" onSubmit={saveNote}>
          <div className="panel-heading"><div><h2>{activeNote==="new"?"Nuevo apunte":"Editar apunte"}</h2><p>{selectedNote?.title??"Escribe y guarda tus ideas."}</p></div><button type="button" className="activity-icon-button" onClick={()=>setActiveNote(null)} aria-label="Cerrar editor"><X size={16}/></button></div>
          <label htmlFor="note-title">Título</label><input id="note-title" value={title} onChange={event=>setTitle(event.target.value)} placeholder="Ej. Resumen de la unidad 1" required maxLength={140}/>
          <label htmlFor="note-content">Contenido</label><textarea id="note-content" value={body} onChange={event=>setBody(event.target.value)} placeholder="Escribe aquí tus apuntes..." rows={15}/>
          <div className="note-editor-actions"><button className="primary-button" type="submit" disabled={saving||!title.trim()}><Save size={16}/>{saving?"Guardando...":"Guardar apunte"}</button><button className="secondary-button" type="button" onClick={()=>setActiveNote(null)}>Cancelar</button></div>
        </form> : <>
          <div className="panel-heading"><div><h2>{selectedFolder==="all"?"Todos los apuntes":folders.find(folder=>folder.id===selectedFolder)?.name??"Carpeta"}</h2><p>{visibleNotes.length} {visibleNotes.length===1?"apunte":"apuntes"}</p></div><span className="course-count">{String(visibleNotes.length).padStart(2,"0")}</span></div>
          {loading?<div className="course-empty">Cargando tus apuntes...</div>:visibleNotes.length===0?<div className="course-empty"><span className="empty-icon"><FileText size={22}/></span><strong>Aún no hay apuntes aquí</strong><span>Crea un apunte o una carpeta para comenzar a organizar tus ideas.</span><button type="button" className="text-button" onClick={()=>openNote()}>Crear primer apunte <Plus size={14}/></button></div>:<div className="note-list">{visibleNotes.map(note=><article className="note-row" key={note.id}><button className="note-open" onClick={()=>openNote(note)}><span className="note-icon"><FileText size={17}/></span><span className="note-copy"><strong>{note.title}</strong><small>{note.content?.trim().slice(0,110)||"Sin contenido"}{(note.content?.length??0)>110?"…":""}</small></span></button><span className="note-date">{note.updated_at?new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short"}).format(new Date(note.updated_at)):""}</span><button className="activity-icon-button danger" onClick={()=>void deleteNote(note.id)} aria-label={"Eliminar "+note.title}><Trash2 size={15}/></button></article>)}</div>}
        </>}
      </section>
    </div>
    {error&&<p className="course-error" role="alert">{error}</p>}
  </div>;
}
