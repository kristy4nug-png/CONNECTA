(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  else root.CONNECTASafetyPlan=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const FIELDS=Object.freeze(["warningSigns","helpfulActions","safePeople","safePlaces","professionalSupport","reasonsToKeepGoing"]);
  function clean(value){return typeof value==="string"?value.trim():""}
  function normalise(input={},nowIso=new Date().toISOString()){
    const plan={schemaVersion:1,updatedAt:new Date(nowIso).toISOString()};
    if(Number.isNaN(new Date(plan.updatedAt).getTime())) throw new Error("Safety Plan time is invalid");
    FIELDS.forEach(field=>plan[field]=clean(input[field]));
    return plan;
  }
  function hasContent(plan){return FIELDS.some(field=>clean(plan?.[field]))}
  function buildExport(plan,consent,nowIso=new Date().toISOString()){
    if(!consent) throw new Error("Confirm that you want to create a Safety Plan export");
    if(!hasContent(plan)) throw new Error("Add at least one Safety Plan item before exporting");
    const safe=normalise(plan,nowIso);
    return {format:"connecta-safety-plan-export",formatVersion:1,createdAt:safe.updatedAt,plan:Object.fromEntries(FIELDS.map(field=>[field,safe[field]]))};
  }
  return {FIELDS,normalise,hasContent,buildExport};
});
