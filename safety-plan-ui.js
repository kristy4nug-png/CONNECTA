(function(root,factory){
  const domain=typeof module==="object"&&module.exports?require("./safety-plan-domain.js"):root.CONNECTASafetyPlan;
  const api=factory(domain);
  if(typeof module==="object"&&module.exports) module.exports=api;
  else root.ConnectaSafetyPlanUI=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Safety){
  "use strict";
  const KEY="connectaSafetyPlanV1";
  function createSafetyPlanUI(options){
    const document=options.document,store=options.store,notify=options.notify||(()=>{}),now=options.now||(()=>new Date());
    const byId=id=>document.getElementById(id);
    function read(){return Object.fromEntries(Safety.FIELDS.map(field=>[field,byId(`safetyPlan${field[0].toUpperCase()}${field.slice(1)}`).value]))}
    function fill(){const plan=store.get(KEY,{});Safety.FIELDS.forEach(field=>{byId(`safetyPlan${field[0].toUpperCase()}${field.slice(1)}`).value=plan[field]||""})}
    function render(){const plan=store.get(KEY,null);const box=byId("safetyPlanSummary");if(!Safety.hasContent(plan)){box.innerHTML='<div class="empty">No Safety Plan saved yet. You can add only what feels useful.</div>';return} box.textContent="Your private Safety Plan is saved on this device. You can edit, export deliberately, or delete it."}
    function download(data){if(options.download){options.download(data);return}const win=document.defaultView,blob=new win.Blob([JSON.stringify(data,null,2)],{type:"application/json"}),link=document.createElement("a");link.href=win.URL.createObjectURL(blob);link.download=`connecta-safety-plan-${data.createdAt.slice(0,10)}.json`;link.click();win.URL.revokeObjectURL(link.href)}
    function bind(){
      byId("openSafetyPlan").addEventListener("click",()=>{fill();byId("safetyPlanDialog").showModal();byId("safetyPlanWarningSigns").focus()});
      byId("safetyPlanForm").addEventListener("submit",event=>{event.preventDefault();try{const plan=Safety.normalise(read(),now().toISOString());if(!Safety.hasContent(plan))throw new Error("Add at least one item or choose Cancel");store.set(KEY,plan);byId("safetyPlanDialog").close();render();notify("Safety Plan saved privately on this device")}catch(error){notify(error.message)}});
      byId("deleteSafetyPlan").addEventListener("click",()=>{const confirmAction=options.confirm||document.defaultView.confirm.bind(document.defaultView);if(!store.get(KEY,null)||!confirmAction("Delete this private Safety Plan from this device?"))return;store.remove(KEY);byId("safetyPlanDialog").close();render();notify("Safety Plan deleted from this device")});
      byId("exportSafetyPlan").addEventListener("click",()=>{try{const data=Safety.buildExport(store.get(KEY,null),byId("safetyPlanExportConsent").checked,now().toISOString());download(data);byId("safetyPlanExportConsent").checked=false;notify("Safety Plan export downloaded. Nothing was sent.")}catch(error){notify(error.message)}});
    }
    const api={init(){bind();render();return api},render};return api;
  }
  return {createSafetyPlanUI};
});
