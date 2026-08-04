const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const {JSDOM, ResourceLoader, VirtualConsole} = require("jsdom");

const root = path.resolve(__dirname,"..");

function server(){
  const instance = http.createServer(async(request,response)=>{
    try{
      const pathname = new URL(request.url,"http://localhost").pathname === "/"
        ? "/index.html"
        : new URL(request.url,"http://localhost").pathname;
      const file = path.resolve(root,`.${pathname}`);
      if(!file.startsWith(root)) throw new Error("Invalid path");
      const body = await fs.readFile(file);
      response.writeHead(200,{"content-type":file.endsWith(".js")?"text/javascript":"text/html"});
      response.end(body);
    }catch{
      response.writeHead(404);response.end("Not found");
    }
  });
  return new Promise(resolve=>instance.listen(0,"127.0.0.1",()=>resolve(instance)));
}

class LocalOnlyLoader extends ResourceLoader{
  fetch(url,options){
    return new URL(url).hostname === "127.0.0.1" ? super.fetch(url,options) : null;
  }
}

test("real CONNECTA page exposes the four-tab Personal Meeting flow", async t=>{
  const appServer = await server();
  t.after(()=>appServer.close());
  const {port} = appServer.address();
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError",error=>errors.push(error.message));

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/`,{
    runScripts:"dangerously",
    resources:new LocalOnlyLoader(),
    pretendToBeVisual:true,
    virtualConsole,
    beforeParse(window){
      window.scrollTo=()=>{};
      window.HTMLElement.prototype.scrollIntoView=()=>{};
      window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
      window.HTMLDialogElement.prototype.close=function(){this.open=false};
      Object.defineProperty(window.navigator,"onLine",{value:true,configurable:true});
      Object.defineProperty(window.navigator,"serviceWorker",{value:{register:async()=>({})},configurable:true});
      window.localStorage.setItem("meetings",JSON.stringify([{
        id:"legacy-page",fellowship:"AA",name:"Legacy Page Meeting",date:"2026-08-04",time:"18:00",format:"In person",place:"Old Hall",notes:"Preserve me"
      }]));
    }
  });
  t.after(()=>dom.window.close());
  if(dom.window.document.readyState !== "complete") await new Promise(resolve=>dom.window.addEventListener("load",resolve,{once:true}));
  await new Promise(resolve=>setTimeout(resolve,50));

  const document = dom.window.document;
  assert.equal(document.querySelectorAll("[data-meeting-tab]").length,4);
  assert.match(document.querySelector("#meetingList").textContent,/Legacy Page Meeting/);
  assert.equal(JSON.parse(dom.window.localStorage.getItem("personalMeetings"))[0].notes,"Preserve me");

  document.querySelector('[data-meeting-tab="mine"]').click();
  assert.equal(document.querySelector('[data-meeting-panel="mine"]').hidden,false);
  document.querySelector("#openMeetingForm").click();
  document.querySelector("#fellowship").value="NA";
  document.querySelector("#meetingName").value="Integration Meeting";
  document.querySelector("#meetingForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
  assert.match(document.querySelector("#meetingList").textContent,/Integration Meeting/);
  assert.deepEqual(errors,[]);
});

test("real CONNECTA page creates and reopens My First 72 Hours", async t=>{
  const appServer = await server();
  t.after(()=>appServer.close());
  const {port} = appServer.address();
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError",error=>errors.push(error.message));

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/`,{
    runScripts:"dangerously",
    resources:new LocalOnlyLoader(),
    pretendToBeVisual:true,
    virtualConsole,
    beforeParse(window){
      window.scrollTo=()=>{};
      window.HTMLElement.prototype.scrollIntoView=()=>{};
      window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
      window.HTMLDialogElement.prototype.close=function(){this.open=false};
      Object.defineProperty(window.navigator,"onLine",{value:true,configurable:true});
      Object.defineProperty(window.navigator,"serviceWorker",{value:{register:async()=>({})},configurable:true});
    }
  });
  t.after(()=>dom.window.close());
  if(dom.window.document.readyState !== "complete") await new Promise(resolve=>dom.window.addEventListener("load",resolve,{once:true}));
  await new Promise(resolve=>setTimeout(resolve,50));

  const document = dom.window.document;
  document.querySelector("#openBridgePlan").click();
  document.querySelector("#bridgeTransitionDate").value="2026-08-10";
  document.querySelector("#bridgeTransitionTime").value="09:00";
  document.querySelector("#bridgeAppointment").value="Community recovery appointment";
  document.querySelector("#bridgePlanForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));

  assert.match(document.querySelector("#bridgePracticalSummary").textContent,/Community recovery appointment/);
  assert.equal(JSON.parse(dom.window.localStorage.getItem("recoveryBridgeV1")).keyAppointment,"Community recovery appointment");
  document.querySelector('[data-bridge-checkin="red"]').click();
  assert.equal(document.querySelector("#supportDialog").open,true);
  assert.match(document.querySelector(".support-step.active").textContent,/Call 999|Samaritans 116 123/);
  document.querySelector("#supportDialog").close();
  document.querySelector("#open20").click();
  assert.match(document.querySelector(".support-step.active").textContent,/1\. Make the next few minutes safer/);
  assert.deepEqual(errors,[]);
});
