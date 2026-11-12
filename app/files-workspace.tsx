"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Download, File, FilePlus2, FolderOpen, Trash2 } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type StoredFile={id:string;name:string;created_at:string;metadata:Record<string,unknown>|null};
const bucket="aurenza-files";
function readableSize(bytes:number){if(bytes<1024)return bytes+" B";if(bytes<1024*1024)return (bytes/1024).toFixed(1)+" KB";return (bytes/1024/1024).toFixed(1)+" MB";}

export default function FilesWorkspace(){
  const [files,setFiles]=useState<StoredFile[]>([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  async function loadFiles(){
    setLoading(true);setError("");
    try{
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      const {data,error:listError}=await supabase.storage.from(bucket).list(user.id,{limit:100,sortBy:{column:"created_at",order:"desc"}});
      if(listError)throw listError;
      setFiles((data??[]).filter(item=>item.id!==null).map(item=>({id:item.id!,name:item.name,created_at:item.created_at??"",metadata:(item.metadata??null) as Record<string,unknown>|null})));
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos cargar tus archivos.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void loadFiles();},[]);

  async function uploadFiles(event:ChangeEvent<HTMLInputElement>){
    const selected=Array.from(event.target.files??[]);
    event.target.value="";
    if(!selected.length)return;
    setUploading(true);setError("");setNotice("");
    try{
      const supabase=getSupabaseClient();
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error("Inicia sesión para subir archivos.");
      const failed:string[]=[];
      for(const file of selected){
        if(file.size>25*1024*1024){failed.push(file.name+" (supera 25 MB)");continue;}
        const safeName=file.name.normalize("NFKD").replace(/[^\w.-]+/g,"-").replace(/-+/g,"-");
        const path=user.id+"/"+crypto.randomUUID()+"-"+safeName;
        const {error:uploadError}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
        if(uploadError)failed.push(file.name+" ("+uploadError.message+")");
      }
      await loadFiles();
      if(failed.length)setError("No se pudieron subir: "+failed.join(", "));
      else setNotice(selected.length===1?"Archivo subido correctamente.":"Archivos subidos correctamente.");
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos subir los archivos.");}
    finally{setUploading(false);}
  }

  async function downloadFile(fileName:string){
    try{
      const {data:{user},error:userError}=await getSupabaseClient().auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error("Inicia sesión para descargar.");
      const {data,error:downloadError}=await getSupabaseClient().storage.from(bucket).createSignedUrl(user.id+"/"+fileName,60);
      if(downloadError)throw downloadError;
      window.open(data.signedUrl,"_blank","noopener,noreferrer");
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos preparar la descarga.");}
  }

  async function deleteFile(fileName:string){
    if(!window.confirm("¿Eliminar este archivo?"))return;
    try{
      const {data:{user},error:userError}=await getSupabaseClient().auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error("Inicia sesión para eliminar archivos.");
      const {error:removeError}=await getSupabaseClient().storage.from(bucket).remove([user.id+"/"+fileName]);
      if(removeError)throw removeError;
      setFiles(current=>current.filter(file=>file.name!==fileName));
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos eliminar el archivo.");}
  }

  return <div className="files-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><FolderOpen size={14}/> TUS DOCUMENTOS, EN UN SOLO LUGAR</div><h1>Archivos<span className="orange-period">.</span></h1><p className="intro">Guarda tus documentos y materiales académicos de forma privada.</p></div><label className="primary-button file-upload-button"><FilePlus2 size={17}/>{uploading?"Subiendo...":"Subir archivos"}<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={event=>void uploadFiles(event)} disabled={uploading}/></label></div>
    <section className="panel files-panel">
      <div className="panel-heading"><div><h2>Mis documentos</h2><p>{files.length} {files.length===1?"archivo guardado":"archivos guardados"} · Máximo 25 MB por archivo</p></div><span className="course-count">{String(files.length).padStart(2,"0")}</span></div>
      {loading?<div className="course-empty">Cargando tus archivos...</div>:files.length===0?<div className="course-empty"><span className="empty-icon"><FolderOpen size={22}/></span><strong>Tu espacio está listo</strong><span>Sube tus PDF, imágenes, documentos y presentaciones para tenerlos a la mano.</span></div>:<div className="stored-file-list">{files.map(file=>{
        const size=Number(file.metadata?.size??0);
        const date=file.created_at?new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",year:"numeric"}).format(new Date(file.created_at)):"";
        return <article className="stored-file-row" key={file.id}><span className="stored-file-icon"><File size={18}/></span><div className="stored-file-copy"><strong>{file.name.replace(/^[0-9a-f-]{36}-/i,"")}</strong><small>{date}{size?" · "+readableSize(size):""}</small></div><button className="activity-icon-button" onClick={()=>void downloadFile(file.name)} aria-label={"Descargar "+file.name} title="Descargar"><Download size={15}/></button><button className="activity-icon-button danger" onClick={()=>void deleteFile(file.name)} aria-label={"Eliminar "+file.name} title="Eliminar"><Trash2 size={15}/></button></article>;
      })}</div>}
    </section>
    {notice&&<p className="files-notice" role="status">{notice}</p>}
    {error&&<p className="course-error" role="alert">{error}</p>}
  </div>;
}
