(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  else root.CONNECTAStorage=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SCHEMA_KEY="connectaStorageSchemaV1";
  const SCHEMA_VERSION=1;
  const FIXED_KEYS=new Set([
    "oneTask","readDays","contacts","promises","checklist","textScale",
    "connectaBetaProfileV1","connectaPrivacyLockV1","personalMeetingsV1",
    "recoveryBridgeV1","recoveryCapitalV1","personalAppointmentsV1","connectaSafetyPlanV1"
  ]);
  const PREFIXES=["safety-","journal-","reflection-"];

  function isConnectaKey(key){
    return FIXED_KEYS.has(key)||PREFIXES.some(prefix=>key.startsWith(prefix));
  }
  function keys(storage){
    const result=[];
    for(let index=0;index<Number(storage?.length||0);index++){
      const key=storage.key(index);
      if(key&&isConnectaKey(key)) result.push(key);
    }
    return result.sort();
  }
  function migrate(storage,nowIso=new Date().toISOString()){
    if(!storage) throw new Error("Browser storage is unavailable");
    const existing=storage.getItem(SCHEMA_KEY);
    if(existing){
      try{
        const marker=JSON.parse(existing);
        if(marker.schemaVersion===SCHEMA_VERSION) return {changed:false,marker};
      }catch{ /* replace only CONNECTA's malformed marker */ }
    }
    const marker={schemaVersion:SCHEMA_VERSION,migratedAt:nowIso,legacyKeyCount:keys(storage).length};
    storage.setItem(SCHEMA_KEY,JSON.stringify(marker));
    return {changed:true,marker};
  }
  function exportData(storage,nowIso=new Date().toISOString()){
    const records={};
    keys(storage).forEach(key=>{ records[key]=storage.getItem(key); });
    const marker=storage.getItem(SCHEMA_KEY);
    if(marker) records[SCHEMA_KEY]=marker;
    return {format:"connecta-local-export",formatVersion:1,exportedAt:nowIso,records};
  }
  function validateImport(value){
    if(!value||value.format!=="connecta-local-export"||value.formatVersion!==1||!value.records||Array.isArray(value.records)){
      throw new Error("This is not a valid CONNECTA backup");
    }
    const records={};
    for(const [key,record] of Object.entries(value.records)){
      if(key!==SCHEMA_KEY&&!isConnectaKey(key)) throw new Error("The backup contains an unsupported storage key");
      if(typeof record!=="string") throw new Error("The backup contains an invalid storage value");
      try{ JSON.parse(record); }catch{ throw new Error(`The backup contains invalid data for ${key}`); }
      records[key]=record;
    }
    return records;
  }
  function restore(storage,value){
    const records=validateImport(value);
    const previous=exportData(storage);
    try{
      clear(storage);
      for(const [key,record] of Object.entries(records)) storage.setItem(key,record);
      migrate(storage);
      return {restored:Object.keys(records).length};
    }catch(error){
      clear(storage);
      for(const [key,record] of Object.entries(previous.records)) storage.setItem(key,record);
      throw error;
    }
  }
  function clear(storage){
    keys(storage).forEach(key=>storage.removeItem(key));
    storage.removeItem(SCHEMA_KEY);
  }
  return {SCHEMA_KEY,SCHEMA_VERSION,isConnectaKey,keys,migrate,exportData,validateImport,restore,clear};
});
