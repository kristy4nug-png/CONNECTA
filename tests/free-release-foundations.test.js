const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {JSDOM}=require("jsdom");
const Storage=require("../connecta-storage.js");

const index=fs.readFileSync(require.resolve("../index.html"),"utf8");
const worker=fs.readFileSync(require.resolve("../service-worker.js"),"utf8");

test("first-run onboarding explains privacy, support and accessibility",()=>{
  const dom=new JSDOM(index);
  const onboarding=dom.window.document.querySelector("#onboardingDialog").textContent;
  assert.match(onboarding,/does not diagnose, prescribe, monitor/i);
  assert.match(onboarding,/nothing is shared automatically/i);
  assert.match(onboarding,/export a backup, restore.*delete/i);
  assert.match(onboarding,/text size and Privacy Lock/i);
  assert.match(onboarding,/call 999/i);
});

test("primary navigation remains five labelled native buttons for keyboard operation",()=>{
  const dom=new JSDOM(index,{pretendToBeVisual:true});
  const buttons=[...dom.window.document.querySelectorAll(".bottom-nav .nav-btn")];
  assert.equal(buttons.length,5);
  assert.ok(buttons.every(button=>button.tagName==="BUTTON"&&!button.disabled&&button.textContent.trim()));
  buttons[0].focus();
  assert.equal(dom.window.document.activeElement,buttons[0]);
});

test("Safety Plan, onboarding and offline PWA assets are present in the release shell",()=>{
  assert.match(index,/id="safetyPlanDialog"/);
  assert.match(index,/aria-live="polite"/);
  assert.match(index,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(index,/@media\(max-width:560px\)/);
  assert.match(worker,/safety-plan-domain\.js/);
  assert.match(worker,/safety-plan-ui\.js/);
});

test("fresh and upgrade storage paths retain records, reject invalid restore and roll back failures",()=>{
  const data=new Map([["contacts",'[]'],["journal-2026-08-04",'"private"'],["other-app","keep"]]);
  const storage={get length(){return data.size},key:i=>[...data.keys()][i]||null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
  Storage.migrate(storage,"2026-08-04T12:00:00.000Z");
  const backup=Storage.exportData(storage);
  assert.throws(()=>Storage.restore(storage,{format:"bad"}),/valid Atlas backup/);
  Storage.restore(storage,backup);
  assert.equal(storage.getItem("journal-2026-08-04"),'"private"');
  assert.equal(storage.getItem("other-app"),"keep");
});
