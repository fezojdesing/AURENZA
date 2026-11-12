"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";

type Activity={id:string;title:string;course_id:string|null;due_date:string|null;status:string|null};
type Course={id:string;name:string;color:string|null};
const monthNames=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const weekDays=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
function keyForDate(date:Date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");}

export default function CalendarWorkspace(){
  const [activities,setActivities]=useState<Activity[]>([]);
  const [courses,setCourses]=useState<Course[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [selectedDate,setSelectedDate]=useState(()=>keyForDate(new Date()));

  useEffect(()=>{
    async function load(){
      setLoading(true);setError("");
      try{
        const supabase=getSupabaseClient();
        const {data:{user},error:userError}=await supabase.auth.getUser();
        if(userError)throw userError;
        if(!user)throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
        const [activityResult,courseResult]=await Promise.all([
          supabase.from("activities").select("id,title,course_id,due_date,status").eq("user_id",user.id).not("due_date","is",null).order("due_date"),
          supabase.from("courses").select("id,name,color").eq("user_id",user.id),
        ]);
        if(activityResult.error)throw activityResult.error;
        if(courseResult.error)throw courseResult.error;
        setActivities(activityResult.data??[]);setCourses(courseResult.data??[]);
      }catch(caught){setError(caught instanceof Error?caught.message:"No pudimos cargar tu calendario.");}
      finally{setLoading(false);}
    }
    void load();
  },[]);

  const calendarDays=useMemo(()=>{
    const year=month.getFullYear(),monthIndex=month.getMonth();
    const first=new Date(year,monthIndex,1);
    const offset=(first.getDay()+6)%7;
    const count=new Date(year,monthIndex+1,0).getDate();
    const cells:({day:number;date:string}|null)[]=Array.from({length:offset},()=>null);
    for(let day=1;day<=count;day++)cells.push({day,date:keyForDate(new Date(year,monthIndex,day))});
    while(cells.length%7!==0)cells.push(null);
    return cells;
  },[month]);

  const activitiesByDate=useMemo(()=>{
    const grouped:Record<string,Activity[]>={};
    activities.forEach(item=>{if(item.due_date){const key=keyForDate(new Date(item.due_date));(grouped[key]??=[]).push(item);}});
    return grouped;
  },[activities]);
  const selectedActivities=activitiesByDate[selectedDate]??[];
  const selectedDateLabel=useMemo(()=>{
    const [year,monthNum,day]=selectedDate.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(year,monthNum-1,day));
  },[selectedDate]);

  function moveMonth(amount:number){setMonth(current=>new Date(current.getFullYear(),current.getMonth()+amount,1));}

  return <div className="calendar-workspace">
    <div className="welcome-row"><div><div className="eyebrow"><CalendarDays size={14}/> TUS FECHAS, EN PERSPECTIVA</div><h1>Calendario<span className="orange-period">.</span></h1><p className="intro">Visualiza tus entregas y organiza mejor tu tiempo.</p></div></div>
    <div className="calendar-layout">
      <section className="panel calendar-month-panel">
        <div className="calendar-month-header"><div><h2>{monthNames[month.getMonth()]} <span>{month.getFullYear()}</span></h2><p>Selecciona un día para ver tus entregas.</p></div><div className="calendar-nav"><button onClick={()=>moveMonth(-1)} aria-label="Mes anterior"><ChevronLeft size={17}/></button><button onClick={()=>moveMonth(1)} aria-label="Mes siguiente"><ChevronRight size={17}/></button></div></div>
        <div className="calendar-grid">
          {weekDays.map(day=><div className="calendar-weekday" key={day}>{day}</div>)}
          {calendarDays.map((cell,index)=>{
            if(!cell)return <div className="calendar-cell empty" key={"empty-"+index}/>;
            const isToday=cell.date===keyForDate(new Date());
            const isSelected=cell.date===selectedDate;
            const count=activitiesByDate[cell.date]?.length??0;
            return <button type="button" key={cell.date} className={"calendar-cell"+(isToday?" today":"")+(isSelected?" selected":"")} onClick={()=>setSelectedDate(cell.date)}>
              <span>{cell.day}</span>{count>0&&<i className="calendar-dots">{Array.from({length:Math.min(count,3)}).map((_,i)=><b key={i}/>)}</i>}
            </button>;
          })}
        </div>
        <div className="calendar-legend"><span><i className="legend-today"/> Hoy</span><span><i className="legend-event"/> Con entregas</span></div>
      </section>
      <section className="panel calendar-agenda-panel">
        <div className="panel-heading"><div><h2>Agenda del día</h2><p>{selectedDateLabel}</p></div><span className="focus-icon"><Clock size={17}/></span></div>
        {loading?<div className="course-empty">Cargando calendario...</div>:selectedActivities.length===0?<div className="course-empty"><span className="empty-icon"><CalendarDays size={22}/></span><strong>Un día despejado</strong><span>No tienes entregas registradas para esta fecha.</span></div>:<div className="calendar-agenda-list">{selectedActivities.map(activity=>{
          const course=courses.find(item=>item.id===activity.course_id);
          const time=activity.due_date?new Intl.DateTimeFormat("es-MX",{hour:"2-digit",minute:"2-digit"}).format(new Date(activity.due_date)):"";
          return <article className="agenda-item" key={activity.id}><span className="agenda-color" style={{background:course?.color||"#34516F"}}/><div><strong>{activity.title}</strong><small>{course?.name??"Sin materia asignada"}</small><span><Clock size={12}/>{time}</span></div><em className={"agenda-status "+(activity.status==="completed"?"done":activity.status==="in_progress"?"progress":"")}>{activity.status==="completed"?"Lista":activity.status==="in_progress"?"En curso":"Pendiente"}</em></article>;
        })}</div>}
        <div className="agenda-footer"><span>{activities.length} entregas con fecha</span><button className="text-button" onClick={()=>setSelectedDate(keyForDate(new Date()))}>Ir a hoy</button></div>
      </section>
    </div>
    {error&&<p className="course-error" role="alert">{error}</p>}
  </div>;
}
