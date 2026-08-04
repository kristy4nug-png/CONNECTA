(function(root,factory){
  const domain = typeof module === "object" && module.exports
    ? require("./recovery-capital-domain.js")
    : root.CONNECTARecoveryCapital;
  const api = factory(domain);
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.ConnectaRecoveryCapitalUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(Capital){
  "use strict";

  const STORAGE_KEY = "recoveryCapitalV1";

  function createRecoveryCapitalUI(options){
    const document = options.document;
    const store = options.store;
    const now = options.now || (()=>new Date());
    const idFactory = options.idFactory || (()=>crypto.randomUUID());
    const notify = options.notify || (()=>{});
    const byId = id=>document.getElementById(id);

    function escapeHtml(value=""){
      return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    }

    function renderForm(){
      byId("capitalAreas").innerHTML=Capital.AREAS.map(area=>`
        <fieldset class="capital-area">
          <legend>${escapeHtml(area)}</legend>
          <label>How is this area today?
            <select data-capital-rating="${escapeHtml(area)}">
              <option value="1">1 · needs attention</option>
              <option value="2">2 · needs some support</option>
              <option value="3" selected>3 · mixed today</option>
              <option value="4">4 · feeling steadier</option>
              <option value="5">5 · strong today</option>
            </select>
          </label>
          <label>One optional next action
            <input data-capital-action="${escapeHtml(area)}" maxlength="180" placeholder="A small, practical next step">
          </label>
        </fieldset>`).join("");
    }

    function renderHistory(){
      const reviews=Capital.reviewHistory(store.get(STORAGE_KEY,[]));
      if(!reviews.length){
        byId("capitalHistory").innerHTML='<div class="empty">No Recovery Capital review saved yet.</div>';
        return;
      }
      byId("capitalHistory").innerHTML=reviews.map((review,index)=>`
        <details ${index===0?"open":""}>
          <summary>${escapeHtml(new Date(review.reviewedAt).toLocaleString("en-GB"))}</summary>
          ${Capital.AREAS.map(area=>{
            const value=review.areas[area];
            return `<p><strong>${escapeHtml(area)} · ${value.rating}/5</strong>${value.nextAction?`<br><span class="small">Next action: ${escapeHtml(value.nextAction)}</span>`:""}</p>`;
          }).join("")}
        </details>`).join("");
    }

    function readForm(){
      return Object.fromEntries(Capital.AREAS.map(area=>[area,{
        rating:Number(document.querySelector(`[data-capital-rating="${area}"]`).value),
        nextAction:document.querySelector(`[data-capital-action="${area}"]`).value
      }]));
    }

    function bind(){
      byId("capitalAreas").addEventListener("change",event=>{
        const select=event.target.closest("[data-capital-rating]");
        if(select) byId("capitalGuidance").textContent=Capital.guidanceForRating(Number(select.value));
      });
      byId("capitalForm").addEventListener("submit",event=>{
        event.preventDefault();
        try{
          const reviews=Capital.saveReview(store.get(STORAGE_KEY,[]),readForm(),now().toISOString(),idFactory);
          store.set(STORAGE_KEY,reviews);
          renderHistory();
          notify("Recovery Capital review saved privately on this device");
        }catch(error){ notify(error.message); }
      });
    }

    function init(){
      renderForm();
      bind();
      renderHistory();
      byId("capitalGuidance").textContent="Each area stands on its own. CONNECTA never combines these ratings.";
      return api;
    }

    const api={init,renderHistory};
    return api;
  }

  return {createRecoveryCapitalUI};
});
