const test=require("node:test");
const assert=require("node:assert/strict");
const Storage=require("../connecta-storage.js");

function memoryStorage(initial={}){
  const data=new Map(Object.entries(initial));
  return {get length(){return data.size},key:index=>[...data.keys()][index]||null,getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),dump:()=>Object.fromEntries(data)};
}

test("migration records the schema without changing legacy recovery records",()=>{
  const storage=memoryStorage({contacts:'[{"name":"Sam"}]',unrelated:'keep'});
  const result=Storage.migrate(storage,"2026-08-04T10:00:00.000Z");
  assert.equal(result.changed,true);
  assert.equal(storage.getItem("contacts"),'[{"name":"Sam"}]');
  assert.equal(storage.getItem("unrelated"),"keep");
  assert.equal(Storage.migrate(storage).changed,false);
});

test("backup exports only Atlas records and restore preserves unrelated origin data",()=>{
  const source=memoryStorage({contacts:'[]','journal-2026-08-04':'"private"',unrelated:'keep'});
  Storage.migrate(source,"2026-08-04T10:00:00.000Z");
  const backup=Storage.exportData(source,"2026-08-04T11:00:00.000Z");
  assert.equal("unrelated" in backup.records,false);
  const target=memoryStorage({unrelated:'keep',contacts:'[{"name":"old"}]'});
  Storage.restore(target,backup);
  assert.equal(target.getItem("unrelated"),"keep");
  assert.equal(target.getItem("journal-2026-08-04"),'"private"');
});

test("invalid backups are rejected before any local recovery record is changed",()=>{
  const storage=memoryStorage({contacts:'[]'});
  assert.throws(()=>Storage.restore(storage,{format:"connecta-local-export",formatVersion:1,records:{contacts:"not json"}}),/invalid data/);
  assert.equal(storage.getItem("contacts"),"[]");
});

test("scoped deletion leaves non-Atlas origin storage untouched",()=>{
  const storage=memoryStorage({contacts:'[]','safety-2026-08-04':'{}',unrelated:'keep'});
  Storage.clear(storage);
  assert.deepEqual(storage.dump(),{unrelated:"keep"});
});

test("v0.4.2 records migrate without loss when v0.4.3 adds Safety Plan storage",()=>{
  const storage=memoryStorage({contacts:'[{"name":"Sam"}]',personalAppointmentsV1:'[]',connectaSafetyPlanV1:'{"warningSigns":"alone"}'});
  Storage.migrate(storage,"2026-08-04T12:00:00.000Z");
  assert.equal(storage.getItem("contacts"),'[{"name":"Sam"}]');
  assert.equal(Storage.exportData(storage).records.connectaSafetyPlanV1,'{"warningSigns":"alone"}');
});
