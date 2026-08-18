document.addEventListener("DOMContentLoaded",async()=>{
if(typeof window.eKhokhaDataReady==="undefined"){console.error("E-Khokha Error: Catalog loader not found!");return}
try{await window.eKhokhaDataReady}catch(error){console.error("E-Khokha Error: Catalog load failed.",error);return}
localStorage.removeItem("eKhokhaCoupons");
renderCart();
});
async function getAppliedCouponData(totalAmount){
const stored=getStoredCoupon();
if(!stored||!stored.code)return{coupon:null,discount:0,error:null};
try{
const {data:userData,error:userError}=await supabaseClient.auth.getUser();
if(userError)throw userError;
const user=userData?.user;
if(!user)return{coupon:null,discount:0,error:"Please login to use this coupon."};
const {data:coupon,error:couponError}=await supabaseClient.from("coupons").select("coupon_id,code,type,value,min_order_amount,max_discount_amount,start_at,expires_at,usage_limit,per_user_limit,status").eq("code",String(stored.code).trim().toUpperCase()).maybeSingle();
if(couponError)throw new Error("Unable to verify coupon.");
if(!coupon)throw new Error("This coupon is no longer available.");
if(stored.coupon_id&&String(stored.coupon_id)!==String(coupon.coupon_id))throw new Error("Coupon reference is invalid.");
const now=Date.now();
const start=new Date(coupon.start_at).getTime();
const expiry=new Date(coupon.expires_at).getTime();
if(coupon.status!=="active")throw new Error("This coupon is currently unavailable.");
if(Number.isNaN(start)||Number.isNaN(expiry))throw new Error("Coupon validity could not be verified.");
if(now<start)throw new Error("This coupon is not active yet.");
if(now>expiry)throw new Error("This coupon has expired.");
const minOrder=Number(coupon.min_order_amount||0);
if(totalAmount<minOrder)throw new Error(`Minimum order value is ₹${formatMoney(minOrder)}.`);
if(coupon.usage_limit){
const {count,error}=await supabaseClient.from("coupon_usage").select("coupon_usage_id",{count:"exact",head:true}).eq("coupon_id",coupon.coupon_id);
if(error)throw new Error("Unable to verify coupon usage.");
if(Number(count||0)>=Number(coupon.usage_limit))throw new Error("This coupon has reached its usage limit.");
}
if(coupon.per_user_limit){
const {count,error}=await supabaseClient.from("coupon_usage").select("coupon_usage_id",{count:"exact",head:true}).eq("coupon_id",coupon.coupon_id).eq("user_id",user.id);
if(error)throw new Error("Unable to verify your coupon usage.");
if(Number(count||0)>=Number(coupon.per_user_limit))throw new Error("You have already reached your usage limit for this coupon.");
}
const value=Number(coupon.value||0);
let discount=0;
if(coupon.type==="fixed"){
discount=value;
}else if(coupon.type==="percentage"||coupon.type==="percent"){
discount=totalAmount*(value/100);
}else{
throw new Error("Invalid coupon type.");
}
const maxDiscount=Number(coupon.max_discount_amount||0);
if(maxDiscount>0)discount=Math.min(discount,maxDiscount);
discount=Math.min(Math.max(discount,0),totalAmount);
if(discount<=0)throw new Error("This coupon cannot be applied to this order.");
return{coupon,discount:Number(discount.toFixed(2)),error:null};
}catch(error){
console.error("Cart coupon validation error:",error);
return{coupon:null,discount:0,error:error.message||"Unable to verify coupon."};
}
}
function getStoredCoupon(){
try{
const data=JSON.parse(localStorage.getItem("eKhokhaAppliedCoupon"));
if(!data||!data.code)return null;
return{coupon_id:data.coupon_id||null,code:String(data.code).trim().toUpperCase()};
}catch(e){return null}
}
function renderCart(){
let cart=[];
try{cart=JSON.parse(localStorage.getItem("eKhokhaCart"))||[]}catch(e){cart=[]}
const emptyCartState=document.getElementById("empty-cart-state");
const cartContainer=document.getElementById("cart-items-container");
const cartItemsList=document.getElementById("cart-items-list");
if(cart.length===0){
if(emptyCartState)emptyCartState.style.display="flex";
if(cartContainer)cartContainer.style.display="none";
updateCartBill(0,0);
return;
}
if(emptyCartState)emptyCartState.style.display="none";
if(cartContainer)cartContainer.style.display="block";
if(cartItemsList)cartItemsList.innerHTML="";
let totalAmount=0;
cart.forEach(item=>{
const productData=getProductById(item.product_id);
if(!productData)return;
const currentName=productData.basic_info.name;
const currentPrice=Number(productData.pricing.current_price||0);
const currentImage=productData.images?.length?productData.images[0]:"https://placehold.co/100x100/1a1a1a/ffffff?text=No+Image";
const selectedVariant=productData.variants?.find(variant=>String(variant.variant_id)===String(item.variant_id));
const variantValue=item.variant_value||selectedVariant?.variant_value||item.size||"Free Size";
const quantity=Number(item.quantity||1);
const itemTotal=currentPrice*quantity;
totalAmount+=itemTotal;
const itemDiv=document.createElement("div");
itemDiv.className="cart-item";
itemDiv.innerHTML=`<div class="cart-item-image">
<img src="${escapeHtml(currentImage)}" alt="${escapeHtml(currentName)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
</div>
<div class="cart-item-info">
<div class="item-title-row">
<div class="item-title">${escapeHtml(currentName)}</div>
<button class="item-delete-btn" onclick="removeItem('${escapeHtml(item.product_id)}','${escapeHtml(item.variant_id||"")}')">
<span class="material-symbols-outlined">delete</span>
</button>
</div>
<div class="item-size">
${selectedVariant?.variant_type==="color"?"Color":"Size"}:
<b>${escapeHtml(variantValue)}</b>
</div>
<div class="item-price-row">
<div class="item-price">₹${formatMoney(currentPrice)}</div>
<div class="item-qty-controls">
<button class="qty-btn-small" onclick="updateQty('${escapeHtml(item.product_id)}','${escapeHtml(item.variant_id||"")}',-1)">
<span class="material-symbols-outlined">remove</span>
</button>
<span class="qty-number-small">${quantity}</span>
<button class="qty-btn-small" onclick="updateQty('${escapeHtml(item.product_id)}','${escapeHtml(item.variant_id||"")}',1)">
<span class="material-symbols-outlined">add</span>
</button>
</div>
</div>
</div>`;
if(cartItemsList)cartItemsList.appendChild(itemDiv);
});
updateCartWithCoupon(totalAmount);
}
async function updateCartWithCoupon(totalAmount){
let finalTotal=totalAmount;
const couponRow=document.getElementById("coupon-discount-row");
const couponDiscountText=document.getElementById("cart-coupon-discount");
const couponStatusText=document.getElementById("coupon-status-text");
const couponActionBtn=document.getElementById("coupon-action-btn");
resetCouponUI();
const stored=getStoredCoupon();
if(!stored){
updateCartBill(totalAmount,finalTotal);
return;
}
if(couponStatusText){
couponStatusText.innerText="Checking...";
couponStatusText.style.color="#636e72";
}
if(couponActionBtn){
couponActionBtn.innerText="Checking...";
couponActionBtn.style.pointerEvents="none";
}
const result=await getAppliedCouponData(totalAmount);
if(result.error){
if(couponStatusText){
couponStatusText.innerText=result.error;
couponStatusText.style.color="#d63031";
}
if(couponActionBtn){
couponActionBtn.innerText="Remove";
couponActionBtn.style.color="#636e72";
couponActionBtn.href="#";
couponActionBtn.style.pointerEvents="auto";
couponActionBtn.onclick=e=>{e.preventDefault();removeAppliedCoupon();};
}
updateCartBill(totalAmount,finalTotal);
return;
}
const coupon=result.coupon;
const discount=result.discount;
finalTotal=Math.max(0,totalAmount-discount);
if(couponRow)couponRow.style.display="flex";
if(couponDiscountText)couponDiscountText.innerText=`-₹${formatMoney(discount)}`;
if(couponStatusText){
couponStatusText.innerText=`'${coupon.code}' Applied`;
couponStatusText.style.color="#388e3c";
}
if(couponActionBtn){
couponActionBtn.innerText="Remove";
couponActionBtn.style.color="#636e72";
couponActionBtn.href="#";
couponActionBtn.style.pointerEvents="auto";
couponActionBtn.onclick=e=>{e.preventDefault();removeAppliedCoupon();};
}
updateCartBill(totalAmount,finalTotal);
}
function resetCouponUI(){
const couponRow=document.getElementById("coupon-discount-row");
const couponStatusText=document.getElementById("coupon-status-text");
const couponActionBtn=document.getElementById("coupon-action-btn");
if(couponRow)couponRow.style.display="none";
if(couponStatusText){
couponStatusText.innerText="Apply Coupon";
couponStatusText.style.color="#1a1a1a";
}
if(couponActionBtn){
couponActionBtn.innerText="Apply";
couponActionBtn.style.color="#fd4f6a";
couponActionBtn.href="coupon.html";
couponActionBtn.style.pointerEvents="auto";
couponActionBtn.onclick=null;
}
}
function updateCartBill(totalAmount,finalTotal){
const itemTotalEl=document.getElementById("item-total");
const grandTotalEl=document.getElementById("grand-total");
const footerTotalEl=document.getElementById("footer-total");
if(itemTotalEl)itemTotalEl.innerText="₹"+formatMoney(totalAmount);
if(grandTotalEl)grandTotalEl.innerText="₹"+formatMoney(finalTotal);
if(footerTotalEl)footerTotalEl.innerText="₹"+formatMoney(finalTotal);
}
window.removeItem=function(productId,variantId){
let cart=[];
try{cart=JSON.parse(localStorage.getItem("eKhokhaCart"))||[]}catch(e){cart=[]}
cart=cart.filter(item=>!(String(item.product_id)===String(productId)&&String(item.variant_id||"")===String(variantId||"")));
localStorage.setItem("eKhokhaCart",JSON.stringify(cart));
if(typeof updateCartBadge==="function")updateCartBadge();
renderCart();
};
window.updateQty=function(productId,variantId,change){
let cart=[];
try{cart=JSON.parse(localStorage.getItem("eKhokhaCart"))||[]}catch(e){cart=[]}
const index=cart.findIndex(item=>String(item.product_id)===String(productId)&&String(item.variant_id||"")===String(variantId||""));
if(index===-1)return;
const productData=getProductById(productId);
if(!productData)return;
const variant=productData.variants?.find(v=>String(v.variant_id)===String(variantId));
const availableStock=variant?Number(variant.stock_quantity||0):0;
if(change===-1){
if(Number(cart[index].quantity)===1){removeItem(productId,variantId);return;}
cart[index].quantity=Number(cart[index].quantity)-1;
}
if(change===1){
if(Number(cart[index].quantity)>=availableStock){alert(`Only ${availableStock} item(s) available.`);return;}
if(Number(cart[index].quantity)>=10)return;
cart[index].quantity=Number(cart[index].quantity)+1;
}
localStorage.setItem("eKhokhaCart",JSON.stringify(cart));
if(typeof updateCartBadge==="function")updateCartBadge();
renderCart();
};
function removeAppliedCoupon(){
localStorage.removeItem("eKhokhaAppliedCoupon");
localStorage.removeItem("eKhokhaCoupons");
renderCart();
}
function formatMoney(value){
return Number(value||0).toLocaleString("en-IN",{maximumFractionDigits:2});
}
function escapeHtml(value){
return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
document.addEventListener("DOMContentLoaded",()=>{
const proceedBtn=document.getElementById("proceed-btn");
if(proceedBtn){
proceedBtn.addEventListener("click",e=>{
e.preventDefault();
let currentCart=[];
try{currentCart=JSON.parse(localStorage.getItem("eKhokhaCart"))||[]}catch(error){currentCart=[]}
if(currentCart.length===0){alert("Cart khali hai, pehle kuch add kijiye!");return;}
localStorage.setItem("eKhokhaCheckoutMode","route_cart");
window.location.href="checkout.html";
});
}
});
