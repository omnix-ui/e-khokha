let allCustomers=[];
async function loadCustomers(){
 setCustomerState("loading");
 const {data:profiles,error:pError}=await supabaseClient.from("profiles").select("*").eq("role","customer").order("created_at",{ascending:false});
 if(pError){console.error("Customers load error:",pError);setCustomerState("error","Unable to load customers.");return}
 const customers=profiles||[];
 const ids=customers.map(c=>c.user_id).filter(Boolean);
 let orders=[];
 if(ids.length){
  const {data:o,error:oError}=await supabaseClient.from("orders").select("order_id,user_id,total_amount,created_at").in("user_id",ids);
  if(!oError)orders=o||[];
 }
 const orderMap=new Map();
 ids.forEach(id=>orderMap.set(id,[]));
 orders.forEach(o=>{if(orderMap.has(o.user_id))orderMap.get(o.user_id).push(o)});
 allCustomers=customers.map(c=>{
  const userOrders=orderMap.get(c.user_id)||[];
  return {...c,order_count:userOrders.length,total_spent:userOrders.reduce((t,o)=>t+Number(o.total_amount||0),0)};
 });
 renderCustomers();
}
function setCustomerState(state,message=""){
 const loading=document.getElementById("customersLoading"),empty=document.getElementById("customersEmpty"),table=document.getElementById("customersTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}
function getCustomerName(c){
 return c.full_name||c.name||c.display_name||"Customer";
}
function renderCustomers(){
 const body=document.getElementById("customersBody");
 const search=(document.getElementById("customerSearch")?.value||"").trim().toLowerCase();
 const filter=document.getElementById("customerFilter")?.value||"all";
 if(!body)return;
 body.innerHTML="";
 const filtered=allCustomers.filter(c=>{
  const name=getCustomerName(c).toLowerCase();
  const id=String(c.user_id||"").toLowerCase();
  return(!search||name.includes(search)||id.includes(search))&&(filter==="all"||(filter==="with-orders"&&c.order_count>0)||(filter==="no-orders"&&c.order_count===0));
 });
 if(!filtered.length){setCustomerState("empty","No customers found.");return}
 setCustomerState("ready");
 filtered.forEach(c=>{
  const row=document.createElement("tr");
  const customer=document.createElement("td"),id=document.createElement("td"),orders=document.createElement("td"),spent=document.createElement("td"),joined=document.createElement("td"),action=document.createElement("td");
  customer.className="customer-name";
  customer.textContent=getCustomerName(c);
  id.textContent=c.user_id?`${c.user_id.slice(0,8)}...`:"—";
  orders.textContent=c.order_count;
  spent.textContent=`₹${Number(c.total_spent||0).toLocaleString("en-IN")}`;
  const d=c.created_at?new Date(c.created_at):null;
  joined.textContent=d&&!isNaN(d)?d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const view=document.createElement("button");
  view.type="button";view.className="small-btn";view.textContent="View";
  view.addEventListener("click",()=>openCustomer(c));
  action.appendChild(view);
  row.append(customer,id,orders,spent,joined,action);
  body.appendChild(row);
 });
}
function openCustomer(c){
 const modal=document.getElementById("customerModal"),box=document.getElementById("customerDetails");
 box.innerHTML="";
 document.getElementById("customerModalSubtitle").textContent=getCustomerName(c);
 const fields=[
  ["Name",getCustomerName(c)],
  ["Customer ID",c.user_id||"—"],
  ["Mobile",c.mobile||c.phone||"Not available"],
  ["Orders",String(c.order_count)],
  ["Total Spent",`₹${Number(c.total_spent||0).toLocaleString("en-IN")}`],
  ["Joined",c.created_at?new Date(c.created_at).toLocaleString("en-IN"):"—"]
 ];
 fields.forEach(([label,value])=>{
  const item=document.createElement("div");item.className="customer-detail-item";
  const l=document.createElement("span");l.textContent=label;
  const v=document.createElement("strong");v.textContent=value;
  item.append(l,v);box.appendChild(item);
 });
 modal.classList.remove("hidden");
 document.body.classList.add("modal-open");
}
function closeCustomerModal(){
 document.getElementById("customerModal").classList.add("hidden");
 document.body.classList.remove("modal-open");
}
document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();if(!ok)return;
 document.getElementById("customerSearch").addEventListener("input",renderCustomers);
 document.getElementById("customerFilter").addEventListener("change",renderCustomers);
 document.getElementById("closeCustomerModal").addEventListener("click",closeCustomerModal);
 document.getElementById("customerModal").addEventListener("click",e=>{if(e.target.id==="customerModal")closeCustomerModal()});
 await loadCustomers();
});