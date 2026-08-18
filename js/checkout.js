let currentUser=null,isSubmitting=false;

document.addEventListener("DOMContentLoaded",async()=>{
if(typeof window.eKhokhaDataReady==="undefined"){console.error("E-KHOKHA Error: Catalog loader not found!");return}
try{
await window.eKhokhaDataReady;
const {data,error}=await supabaseClient.auth.getSession();
if(error)throw error;
if(!data?.session?.user){window.location.href="login.html";return}
currentUser=data.session.user;
await loadDefaultAddress();
await renderCheckoutSummary();
}catch(error){
console.error("Checkout init error:",error);
alert("Unable to load checkout. Please try again.");
}
});

function getCheckoutItems(){
const mode=localStorage.getItem("eKhokhaCheckoutMode");
try{
if(mode==="route_product"){
const data=JSON.parse(localStorage.getItem("eKhokhaCheckoutData"));
return data?[data]:[];
}
if(mode==="route_cart")return JSON.parse(localStorage.getItem("eKhokhaCart"))||[];
}catch(e){console.error("Checkout data error:",e)}
return[];
}

async function loadDefaultAddress(){
const {data,error}=await supabaseClient.from("addresses").select("*").eq("user_id",currentUser.id).eq("is_default",true).maybeSingle();
if(error){console.error("Default address error:",error);return}
if(!data)return;
document.getElementById("fullName").value=data.full_name||"";
document.getElementById("mobile").value=data.mobile||"";
document.getElementById("house").value=data.house||"";
document.getElementById("street").value=data.street||"";
document.getElementById("city").value=data.city||"";
document.getElementById("state").value=data.state||"";
document.getElementById("pincode").value=data.pincode||"";
}

function getAppliedCoupon(){
try{
const c=JSON.parse(localStorage.getItem("eKhokhaAppliedCoupon"));
return c&&c.code?c:null;
}catch(e){return null}
}

function getDisplayItems(){
return getCheckoutItems().map(item=>{
const product=getProductById(item.product_id);
const variant=product?.variants?.find(v=>String(v.variant_id)===String(item.variant_id));
return{
...item,
product,
variant,
product_name:product?.basic_info?.name||"Product",
variant_value:item.variant_value||variant?.variant_value||"Free Size",
quantity:Number(item.quantity||1)
};
});
}

async function buildSecureCheckoutPayload(){
const items=getCheckoutItems();
if(!items.length)throw new Error("Checkout list is empty.");

const rpcItems=items.map(item=>({
product_id:item.product_id,
variant_id:item.variant_id,
quantity:Number(item.quantity)
}));

for(const item of rpcItems){
if(!item.product_id||!item.variant_id)throw new Error("Invalid product or variant.");
if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)throw new Error("Invalid quantity.");
}

const address={
full_name:document.getElementById("fullName")?.value.trim()||"",
mobile:document.getElementById("mobile")?.value.trim()||"",
house:document.getElementById("house")?.value.trim()||"",
street:document.getElementById("street")?.value.trim()||"",
city:document.getElementById("city")?.value.trim()||"",
state:document.getElementById("state")?.value.trim()||"",
pincode:document.getElementById("pincode")?.value.trim()||""
};

return{items:rpcItems,address,coupon:getAppliedCoupon()};
}

