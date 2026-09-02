(function(root,factory){
  const domain = typeof module === "object" && module.exports
    ? require("./continuity-domain.js")
    : root.CONNECTAContinuity;
  const api = factory(domain);
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.ConnectaContinuityUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(Continuity){
  "use strict";

  const APPOINTMENTS_KEY="personalAppointmentsV1";

  function createContinuityUI(options){
    const document=options.document;
    const store=options.store;
    const now=options.now || (()=>new Date());
    const idFactory=options.idFactory || (()=>crypto.randomUUID());
    const notify=options.notify || (()=>{});
    const confirmConsent=options.consent || (action=>document.defaultView.confirm(`I consent to ${action} a Worker Handover using only the selected sections.`));
    const byId=id=>document.getElementById(id);

    function escapeHtml(value=""){
      return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    }

    function appointments(){ return store.get(APPOINTMENTS_KEY,[]); }
    function saveAppointments(value){ store.set(APPOINTMENTS_KEY,value); renderAppointments(); }

    function renderAppointments(){
      const items=appointments().slice().sort((left,right)=>`${left.date}T${left.time||"23:59"}`.localeCompare(`${right.date}T${right.time||"23:59"}`));
      if(!items.length){
        byId("appointmentList").innerHTML='<div class="empty">No Personal Appointments saved yet.</div>';
        return;
      }
      byId("appointmentList").innerHTML=items.map(item=>`
        <article class="appointment-card ${escapeHtml(item.status)}">
          <span class="pill">${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(new Date(`${item.date}T12:00:00`).toLocaleDateString("en-GB"))}${item.time?` · ${escapeHtml(item.time)}`:""}</p>
          ${item.personOrService?`<p class="small">${escapeHtml(item.personOrService)}</p>`:""}
          ${item.locationOrLink?`<p class="small">${escapeHtml(item.locationOrLink)}</p>`:""}
          <div class="action-row">
            <button class="ghost" data-edit-appointment="${escapeHtml(item.id)}">Edit</button>
            ${item.status!=="completed"?`<button class="primary" data-appointment-id="${escapeHtml(item.id)}" data-appointment-status="completed">Complete</button>`:""}
            ${item.status!=="cancelled"?`<button class="ghost" data-appointment-id="${escapeHtml(item.id)}" data-appointment-status="cancelled">Cancel</button>`:""}
          </div>
        </article>`).join("");
    }

    function fillAppointment(item={}){
      byId("appointmentId").value=item.id||"";
      byId("appointmentType").value=item.type||"worker";
      byId("appointmentTitle").value=item.title||"";
      byId("appointmentDate").value=item.date||now().toISOString().slice(0,10);
      byId("appointmentTime").value=item.time||"";
      byId("appointmentPerson").value=item.personOrService||"";
      byId("appointmentLocation").value=item.locationOrLink||"";
      byId("appointmentReminder").value=item.reminder||"off";
      byId("appointmentPrivateNotes").value=item.privateNotes||"";
    }

    function appointmentInput(){
      const existing=appointments().find(item=>item.id===byId("appointmentId").value);
      return {
        ...existing,
        id:byId("appointmentId").value,
        type:byId("appointmentType").value,
        title:byId("appointmentTitle").value,
        date:byId("appointmentDate").value,
        time:byId("appointmentTime").value,
        personOrService:byId("appointmentPerson").value,
        locationOrLink:byId("appointmentLocation").value,
        reminder:byId("appointmentReminder").value,
        privateNotes:byId("appointmentPrivateNotes").value
      };
    }

    function contextForHandover(){
      const profile=store.get("connectaBetaProfileV1",{});
      return {
        profile,
        bridge:store.get("recoveryBridgeV1",null),
        appointments:appointments(),
        capital:store.get("recoveryCapitalV1",[]),
        trustedContact:profile.trustedContact || {}
      };
    }

    function handoverMarkup(handover){
      const sections=handover.sections;
      const rows=[];
      if(sections.profile) rows.push(`<h3>Beta profile</h3><p>${escapeHtml(sections.profile.displayName || "Name not added")}</p><p class="small">${escapeHtml(sections.profile.pathways.join(", ") || "No pathways selected")}</p>`);
      if(sections.bridge) rows.push(`<h3>Recovery Bridge</h3><p>Transition: ${escapeHtml(sections.bridge.transitionType)} ${escapeHtml(sections.bridge.transitionAt)}</p><p>First night: ${escapeHtml(sections.bridge.firstNightAddress)}</p><p>Medication: ${escapeHtml(sections.bridge.medicationPlan)}</p><p>Transport: ${escapeHtml(sections.bridge.transportPlan)}</p>`);
      if(sections.appointments) rows.push(`<h3>Upcoming appointments</h3>${sections.appointments.length?sections.appointments.map(item=>`<p><strong>${escapeHtml(item.title)}</strong> · ${escapeHtml(item.date)} ${escapeHtml(item.time)}</p>`).join(""):"<p>None selected.</p>"}`);
      if(sections.capital) rows.push(`<h3>Recovery Capital Map</h3>${Object.entries(sections.capital.areas).map(([area,value])=>`<p><strong>${escapeHtml(area)} · ${value.rating}/5</strong>${value.nextAction?`<br>${escapeHtml(value.nextAction)}`:""}</p>`).join("")}`);
      if(sections.trustedContact) rows.push(`<h3>Trusted contact</h3><p>${escapeHtml(sections.trustedContact.name)} · ${escapeHtml(sections.trustedContact.phone)}</p>`);
      return `<article class="passport-sheet"><h2>${escapeHtml(handover.title)}</h2><p class="small">Created ${escapeHtml(new Date(handover.generatedAt).toLocaleString("en-GB"))}</p>${rows.join("")}<p class="small">Created only for this action. Nothing was sent automatically.</p></article>`;
    }

    function download(documentData){
      if(options.download){ options.download(documentData); return; }
      const win=document.defaultView;
      const blob=new win.Blob([JSON.stringify(documentData,null,2)],{type:"application/json"});
      const link=document.createElement("a");
      link.href=win.URL.createObjectURL(blob);
      link.download=`connecta-worker-handover-${documentData.generatedAt.slice(0,10)}.json`;
      link.click();
      win.URL.revokeObjectURL(link.href);
    }

    function performHandover(action){
      if(!confirmConsent(action)){
        notify("Worker Handover cancelled. No information was created.");
        return null;
      }
      const actionTime=now().toISOString();
      const consent=Continuity.createHandoverConsent(action,actionTime,idFactory);
      const include=[...document.querySelectorAll("[data-handover-section]:checked")].map(input=>input.dataset.handoverSection);
      const result=Continuity.buildWorkerHandover(contextForHandover(),{action,consent,include},actionTime);
      byId("workerHandoverPreview").innerHTML=handoverMarkup(result.document);
      if(action==="download") download(result.document);
      if(action==="print") (options.print || document.defaultView.print).call(document.defaultView,result.document);
      return result.document;
    }

    function bind(){
      byId("openAppointmentForm").addEventListener("click",()=>{
        fillAppointment();
        byId("appointmentDialog").showModal();
      });
      byId("appointmentForm").addEventListener("submit",event=>{
        event.preventDefault();
        try{
          saveAppointments(Continuity.saveAppointment(appointments(),appointmentInput(),now().toISOString(),idFactory));
          byId("appointmentDialog").close();
          notify("Personal Appointment saved");
        }catch(error){ notify(error.message); }
      });
      byId("appointmentList").addEventListener("click",event=>{
        const edit=event.target.closest("[data-edit-appointment]");
        const status=event.target.closest("[data-appointment-status]");
        if(edit){
          fillAppointment(appointments().find(item=>item.id===edit.dataset.editAppointment));
          byId("appointmentDialog").showModal();
        }
        if(status) saveAppointments(Continuity.setAppointmentStatus(appointments(),status.dataset.appointmentId,status.dataset.appointmentStatus,now().toISOString()));
      });
      byId("openWorkerHandover").addEventListener("click",()=>{
        byId("workerHandoverPreview").innerHTML='<p class="muted small">Choose sections, then give fresh consent for each preview, download or print action.</p>';
        byId("workerHandoverDialog").showModal();
      });
      byId("previewWorkerHandover").addEventListener("click",()=>performHandover("preview"));
      byId("downloadWorkerHandover").addEventListener("click",()=>performHandover("download"));
      byId("printWorkerHandover").addEventListener("click",()=>performHandover("print"));
    }

    function init(){ bind(); renderAppointments(); return api; }
    const api={init,renderAppointments,performHandover};
    return api;
  }

  return {createContinuityUI};
});
