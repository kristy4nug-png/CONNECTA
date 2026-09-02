(function(root,factory){
  const domain = typeof module === "object" && module.exports
    ? require("./beta-domain.js")
    : root.CONNECTABeta;
  const api = factory(domain);
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.ConnectaBetaUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(Beta){
  "use strict";

  const PROFILE_KEY="connectaBetaProfileV1";
  const LOCK_KEY="connectaPrivacyLockV1";
  const SESSION_KEY="connectaPrivacyUnlocked";

  function createBetaUI(options){
    const document=options.document;
    const store=options.store;
    const session=options.session || document.defaultView.sessionStorage;
    const now=options.now || (()=>new Date());
    const idFactory=options.idFactory || (()=>crypto.randomUUID());
    const notify=options.notify || (()=>{});
    const confirmAction=options.confirm || (message=>document.defaultView.confirm(message));
    const byId=id=>document.getElementById(id);

    function applyProfile(profile){
      const scale=Number(profile?.textScale) || 1;
      document.documentElement.style.setProperty("--text-scale",String(scale));
    }

    function setLocked(locked){
      byId("privacyLockScreen").hidden=!locked;
      document.body.classList.toggle("privacy-locked",locked);
      const content=byId("appContent");
      if(content){
        if(locked) content.setAttribute("inert","");
        else content.removeAttribute("inert");
      }
      document.documentElement.classList.remove("connecta-start-locked");
      if(locked) byId("unlockPin").focus();
    }

    function openOnboarding(){
      if(!store.get(PROFILE_KEY,null)) byId("onboardingDialog").showModal();
    }

    function saveOnboarding(input){
      const result=Beta.saveBetaProfile(store.get("contacts",[]),input,now().toISOString(),idFactory);
      store.set(PROFILE_KEY,result.profile);
      store.set("contacts",result.contacts);
      store.set("textScale",result.profile.textScale);
      applyProfile(result.profile);
      byId("onboardingDialog").close();
      notify("Atlas setup saved on this device");
    }

    function onboardingInput(){
      return {
        displayName:byId("setupDisplayName").value,
        textSize:byId("setupTextSize").value,
        pathways:[...document.querySelectorAll("[data-setup-pathway]:checked")].map(input=>input.dataset.setupPathway),
        trustedContact:{name:byId("setupContactName").value,phone:byId("setupContactPhone").value}
      };
    }

    function diagnosticInput(){
      const win=document.defaultView;
      return {
        version:"0.4.1",
        createdAt:now().toISOString(),
        userAgent:win.navigator.userAgent,
        platform:win.navigator.userAgentData?.platform || win.navigator.platform || "Unknown",
        online:win.navigator.onLine!==false,
        storage:win.localStorage,
        features:{
          serviceWorker:"serviceWorker" in win.navigator,
          webCrypto:Boolean(win.crypto?.subtle),
          download:"download" in document.createElement("a")
        }
      };
    }

    function downloadDiagnostic(report){
      if(options.downloadDiagnostic){ options.downloadDiagnostic(report); return; }
      const win=document.defaultView;
      const blob=new win.Blob([JSON.stringify(report,null,2)],{type:"application/json"});
      const link=document.createElement("a");
      link.href=win.URL.createObjectURL(blob);
      link.download=`connecta-diagnostic-${report.createdAt.slice(0,10)}.json`;
      link.click();
      win.URL.revokeObjectURL(link.href);
    }

    function bind(){
      byId("onboardingForm").addEventListener("submit",event=>{
        event.preventDefault();
        saveOnboarding(onboardingInput());
      });
      byId("skipOnboarding").addEventListener("click",()=>{
        const existingScale=Number(store.get("textScale",1));
        saveOnboarding({textScale:existingScale,pathways:[],trustedContact:{}});
      });
      byId("openBetaSettings").addEventListener("click",()=>byId("betaSettingsDialog").showModal());
      byId("openBetaInfo").addEventListener("click",()=>byId("betaInfoDialog").showModal());
      byId("privacyLockForm").addEventListener("submit",async event=>{
        event.preventDefault();
        const pin=byId("privacyPin").value;
        if(pin!==byId("privacyPinConfirm").value){ notify("The PIN entries do not match"); return; }
        try{
          const lock=await Beta.createPrivacyLock(pin,{nowIso:now().toISOString()});
          store.set(LOCK_KEY,lock);
          session.setItem(SESSION_KEY,"yes");
          byId("privacyPin").value="";
          byId("privacyPinConfirm").value="";
          notify("Privacy Lock is on");
        }catch(error){ notify(error.message); }
      });
      byId("removePrivacyLock").addEventListener("click",()=>{
        if(!store.get(LOCK_KEY,null) || !confirmAction("Turn off Privacy Lock on this device?")) return;
        store.remove(LOCK_KEY);
        session.removeItem(SESSION_KEY);
        setLocked(false);
        notify("Privacy Lock is off");
      });
      byId("lockNow").addEventListener("click",()=>{
        if(!store.get(LOCK_KEY,null)){ byId("betaSettingsDialog").showModal(); return; }
        session.removeItem(SESSION_KEY);
        byId("unlockPin").value="";
        byId("unlockMessage").textContent="";
        setLocked(true);
      });
      byId("unlockForm").addEventListener("submit",async event=>{
        event.preventDefault();
        const correct=await Beta.verifyPrivacyPin(byId("unlockPin").value,store.get(LOCK_KEY,null));
        byId("unlockPin").value="";
        if(!correct){ byId("unlockMessage").textContent="That PIN is incorrect. Try again."; return; }
        session.setItem(SESSION_KEY,"yes");
        byId("unlockMessage").textContent="";
        setLocked(false);
        openOnboarding();
      });
      byId("downloadDiagnostics").addEventListener("click",()=>{
        const report=Beta.buildDiagnosticReport(diagnosticInput());
        downloadDiagnostic(report);
        notify("Diagnostic report downloaded. Nothing was sent.");
      });
    }

    function init(){
      bind();
      const profile=store.get(PROFILE_KEY,null);
      applyProfile(profile || {textScale:store.get("textScale",1)});
      const needsUnlock=Boolean(store.get(LOCK_KEY,null)) && session.getItem(SESSION_KEY)!=="yes";
      setLocked(needsUnlock);
      if(!needsUnlock) openOnboarding();
      return api;
    }

    const api={init,setLocked};
    return api;
  }

  return {createBetaUI};
});
