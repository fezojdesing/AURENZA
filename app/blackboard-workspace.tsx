"use client";

import { ExternalLink, GraduationCap, Info } from "lucide-react";

export default function BlackboardWorkspace(){
  return <div className="blackboard-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><GraduationCap size={14}/> PLATAFORMA DE TU INSTITUCIÓN</div><h1>Blackboard<span className="orange-period">.</span></h1><p className="intro">Accede a tu entorno institucional de aprendizaje.</p></div></div>
    <section className="panel blackboard-panel">
      <span className="empty-icon"><GraduationCap size={25}/></span>
      <h2>Accede a tu aula virtual UNITEC</h2>
      <p>Ingresa directamente al entorno de Blackboard de UNITEC para consultar tus cursos, actividades y avisos institucionales.</p>
      <a className="primary-button blackboard-link" href="https://unitec-stage.blackboard.com" target="_blank" rel="noreferrer"><ExternalLink size={16}/> Abrir Blackboard</a>
      <div className="blackboard-note"><Info size={15}/><span>Blackboard UNITEC se abre en una pestaña nueva. Tus cursos y calificaciones institucionales no se sincronizan automáticamente con AURENZA.</span></div>
    </section>
  </div>;
}
