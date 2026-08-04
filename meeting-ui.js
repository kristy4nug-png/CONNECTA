(function(root, factory){
  const domain = typeof module === "object" && module.exports
    ? require("./meeting-domain.js")
    : root.ConnectaMeetings;
  const api = factory(domain);
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.ConnectaMeetingUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(Meetings){
  "use strict";

  const MEETING_KEY = "personalMeetings";
  const DRAFT_KEY = "meetingDraft";
  const MIGRATION_KEY = "meetingMigrationVersion";
  const clean = value => String(value ?? "").trim();
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[character]);
  const localDateKey = date => [
    date.getFullYear(),
    String(date.getMonth()+1).padStart(2,"0"),
    String(date.getDate()).padStart(2,"0")
  ].join("-");
  const formatDateTime = date => date
    ? date.toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})
    : "Date and time not set";
  const attendanceLabel = value => ({inPerson:"In person",online:"Online",telephone:"Telephone"})[value] || "In person";
  const reminderLabel = value => ({off:"Off",oneHour:"1 hour before",morningOf:"Morning of meeting",oneDay:"1 day before"})[value] || "1 hour before";
  const weekdayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function storedScheduleLabel(meeting){
    const time = clean(meeting.time);
    if(meeting.recurrence === "weekly" && Number.isInteger(Number(meeting.dayOfWeek))){
      return `Weekly ${weekdayNames[Number(meeting.dayOfWeek)]}${time ? ` at ${time}` : ""}`;
    }
    if(meeting.date){
      const date = new Date(`${meeting.date}T12:00:00`);
      if(!Number.isNaN(date.getTime())) return `${date.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}${time ? ` at ${time}` : ""}`;
    }
    return time ? `Time: ${time}` : "Date and time not set";
  }

  function createMeetingUI(options){
    const document = options.document;
    const store = options.store;
    const now = options.now || (() => new Date());
    const confirmAction = options.confirm || (message => globalThis.confirm(message));
    const isOnline = options.isOnline || (() => globalThis.navigator?.onLine !== false);
    const notify = options.notify || (() => {});
    let selectedMeetingId = null;
    let pendingImport = null;

    const byId = id => document.getElementById(id);
    const all = selector => [...document.querySelectorAll(selector)];
    const getMeetings = () => store.get(MEETING_KEY,[]);
    const setMeetings = meetings => store.set(MEETING_KEY,meetings);

    function migrate(){
      if(store.get(MIGRATION_KEY,0) >= 2) return;
      const existing = store.get(MEETING_KEY,null);
      if(!Array.isArray(existing)){
        const legacy = store.get("meetings",[]);
        setMeetings(Meetings.migrateLegacyMeetings(legacy));
      }
      store.set(MIGRATION_KEY,2);
      store.remove?.("meetings");
    }

    function selectTab(name){
      all("[data-meeting-tab]").forEach(button => {
        const selected = button.dataset.meetingTab === name;
        button.setAttribute("aria-selected",String(selected));
        button.classList.toggle("active",selected);
      });
      all("[data-meeting-panel]").forEach(panel => {
        panel.hidden = panel.dataset.meetingPanel !== name;
      });
    }

    function recurrenceForForm(){
      const weekly = byId("meetingRecurrence").value === "weekly";
      byId("meetingDayWrap").hidden = !weekly;
      byId("meetingDateWrap").hidden = weekly;
    }

    function formValues(){
      return {
        id:clean(byId("meetingId").value),
        fellowship:byId("fellowship").value,
        name:byId("meetingName").value,
        recurrence:byId("meetingRecurrence").value,
        dayOfWeek:Number(byId("meetingDay").value),
        date:byId("meetingDate").value,
        time:byId("meetingTime").value,
        attendanceMode:byId("meetingFormat").value,
        location:byId("meetingPlace").value,
        postcode:byId("meetingPostcode").value,
        onlineLink:byId("meetingOnlineLink").value,
        notes:byId("meetingNotes").value,
        accessibility:byId("meetingAccessibility").value,
        openness:byId("meetingOpenness").value,
        reminder:byId("meetingReminder").value
      };
    }

    function fillForm(meeting={}){
      byId("meetingId").value = meeting.id || "";
      const fellowship = meeting.fellowship || "AA";
      if(![...byId("fellowship").options].some(option=>option.value===fellowship)){
        const legacyFellowship = document.createElement("option");
        legacyFellowship.value = fellowship;
        legacyFellowship.textContent = `${fellowship} (saved legacy fellowship)`;
        byId("fellowship").appendChild(legacyFellowship);
      }
      byId("fellowship").value = fellowship;
      byId("meetingName").value = meeting.name || "";
      byId("meetingRecurrence").value = meeting.recurrence || "weekly";
      byId("meetingDay").value = String(meeting.dayOfWeek ?? now().getDay());
      byId("meetingDate").value = meeting.date || localDateKey(now());
      byId("meetingTime").value = meeting.time || "";
      const format = meeting.attendanceMode || "inPerson";
      if(![...byId("meetingFormat").options].some(option=>option.value===format)){
        const legacyOption = document.createElement("option");
        legacyOption.value = format;
        legacyOption.textContent = `${attendanceLabel(format)} (saved legacy format)`;
        byId("meetingFormat").appendChild(legacyOption);
      }
      byId("meetingFormat").value = format;
      byId("meetingPlace").value = meeting.location || "";
      byId("meetingPostcode").value = meeting.postcode || "";
      byId("meetingOnlineLink").value = meeting.onlineLink || "";
      byId("meetingNotes").value = meeting.notes || "";
      byId("meetingAccessibility").value = meeting.accessibility || "";
      byId("meetingOpenness").value = meeting.openness || "unknown";
      byId("meetingReminder").value = meeting.reminder || "oneHour";
      recurrenceForForm();
    }

    function openForm(meeting){
      fillForm(meeting || {});
      byId("meetingDialog").showModal();
    }

    function saveDraft(){
      const draft = formValues();
      if(Object.values(draft).some(value => clean(value))) store.set(DRAFT_KEY,draft);
      byId("continueMeetingDraft").hidden = !store.get(DRAFT_KEY,null);
    }

    function meetingCard(meeting, archived=false){
      const occurrence = Meetings.nextOccurrence(meeting,now());
      const schedule = archived ? storedScheduleLabel(meeting) : occurrence ? formatDateTime(occurrence) : "Date and time not set";
      const cls = ["aa","na","aca"].includes(meeting.fellowship.toLowerCase()) ? meeting.fellowship.toLowerCase() : "other";
      const action = archived
        ? `<div class="action-row"><button class="ghost" data-view-archived="${escapeHtml(meeting.id)}">View details</button><button class="danger-btn" data-delete-archived="${escapeHtml(meeting.id)}">Delete permanently</button></div>`
        : `<button class="ghost" data-meeting-id="${escapeHtml(meeting.id)}">Open details</button>`;
      return `<article class="meeting">
        <div class="meeting-top"><div><span class="pill ${cls}">${escapeHtml(meeting.fellowship)}</span><h4>${escapeHtml(meeting.name)}</h4></div>${action}</div>
        <p><strong>${escapeHtml(schedule)}</strong></p>
        <p class="muted small">${escapeHtml(attendanceLabel(meeting.attendanceMode))} · Reminder: ${escapeHtml(reminderLabel(meeting.reminder))}</p>
      </article>`;
    }

    function renderLists(){
      const meetings = getMeetings();
      const active = meetings.filter(meeting => meeting.status !== "archived")
        .sort((a,b) => (Meetings.nextOccurrence(a,now())?.getTime() ?? Number.MAX_SAFE_INTEGER) - (Meetings.nextOccurrence(b,now())?.getTime() ?? Number.MAX_SAFE_INTEGER));
      const archived = meetings.filter(meeting => meeting.status === "archived");
      byId("meetingList").innerHTML = active.length
        ? active.map(meeting => meetingCard(meeting)).join("")
        : '<div class="empty">No Personal Meetings saved yet. Use an official finder, then add the meeting you want to remember.</div>';
      byId("archivedMeetingList").innerHTML = archived.length
        ? archived.map(meeting => meetingCard(meeting,true)).join("")
        : '<div class="empty">No archived meetings.</div>';
    }

    function renderWeek(){
      const strip = byId("weekStrip");
      strip.innerHTML = "";
      const meetings = getMeetings().filter(meeting => meeting.status !== "archived");
      for(let offset=0;offset<7;offset++){
        const date = new Date(now());
        date.setHours(0,0,0,0);
        date.setDate(date.getDate()+offset);
        const key = localDateKey(date);
        const hasMeeting = meetings.some(meeting => localDateKey(Meetings.nextOccurrence(meeting,now()) || new Date(0)) === key);
        const element = document.createElement("div");
        element.className = `day${offset===0 ? " today" : ""}${hasMeeting ? " has-meeting" : ""}`;
        element.innerHTML = `<strong>${date.toLocaleDateString("en-GB",{weekday:"short"})}</strong><br>${date.getDate()}`;
        strip.appendChild(element);
      }
    }

    function renderReminders(){
      const active = getMeetings().filter(meeting => meeting.status !== "archived" && meeting.reminder !== "off");
      const items = active.map(meeting => {
        const occurrence = Meetings.nextOccurrence(meeting,now());
        return {meeting,occurrence,reminderAt:Meetings.reminderTime(occurrence,meeting.reminder)};
      }).filter(item => item.occurrence).sort((a,b)=>a.occurrence-b.occurrence);
      byId("reminderList").innerHTML = items.length ? items.map(item => {
        const occurrenceId = item.occurrence.toISOString();
        const dismissed = item.meeting.reminderDismissedFor === occurrenceId;
        const snoozed = item.meeting.reminderSnoozedUntil && new Date(item.meeting.reminderSnoozedUntil) > now();
        const due = item.reminderAt && item.reminderAt <= now() && !dismissed && !snoozed;
        return `<article class="meeting${due ? " reminder-due" : ""}"><span class="pill ${item.meeting.fellowship.toLowerCase()}">${escapeHtml(item.meeting.fellowship)}</span>
          <h4>${escapeHtml(item.meeting.name)}</h4><p><strong>${escapeHtml(formatDateTime(item.occurrence))}</strong></p>
          <p class="muted small">${dismissed ? "Reminder dismissed" : snoozed ? "Snoozed" : due ? "Reminder due now" : `Reminder: ${escapeHtml(reminderLabel(item.meeting.reminder))}`}</p>
          <div class="action-row"><button class="secondary" data-open-reminder="${escapeHtml(item.meeting.id)}">Open details</button>
          <button class="ghost" data-snooze-reminder="${escapeHtml(item.meeting.id)}">Snooze 1 hour</button>
          <button class="ghost" data-dismiss-reminder="${escapeHtml(item.meeting.id)}">Dismiss</button></div></article>`;
      }).join("") : '<div class="empty">No upcoming meeting reminders.</div>';
    }

    function renderDraft(){
      byId("continueMeetingDraft").hidden = !store.get(DRAFT_KEY,null);
    }

    function renderConnection(){
      const state = Meetings.officialFinderState(isOnline());
      byId("meetingOffline").hidden = state.available;
      if(!state.available) byId("meetingOffline").querySelector?.("p") && (byId("meetingOffline").querySelector("p").textContent = state.message);
    }

    function render(){
      renderLists();
      renderWeek();
      renderReminders();
      renderDraft();
      renderConnection();
    }

    function showDetails(id){
      const meeting = getMeetings().find(item => item.id === id);
      if(!meeting) return;
      selectedMeetingId = id;
      const occurrence = Meetings.nextOccurrence(meeting,now());
      const schedule = meeting.status === "archived" ? storedScheduleLabel(meeting) : formatDateTime(occurrence);
      const lines = [
        `<span class="pill ${escapeHtml(meeting.fellowship.toLowerCase())}">${escapeHtml(meeting.fellowship)}</span>`,
        `<h2>${escapeHtml(meeting.name)}</h2>`,
        `<p><strong>${escapeHtml(schedule)}</strong> · ${escapeHtml(attendanceLabel(meeting.attendanceMode))}</p>`,
        meeting.location ? `<p><strong>Venue:</strong> ${escapeHtml(meeting.location)}</p>` : "",
        meeting.postcode ? `<p><strong>Postcode:</strong> ${escapeHtml(meeting.postcode)}</p>` : "",
        meeting.onlineLink ? `<p><strong>Online:</strong> ${Meetings.isValidHttpUrl(meeting.onlineLink) ? `<a href="${escapeHtml(meeting.onlineLink)}" target="_blank" rel="noopener">Open meeting link</a>` : escapeHtml(meeting.onlineLink)}</p>` : "",
        meeting.accessibility ? `<p><strong>Accessibility:</strong> ${escapeHtml(meeting.accessibility)} <span class="muted small">Please verify with the venue.</span></p>` : "",
        `<p><strong>Attendance:</strong> ${escapeHtml(meeting.openness || "unknown")}</p>`,
        meeting.notes ? `<p><strong>Private note:</strong> ${escapeHtml(meeting.notes)}</p>` : ""
      ];
      byId("meetingDetailsBody").innerHTML = lines.join("");
      byId("editMeeting").hidden = meeting.status === "archived";
      byId("archiveMeeting").hidden = meeting.status === "archived";
      byId("meetingDetailsDialog").showModal();
    }

    function updateReminder(id, changes){
      const meetings = getMeetings();
      const index = meetings.findIndex(item => item.id === id);
      if(index === -1) return;
      meetings[index] = {...meetings[index],...changes,updatedAt:now().toISOString()};
      setMeetings(meetings);
      renderReminders();
    }

    function personalMeetingsFromExport(payload){
      if(!payload || typeof payload !== "object") throw new Error("This is not a CONNECTA export file");
      const storage = payload.storage || payload;
      const decode = value => typeof value === "string" ? JSON.parse(value) : value;
      const personal = decode(storage.personalMeetings);
      if(Array.isArray(personal)) return personal;
      const legacy = decode(storage.meetings);
      if(Array.isArray(legacy)) return Meetings.migrateLegacyMeetings(legacy);
      throw new Error("No meeting information was found in this export");
    }

    function prepareImport(incomingPersonalMeetings){
      const preview = Meetings.mergePersonalMeetingImport(getMeetings(),incomingPersonalMeetings);
      pendingImport = {incomingPersonalMeetings,preview};
      const box = byId("meetingImportConflicts");
      box.innerHTML = `<p><strong>${incomingPersonalMeetings.length}</strong> meeting record${incomingPersonalMeetings.length===1?"":"s"} ready to merge.</p>` + preview.conflicts.map(conflict => `
        <label>${escapeHtml(conflict.existing.fellowship)} · ${escapeHtml(conflict.existing.name)}
          <select data-import-key="${escapeHtml(conflict.key)}"><option value="keepExisting">Keep existing</option><option value="useIncoming">Use imported</option><option value="keepBoth">Keep both</option></select>
        </label>`).join("");
      byId("meetingImportDialog").showModal();
    }

    function bind(){
      all("[data-meeting-tab]").forEach(button => button.addEventListener("click",()=>selectTab(button.dataset.meetingTab)));
      byId("openMyMeetings").addEventListener("click",()=>selectTab("mine"));
      byId("retryMeetingConnection").addEventListener("click",renderConnection);
      all("[data-official-finder]").forEach(link => link.addEventListener("click",event => {
        if(isOnline()) return;
        event.preventDefault();
        renderConnection();
        byId("meetingOffline").hidden = false;
      }));
      byId("openMeetingForm").addEventListener("click",()=>openForm());
      byId("continueMeetingDraft").addEventListener("click",()=>openForm(store.get(DRAFT_KEY,{})));
      byId("meetingRecurrence").addEventListener("change",()=>{recurrenceForForm();saveDraft()});
      byId("meetingForm").addEventListener("input",saveDraft);
      byId("meetingForm").addEventListener("submit",event => {
        event.preventDefault();
        try{
          setMeetings(Meetings.saveMeeting(getMeetings(),formValues(),now().toISOString()));
          store.remove?.(DRAFT_KEY);
          byId("meetingDialog").close();
          render();
          notify("Personal Meeting saved");
        }catch(error){notify(error.message)}
      });
      byId("meetingList").addEventListener("click",event => {
        const button = event.target.closest("[data-meeting-id]");
        if(button) showDetails(button.dataset.meetingId);
      });
      byId("editMeeting").addEventListener("click",()=>{
        const meeting = getMeetings().find(item=>item.id===selectedMeetingId);
        if(!meeting) return;
        byId("meetingDetailsDialog").close();
        openForm(meeting);
      });
      byId("archiveMeeting").addEventListener("click",()=>{
        if(!selectedMeetingId) return;
        setMeetings(Meetings.archiveMeeting(getMeetings(),selectedMeetingId,now().toISOString()));
        byId("meetingDetailsDialog").close();
        render();
        notify("Meeting archived");
      });
      byId("archivedMeetingList").addEventListener("click",event => {
        const view = event.target.closest("[data-view-archived]");
        const button = event.target.closest("[data-delete-archived]");
        if(view) showDetails(view.dataset.viewArchived);
        if(!button || !confirmAction("Permanently delete this archived meeting? This cannot be undone.")) return;
        setMeetings(Meetings.deleteArchivedMeeting(getMeetings(),button.dataset.deleteArchived));
        render();
      });
      byId("reminderList").addEventListener("click",event => {
        const open = event.target.closest("[data-open-reminder]");
        const snooze = event.target.closest("[data-snooze-reminder]");
        const dismiss = event.target.closest("[data-dismiss-reminder]");
        if(open) showDetails(open.dataset.openReminder);
        if(snooze){
          const until = new Date(now()); until.setHours(until.getHours()+1);
          updateReminder(snooze.dataset.snoozeReminder,{reminderSnoozedUntil:until.toISOString()});
        }
        if(dismiss){
          const meeting = getMeetings().find(item=>item.id===dismiss.dataset.dismissReminder);
          const occurrence = Meetings.nextOccurrence(meeting,now());
          updateReminder(dismiss.dataset.dismissReminder,{reminderDismissedFor:occurrence?.toISOString() || null});
        }
      });
      byId("importMeetings").addEventListener("click",async()=>{
        const file = byId("meetingImportFile").files?.[0];
        if(!file){byId("meetingImportStatus").textContent="Choose a CONNECTA export file first.";return}
        try{
          prepareImport(personalMeetingsFromExport(JSON.parse(await file.text())));
          byId("meetingImportStatus").textContent="Import checked. Review before applying.";
        }catch(error){byId("meetingImportStatus").textContent=error.message}
      });
      byId("applyMeetingImport").addEventListener("click",()=>{
        if(!pendingImport) return;
        const decisions = {};
        all("[data-import-key]").forEach(select => decisions[select.dataset.importKey]=select.value);
        const result = Meetings.mergePersonalMeetingImport(getMeetings(),pendingImport.incomingPersonalMeetings,decisions);
        if(result.conflicts.length){byId("meetingImportStatus").textContent="Resolve every duplicate before importing.";return}
        setMeetings(result.meetings);
        pendingImport = null;
        byId("meetingImportDialog").close();
        render();
        byId("meetingImportStatus").textContent="Meeting information imported successfully.";
      });
      byId("clearMeetingData").addEventListener("click",()=>{
        if(!confirmAction("Delete all Personal Meetings, archives, meeting reminders and meeting drafts from this device?")) return;
        [MEETING_KEY,DRAFT_KEY,MIGRATION_KEY,"meetings"].forEach(key=>store.remove?.(key));
        store.set(MIGRATION_KEY,2);
        setMeetings([]);
        render();
        notify("All meeting information deleted");
      });
    }

    function init(){
      migrate();
      bind();
      selectTab("find");
      recurrenceForForm();
      render();
      return api;
    }

    const api = {init,render,selectTab,showDetails};
    return api;
  }

  return {createMeetingUI};
});
