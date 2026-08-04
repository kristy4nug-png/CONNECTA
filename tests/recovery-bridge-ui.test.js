const test = require("node:test");
const assert = require("node:assert/strict");
const {JSDOM} = require("jsdom");

const {createRecoveryBridgeUI} = require("../recovery-bridge-ui.js");

function fixture(){
  const dom = new JSDOM(`<!doctype html><body>
    <div id="bridgeEmpty"><button id="openBridgePlan">Create plan</button></div>
    <div id="bridgeActive" hidden>
      <div id="bridgeCountdown"></div><div id="bridgeProgress"></div><div id="bridgePracticalSummary"></div>
      <button id="editBridgePlan">Edit</button><button id="deleteBridgePlan">Delete</button><button id="openRecoveryPassport">Passport</button>
      <button data-bridge-checkin="green">Green</button><button data-bridge-checkin="amber">Amber</button><button data-bridge-checkin="red">Red</button>
      <div id="bridgeGuidance"></div><div id="bridgeTaskList"></div>
    </div>
    <dialog id="bridgePlanDialog"><form id="bridgePlanForm">
      <select id="bridgeTransitionType"><option value="release">Release</option><option value="discharge">Discharge</option></select>
      <input id="bridgeTransitionDate" type="date"><input id="bridgeTransitionTime" type="time">
      <input id="bridgeFirstNight"><textarea id="bridgeMedication"></textarea><input id="bridgeAppointment">
      <input id="bridgeTransport"><input id="bridgeContactName"><input id="bridgeContactPhone"><textarea id="bridgePrivateNotes"></textarea>
      <button type="submit">Save</button>
    </form></dialog>
    <dialog id="recoveryPassportDialog"><form id="recoveryPassportForm">
      <input type="checkbox" data-passport-section="transition"><input type="checkbox" data-passport-section="firstNight">
      <input type="checkbox" data-passport-section="medication"><input type="checkbox" data-passport-section="appointment">
      <input type="checkbox" data-passport-section="transport"><input type="checkbox" data-passport-section="safeContact">
      <input type="checkbox" data-passport-section="tasks"><input id="passportConsent" type="checkbox">
      <button id="previewRecoveryPassport" type="submit">Preview</button>
    </form><div id="recoveryPassportPreview"></div><button id="downloadRecoveryPassport"></button><button id="printRecoveryPassport"></button>
    </dialog>
  `,{url:"https://connecta.local/"});
  for(const dialog of dom.window.document.querySelectorAll("dialog")){
    dialog.showModal=function(){this.open=true};
    dialog.close=function(){this.open=false};
  }
  return dom;
}

function memoryStore(){
  const data = new Map();
  return {
    get:(key,fallback)=>data.has(key) ? structuredClone(data.get(key)) : fallback,
    set:(key,value)=>data.set(key,structuredClone(value)),
    remove:key=>data.delete(key)
  };
}

test("the interface persists a 72-hour plan, appointment and task completion", () => {
  const store = memoryStore();
  const firstDom = fixture();
  const firstUI = createRecoveryBridgeUI({
    document:firstDom.window.document,
    store,
    now:()=>new Date("2026-08-03T09:00:00.000Z"),
    confirm:()=>true
  });
  firstUI.init();

  firstDom.window.document.querySelector("#openBridgePlan").click();
  firstDom.window.document.querySelector("#bridgeTransitionDate").value="2026-08-10";
  firstDom.window.document.querySelector("#bridgeTransitionTime").value="09:00";
  firstDom.window.document.querySelector("#bridgeAppointment").value="Recovery worker on Tuesday at 10:00";
  firstDom.window.document.querySelector("#bridgePlanForm").dispatchEvent(new firstDom.window.Event("submit",{bubbles:true,cancelable:true}));

  const saved = store.get("recoveryBridgeV1",null);
  assert.equal(saved.keyAppointment,"Recovery worker on Tuesday at 10:00");

  const firstTask = firstDom.window.document.querySelector("[data-bridge-task]");
  firstTask.checked=true;
  firstTask.dispatchEvent(new firstDom.window.Event("change",{bubbles:true}));
  assert.ok(store.get("recoveryBridgeV1",null).tasks[0].completedAt);

  firstDom.window.document.querySelector("#editBridgePlan").click();
  firstDom.window.document.querySelector("#bridgeAppointment").value="Updated recovery appointment";
  firstDom.window.document.querySelector("#bridgePlanForm").dispatchEvent(new firstDom.window.Event("submit",{bubbles:true,cancelable:true}));
  assert.ok(store.get("recoveryBridgeV1",null).tasks[0].completedAt);

  const reopenedDom = fixture();
  createRecoveryBridgeUI({
    document:reopenedDom.window.document,
    store,
    now:()=>new Date("2026-08-03T10:00:00.000Z"),
    confirm:()=>true
  }).init();

  assert.match(reopenedDom.window.document.querySelector("#bridgePracticalSummary").textContent,/Updated recovery appointment/);
  assert.equal(reopenedDom.window.document.querySelector("[data-bridge-task]").checked,true);
});

