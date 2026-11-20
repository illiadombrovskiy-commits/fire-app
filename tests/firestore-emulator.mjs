import {initializeTestEnvironment,assertSucceeds,assertFails} from "@firebase/rules-unit-testing";
import {doc,setDoc,getDoc,deleteDoc,serverTimestamp,onSnapshot} from "firebase/firestore";
import {readFileSync} from "node:fs";
const env=await initializeTestEnvironment({projectId:"demo-v-slove",firestore:{rules:readFileSync("firestore.rules","utf8")}});
try {
 const day="2026-11-20";
 await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  await setDoc(doc(db,"profiles/a"),{friends:["b"],flameDay:day});
  await setDoc(doc(db,"profiles/b"),{friends:["a"]});
 });
 const a=env.authenticatedContext("a").firestore(), b=env.authenticatedContext("b").firestore(), c=env.authenticatedContext("c").firestore();
 const globe={name:"A",photo:"",b:0,refs:["Быт. 1"],plan:"Библия",streak:1,lit:day,seen:day,fc:1};
 await assertFails(setDoc(doc(b,"globe/a"),globe));
 await assertSucceeds(setDoc(doc(a,"globe/a"),globe));
 await assertSucceeds(getDoc(doc(b,"globe/a")));
 // Live globe subscribers must receive changes from another signed-in account.
 const changed = new Promise((resolve,reject) => {
  let unsubscribe = () => {};
  const timer = setTimeout(() => { unsubscribe(); reject(new Error("Globe update was not delivered in real time")); }, 10000);
  unsubscribe = onSnapshot(doc(b,"globe/a"), reader => {
   if (reader.exists() && reader.data().lit === "2026-11-21") {
    clearTimeout(timer); unsubscribe(); resolve();
   }
  }, err => { clearTimeout(timer); unsubscribe(); reject(err); });
 });
 await assertSucceeds(setDoc(doc(a,"globe/a"),{...globe,lit:"2026-11-21",seen:"2026-11-21"}));
 await changed;
 // Restore the day used by the encouragement rules test.
 await assertSucceeds(setDoc(doc(a,"globe/a"),globe));
 await assertSucceeds(setDoc(doc(a,"users/a"),{progress:1}));
 await assertFails(getDoc(doc(b,"users/a")));
 const msg={from:"a",name:"A",photo:"",msg:0,day,at:serverTimestamp()};
 const path="cheers/b/inbox/a_"+day;
 await assertFails(setDoc(doc(c,path),msg));
 await assertSucceeds(setDoc(doc(a,path),msg));
 await assertFails(setDoc(doc(a,path),msg));
 await assertFails(getDoc(doc(c,path)));
 await assertSucceeds(getDoc(doc(b,path)));
 await assertSucceeds(deleteDoc(doc(b,path)));
 // A completed reader must not be sent a stale encouragement, even by an old client.
 await env.withSecurityRulesDisabled(async c=>{
  await setDoc(doc(c.firestore(),"profiles/b"),{friends:["a"],heroFlameDay:day});
 });
 await assertFails(setDoc(doc(a,path),msg));
 // The invitation kind is independent of this reading-presence check.
 await assertSucceeds(setDoc(doc(a,path+"_inv"),{...msg,kind:"invite"}));
 console.log("PASS Firestore emulator: ownership, globe sync, encouragement, invitation and inbox access");
} finally {await env.cleanup()}
