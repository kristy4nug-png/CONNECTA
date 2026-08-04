const test = require("node:test");
const assert = require("node:assert/strict");
const {JSDOM} = require("jsdom");

const {createMeetingUI} = require("../meeting-ui.js");

function fixture(){
  const dom = new JSDOM(`<!doctype html><body>
    <button data-meeting-tab="find" aria-selected="true">Find</button>
    <button data-meeting-tab="mine" aria-selected="false">Mine</button>
    <button data-meeting-tab="reminders" aria-selected="false">Reminders</button>
    <button data-meeting-tab="archived" aria-selected="false">Archived</button>
    <section data-meeting-panel="find"></section>
    <section data-meeting-panel="mine" hidden></section>
    <section data-meeting-panel="reminders" hidden></section>
    <section data-meeting-panel="archived" hidden></section>
    <div id="meetingOffline" hidden></div>
    <a data-official-finder href="https://example.org">Official</a>
    <button id="openMyMeetings"></button><button id="retryMeetingConnection"></button>
    <button id="openMeetingForm"></button><button id="continueMeetingDraft" hidden></button>
    <div id="weekStrip"></div><div id="meetingList"></div><div id="reminderList"></div><div id="archivedMeetingList"></div>
    <input id="meetingImportFile" type="file"><button id="importMeetings"></button>
    <button id="clearMeetingData"></button><div id="meetingImportStatus"></div>
    <dialog id="meetingDialog"><form id="meetingForm">
      <input id="meetingId"><select id="fellowship"><option>AA</option><option>NA</option><option>ACA</option></select>
      <input id="meetingName"><select id="meetingRecurrence"><option value="weekly">Weekly</option><option value="oneOff">One-off</option></select>
      <div id="meetingDayWrap"><select id="meetingDay"><option value="1">Monday</option></select></div>
      <div id="meetingDateWrap"><input id="meetingDate" type="date"></div>
      <input id="meetingTime" type="time"><select id="meetingFormat"><option value="inPerson">In person</option><option value="online">Online</option></select>
      <input id="meetingPlace"><input id="meetingPostcode"><input id="meetingOnlineLink"><textarea id="meetingNotes"></textarea>
      <textarea id="meetingAccessibility"></textarea><select id="meetingOpenness"><option value="unknown">Unknown</option></select>
      <select id="meetingReminder"><option value="oneHour">One hour</option></select><button type="submit">Save</button>
    </form></dialog>
    <dialog id="meetingDetailsDialog"><div id="meetingDetailsBody"></div><button id="editMeeting"></button><button id="archiveMeeting"></button></dialog>
    <dialog id="meetingImportDialog"><div id="meetingImportConflicts"></div><button id="applyMeetingImport"></button></dialog>
  `,{url:"https://connecta.local/"});
  for(const dialog of dom.window.document.querySelectorAll("dialog")){
    dialog.showModal = function(){this.open=true};
    dialog.close = function(){this.open=false};
  }
  return dom;
}

function memoryStore(seed={}){
  const data = new Map(Object.entries(seed));
  return {
    get:(key,fallback)=>data.has(key) ? structuredClone(data.get(key)) : fallback,
    set:(key,value)=>data.set(key,structuredClone(value)),
    remove:key=>data.delete(key)
  };
}

test("meeting UI migrates legacy data and supports save then archive through user controls", () => {
  const dom = fixture();
  const store = memoryStore({meetings:[{
    id:"old-1",fellowship:"Other",name:"Old Meeting",date:"2026-08-04",time:"18:00",format:"In person",place:"Town Hall",notes:"Keep this"
  }]});
  const ui = createMeetingUI({
    document:dom.window.document,
    store,
    now:()=>new Date("2026-08-03T10:00:00+01:00"),
    confirm:()=>true,
    isOnline:()=>true
  });
  ui.init();

  assert.equal(store.get("personalMeetings",[])[0].notes,"Keep this");
  assert.match(dom.window.document.querySelector("#meetingList").textContent,/Old Meeting/);

  dom.window.document.querySelector("#openMeetingForm").click();
  dom.window.document.querySelector("#fellowship").value="NA";
  dom.window.document.querySelector("#meetingName").value="New Hope";
  dom.window.document.querySelector("#meetingForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
  assert.equal(store.get("personalMeetings",[]).length,2);

  dom.window.document.querySelector('[data-meeting-id="old-1"]').click();
  dom.window.document.querySelector("#editMeeting").click();
  assert.equal(dom.window.document.querySelector("#fellowship").value,"Other");
  dom.window.document.querySelector("#meetingForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
  assert.equal(store.get("personalMeetings",[]).find(item=>item.id==="old-1").fellowship,"Other");
  dom.window.document.querySelector('[data-meeting-id="old-1"]').click();
  dom.window.document.querySelector("#archiveMeeting").click();
  assert.equal(store.get("personalMeetings",[]).find(item=>item.id==="old-1").status,"archived");
  assert.match(dom.window.document.querySelector("#archivedMeetingList").textContent,/Old Meeting/);
  dom.window.document.querySelector('[data-view-archived="old-1"]').click();
  assert.match(dom.window.document.querySelector("#meetingDetailsBody").textContent,/Keep this/);
  assert.doesNotMatch(dom.window.document.querySelector("#meetingDetailsBody").textContent,/Date and time not set/);
  assert.equal(dom.window.document.querySelector("#editMeeting").hidden,true);
  assert.equal(dom.window.document.querySelector("#archiveMeeting").hidden,true);
});