test("check-in controls save the next action and open urgent support for red", () => {
  const store = memoryStore();
  const dom = fixture();
  let urgentSupportOpened = 0;
  createRecoveryBridgeUI({
    document:dom.window.document,
    store,
    now:()=>new Date("2026-08-10T10:00:00.000Z"),
    confirm:()=>true,
    openUrgentSupport:()=>urgentSupportOpened++
  }).init();

  dom.window.document.querySelector("#openBridgePlan").click();
  dom.window.document.querySelector("#bridgeTransitionDate").value="2026-08-10";
  dom.window.document.querySelector("#bridgeTransitionTime").value="09:00";
  dom.window.document.querySelector("#bridgePlanForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));

  dom.window.document.querySelector('[data-bridge-checkin="amber"]').click();
  assert.match(dom.window.document.querySelector("#bridgeGuidance").textContent,/contact someone safe/i);
  assert.equal(store.get("recoveryBridgeV1",null).checkIns.at(-1).status,"amber");

  dom.window.document.querySelector('[data-bridge-checkin="red"]').click();
  assert.equal(urgentSupportOpened,1);
});

test("Recovery Passport preview shares selected practical details but not private notes", () => {
  const store = memoryStore();
  const dom = fixture();
  const downloaded = [];
  const printed = [];
  createRecoveryBridgeUI({
    document:dom.window.document,
    store,
    now:()=>new Date("2026-08-09T12:00:00.000Z"),
    confirm:()=>true,
    download:passport=>downloaded.push(passport),
    print:passport=>printed.push(passport)
  }).init();

  dom.window.document.querySelector("#openBridgePlan").click();
  dom.window.document.querySelector("#bridgeTransitionDate").value="2026-08-10";
  dom.window.document.querySelector("#bridgeTransitionTime").value="09:00";
  dom.window.document.querySelector("#bridgeFirstNight").value="15 Safe Street";
  dom.window.document.querySelector("#bridgeAppointment").value="Recovery worker Tuesday at 10:00";
  dom.window.document.querySelector("#bridgePrivateNotes").value="Do not show this private history";
  dom.window.document.querySelector("#bridgePlanForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));

  dom.window.document.querySelector("#openRecoveryPassport").click();
  dom.window.document.querySelector('[data-passport-section="transition"]').checked=true;
  dom.window.document.querySelector('[data-passport-section="firstNight"]').checked=true;
  dom.window.document.querySelector('[data-passport-section="appointment"]').checked=true;
  dom.window.document.querySelector("#passportConsent").checked=true;
  dom.window.document.querySelector("#recoveryPassportForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));

  const preview = dom.window.document.querySelector("#recoveryPassportPreview").textContent;
  assert.match(preview,/15 Safe Street/);
  assert.match(preview,/Recovery worker Tuesday at 10:00/);
  assert.doesNotMatch(preview,/Do not show this private history/);
  assert.equal(dom.window.document.querySelector('[data-passport-section="privateNotes"]'),null);

  dom.window.document.querySelector("#passportConsent").checked=false;
  dom.window.document.querySelector("#printRecoveryPassport").click();
  assert.equal(printed.length,0);
  assert.match(dom.window.document.querySelector("#recoveryPassportPreview").textContent,/consent/i);

  dom.window.document.querySelector("#passportConsent").checked=true;
  dom.window.document.querySelector('[data-passport-section="appointment"]').checked=false;
  dom.window.document.querySelector("#downloadRecoveryPassport").click();
  assert.equal(downloaded.length,1);
  assert.equal("keyAppointment" in downloaded[0].sections,false);
  assert.equal(dom.window.document.querySelector("#passportConsent").checked,false);

  dom.window.document.querySelector("#passportConsent").checked=true;
  dom.window.document.querySelector("#printRecoveryPassport").click();
  assert.equal(printed.length,1);
  assert.equal(dom.window.document.querySelector("#passportConsent").checked,false);
});
