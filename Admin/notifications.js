let allNotifications=[],allCustomers=[],allOrders=[];
function setNotificationState(state,message=""){
 const loading=document.getElementById("notificationsLoading"),empty=document.getElementById("notificationsEmpty"),table=document.getElementById("notificationsTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}
async function loadNotifications(){
 setNotificationState("loading");
 const {data,error}=await supabaseClient.from("notifications").select("notification_id,user_id,type,title,message,related_order_id,is_read,created_at").order("created_at",{ascending:false});
 if(error){console.error("Notifications load error:",error);setNotificationState("error","Unable to load notifications.");return}
 allNotifications=data||[];
 renderNotifications();
}
async function loadCustomers(){
 const {data,error}=await supabaseClient.from("profiles").select("user_id,full_name,role").eq("role","customer").order("full_name",{ascending:true});
 if(error){console.error("Customers load error:",error);return}
 allCustomers=data||[];
 const select=document.getElementById("notificationUser");
 select.innerHTML='<option value="">Select customer</option>';
 allCustomers.forEach(c=>{
  const o=document.createElement("option");
  o.value=c.user_id;
  o.textContent=c.full_name||"Customer "+c.user_id.slice(0,8);
  select.appendChild(o);
 });
}
async function loadOrders(){
 const {data,error}=await supabaseClient.from("orders").select("order_id,order_code,user_id,created_at").order("created_at",{ascending:false});
 if(error){console.error("Orders load error:",error);return}
 allOrders=data||[];
 const select=document.getElementById("notificationOrder");
 select.innerHTML='<option value="">No related order</option>';
 allOrders.forEach(o=>{
  const customer=allCustomers.find(c=>c.user_id===o.user_id);
  const option=document.createElement("option");
  option.value=o.order_id;
  option.textContent=`${o.order_code} — ${customer?.full_name||"Customer"}`;
  select.appendChild(option);
 });
}
function getCustomerName(userId){
 const customer=allCustomers.find(c=>c.user_id===userId);
 return customer?.full_name||"Customer";
}
function formatDate(value){
 if(!value)return"—";
 return new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function renderNotifications(){
 const body=document.getElementById("notificationsBody"),search=document.getElementById("notificationSearch").value.trim().toLowerCase(),filter=document.getElementById("notificationFilter").value;
 body.innerHTML="";
 const filtered=allNotifications.filter(n=>{
  const customer=getCustomerName(n.user_id).toLowerCase();
  const text=`${customer} ${n.type||""} ${n.title||""} ${n.message||""}`.toLowerCase();
  return(!search||text.includes(search))&&(filter==="all"||n.type===filter);
 });
 if(!filtered.length){setNotificationState("empty","No notifications found.");return}
 setNotificationState("ready");
 filtered.forEach(n=>{
  const row=document.createElement("tr");
  const customer=document.createElement("td"),type=document.createElement("td"),title=document.createElement("td"),message=document.createElement("td"),date=document.createElement("td"),status=document.createElement("td");
  customer.textContent=getCustomerName(n.user_id);
  type.textContent=n.type||"general";
  title.textContent=n.title||"—";
  message.textContent=n.message||"—";
  date.textContent=formatDate(n.created_at);
  const badge=document.createElement("span");
  badge.className=`status-badge ${n.is_read?"active":"pending"}`;
  badge.textContent=n.is_read?"Read":"Unread";
  status.appendChild(badge);
  row.append(customer,type,title,message,date,status);
  body.appendChild(row);
 });
}
function showNotificationMessage(message,type=""){
 const box=document.getElementById("notificationFormMessage");
 box.textContent=message;
 box.className=`form-message ${type}`.trim();
}
function clearNotificationMessage(){
 const box=document.getElementById("notificationFormMessage");
 box.textContent="";
 box.className="form-message";
}
function openNotificationModal(){
 clearNotificationMessage();
 document.getElementById("notificationForm").reset();
 document.getElementById("notificationModal").classList.remove("hidden");
 document.body.classList.add("modal-open");
}
function closeNotificationModal(){
 document.getElementById("notificationModal").classList.add("hidden");
 document.body.classList.remove("modal-open");
 document.getElementById("notificationForm").reset();
 clearNotificationMessage();
}
async function sendNotification(e){
 e.preventDefault();
 clearNotificationMessage();
 const userId=document.getElementById("notificationUser").value;
 const type=document.getElementById("notificationType").value;
 const title=document.getElementById("notificationTitle").value.trim();
 const message=document.getElementById("notificationMessage").value.trim();
 const orderId=document.getElementById("notificationOrder").value||null;
 if(!userId){showNotificationMessage("Please select a customer.","error");return}
 if(!title){showNotificationMessage("Notification title is required.","error");return}
 if(!message){showNotificationMessage("Notification message is required.","error");return}
 const button=document.getElementById("saveNotificationBtn");
 button.disabled=true;
 button.textContent="Sending...";
 const {error}=await supabaseClient.from("notifications").insert({
  user_id:userId,
  type,
  title,
  message,
  related_order_id:orderId,
  is_read:false
 });
 if(error){
  console.error("Send notification error:",error);
  showNotificationMessage(error.message||"Unable to send notification.","error");
  button.disabled=false;
  button.textContent="Send Notification";
  return;
 }
 button.disabled=false;
 button.textContent="Send Notification";
 closeNotificationModal();
 await loadNotifications();
}
document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();
 if(!ok)return;
 document.getElementById("notificationSearch").addEventListener("input",renderNotifications);
 document.getElementById("notificationFilter").addEventListener("change",renderNotifications);
 document.getElementById("sendNotificationBtn").addEventListener("click",openNotificationModal);
 document.getElementById("closeNotificationModal").addEventListener("click",closeNotificationModal);
 document.getElementById("cancelNotificationBtn").addEventListener("click",closeNotificationModal);
 document.getElementById("notificationForm").addEventListener("submit",sendNotification);
 document.getElementById("notificationModal").addEventListener("click",e=>{
  if(e.target.id==="notificationModal")closeNotificationModal();
 });
 await loadCustomers();
 await loadOrders();
 await loadNotifications();
});