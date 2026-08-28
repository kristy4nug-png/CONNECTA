const test = require("node:test");
const assert = require("node:assert/strict");

const Bridge = require("../recovery-bridge-domain.js");

test("a transition date creates an ordered plan through the first 72 hours", () => {
  const plan = Bridge.createBridgePlan({
    transitionType:"release",
    transitionAt:"2026-08-10T08:00:00.000Z"
  }, "2026-08-03T09:00:00.000Z");

  assert.equal(plan.transitionType,"release");
  assert.equal(plan.transitionAt,"2026-08-10T08:00:00.000Z");
  assert.deepEqual(
    [...new Set(plan.tasks.map(task=>task.window))],
    ["prepare","first24","hours24to48","hours48to72"]
  );
  assert.ok(plan.tasks.every(task=>task.completedAt===null));
  assert.equal(plan.tasks.at(-1).dueAt,"2026-08-13T08:00:00.000Z");
});

test("task completion preserves the rest of the Recovery Bridge plan", () => {
  const plan = Bridge.createBridgePlan({
    transitionType:"discharge",
    transitionAt:"2026-08-10T08:00:00.000Z"
  }, "2026-08-03T09:00:00.000Z");

  const completed = Bridge.setBridgeTaskCompletion(
    plan,
    "bridge-task-01",
    true,
    "2026-08-09T17:30:00.000Z"
  );

  assert.equal(completed.tasks[0].completedAt,"2026-08-09T17:30:00.000Z");
  assert.equal(completed.tasks[1].completedAt,null);
  assert.equal(completed.transitionAt,"2026-08-10T08:00:00.000Z");
  assert.equal(plan.tasks[0].completedAt,null);
});

test("green, amber and red check-ins give dignified next actions", () => {
  const plan = Bridge.createBridgePlan({transitionAt:"2026-08-10T08:00:00.000Z"});
  const expected = {
    green:{urgent:false,phrase:"one planned task"},
    amber:{urgent:false,phrase:"contact someone safe"},
    red:{urgent:true,phrase:"immediate human support"}
  };

  for(const [status,outcome] of Object.entries(expected)){
    const result = Bridge.recordBridgeCheckIn(plan,status,"2026-08-10T10:00:00.000Z");
    assert.equal(result.guidance.showUrgentSupport,outcome.urgent);
    assert.match(result.guidance.nextAction,new RegExp(outcome.phrase,"i"));
    assert.doesNotMatch(result.guidance.nextAction,/failed|broken|reset/i);
    assert.equal(result.plan.checkIns.at(-1).status,status);
  }
});

test("a Recovery Passport requires consent and never includes private notes", () => {
  const plan = Bridge.createBridgePlan({
    transitionType:"release",
    transitionAt:"2026-08-10T08:00:00.000Z",
    firstNightAddress:"15 Safe Street",
    medicationPlan:"Collect prescription from the community pharmacy",
    keyAppointment:"Recovery worker, 11 August at 10:00",
    transportPlan:"Bus 7 from the gate",
    safeContact:{name:"Alex",phone:"07123 456789"},
    privateNotes:"This must stay only inside Atlas"
  });

  assert.throws(
    ()=>Bridge.buildRecoveryPassport(plan,{consent:false,include:["transition"]}),
    /consent/i
  );

  const passport = Bridge.buildRecoveryPassport(plan,{
    consent:true,
    include:["transition","medication","safeContact","privateNotes"]
  },"2026-08-09T12:00:00.000Z");

  assert.equal(passport.sections.transition.type,"release");
  assert.equal(passport.sections.medicationPlan,"Collect prescription from the community pharmacy");
  assert.deepEqual(passport.sections.safeContact,{name:"Alex",phone:"07123 456789"});
  assert.doesNotMatch(JSON.stringify(passport),/This must stay only inside Atlas|privateNotes/);
  assert.equal("firstNightAddress" in passport.sections,false);
});