async function renderCheckoutSummary(){
const list=document.getElementById("checkout-items-list");
if(!list)return;

try{
const items=getDisplayItems();
if(!items.length)throw new Error("Checkout list is empty.");

list.innerHTML="";

let localTotal=0;

items.forEach(item=>{
const product=item.product;
const image=product?.images?.length?product.images[0]:"https://placehold.co/100x100/1a1a1a/ffffff?text=No+Image";
const variantType=item.variant?.variant_type||"variant";
const variantLabel=variantType==="color"?"Color":"Size";
const price=Number(product?.pricing?.current_price||0);
const itemTotal=price*item.quantity;
localTotal+=itemTotal;

const div=document.createElement("div");
div.className="checkout-item";
div.innerHTML=`
<div class="mini-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.product_name)}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;"></div>
<div class="mini-details">
<div class="mini-title">${escapeHtml(item.product_name)}</div>
<div class="mini-qty-price"><span>Qty: ${item.quantity} | ${escapeHtml(variantLabel)}: ${escapeHtml(item.variant_value)}</span><span class="mini-price">₹${Math.round(itemTotal)}</span></div>
</div>`;
list.appendChild(div);
});

document.getElementById("checkout-dynamic-coupon-row")?.remove();

const applied=getAppliedCoupon();

document.getElementById("checkout-item-total").innerText="₹"+Math.round(localTotal);
document.getElementById("checkout-grand-total").innerText="₹"+Math.round(localTotal);
document.getElementById("footer-pay-amount").innerText="₹"+Math.round(localTotal);

if(applied?.code){
const row=document.createElement("div");
row.id="checkout-dynamic-coupon-row";
row.className="bill-row";
row.style.color="#388e3c";
row.innerHTML=`<span>Coupon (${escapeHtml(applied.code)})</span><span style="font-weight:600;">Applied at checkout</span>`;
document.getElementById("checkout-item-total").parentElement.insertAdjacentElement("afterend",row);
}

}catch(error){
console.error("Checkout summary error:",error);
list.innerHTML=`<div style="padding:15px;color:#d63031">${escapeHtml(error.message)}</div>`;
}
}

document.getElementById("place-order-btn")?.addEventListener("click",placeOrder);

async function placeOrder(){
if(isSubmitting)return;

const btn=document.getElementById("place-order-btn");
if(!btn)return;

isSubmitting=true;
const originalText=btn.innerHTML;
btn.innerHTML="Placing Order...";
btn.style.opacity=".7";
btn.style.pointerEvents="none";

const unlock=()=>{
isSubmitting=false;
btn.innerHTML=originalText;
btn.style.opacity="1";
btn.style.pointerEvents="auto";
};

try{
const {data:sessionData,error:sessionError}=await supabaseClient.auth.getSession();
if(sessionError)throw sessionError;

if(!sessionData?.session?.user){
window.location.href="login.html";
return;
}

currentUser=sessionData.session.user;

const form=document.getElementById("address-form");
if(!form.checkValidity()){
form.reportValidity();
unlock();
return;
}

const payload=await buildSecureCheckoutPayload();

const couponCode=payload.coupon?.code||null;

const {data,error}=await supabaseClient.rpc("create_order_secure",{
p_items:payload.items,
p_address:payload.address,
p_coupon_code:couponCode
});

if(error)throw new Error(error.message||"Unable to place order.");

if(!data?.order_id||!data?.order_code){
throw new Error("Order was not created correctly.");
}

const displayItems=getDisplayItems();

const latestOrder={
order_id:data.order_id,
orderId:data.order_code,
items:displayItems.map(item=>({
product_id:item.product_id,
variant_id:item.variant_id,
product_name:item.product_name,
variant_value:item.variant_value,
quantity:item.quantity,
unit_price:item.product?.pricing?.current_price||0,
item_total:Number(item.product?.pricing?.current_price||0)*item.quantity
})),
item_total:Number(data.item_total||0),
discount_amount:Number(data.discount_amount||0),
coupon_applied:data.coupon_code||null,
total:Number(data.total_amount||0),
address:{
name:payload.address.full_name,
mobile:payload.address.mobile,
house:payload.address.house,
street:payload.address.street,
city:payload.address.city,
state:payload.address.state,
pincode:payload.address.pincode
},
payment_method:data.payment_method||"cod",
status:"Pending",
estimatedDelivery:formatDate(data.estimated_delivery)
};

localStorage.setItem("eKhokhaLatestOrder",JSON.stringify(latestOrder));

if(localStorage.getItem("eKhokhaCheckoutMode")==="route_cart"){
localStorage.setItem("eKhokhaCart",JSON.stringify([]));
}

localStorage.removeItem("eKhokhaAppliedCoupon");
localStorage.removeItem("eKhokhaCoupons");
localStorage.removeItem("eKhokhaCheckoutData");
localStorage.removeItem("eKhokhaCheckoutMode");

window.location.href="success.html";

}catch(error){
console.error("Secure checkout error:",error);
alert(error.message||"Unable to place order. Please try again.");
unlock();
}
}

function formatDate(date){
if(!date)return"";
return new Date(date+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}

function escapeHtml(value){
return String(value??"").replace(/[&<>"']/g,char=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
}[char]));
}