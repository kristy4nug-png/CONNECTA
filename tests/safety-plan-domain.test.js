const test=require("node:test");
const assert=require("node:assert/strict");
const Safety=require("../safety-plan-domain.js");

test("Safety Plan creates and edits private fields without automatic sharing",()=>{
  const plan=Safety.normalise({warningSigns:"Feeling isolated",safePeople:"Alex"},"2026-08-04T10:00:00.000Z");
  assert.equal(plan.warningSigns,"Feeling isolated");
  assert.equal(plan.safePeople,"Alex");
  assert.equal("sharedWith" in plan,false);
  const edited=Safety.normalise({...plan,warningSigns:"Not sleeping"},"2026-08-04T11:00:00.000Z");
  assert.equal(edited.warningSigns,"Not sleeping");
});

test("Safety Plan export requires deliberate consent",()=>{
  const plan=Safety.normalise({helpfulActions:"Call a safe person"});
  assert.throws(()=>Safety.buildExport(plan,false),/confirm/i);
  const exported=Safety.buildExport(plan,true,"2026-08-04T10:00:00.000Z");
  assert.equal(exported.format,"connecta-safety-plan-export");
  assert.equal(exported.plan.helpfulActions,"Call a safe person");
});
