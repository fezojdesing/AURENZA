"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

export default function SettingsWorkspace(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [loaded,setLoaded]=useState(false);

  async function loadAccount(){
    if(loaded)return;
    const {data:{user},error:userError}=await getSupabaseClient().auth.getUser();
    if(userError){setError(userError.message);return;}
    setEmail(user?.email??"");setLoaded(true);
  }
  void loadAccount();

  async function updatePassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setNotice("");
    if(password.length<8){setError("Usa una contraseña de al menos 8 caracteres.");return;}
    if(password!==confirm){setError("Las contraseñas no coinciden.");return;}
    setBusy(true);
    try{
      const {error:updateError}=await getSupabaseClient().auth.updateUser({password});
      if(updateError)throw updateError;
      setPassword("");setConfirm("");setNotice("Tu contraseña se actualizó correctamente.");
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos actualizar la contraseña.");}
    finally{setBusy(false);}
  }

  async function requestEmailChange(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setNotice("");
    setBusy(true);
    try{
      const {error:updateError}=await getSupabaseClient().auth.updateUser({email:email.trim()});
      if(updateError)throw updateError;
      setNotice("Te enviamos un correo para confirmar el cambio de dirección.");
    }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos solicitar el cambio de correo.");}
    finally{setBusy(false);}
  }

  return <div className="settings-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><ShieldCheck size={14}/> TU CUENTA Y PRIVACIDAD</div><h1>Configuración<span className="orange-period">.</span></h1><p className="intro">Administra los datos de acceso de tu espacio AURENZA.</p></div></div>
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-heading"><div><h2>Correo electrónico</h2><p>Tu dirección asociada a la cuenta.</p></div><span className="focus-icon"><Mail size={17}/></span></div>
        <form className="settings-form" onSubmit={requestEmailChange}><label htmlFor="account-email">Correo electrónico</label><input id="account-email" type="email" value={email} onChange={event=>setEmail(event.target.value)} required/><p className="settings-help">Supabase puede pedirte confirmar el cambio desde tu bandeja de entrada.</p><button className="primary-button" type="submit" disabled={busy||!loaded}>Solicitar cambio de correo</button></form>
      </section>
      <section className="panel settings-panel"><div className="panel-heading"><div><h2>Cambiar contraseña</h2><p>Protege tu cuenta con una clave segura.</p></div><span className="focus-icon"><LockKeyhole size={17}/></span></div>
        <form className="settings-form" onSubmit={updatePassword}><label htmlFor="new-password">Nueva contraseña</label><input id="new-password" type="password" minLength={8} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Al menos 8 caracteres" required/><label htmlFor="confirm-password">Confirmar contraseña</label><input id="confirm-password" type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)} placeholder="Repite la contraseña" required/><button className="primary-button" type="submit" disabled={busy}>Actualizar contraseña</button></form>
      </section>
    </div>
    {notice&&<p className="files-notice" role="status">{notice}</p>}{error&&<p className="course-error" role="alert">{error}</p>}
  </div>;
}
