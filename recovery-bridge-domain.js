(function(root,factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.CONNECTARecoveryBridge = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(){
  "use strict";

  const TASKS = [
    ["prepare","Confirm where I will sleep on the first night",0],
    ["prepare","Collect identification, medication and important paperwork",0],
    ["prepare","Charge my phone and save essential contact numbers",0],
    ["first24","Travel to the planned safe address",12],
    ["first24","Follow my medication or pharmacy plan",18],
    ["first24","Make contact with one safe person or service",24],
    ["hours24to48","Confirm my key recovery or treatment appointment",36],
    ["hours24to48","Check food, money and phone credit for the next day",42],
    ["hours24to48","Confirm a recovery meeting or peer-support option",48],
    ["hours48to72","Review housing, benefits and transport actions",60],
    ["hours48to72","Review the plan with a trusted person or worker",66],
    ["hours48to72","Choose the next safe step after the first 72 hours",72]
  ];

  const CHECK_IN_GUIDANCE = {
    green:{
      title:"Protect what is working",
      nextAction:"Choose one planned task that would keep the next few hours steady.",
      showUrgentSupport:false
    },
    amber:{
      title:"Reduce the load",
      nextAction:"Contact someone safe, then choose one essential task and leave the rest for later.",
      showUrgentSupport:false
    },
    red:{
      title:"Move toward support now",
      nextAction:"Move toward immediate human support. If there is immediate danger, call 999 or use Atlas's urgent support options.",
      showUrgentSupport:true
    }
  };

  function clean(value){
    return typeof value === "string" ? value.trim() : "";
  }

  function validIso(value,label){
    const text = clean(value);
    const date = new Date(text);
    if(!text || Number.isNaN(date.getTime())) throw new Error(`${label} is required`);
    return date.toISOString();
  }

  function addHours(iso,hours){
    return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
  }

  function createBridgePlan(input,nowIso = new Date().toISOString()){
    const transitionAt = validIso(input?.transitionAt,"Transition date and time");
    const createdAt = validIso(nowIso,"Creation time");
    const transitionType = clean(input?.transitionType) || "transition";
    const tasks = TASKS.map(([window,label,dueAfterHours],index)=>({
      id:`bridge-task-${String(index+1).padStart(2,"0")}`,
      window,
      label,
      dueAt:addHours(transitionAt,dueAfterHours),
      completedAt:null
    }));
    return {
      schemaVersion:1,
      id:"recovery-bridge",
      transitionType,
      transitionAt,
      createdAt,
      updatedAt:createdAt,
      firstNightAddress:clean(input?.firstNightAddress),
      medicationPlan:clean(input?.medicationPlan),
      keyAppointment:clean(input?.keyAppointment),
      transportPlan:clean(input?.transportPlan),
      safeContact:{
        name:clean(input?.safeContact?.name),
        phone:clean(input?.safeContact?.phone)
      },
      privateNotes:clean(input?.privateNotes),
      tasks
    };
  }

  function setBridgeTaskCompletion(plan,taskId,completed,nowIso = new Date().toISOString()){
    const index = plan?.tasks?.findIndex(task=>task.id===taskId) ?? -1;
    if(index === -1) throw new Error("Recovery Bridge task was not found");
    const updatedAt = validIso(nowIso,"Update time");
    return {
      ...plan,
      updatedAt,
      tasks:plan.tasks.map((task,taskIndex)=>taskIndex===index
        ? {...task,completedAt:completed ? updatedAt : null}
        : {...task})
    };
  }

  function recordBridgeCheckIn(plan,status,nowIso = new Date().toISOString()){
    const guidance = CHECK_IN_GUIDANCE[status];
    if(!guidance) throw new Error("Choose a green, amber or red check-in");
    const recordedAt = validIso(nowIso,"Check-in time");
    return {
      plan:{
        ...plan,
        updatedAt:recordedAt,
        checkIns:[...(Array.isArray(plan?.checkIns) ? plan.checkIns.map(item=>({...item})) : []),{status,recordedAt}]
      },
      guidance:{...guidance}
    };
  }

  function buildRecoveryPassport(plan,options = {},nowIso = new Date().toISOString()){
    if(options.consent !== true) throw new Error("Consent is required to create a Recovery Passport");
    const include = new Set(Array.isArray(options.include) ? options.include : []);
    const sections = {};
    if(include.has("transition")){
      sections.transition = {type:plan.transitionType,dateAndTime:plan.transitionAt};
    }
    if(include.has("medication") && plan.medicationPlan){
      sections.medicationPlan = plan.medicationPlan;
    }
    if(include.has("firstNight") && plan.firstNightAddress){
      sections.firstNightAddress = plan.firstNightAddress;
    }
    if(include.has("appointment") && plan.keyAppointment){
      sections.keyAppointment = plan.keyAppointment;
    }
    if(include.has("transport") && plan.transportPlan){
      sections.transportPlan = plan.transportPlan;
    }
    if(include.has("safeContact") && (plan.safeContact?.name || plan.safeContact?.phone)){
      sections.safeContact = {
        name:clean(plan.safeContact?.name),
        phone:clean(plan.safeContact?.phone)
      };
    }
    if(include.has("tasks")){
      sections.tasks = plan.tasks.map(task=>({
        window:task.window,
        task:task.label,
        dueAt:task.dueAt,
        completed:Boolean(task.completedAt)
      }));
    }
    return {
      app:"Atlas",
      document:"Recovery Passport",
      generatedAt:validIso(nowIso,"Passport time"),
      sections
    };
  }

  return {createBridgePlan,setBridgeTaskCompletion,recordBridgeCheckIn,buildRecoveryPassport};
});
