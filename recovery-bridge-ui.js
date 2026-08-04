(function(root,factory){
  const domain = typeof module === "object" && module.exports
    ? require("./recovery-bridge-domain.js")
    : root.CONNECTARecoveryBridge;
  const api = factory(domain);
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.ConnectaRecoveryBridgeUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(Bridge){
  "use strict";

  const STORAGE_KEY = "recoveryBridgeV1";
  const WINDOW_LABELS = {
    prepare:"Prepare before the transition",
    first24:"First 24 hours",
    hours24to48:"24–48 hours",
    hours48to72:"48–72 hours"
  };

  function createRecoveryBridgeUI(options){
    const document = options.document;
    const store = options.store;
    const now = options.now || (()=>new Date());
    const notify = options.notify || (()=>{});
    const confirmAction = options.confirm || (()=>true);
    const openUrgentSupport = options.openUrgentSupport || (()=>{});
    const byId = id => document.getElementById(id);
    const all = selector => [...document.querySelectorAll(selector)];

    function escapeHtml(value=""){
      return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    }

    function getPlan(){
      return store.get(STORAGE_KEY,null);
    }

    function setPlan(plan){
      store.set(STORAGE_KEY,plan);
      render();
    }

    function localDateAndTime(iso){
      const date = new Date(iso);
      const local = new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString();
      return {date:local.slice(0,10),time:local.slice(11,16)};
    }

    function countdownText(plan){
      const difference = new Date(plan.transitionAt).getTime()-now().getTime();
      if(difference>0){
        const hours = Math.ceil(difference/3600000);
        return hours>=48 ? `${Math.ceil(hours/24)} days until ${plan.transitionType}` : `${hours} hours until ${plan.transitionType}`;
      }
      const elapsedHours = Math.floor(Math.abs(difference)/3600000);
      return elapsedHours<72 ? `Hour ${elapsedHours+1} of the first 72 hours` : "First 72-hour plan ready for review";
    }

    function practicalSummary(plan){
      const items = [
        ["First night",plan.firstNightAddress],
        ["Medication",plan.medicationPlan],
        ["Key appointment",plan.keyAppointment],
        ["Transport",plan.transportPlan],
        ["Safe contact",[plan.safeContact?.name,plan.safeContact?.phone].filter(Boolean).join(" · ")]
      ].filter(([,value])=>value);
      return items.length
        ? items.map(([label,value])=>`<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")
        : '<p class="muted small">Add practical information when you are ready.</p>';
    }

    function taskMarkup(plan){
      return Object.keys(WINDOW_LABELS).map(window=>{
        const tasks = plan.tasks.filter(task=>task.window===window);
        if(!tasks.length) return "";
        return `<section class="bridge-window"><h4>${WINDOW_LABELS[window]}</h4>${tasks.map(task=>`
          <label class="bridge-task ${task.completedAt?"complete":""}">
            <input type="checkbox" data-bridge-task="${escapeHtml(task.id)}" ${task.completedAt?"checked":""}>
            <span>${escapeHtml(task.label)}</span>
          </label>`).join("")}</section>`;
      }).join("");
    }

    function render(){
      const plan = getPlan();
      byId("bridgeEmpty").hidden=Boolean(plan);
      byId("bridgeActive").hidden=!plan;
      if(!plan) return;
      byId("bridgeCountdown").textContent=countdownText(plan);
      const complete = plan.tasks.filter(task=>task.completedAt).length;
      byId("bridgeProgress").textContent=`${complete} of ${plan.tasks.length} steps completed`;
      byId("bridgePracticalSummary").innerHTML=practicalSummary(plan);
      byId("bridgeTaskList").innerHTML=taskMarkup(plan);
    }

    function fillPlanForm(plan){
      const parts = localDateAndTime(plan?.transitionAt || now().toISOString());
      byId("bridgeTransitionType").value=plan?.transitionType || "release";
      byId("bridgeTransitionDate").value=parts.date;
      byId("bridgeTransitionTime").value=parts.time;
      byId("bridgeFirstNight").value=plan?.firstNightAddress || "";
      byId("bridgeMedication").value=plan?.medicationPlan || "";
      byId("bridgeAppointment").value=plan?.keyAppointment || "";
      byId("bridgeTransport").value=plan?.transportPlan || "";
      byId("bridgeContactName").value=plan?.safeContact?.name || "";
      byId("bridgeContactPhone").value=plan?.safeContact?.phone || "";
      byId("bridgePrivateNotes").value=plan?.privateNotes || "";
    }

    function openPlanForm(){
      fillPlanForm(getPlan());
      byId("bridgePlanDialog").showModal();
    }

    function bridgeInput(){
      const date = byId("bridgeTransitionDate").value;
      const time = byId("bridgeTransitionTime").value;
      if(!date || !time) throw new Error("Choose the transition date and time");
      return {
        transitionType:byId("bridgeTransitionType").value,
        transitionAt:new Date(`${date}T${time}:00`).toISOString(),
        firstNightAddress:byId("bridgeFirstNight").value,
        medicationPlan:byId("bridgeMedication").value,
        keyAppointment:byId("bridgeAppointment").value,
        transportPlan:byId("bridgeTransport").value,
        safeContact:{name:byId("bridgeContactName").value,phone:byId("bridgeContactPhone").value},
        privateNotes:byId("bridgePrivateNotes").value
      };
    }

    function passportMarkup(passport){
      const sections = passport.sections;
      const rows = [];
      if(sections.transition) rows.push(["Transition",`${sections.transition.type} · ${new Date(sections.transition.dateAndTime).toLocaleString("en-GB")}`]);
      if(sections.firstNightAddress) rows.push(["First night",sections.firstNightAddress]);
      if(sections.medicationPlan) rows.push(["Medication plan",sections.medicationPlan]);
      if(sections.keyAppointment) rows.push(["Key appointment",sections.keyAppointment]);
      if(sections.transportPlan) rows.push(["Transport",sections.transportPlan]);
      if(sections.safeContact) rows.push(["Safe contact",[sections.safeContact.name,sections.safeContact.phone].filter(Boolean).join(" · ")]);
      if(sections.tasks){
        const complete = sections.tasks.filter(task=>task.completed).length;
        rows.push(["72-hour steps",`${complete} of ${sections.tasks.length} completed`]);
      }
      return `<article class="passport-sheet"><h3>CONNECTA Recovery Passport</h3><p class="small">Created ${escapeHtml(new Date(passport.generatedAt).toLocaleString("en-GB"))}</p>${rows.map(([label,value])=>`<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")}<p class="small">Private notes are never included in this passport.</p></article>`;
    }

    function currentPassport(){
      const include = all("[data-passport-section]:checked").map(input=>input.dataset.passportSection);
      return Bridge.buildRecoveryPassport(getPlan(),{
        consent:byId("passportConsent").checked,
        include
      },now().toISOString());
    }

    function downloadPassport(passport){
      if(options.download){
        options.download(passport);
        return;
      }
      const window = document.defaultView;
      const blob = new window.Blob([JSON.stringify(passport,null,2)],{type:"application/json"});
      const link = document.createElement("a");
      link.href=window.URL.createObjectURL(blob);
      link.download=`connecta-recovery-passport-${passport.generatedAt.slice(0,10)}.json`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }

    function performPassportAction(action){
      try{
        const passport = currentPassport();
        byId("recoveryPassportPreview").innerHTML=passportMarkup(passport);
        action(passport);
      }catch(error){
        byId("recoveryPassportPreview").textContent=error.message;
      }finally{
        byId("passportConsent").checked=false;
      }
    }

    function bind(){
      byId("openBridgePlan").addEventListener("click",openPlanForm);
      byId("editBridgePlan").addEventListener("click",openPlanForm);
      byId("bridgePlanForm").addEventListener("submit",event=>{
        event.preventDefault();
        try{
          const existing = getPlan();
          let saved = Bridge.createBridgePlan(bridgeInput(),now().toISOString());
          if(existing){
            const completionById = new Map(existing.tasks.map(task=>[task.id,task.completedAt]));
            saved = {
              ...saved,
              createdAt:existing.createdAt,
              checkIns:Array.isArray(existing.checkIns) ? existing.checkIns.map(item=>({...item})) : [],
              tasks:saved.tasks.map(task=>({...task,completedAt:completionById.get(task.id) || null}))
            };
          }
          setPlan(saved);
          byId("bridgePlanDialog").close();
          notify("My First 72 Hours plan saved");
        }catch(error){ notify(error.message); }
      });
      byId("bridgeTaskList").addEventListener("change",event=>{
        const checkbox = event.target.closest("[data-bridge-task]");
        if(!checkbox) return;
        setPlan(Bridge.setBridgeTaskCompletion(getPlan(),checkbox.dataset.bridgeTask,checkbox.checked,now().toISOString()));
      });
      byId("deleteBridgePlan").addEventListener("click",()=>{
        if(!confirmAction("Delete My First 72 Hours plan from this device?")) return;
        store.remove(STORAGE_KEY);
        render();
      });
      all("[data-bridge-checkin]").forEach(button=>button.addEventListener("click",()=>{
        const result = Bridge.recordBridgeCheckIn(getPlan(),button.dataset.bridgeCheckin,now().toISOString());
        setPlan(result.plan);
        byId("bridgeGuidance").innerHTML=`<strong>${escapeHtml(result.guidance.title)}</strong><p>${escapeHtml(result.guidance.nextAction)}</p>`;
        if(result.guidance.showUrgentSupport) openUrgentSupport();
      }));
      byId("openRecoveryPassport").addEventListener("click",()=>{
        byId("passportConsent").checked=false;
        byId("recoveryPassportPreview").innerHTML='<p class="muted small">Select only the practical information you want to share.</p>';
        byId("recoveryPassportDialog").showModal();
      });
      byId("recoveryPassportForm").addEventListener("submit",event=>{
        event.preventDefault();
        performPassportAction(()=>{});
      });
      byId("downloadRecoveryPassport").addEventListener("click",()=>performPassportAction(downloadPassport));
      byId("printRecoveryPassport").addEventListener("click",()=>performPassportAction(passport=>{
        (options.print || document.defaultView.print).call(document.defaultView,passport);
      }));
    }

    function init(){
      bind();
      render();
      return api;
    }

    const api = {init,render,getPlan};
    return api;
  }

  return {createRecoveryBridgeUI};
});
