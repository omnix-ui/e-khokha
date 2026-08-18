let coupons=[],currentUser=null;
document.addEventListener("DOMContentLoaded",initCouponPage);
async function initCouponPage(){
try{
const {data,error}=await supabaseClient.auth.getUser();
if(error)throw error;
currentUser=data?.user||null;
if(!currentUser){
alert("Please login to use coupons.");
return window.location.href="login.html";
}
localStorage.removeItem("eKhokhaCoupons");
bindEvents();
if(window.eKhokhaDataReady){
try{await window.eKhokhaDataReady}catch(e){console.error(e)}
}
renderAppliedCoupon();
await loadCoupons();
}catch(error){
console.error("Coupon page error:",error);
showError("Unable to load coupons. Please try again.");
}
}
function bindEvents(){
const input=document.getElementById("manual-coupon-input");
const btn=document.getElementById("manual-apply-btn");
document.getElementById("remove-coupon-btn")?.addEventListener("click",removeAppliedCoupon);
btn?.addEventListener("click",handleManualApply);
input?.addEventListener("keydown",e=>{if(e.key==="Enter")handleManualApply();});
input?.addEventListener("input",e=>{e.target.value=e.target.value.toUpperCase().replace(/\s/g,"");});
}
async function loadCoupons(){
const {data,error}=await supabaseClient.from("coupons").select("*").eq("status","active").order("created_at",{ascending:false});
if(error)throw error;
const now=Date.now();
coupons=(data||[]).filter(c=>{
const start=new Date(c.start_at).getTime();
const expiry=new Date(c.expires_at).getTime();
return !isNaN(start)&&!isNaN(expiry)&&now>=start&&now<=expiry;
});
renderCoupons();
}
function renderCoupons(){
const container=document.getElementById("available-coupons-container");
if(!container)return;
if(!coupons.length){
container.innerHTML='<div class="coupon-empty">No coupons available right now.</div>';
return;
}
container.innerHTML="";
coupons.forEach(c=>{
const minAmt=Number(c.min_order_amount||0);
const minText=minAmt>0?`On orders above ₹${formatMoney(minAmt)}`:"No minimum order value";
container.innerHTML+=`<div class="coupon-card">
<div class="coupon-card-top">
<div>
<div class="coupon-code">${escapeHtml(c.code)}</div>
<div class="coupon-off">${getDiscountTitle(c)}</div>
<div class="coupon-min">${minText}</div>
</div>
<button type="button" class="coupon-card-apply" onclick="applyCoupon('${escapeJs(c.code)}')">Apply</button>
</div>
<hr class="coupon-divider">
<div class="coupon-description">${escapeHtml(c.description||"Enjoy this exclusive offer on your order.")}</div>
<div class="coupon-expiry">Valid till ${formatDate(c.expires_at)}</div>
</div>`;
});
}
function calculateCartTotal(){
let cart=[];
try{cart=JSON.parse(localStorage.getItem("eKhokhaCart"))||[];}catch(e){}
return cart.reduce((total,item)=>{
let product=typeof getProductById==="function"?getProductById(item.product_id):null;
if(!product&&Array.isArray(window.eKhokhaProducts)){
product=window.eKhokhaProducts.find(x=>String(x.id||x.product_id)===String(item.product_id));
}
if(!product)return total;
const price=Number(product.pricing?.current_price||0);
const quantity=Number(item.quantity||1);
return total+(price*quantity);
},0);
}
async function validateCoupon(coupon,totalAmount){
if(!coupon)throw new Error("Invalid coupon.");
if(totalAmount<=0)throw new Error("Your cart is empty.");
const now=Date.now();
const start=new Date(coupon.start_at).getTime();
const expiry=new Date(coupon.expires_at).getTime();
if(coupon.status!=="active")throw new Error("This coupon is currently unavailable.");
if(isNaN(start)||isNaN(expiry))throw new Error("Coupon validity could not be verified.");
if(now<start)throw new Error("This coupon is not active yet.");
if(now>expiry)throw new Error("This coupon has expired.");
const minOrder=Number(coupon.min_order_amount||0);
if(totalAmount<minOrder){throw new Error(`Minimum order value is ₹${formatMoney(minOrder)}.`);}
if(coupon.usage_limit){
const {count,error}=await supabaseClient.from("coupon_usage").select("coupon_usage_id",{count:"exact",head:true}).eq("coupon_id",coupon.coupon_id);
if(error)throw new Error("Unable to verify coupon usage.");
if(Number(count||0)>=Number(coupon.usage_limit)){throw new Error("This coupon has reached its usage limit.");}
}
if(coupon.per_user_limit){
const {count,error}=await supabaseClient.from("coupon_usage").select("coupon_usage_id",{count:"exact",head:true}).eq("coupon_id",coupon.coupon_id).eq("user_id",currentUser.id);
if(error)throw new Error("Unable to verify your coupon usage.");
if(Number(count||0)>=Number(coupon.per_user_limit)){throw new Error("You have already reached your usage limit for this coupon.");}
}
const discount=calculateDiscount(coupon,totalAmount);
if(discount<=0)throw new Error("This coupon cannot be applied to this order.");
return discount;
}
async function applyCoupon(code){
code=String(code||"").trim().toUpperCase();
if(!code){alert("Please enter a coupon code.");return;}
if(!currentUser){alert("Please login to use coupons.");return window.location.href="login.html";}
const cartTotal=calculateCartTotal();
if(cartTotal<=0){alert("Your cart is empty! Add items to apply coupons.");return;}
const btn=document.getElementById("manual-apply-btn");
if(btn){btn.disabled=true;btn.textContent="Checking...";}
try{
let coupon=coupons.find(c=>String(c.code).toUpperCase()===code);
if(!coupon){
const {data,error}=await supabaseClient.from("coupons").select("*").eq("code",code).maybeSingle();
if(error)throw new Error("Unable to verify coupon.");
if(!data)throw new Error("Invalid coupon code.");
coupon=data;
}
const discount=await validateCoupon(coupon,cartTotal);
const applied={coupon_id:coupon.coupon_id,code:coupon.code};
localStorage.setItem("eKhokhaAppliedCoupon",JSON.stringify(applied));
localStorage.removeItem("eKhokhaCoupons");
renderAppliedCoupon();
alert(`${coupon.code} applied successfully! You save ₹${formatMoney(discount)}.`);
window.history.back();
}catch(error){
console.error("Apply coupon error:",error);
alert(error.message||"Unable to apply coupon.");
}finally{
if(btn){btn.disabled=false;btn.textContent="Apply";}
}
}
function calculateDiscount(c,cartTotal){
const value=Number(c.value||0);
const maxDiscount=Number(c.max_discount_amount||0);
let discount=0;
if(c.type==="fixed"){discount=value;}else if(c.type==="percentage"||c.type==="percent"){discount=cartTotal*(value/100);}else{return 0;}
if(maxDiscount>0){discount=Math.min(discount,maxDiscount);}
return Math.min(Math.max(discount,0),cartTotal);
}
function getAppliedCoupon(){
try{
const data=JSON.parse(localStorage.getItem("eKhokhaAppliedCoupon"));
if(!data||!data.code)return null;
return{coupon_id:data.coupon_id||null,code:String(data.code).trim().toUpperCase()};
}catch(e){return null;}
}
function renderAppliedCoupon(){
const box=document.getElementById("applied-coupon-box");
const text=document.getElementById("applied-coupon-text");
const applied=getAppliedCoupon();
if(!applied){box?.classList.remove("show");return;}
if(text){text.textContent=`✓ ${applied.code} applied`;}
box?.classList.add("show");
}
function removeAppliedCoupon(){
localStorage.removeItem("eKhokhaAppliedCoupon");
localStorage.removeItem("eKhokhaCoupons");
renderAppliedCoupon();
alert("Coupon removed.");
}
function getDiscountTitle(c){
if(c.type==="fixed"){return `₹${formatMoney(c.value)} OFF`;}
if(c.type==="percentage"||c.type==="percent"){return `${formatNumber(c.value)}% OFF${Number(c.max_discount_amount||0)>0?` (up to ₹${formatMoney(c.max_discount_amount)})`:""}`;}
return "Special Offer";
}
function formatMoney(value){return Number(value||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function formatNumber(value){return Number(value||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function formatDate(date){return new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}
function showError(message){
const container=document.getElementById("available-coupons-container");
if(container){container.innerHTML=`<div class="coupon-error">${escapeHtml(message)}</div>`;}
}
function escapeHtml(value){
return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function escapeJs(value){
return String(value??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");
}
window.handleManualApply=()=>{
const input=document.getElementById("manual-coupon-input");
const code=input?.value.trim();
if(!code){alert("Please enter a coupon code.");input?.focus();return;}
applyCoupon(code);
};
window.applyCoupon=applyCoupon;
