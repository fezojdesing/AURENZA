"use client";

import { ExternalLink, GraduationCap, Info } from "lucide-react";

export default function BlackboardWorkspace(){
  return <div className="blackboard-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><GraduationCap size={14}/> PLATAFORMA DE TU INSTITUCIÓN</div><h1>Blackboard<span className="orange-period">.</span></h1><p className="intro">Accede a tu entorno institucional de aprendizaje.</p></div></div>
    <section className="panel blackboard-panel">
      <span className="empty-icon"><GraduationCap size={25}/></span>
      <h2>Conecta con tu aula virtual</h2>
      <p>Blackboard es una plataforma externa. Para enlazar directamente tu institución y mostrar tus cursos aquí, necesitamos la dirección específica de acceso que utiliza tu escuela.</p>
      <a className="primary-button blackboard-link" href="https://www.blackboard.com/" target="_blank" rel="noreferrer"><ExternalLink size={16}/> Abrir Blackboard</a>
      <div className="blackboard-note"><Info size={15}/><span>El acceso institucional, tus materias y tus calificaciones de Blackboard no se sincronizan automáticamente con AURENZA. Puedes guardar tus actividades y apuntes aquí de manera independiente.</span></div>
    </section>
  </div>;
}
