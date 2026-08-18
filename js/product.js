document.addEventListener("DOMContentLoaded",async()=>{
if(typeof window.eKhokhaDataReady==="undefined"){console.error("E-Khokha: catalog loader not found");return}
try{await window.eKhokhaDataReady}catch(e){console.error("E-Khokha: catalog load failed",e);return}

const productTitle=document.querySelector(".product-title");
if(!productTitle)return;

const activeProductId=localStorage.getItem("eKhokhaActiveProductId")||"PROD-001";
let productData=typeof getProductById==="function"?getProductById(activeProductId):null;
let selectedVariant=null;
let quantity=1;
let currentImages=[];
let ratingData={score:0,count:0};

const $=s=>document.querySelector(s);
const mainImage=$("#main-product-image");
const thumbnailList=$("#thumbnail-list");
const ratingBadge=$("#product-rating-badge");
const ratingSummary=$("#product-rating-summary");
const ratingPreview=$("#product-page-rating-preview");
const currentPriceEl=$(".current-price");
const originalPriceEl=$(".original-price");
const discountEl=$(".discount-percent");
const descriptionEl=$(".product-description");
const sizeList=$(".size-list");
const stockStatusEl=$(".stock-status");
const qtyNumber=$(".qty-number");
const addToCartBtn=$("#add-to-cart-btn");
const buyNowBtn=$("#buy-now-btn");

function money(value){
return "₹"+Number(value||0).toLocaleString("en-IN");
}

function calculateDiscount(current,original){
current=Number(current||0);
original=Number(original||0);
if(!original||original<=current)return 0;
return Math.round(((original-current)/original)*100);
}

async function loadDirectProductImages(){
try{
const {data,error}=await supabaseClient.from("product_images").select("image_url,display_order,is_primary").eq("product_id",activeProductId).order("display_order",{ascending:true});
if(error)throw error;
if(data&&data.length){
return data.slice(0,6).sort((a,b)=>{
if(a.is_primary&&!b.is_primary)return-1;
if(!a.is_primary&&b.is_primary)return 1;
return Number(a.display_order||0)-Number(b.display_order||0);
}).map(x=>x.image_url).filter(Boolean);
}
}catch(e){console.error("Product image fetch failed:",e)}
return[];
}

async function loadRatings(){
ratingData={score:0,count:0};
try{
const {data,error}=await supabaseClient.from("reviews").select("rating").eq("product_id",activeProductId).eq("status","approved");
if(error)throw error;
if(data&&data.length){
const total=data.reduce((sum,r)=>sum+Number(r.rating||0),0);
ratingData.count=data.length;
ratingData.score=Math.round((total/data.length)*10)/10;
}
}catch(e){console.error("Rating fetch failed:",e)}
renderRatings();
}

function renderRatings(){
if(ratingData.count>0){
const rounded=Math.round(ratingData.score);
const stars="★".repeat(rounded)+"☆".repeat(5-rounded);
if(ratingBadge){
ratingBadge.style.display="flex";
ratingBadge.innerHTML=`<span>${ratingData.score}</span><span class="material-symbols-outlined" style="font-size:14px">star</span>`;
}
if(ratingSummary)ratingSummary.textContent=`${ratingData.count.toLocaleString("en-IN")} ${ratingData.count===1?"review":"reviews"}`;
if(ratingPreview){
ratingPreview.innerHTML=`
<div style="font-size:36px;font-weight:700;color:#1a1a1a;line-height:1">${ratingData.score}</div>
<div>
<div style="color:#ffb800;font-size:18px">${stars}</div>
<div style="font-size:12px;color:#636e72;margin-top:4px">Based on ${ratingData.count.toLocaleString("en-IN")} approved ${ratingData.count===1?"review":"reviews"}</div>
</div>`;
}
}else{
if(ratingBadge){
ratingBadge.style.display="none";
ratingBadge.innerHTML="";
}
if(ratingSummary)ratingSummary.textContent="No reviews yet";
if(ratingPreview)ratingPreview.innerHTML=`<div class="no-rating">No reviews yet. Be the first to review!</div>`;
}
}

function renderGallery(images){
if(!mainImage||!thumbnailList)return;
thumbnailList.innerHTML="";
currentImages=(images||[]).filter(Boolean).slice(0,6);

if(!currentImages.length){
mainImage.removeAttribute("src");
mainImage.alt="Product image unavailable";
thumbnailList.innerHTML=`<span style="padding:10px;color:#777;font-size:13px">No product images available</span>`;
return;
}

mainImage.src=currentImages[0];
mainImage.alt=productData?.basic_info?.name||"Product Image";

currentImages.forEach((url,index)=>{
const img=document.createElement("img");
img.src=url;
img.alt=`Product image ${index+1}`;
img.className=index===0?"active":"";
img.loading=index===0?"eager":"lazy";
img.addEventListener("click",()=>{
mainImage.src=url;
document.querySelectorAll("#thumbnail-list img").forEach(x=>x.classList.remove("active"));
img.classList.add("active");
});
img.addEventListener("error",()=>img.style.display="none");
thumbnailList.appendChild(img);
});
}

function updateVariantStock(){
if(!stockStatusEl)return;
if(!selectedVariant){
stockStatusEl.textContent="Out of Stock";
stockStatusEl.style.color="#d63031";
if(addToCartBtn)addToCartBtn.disabled=true;
if(buyNowBtn)buyNowBtn.disabled=true;
return;
}

const stock=Number(selectedVariant.stock_quantity||0);

if(stock<=0){
stockStatusEl.textContent="Out of Stock";
stockStatusEl.style.color="#d63031";
if(addToCartBtn)addToCartBtn.disabled=true;
if(buyNowBtn)buyNowBtn.disabled=true;
}else if(stock<=5){
stockStatusEl.textContent=`Only ${stock} left`;
stockStatusEl.style.color="#e67e22";
if(addToCartBtn)addToCartBtn.disabled=false;
if(buyNowBtn)buyNowBtn.disabled=false;
}else{
stockStatusEl.textContent="In Stock";
stockStatusEl.style.color="green";
if(addToCartBtn)addToCartBtn.disabled=false;
if(buyNowBtn)buyNowBtn.disabled=false;
}

if(quantity>stock){
quantity=stock;
if(quantity<1)quantity=1;
qtyNumber.textContent=quantity;
}
}

function renderVariants(){
if(!sizeList)return;
sizeList.innerHTML="";
const variants=Array.isArray(productData?.variants)?productData.variants:[];

if(!variants.length){
selectedVariant={variant_id:null,variant_type:null,variant_value:null,stock_quantity:999999,status:"active"};
updateVariantStock();
return;
}

let firstAvailable=null;

variants.forEach(variant=>{
const btn=document.createElement("button");
btn.type="button";
btn.className="size-btn";
btn.textContent=variant.variant_value||"Default";

const available=Number(variant.stock_quantity||0)>0&&variant.status==="active";
if(!available){
btn.disabled=true;
btn.style.opacity=".5";
btn.style.cursor="not-allowed";
}

if(!firstAvailable&&available)firstAvailable=variant;

btn.addEventListener("click",()=>{
if(btn.disabled)return;
document.querySelectorAll(".size-list .size-btn").forEach(x=>x.classList.remove("active"));
btn.classList.add("active");
selectedVariant=variant;
quantity=1;
qtyNumber.textContent="1";
updateVariantStock();
});

sizeList.appendChild(btn);
});

if(firstAvailable){
selectedVariant=firstAvailable;
const firstBtn=[...sizeList.querySelectorAll(".size-btn")].find(btn=>btn.textContent===firstAvailable.variant_value);
if(firstBtn)firstBtn.classList.add("active");
}

updateVariantStock();
}

function setupQuantity(){
$("#qty-minus")?.addEventListener("click",()=>{
if(quantity>1){
quantity--;
qtyNumber.textContent=quantity;
}
});

$("#qty-plus")?.addEventListener("click",()=>{
const stock=Number(selectedVariant?.stock_quantity||0);
if(quantity<10&&quantity<stock){
quantity++;
qtyNumber.textContent=quantity;
}else if(stock>0&&quantity>=stock){
alert(`Only ${stock} item(s) available.`);
}
});
}

function getCart(){
try{return JSON.parse(localStorage.getItem("eKhokhaCart"))||[]}catch(e){return[]}
}

function saveCart(cart){
localStorage.setItem("eKhokhaCart",JSON.stringify(cart));
if(typeof updateCartBadge==="function")updateCartBadge();
}

function validateSelection(){
if(!selectedVariant){
alert("Please select an available variant.");
return false;
}

const stock=Number(selectedVariant.stock_quantity||0);

if(stock<=0){
alert("This variant is out of stock.");
return false;
}

if(quantity>stock){
alert(`Only ${stock} item(s) available.`);
return false;
}

return true;
}

function setupCart(){
addToCartBtn?.addEventListener("click",()=>{
if(addToCartBtn.disabled||!validateSelection())return;

const cart=getCart();
const existingIndex=cart.findIndex(item=>item.product_id===activeProductId&&item.variant_id===selectedVariant.variant_id);

if(existingIndex>-1){
const newQty=Number(cart[existingIndex].quantity||0)+quantity;
if(newQty>Number(selectedVariant.stock_quantity||0)){
alert(`Only ${selectedVariant.stock_quantity} item(s) available.`);
return;
}
cart[existingIndex].quantity=newQty;
}else{
cart.push({
product_id:activeProductId,
variant_id:selectedVariant.variant_id,
variant_type:selectedVariant.variant_type,
variant_value:selectedVariant.variant_value,
quantity
});
}

saveCart(cart);
alert("Added to Cart!");
});

buyNowBtn?.addEventListener("click",e=>{
e.preventDefault();
if(buyNowBtn.disabled||!validateSelection())return;

const buyNowItem={
product_id:activeProductId,
variant_id:selectedVariant.variant_id,
variant_type:selectedVariant.variant_type,
variant_value:selectedVariant.variant_value,
quantity
};

localStorage.setItem("eKhokhaCheckoutData",JSON.stringify(buyNowItem));
localStorage.setItem("eKhokhaCheckoutMode","route_product");
window.location.href="checkout.html";
});
}

function setupPincode(){
const input=$("#pincode-input");
const checkBtn=$("#pincode-check-btn");
const result=$("#delivery-result");

const noidaPincodes=new Set([
"201301","201302","201303","201304","201305","201306","201307","201308","201309","201310","201311","201312","201313","201314","201315","201316","201317","201318"
]);

function check(){
const pincode=(input.value||"").trim();
result.className="delivery-result";

if(!/^[0-9]{6}$/.test(pincode)){
result.textContent="Please enter a valid 6-digit pincode.";
result.classList.add("error");
return;
}

if(noidaPincodes.has(pincode)){
result.textContent=`✓ Delivery available at ${pincode}`;
result.classList.add("success");
}else{
result.textContent=`✕ Sorry, delivery is not available at ${pincode}.`;
result.classList.add("error");
}
}

checkBtn?.addEventListener("click",check);

input?.addEventListener("input",()=>{
input.value=input.value.replace(/\D/g,"").slice(0,6);
result.className="delivery-result";
result.textContent="";
});

input?.addEventListener("keydown",e=>{
if(e.key==="Enter")check();
});
}

function setupShare(){
$("#share-product-btn")?.addEventListener("click",async()=>{
const shareData={
title:productData?.basic_info?.name||"E-KHOKHA Product",
text:`Check out ${productData?.basic_info?.name||"this product"} on E-KHOKHA`,
url:window.location.href
};

try{
if(navigator.share)await navigator.share(shareData);
else{
await navigator.clipboard.writeText(window.location.href);
alert("Product link copied!");
}
}catch(e){}
});
}

if(!productData){
productTitle.textContent="Product not found";
return;
}

const info=productData.basic_info||{};
const pricing=productData.pricing||{};

productTitle.textContent=info.name||"Product";
currentPriceEl.textContent=money(pricing.current_price);

if(Number(pricing.original_price)>0){
originalPriceEl.textContent=money(pricing.original_price);
originalPriceEl.style.display="inline";
const discount=calculateDiscount(pricing.current_price,pricing.original_price);
discountEl.textContent=discount>0?`${discount}% OFF`:"";
discountEl.style.display=discount>0?"inline":"none";
}else{
originalPriceEl.style.display="none";
discountEl.style.display="none";
}

descriptionEl.textContent=info.description||"No product details available.";

renderVariants();
setupQuantity();
setupCart();
setupPincode();
setupShare();
await loadRatings();

let images=Array.isArray(productData.images)?productData.images.filter(Boolean):[];

if(!images.length||images.length<3){
const directImages=await loadDirectProductImages();
if(directImages.length)images=directImages;
}

renderGallery(images);

if(typeof updateCartBadge==="function")updateCartBadge();
});