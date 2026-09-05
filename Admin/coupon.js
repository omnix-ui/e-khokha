let allCoupons=[],editingCouponId=null;

function setCouponState(state,message=""){
 const loading=document.getElementById("couponsLoading"),empty=document.getElementById("couponsEmpty"),table=document.getElementById("couponsTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}

async function loadCoupons(){
 setCouponState("loading");
 const {data,error}=await supabaseClient.from("coupons").select("coupon_id,code,type,value,min_order_amount,max_discount_amount,start_at,expires_at,usage_limit,per_user_limit,status,description,created_at,updated_at").order("created_at",{ascending:false});
 if(error){console.error("Coupons load error:",error);allCoupons=[];setCouponState("error","Unable to load coupons.");return}
 allCoupons=data||[];
 await loadUsageCounts();
 renderCoupons();
}

async function loadUsageCounts(){
 if(!allCoupons.length)return;
 const ids=allCoupons.map(c=>c.coupon_id);
 const {data,error}=await supabaseClient.from("coupon_usage").select("coupon_id").in("coupon_id",ids);
 if(error){console.error("Coupon usage load error:",error);return}
 const counts={};
 (data||[]).forEach(x=>{counts[x.coupon_id]=(counts[x.coupon_id]||0)+1});
 allCoupons=allCoupons.map(c=>({...c,usage_count:counts[c.coupon_id]||0}));
}

function formatDate(value){
 if(!value)return"—";
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return"—";
 return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}

function formatDiscount(c){
 return c.type==="percentage"?`${Number(c.value)}%`:`₹${Number(c.value||0).toLocaleString("en-IN")}`;
}

function renderCoupons(){
 const body=document.getElementById("couponsBody"),search=document.getElementById("couponSearch").value.trim().toLowerCase(),status=document.getElementById("statusFilter").value;
 body.innerHTML="";
 const filtered=allCoupons.filter(c=>{
  const code=String(c.code||"").toLowerCase();
  return(!search||code.includes(search))&&(status==="all"||c.status===status);
 });
 if(!filtered.length){setCouponState("empty","No coupons found.");return}
 setCouponState("ready");
 filtered.forEach(c=>{
  const row=document.createElement("tr");
  const code=document.createElement("td"),discount=document.createElement("td"),min=document.createElement("td"),max=document.createElement("td"),validity=document.createElement("td"),usage=document.createElement("td"),statusCell=document.createElement("td"),action=document.createElement("td");
  code.className="product-name";code.textContent=c.code||"—";
  discount.textContent=formatDiscount(c);
  min.textContent=`₹${Number(c.min_order_amount||0).toLocaleString("en-IN")}`;
  max.textContent=c.max_discount_amount!=null?`₹${Number(c.max_discount_amount).toLocaleString("en-IN")}`:"—";
  validity.textContent=`${formatDate(c.start_at)} - ${formatDate(c.expires_at)}`;
  usage.textContent=c.usage_limit!=null?`${c.usage_count||0}/${c.usage_limit}`:`${c.usage_count||0}/∞`;
  const badge=document.createElement("span");
  badge.className=`status-badge ${c.status==="active"?"active":"inactive"}`;
  badge.textContent=c.status||"unknown";
  statusCell.appendChild(badge);
  const edit=document.createElement("button");
  edit.type="button";edit.className="small-btn";edit.textContent="Edit";
  edit.addEventListener("click",()=>openEditCoupon(c.coupon_id));
  action.appendChild(edit);
  row.append(code,discount,min,max,validity,usage,statusCell,action);
  body.appendChild(row);
 });
}

function showCouponMessage(message,type=""){
 const box=document.getElementById("couponFormMessage");
 box.textContent=message;
 box.className=`form-message ${type}`.trim();
}

function clearCouponMessage(){
 const box=document.getElementById("couponFormMessage");
 box.textContent="";
 box.className="form-message";
}

function openCouponModal(){
 document.getElementById("couponModal").classList.remove("hidden");
 document.body.classList.add("modal-open");
}

function closeCouponModal(){
 document.getElementById("couponModal").classList.add("hidden");
 document.body.classList.remove("modal-open");
 editingCouponId=null;
 document.getElementById("couponForm").reset();
 document.getElementById("couponId").value="";
 document.getElementById("editorTitle").textContent="Add Coupon";
 document.getElementById("editorSubtitle").textContent="Create a new discount coupon.";
 clearCouponMessage();
}

function toDateTimeLocal(value){
 if(!value)return"";
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return"";
 const pad=n=>String(n).padStart(2,"0");
 return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openAddCoupon(){
 editingCouponId=null;
 document.getElementById("couponForm").reset();
 document.getElementById("couponId").value="";
 document.getElementById("editorTitle").textContent="Add Coupon";
 document.getElementById("editorSubtitle").textContent="Create a new discount coupon.";
 document.getElementById("couponStatus").value="active";
 clearCouponMessage();
 openCouponModal();
}

async function openEditCoupon(couponId){
 const {data,error}=await supabaseClient.from("coupons").select("coupon_id,code,type,value,min_order_amount,max_discount_amount,start_at,expires_at,usage_limit,per_user_limit,status,description").eq("coupon_id",couponId).maybeSingle();
 if(error||!data){console.error("Coupon load error:",error);alert("Unable to load coupon.");return}
 editingCouponId=data.coupon_id;
 document.getElementById("couponId").value=data.coupon_id;
 document.getElementById("editorTitle").textContent="Edit Coupon";
 document.getElementById("editorSubtitle").textContent="Update coupon information.";
 document.getElementById("couponCode").value=data.code||"";
 document.getElementById("couponType").value=data.type||"percentage";
 document.getElementById("couponValue").value=data.value??"";
 document.getElementById("minOrderAmount").value=data.min_order_amount??"";
 document.getElementById("maxDiscountAmount").value=data.max_discount_amount??"";
 document.getElementById("startAt").value=toDateTimeLocal(data.start_at);
 document.getElementById("expiresAt").value=toDateTimeLocal(data.expires_at);
 document.getElementById("usageLimit").value=data.usage_limit??"";
 document.getElementById("perUserLimit").value=data.per_user_limit??"";
 document.getElementById("couponStatus").value=data.status||"active";
 document.getElementById("couponDescription").value=data.description||"";
 clearCouponMessage();
 openCouponModal();
}

function validateCouponForm(){
 const code=document.getElementById("couponCode").value.trim().toUpperCase();
 const type=document.getElementById("couponType").value;
 const value=Number(document.getElementById("couponValue").value);
 const min=document.getElementById("minOrderAmount").value;
 const max=document.getElementById("maxDiscountAmount").value;
 const start=document.getElementById("startAt").value;
 const expires=document.getElementById("expiresAt").value;
 const usage=document.getElementById("usageLimit").value;
 const perUser=document.getElementById("perUserLimit").value;
 if(!code)return"Coupon code is required.";
 if(!/^[A-Z0-9_-]+$/.test(code))return"Coupon code can contain only letters, numbers, _ and -.";
 if(!Number.isFinite(value)||value<=0)return"Enter a valid discount value.";
 if(type==="percentage"&&value>100)return"Percentage discount cannot exceed 100%.";
 if(min!==""&&(!Number.isFinite(Number(min))||Number(min)<0))return"Enter a valid minimum order amount.";
 if(max!==""&&(!Number.isFinite(Number(max))||Number(max)<0))return"Enter a valid maximum discount.";
 if(!start||!expires)return"Start and expiry dates are required.";
 if(new Date(expires)<=new Date(start))return"Expiry must be after start date.";
 if(usage!==""&&(!Number.isInteger(Number(usage))||Number(usage)<0))return"Usage limit must be a whole number.";
 if(perUser!==""&&(!Number.isInteger(Number(perUser))||Number(perUser)<0))return"Per-user limit must be a whole number.";
 return null;
}

async function saveCoupon(e){
 e.preventDefault();
 clearCouponMessage();
 const validation=validateCouponForm();
 if(validation){showCouponMessage(validation,"error");return}
 const saveBtn=document.getElementById("saveCouponBtn");
 saveBtn.disabled=true;
 saveBtn.textContent="Saving...";
 try{
  const payload={
   code:document.getElementById("couponCode").value.trim().toUpperCase(),
   type:document.getElementById("couponType").value,
   value:Number(document.getElementById("couponValue").value),
   min_order_amount:document.getElementById("minOrderAmount").value===""?0:Number(document.getElementById("minOrderAmount").value),
   max_discount_amount:document.getElementById("maxDiscountAmount").value===""?null:Number(document.getElementById("maxDiscountAmount").value),
   start_at:new Date(document.getElementById("startAt").value).toISOString(),
   expires_at:new Date(document.getElementById("expiresAt").value).toISOString(),
   usage_limit:document.getElementById("usageLimit").value===""?null:Number(document.getElementById("usageLimit").value),
   per_user_limit:document.getElementById("perUserLimit").value===""?null:Number(document.getElementById("perUserLimit").value),
   status:document.getElementById("couponStatus").value,
   description:document.getElementById("couponDescription").value.trim()||null,
   updated_at:new Date().toISOString()
  };
  let result;
  if(editingCouponId){
   result=await supabaseClient.from("coupons").update(payload).eq("coupon_id",editingCouponId);
  }else{
   result=await supabaseClient.from("coupons").insert(payload);
  }
  if(result.error)throw result.error;
  closeCouponModal();
  await loadCoupons();
 }catch(error){
  console.error("Save coupon error:",error);
  showCouponMessage(error?.message||"Unable to save coupon.","error");
 }finally{
  saveBtn.disabled=false;
  saveBtn.textContent="Save Coupon";
 }
}

document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();
 if(!ok)return;
 const search=document.getElementById("couponSearch");
 const filter=document.getElementById("statusFilter");
 const add=document.getElementById("addCouponBtn");
 const close=document.getElementById("closeCouponModal");
 const cancel=document.getElementById("cancelCouponBtn");
 const form=document.getElementById("couponForm");
 const modal=document.getElementById("couponModal");
 if(search)search.addEventListener("input",renderCoupons);
 if(filter)filter.addEventListener("change",renderCoupons);
 if(add)add.addEventListener("click",openAddCoupon);
 if(close)close.addEventListener("click",closeCouponModal);
 if(cancel)cancel.addEventListener("click",closeCouponModal);
 if(form)form.addEventListener("submit",saveCoupon);
 if(modal)modal.addEventListener("click",e=>{if(e.target.id==="couponModal")closeCouponModal()});
 await loadCoupons();
});