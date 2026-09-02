(function(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.ConnectaMeetings = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(){
  "use strict";

  const clean = value => String(value ?? "").trim();
  const makeId = () => globalThis.crypto?.randomUUID?.() || `meeting-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const allowed = Object.freeze({
    recurrence:new Set(["weekly","oneOff"]),
    attendanceMode:new Set(["inPerson","online","telephone"]),
    openness:new Set(["open","closed","unknown"]),
    reminder:new Set(["off","oneHour","morningOf","oneDay"]),
    status:new Set(["active","archived"])
  });

  function validDate(value){
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if(!match) return false;
    const date = new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    return date.getFullYear()===Number(match[1]) && date.getMonth()===Number(match[2])-1 && date.getDate()===Number(match[3]);
  }

  function isValidHttpUrl(value){
    try{
      const url = new URL(clean(value));
      return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
    }catch{return false}
  }

  function legacyAttendanceMode(format){
    const value = clean(format).toLowerCase();
    if(value === "in person") return "inPerson";
    if(value === "online") return "online";
    if(value === "telephone") return "telephone";
    return value || "inPerson";
  }

  function migrateLegacyMeetings(legacyMeetings, idFactory = makeId){
    if(!Array.isArray(legacyMeetings)) return [];
    return legacyMeetings.map(legacy => ({
      id: clean(legacy.id) || idFactory(),
      schemaVersion: 2,
      fellowship: clean(legacy.fellowship) || "Other",
      name: clean(legacy.name),
      recurrence: "oneOff",
      date: clean(legacy.date),
      dayOfWeek: null,
      time: clean(legacy.time),
      attendanceMode: legacyAttendanceMode(legacy.format),
      location: clean(legacy.place),
      postcode: "",
      onlineLink: /^https?:\/\//i.test(clean(legacy.place)) ? clean(legacy.place) : "",
      notes: clean(legacy.notes),
      accessibility: "",
      openness: "unknown",
      reminder: "oneHour",
      status: "active",
      archivedAt: null,
      createdAt: clean(legacy.createdAt) || null,
      updatedAt: clean(legacy.updatedAt) || null
    }));
  }

  function normalizeMeeting(input, nowIso = new Date().toISOString()){
    const fellowship = clean(input?.fellowship);
    const name = clean(input?.name);
    if(!fellowship || !name) throw new Error("Fellowship and Meeting Name are required");
    const recurrence = clean(input.recurrence) || "oneOff";
    const attendanceMode = clean(input.attendanceMode) || "inPerson";
    const openness = clean(input.openness) || "unknown";
    const reminder = clean(input.reminder) || "oneHour";
    const status = clean(input.status) || "active";
    const date = clean(input.date);
    const time = clean(input.time);
    const rawDay = clean(input.dayOfWeek);
    const dayOfWeek = rawDay === "" ? null : Number(rawDay);
    if(!allowed.recurrence.has(recurrence)) throw new Error("Meeting recurrence is invalid");
    if(!allowed.attendanceMode.has(attendanceMode)) throw new Error("Meeting attendance mode is invalid");
    if(!allowed.openness.has(openness)) throw new Error("Meeting openness is invalid");
    if(!allowed.reminder.has(reminder)) throw new Error("Meeting reminder is invalid");
    if(!allowed.status.has(status)) throw new Error("Meeting status is invalid");
    if(date && !validDate(date)) throw new Error("Meeting date is invalid");
    if(time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Meeting time is invalid");
    if(dayOfWeek !== null && (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)) throw new Error("Meeting day is invalid");
    return {
      id: clean(input.id) || makeId(),
      schemaVersion: 2,
      fellowship,
      name,
      recurrence,
      date,
      dayOfWeek,
      time,
      attendanceMode,
      location: clean(input.location),
      postcode: clean(input.postcode),
      onlineLink: clean(input.onlineLink),
      notes: clean(input.notes),
      accessibility: clean(input.accessibility),
      openness,
      reminder,
      status,
      archivedAt: input.archivedAt || null,
      reminderSnoozedUntil: input.reminderSnoozedUntil || null,
      reminderDismissedFor: input.reminderDismissedFor || null,
      createdAt: input.createdAt || nowIso,
      updatedAt: nowIso
    };
  }

  function saveMeeting(meetings, input, nowIso = new Date().toISOString()){
    const result = Array.isArray(meetings) ? meetings.map(item => ({...item})) : [];
    const meeting = normalizeMeeting(input, nowIso);
    const index = result.findIndex(item => item.id === meeting.id);
    if(index === -1) result.push(meeting);
    else result[index] = {...meeting, createdAt: result[index].createdAt || meeting.createdAt};
    return result;
  }

  function archiveMeeting(meetings, id, nowIso = new Date().toISOString()){
    let found = false;
    const result = meetings.map(meeting => {
      if(meeting.id !== id) return {...meeting};
      found = true;
      return {...meeting, status:"archived", archivedAt:nowIso, updatedAt:nowIso};
    });
    if(!found) throw new Error("Personal Meeting was not found");
    return result;
  }

  function deleteArchivedMeeting(meetings, id){
    const target = meetings.find(meeting => meeting.id === id);
    if(!target) return meetings.map(item => ({...item}));
    if(target.status !== "archived") throw new Error("Only an archived meeting can be permanently deleted");
    return meetings.filter(meeting => meeting.id !== id).map(item => ({...item}));
  }

  function localDateTime(dateValue, timeValue){
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean(dateValue));
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(clean(timeValue));
    if(!dateMatch || !timeMatch) return null;
    return new Date(
      Number(dateMatch[1]), Number(dateMatch[2])-1, Number(dateMatch[3]),
      Number(timeMatch[1]), Number(timeMatch[2]), 0, 0
    );
  }

  function nextOccurrence(meeting, now = new Date()){
    if(!meeting || meeting.status === "archived" || !clean(meeting.time)) return null;
    if(meeting.recurrence !== "weekly"){
      const occurrence = localDateTime(meeting.date, meeting.time);
      return occurrence && occurrence >= now ? occurrence : null;
    }
    const day = Number(meeting.dayOfWeek);
    if(!Number.isInteger(day) || day < 0 || day > 6) return null;
    const [hours, minutes] = clean(meeting.time).split(":").map(Number);
    const occurrence = new Date(now);
    occurrence.setHours(hours, minutes, 0, 0);
    occurrence.setDate(now.getDate() + ((day - now.getDay() + 7) % 7));
    if(occurrence < now) occurrence.setDate(occurrence.getDate() + 7);
    return occurrence;
  }

  function reminderTime(occurrence, reminder){
    if(!(occurrence instanceof Date) || Number.isNaN(occurrence.getTime()) || reminder === "off") return null;
    const result = new Date(occurrence);
    if(reminder === "oneHour") result.setHours(result.getHours()-1);
    else if(reminder === "oneDay") result.setDate(result.getDate()-1);
    else if(reminder === "morningOf"){
      const hour = occurrence.getHours() <= 9 ? Math.max(0,occurrence.getHours()-1) : 9;
      result.setHours(hour,0,0,0);
    }
    return result;
  }

  function duplicateKey(meeting){
    const fellowship = clean(meeting?.fellowship).toLowerCase();
    const name = clean(meeting?.name).replace(/\s+/g," ").toLowerCase();
    const schedule = meeting?.recurrence === "weekly"
      ? `weekly:${Number(meeting.dayOfWeek)}`
      : `oneOff:${clean(meeting?.date)}`;
    return [fellowship,name,schedule,clean(meeting?.time)].join("|");
  }

  function mergePersonalMeetingImport(existingMeetings, incomingPersonalMeetings, decisions = {}){
    const meetings = Array.isArray(existingMeetings) ? existingMeetings.map(item => ({...item})) : [];
    const conflicts = [];
    for(const incomingMeeting of Array.isArray(incomingPersonalMeetings) ? incomingPersonalMeetings : []){
      const key = duplicateKey(incomingMeeting);
      const index = meetings.findIndex(current => duplicateKey(current) === key);
      if(index === -1){
        meetings.push(normalizeMeeting(incomingMeeting));
        continue;
      }
      const decision = decisions[key];
      if(!decision){
        conflicts.push({key, existing:{...meetings[index]}, incoming:{...incomingMeeting}});
      }else if(decision === "useIncoming"){
        const existingMeeting = meetings[index];
        const remainsArchived = existingMeeting.status === "archived";
        meetings[index] = normalizeMeeting({
          ...incomingMeeting,
          id:existingMeeting.id,
          createdAt:existingMeeting.createdAt,
          status:remainsArchived ? "archived" : incomingMeeting.status,
          archivedAt:remainsArchived ? existingMeeting.archivedAt : incomingMeeting.archivedAt
        });
      }else if(decision === "keepBoth"){
        const existingMeeting = meetings[index];
        const remainsArchived = existingMeeting.status === "archived";
        const used = new Set(meetings.map(item => item.id));
        let candidate = clean(incomingMeeting.id) || makeId();
        while(used.has(candidate)) candidate = makeId();
        meetings.push(normalizeMeeting({
          ...incomingMeeting,
          id:candidate,
          status:remainsArchived ? "archived" : incomingMeeting.status,
          archivedAt:remainsArchived ? existingMeeting.archivedAt : incomingMeeting.archivedAt
        }));
      }else if(decision !== "keepExisting"){
        conflicts.push({key, existing:{...meetings[index]}, incoming:{...incomingMeeting}});
      }
    }
    return {meetings, conflicts};
  }

  function officialFinderState(isOnline){
    return {
      available:Boolean(isOnline),
      message:isOnline
        ? "Official fellowship meeting finders open in your normal browser."
        : "The official meeting finder needs an internet connection. Your saved Personal Meetings remain available."
    };
  }

  return {
    migrateLegacyMeetings, normalizeMeeting, saveMeeting, archiveMeeting, deleteArchivedMeeting,
    nextOccurrence, reminderTime, duplicateKey, mergePersonalMeetingImport, officialFinderState, isValidHttpUrl
  };
});
