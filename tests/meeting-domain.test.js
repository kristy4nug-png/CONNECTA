const test = require("node:test");
const assert = require("node:assert/strict");

const Meetings = require("../meeting-domain.js");

test("legacy meeting migration preserves every saved field", () => {
  const legacy = [{
    id: "legacy-1",
    fellowship: "NA",
    name: "Monday Hope",
    date: "2026-08-03",
    time: "19:30",
    format: "Telephone",
    place: "0300 000 0000",
    notes: "Ask for Chris"
  }];

  const [meeting] = Meetings.migrateLegacyMeetings(legacy, () => "new-id");

  assert.equal(meeting.id, "legacy-1");
  assert.equal(meeting.fellowship, "NA");
  assert.equal(meeting.name, "Monday Hope");
  assert.equal(meeting.recurrence, "oneOff");
  assert.equal(meeting.date, "2026-08-03");
  assert.equal(meeting.time, "19:30");
  assert.equal(meeting.attendanceMode, "telephone");
  assert.equal(meeting.location, "0300 000 0000");
  assert.equal(meeting.notes, "Ask for Chris");
  assert.equal(meeting.status, "active");
});

test("save, edit, archive and delete operate through Personal Meeting records", () => {
  const created = Meetings.saveMeeting([], {
    id: "m-1",
    fellowship: "AA",
    name: "New Beginnings"
  }, "2026-08-03T09:00:00.000Z");
  assert.equal(created.length, 1);
  assert.equal(created[0].reminder, "oneHour");

  const edited = Meetings.saveMeeting(created, {
    ...created[0],
    name: "New Beginnings Updated"
  }, "2026-08-03T10:00:00.000Z");
  assert.equal(edited.length, 1);
  assert.equal(edited[0].name, "New Beginnings Updated");

  const archived = Meetings.archiveMeeting(edited, "m-1", "2026-08-03T11:00:00.000Z");
  assert.equal(archived[0].status, "archived");
  assert.equal(archived[0].archivedAt, "2026-08-03T11:00:00.000Z");

  assert.deepEqual(Meetings.deleteArchivedMeeting(archived, "m-1"), []);
  assert.throws(() => Meetings.deleteArchivedMeeting(created, "m-1"), /archived/i);
});

test("weekly and one-off meetings calculate their next occurrence", () => {
  const now = new Date(2026,7,3,10,0); // Monday at 10:00 in the device's local time
  const weekly = {
    recurrence: "weekly",
    dayOfWeek: 1,
    time: "18:30",
    status: "active"
  };
  const oneOff = {
    recurrence: "oneOff",
    date: "2026-08-04",
    time: "09:15",
    status: "active"
  };

  assert.equal(
    Meetings.nextOccurrence(weekly, now).getTime(),
    new Date(2026,7,3,18,30).getTime()
  );
  assert.equal(
    Meetings.nextOccurrence(oneOff, now).getTime(),
    new Date(2026,7,4,9,15).getTime()
  );
  assert.equal(
    Meetings.reminderTime(Meetings.nextOccurrence(weekly, now), "oneHour").getTime(),
    new Date(2026,7,3,17,30).getTime()
  );
});

test("import merge detects recommended duplicates and honours decisions", () => {
  const existing = [{
    id: "existing",
    fellowship: "ACA",
    name: "Gentle Way",
    recurrence: "weekly",
    dayOfWeek: 3,
    time: "19:00",
    status: "active",
    notes: "Existing"
  }];
  const incomingPersonalMeetings = [{
    id: "incoming",
    fellowship: "aca",
    name: " Gentle Way ",
    recurrence: "weekly",
    dayOfWeek: 3,
    time: "19:00",
    status: "active",
    notes: "Imported"
  }];

  const pending = Meetings.mergePersonalMeetingImport(existing, incomingPersonalMeetings);
  assert.equal(pending.conflicts.length, 1);
  assert.equal(pending.meetings[0].notes, "Existing");

  const key = pending.conflicts[0].key;
  const resolved = Meetings.mergePersonalMeetingImport(existing, incomingPersonalMeetings, {[key]: "useIncoming"});
  assert.equal(resolved.conflicts.length, 0);
  assert.equal(resolved.meetings.length, 1);
  assert.equal(resolved.meetings[0].id, "existing");
  assert.equal(resolved.meetings[0].notes, "Imported");
});

test("official finder availability never invents cached fellowship data", () => {
  const online = Meetings.officialFinderState(true);
  assert.equal(online.available, true);

  const offline = Meetings.officialFinderState(false);
  assert.equal(offline.available, false);
  assert.match(offline.message, /internet connection/i);
  assert.equal("cachedPublishedMeetings" in offline, false);
});

test("Personal Meeting import validation rejects impossible schedule values", () => {
  assert.throws(()=>Meetings.normalizeMeeting({fellowship:"AA",name:"Bad time",time:"99:99"}),/time/i);
  assert.throws(()=>Meetings.normalizeMeeting({fellowship:"NA",name:"Bad day",recurrence:"weekly",dayOfWeek:99}),/day/i);
  assert.throws(()=>Meetings.normalizeMeeting({fellowship:"ACA",name:"Bad date",date:"2026-02-30"}),/date/i);
});

test("only well-formed HTTP and HTTPS addresses are considered clickable", () => {
  assert.equal(Meetings.isValidHttpUrl("https://adultchildren.org/meeting-search/"),true);
  assert.equal(Meetings.isValidHttpUrl("http://example.org/path"),true);
  assert.equal(Meetings.isValidHttpUrl("https://%"),false);
  assert.equal(Meetings.isValidHttpUrl("javascript:alert(1)"),false);
  assert.equal(Meetings.isValidHttpUrl("meeting code only"),false);
});

test("import cannot restore an archived Personal Meeting", () => {
  const archived = [{
    id:"archived-1",fellowship:"AA",name:"One Way Archive",recurrence:"weekly",dayOfWeek:1,time:"18:00",
    status:"archived",archivedAt:"2026-08-01T10:00:00.000Z"
  }];
  const incomingPersonalMeetings = [{
    id:"incoming-1",fellowship:"AA",name:"One Way Archive",recurrence:"weekly",dayOfWeek:1,time:"18:00",status:"active"
  }];
  const key = Meetings.duplicateKey(archived[0]);
  const result = Meetings.mergePersonalMeetingImport(archived,incomingPersonalMeetings,{[key]:"useIncoming"});
  assert.equal(result.meetings[0].status,"archived");
  assert.equal(result.meetings[0].archivedAt,"2026-08-01T10:00:00.000Z");

  const keepBoth = Meetings.mergePersonalMeetingImport(archived,incomingPersonalMeetings,{[key]:"keepBoth"});
  assert.equal(keepBoth.meetings.length,2);
  assert.ok(keepBoth.meetings.every(meeting=>meeting.status==="archived"));
});
