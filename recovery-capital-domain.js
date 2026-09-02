(function(root,factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.CONNECTARecoveryCapital = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(){
  "use strict";

  const AREAS = Object.freeze([
    "Safety","Housing","Health","Connection","Money","Purpose","Recovery Support"
  ]);

  function clean(value){
    return typeof value === "string" ? value.trim() : "";
  }

  function validIso(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) throw new Error("Review time is invalid");
    return date.toISOString();
  }

  function emptyRatings(rating = 3){
    return Object.fromEntries(AREAS.map(area=>[area,{rating,nextAction:""}]));
  }

  function normaliseAreas(input){
    return Object.fromEntries(AREAS.map(area=>{
      const rating = Number(input?.[area]?.rating);
      if(!Number.isInteger(rating) || rating<1 || rating>5){
        throw new Error(`${area} rating must be between 1 and 5`);
      }
      return [area,{rating,nextAction:clean(input?.[area]?.nextAction)}];
    }));
  }

  function saveReview(history,input,nowIso = new Date().toISOString(),idFactory = ()=>crypto.randomUUID()){
    const previous = Array.isArray(history)
      ? history.map(review=>({...review,areas:Object.fromEntries(AREAS.map(area=>[area,{...review.areas?.[area]}]))}))
      : [];
    previous.push({
      schemaVersion:1,
      id:idFactory(),
      reviewedAt:validIso(nowIso),
      areas:normaliseAreas(input)
    });
    return previous;
  }

  function reviewHistory(history){
    return (Array.isArray(history) ? history : [])
      .map(review=>({...review,areas:Object.fromEntries(AREAS.map(area=>[area,{...review.areas?.[area]}]))}))
      .sort((left,right)=>new Date(right.reviewedAt)-new Date(left.reviewedAt));
  }

  function guidanceForRating(rating){
    if(Number(rating)<=2) return "This area may need some attention or support. Choose one small next action if that feels useful.";
    if(Number(rating)===3) return "This area feels mixed today. Notice what is helping and choose one steadying action.";
    return "This area feels stronger today. Protect what is helping and build on it gently.";
  }

  return {AREAS,emptyRatings,saveReview,reviewHistory,guidanceForRating};
});
