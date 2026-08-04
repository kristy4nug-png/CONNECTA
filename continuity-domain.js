(function(root,factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.CONNECTAContinuity = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(){
  "use strict";

  const APPOINTMENT_TYPES = Object.freeze([
    "worker","health","probation","treatment","recoveryMeeting","housingBenefits","other"
  ]);
  const REMINDERS = new Set(["off","oneHour","morningOf","oneDay","oneWeek"]);
  const STATUSES = new Set(["upcoming","completed","cancelled"]);
  const HANDOVER_ACTIONS = new Set(["preview","download","print"]);
  const HANDOVER_SECTIONS = new Set(["profile","bridge","appointments","capital","trustedContact"]);
  const CAPITAL_AREAS = ["Safety","Housing","Health","Connection","Money","Purpose","Recovery Support"];

  function clean(value){
    return typeof value === "string" ? value.trim() : "";
  }

  function iso(value,label){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`);
    return date.toISOString();
  }

  function validDate(value){
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean(value));
    if(!match) return false;
    const date = new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    return date.getFullYear()===Number(match[1]) && date.getMonth()===Number(match[2])-1 && date.getDate()===Number(match[3]);
  }

  function normaliseAppointment(input,nowIso,idFactory){
    const title = clean(input?.title);
    const date = clean(input?.date);
    if(!title || !validDate(date)) throw new Error("Appointment name and date are required");
    const type = clean(input?.type) || "other";
    const time = clean(input?.time);
    const reminder = clean(input?.reminder) || "off";
    const status = clean(input?.status) || "upcoming";
    if(!APPOINTMENT_TYPES.includes(type)) throw new Error("Appointment type is invalid");
    if(time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Appointment time is invalid");
    if(!REMINDERS.has(reminder)) throw new Error("Appointment reminder is invalid");
    if(!STATUSES.has(status)) throw new Error("Appointment status is invalid");
    const updatedAt = iso(nowIso,"Appointment update time");
    return {
      schemaVersion:1,
      id:clean(input?.id) || idFactory(),
      type,
      title,
      date,
      time,
      personOrService:clean(input?.personOrService),
      locationOrLink:clean(input?.locationOrLink),
      reminder,
      privateNotes:clean(input?.privateNotes),
      status,
      completedAt:input?.completedAt || null,
      cancelledAt:input?.cancelledAt || null,
      createdAt:input?.createdAt || updatedAt,
      updatedAt
    };
  }

  function saveAppointment(appointments,input,nowIso = new Date().toISOString(),idFactory = ()=>crypto.randomUUID()){
    const result = Array.isArray(appointments) ? appointments.map(item=>({...item})) : [];
    const appointment = normaliseAppointment(input,nowIso,idFactory);
    const index = result.findIndex(item=>item.id===appointment.id);
    if(index===-1) result.push(appointment);
    else result[index]={...appointment,createdAt:result[index].createdAt || appointment.createdAt};
    return result;
  }

  function setAppointmentStatus(appointments,id,status,nowIso = new Date().toISOString()){
    if(!STATUSES.has(status)) throw new Error("Appointment status is invalid");
    let found = false;
    const updatedAt = iso(nowIso,"Appointment update time");
    const result = (Array.isArray(appointments) ? appointments : []).map(item=>{
      if(item.id!==id) return {...item};
      found = true;
      return {
        ...item,
        status,
        completedAt:status==="completed" ? updatedAt : item.completedAt || null,
        cancelledAt:status==="cancelled" ? updatedAt : item.cancelledAt || null,
        updatedAt
      };
    });
    if(!found) throw new Error("Personal Appointment was not found");
    return result;
  }

  function createHandoverConsent(action,nowIso = new Date().toISOString(),idFactory = ()=>crypto.randomUUID()){
    if(!HANDOVER_ACTIONS.has(action)) throw new Error("Choose preview, download or print");
    return {
      id:idFactory(),
      action,
      grantedAt:iso(nowIso,"Consent time"),
      usedAt:null
    };
  }

  function appointmentForHandover(item){
    return {
      type:clean(item?.type),
      title:clean(item?.title),
      date:clean(item?.date),
      time:clean(item?.time),
      personOrService:clean(item?.personOrService),
      locationOrLink:clean(item?.locationOrLink)
    };
  }

  function bridgeForHandover(bridge){
    return {
      transitionType:clean(bridge?.transitionType),
      transitionAt:clean(bridge?.transitionAt),
      firstNightAddress:clean(bridge?.firstNightAddress),
      medicationPlan:clean(bridge?.medicationPlan),
      keyAppointment:clean(bridge?.keyAppointment),
      transportPlan:clean(bridge?.transportPlan),
      safeContact:{name:clean(bridge?.safeContact?.name),phone:clean(bridge?.safeContact?.phone)},
      tasks:(Array.isArray(bridge?.tasks) ? bridge.tasks : []).map(task=>({
        task:clean(task?.label),dueAt:clean(task?.dueAt),completed:Boolean(task?.completedAt)
      }))
    };
  }

  function latestCapitalReview(reviews){
    const latest = (Array.isArray(reviews) ? reviews : [])
      .slice()
      .sort((left,right)=>new Date(right.reviewedAt)-new Date(left.reviewedAt))[0];
    if(!latest) return null;
    return {
      reviewedAt:clean(latest.reviewedAt),
      areas:Object.fromEntries(CAPITAL_AREAS.filter(area=>latest.areas?.[area]).map(area=>[
        area,{rating:Number(latest.areas[area]?.rating),nextAction:clean(latest.areas[area]?.nextAction)}
      ]))
    };
  }

  function buildWorkerHandover(context,options = {},nowIso = new Date().toISOString()){
    const generatedAt = iso(nowIso,"Handover time");
    const consent = options.consent;
    const consentAge = new Date(generatedAt)-new Date(consent?.grantedAt);
    if(
      !HANDOVER_ACTIONS.has(options.action) ||
      consent?.action!==options.action ||
      consent?.usedAt ||
      !Number.isFinite(consentAge) || consentAge<0 || consentAge>5*60*1000
    ) throw new Error("Fresh consent is required for this Worker Handover action");

    const include = new Set((Array.isArray(options.include) ? options.include : []).filter(item=>HANDOVER_SECTIONS.has(item)));
    const sections = {};
    if(include.has("profile")){
      const displayName=clean(context?.profile?.displayName);
      const pathways=Array.isArray(context?.profile?.pathways) ? context.profile.pathways.map(clean).filter(Boolean) : [];
      if(displayName || pathways.length){
        const scale=Number(context?.profile?.textScale) || 1;
        sections.profile={displayName,pathways,textScale:Math.round(scale*100)/100};
      }
    }
    if(include.has("bridge") && context?.bridge) sections.bridge=bridgeForHandover(context.bridge);
    if(include.has("appointments")){
      sections.appointments=(Array.isArray(context?.appointments) ? context.appointments : [])
        .filter(item=>item.status==="upcoming")
        .map(appointmentForHandover)
        .sort((left,right)=>`${left.date}T${left.time || "23:59"}`.localeCompare(`${right.date}T${right.time || "23:59"}`));
    }
    if(include.has("capital")){
      const capital=latestCapitalReview(context?.capital);
      if(capital) sections.capital=capital;
    }
    if(include.has("trustedContact")){
      const name=clean(context?.trustedContact?.name);
      const phone=clean(context?.trustedContact?.phone);
      if(name || phone) sections.trustedContact={name,phone};
    }

    return {
      document:{
        app:"CONNECTA",
        title:"CONNECTA Worker Handover",
        generatedAt,
        sections
      },
      consent:{...consent,usedAt:generatedAt}
    };
  }

  return {
    APPOINTMENT_TYPES,saveAppointment,setAppointmentStatus,
    createHandoverConsent,buildWorkerHandover
  };
});
