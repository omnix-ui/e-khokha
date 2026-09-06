let eKhokhaCategories=[];
let eKhokhaProducts=[];

let eKhokhaReviews=[
{review_id:"REV-001",product_id:"PROD-001",user_id:"auth-uuid-placeholder-001",rating:5,review_text:"Amazing t-shirt! The fabric is really soft and comfortable.",created_at:"2026-08-10T14:30:00Z",updated_at:"2026-08-10T14:30:00Z",status:"approved",is_verified_purchase:true},
{review_id:"REV-002",product_id:"PROD-001",user_id:"auth-uuid-placeholder-002",rating:4,review_text:"Good fit, but color is slightly darker than the image.",created_at:"2026-08-11T10:15:00Z",updated_at:"2026-08-11T10:15:00Z",status:"approved",is_verified_purchase:true},
{review_id:"REV-003",product_id:"PROD-002",user_id:"auth-uuid-placeholder-001",rating:5,review_text:"Best earbuds at this price. Bass is crazy!",created_at:"2026-08-12T09:00:00Z",updated_at:"2026-08-12T09:00:00Z",status:"pending",is_verified_purchase:false}
];

function getApprovedReviews(productId){
return eKhokhaReviews.filter(r=>r.product_id===productId&&r.status==="approved");
}

function calculateDynamicRating(productId){
const approvedReviews=getApprovedReviews(productId);
if(!approvedReviews.length)return{score:0,rating_count:0};
const sum=approvedReviews.reduce((total,review)=>total+review.rating,0);
const avgScore=(sum/approvedReviews.length).toFixed(1);
return{score:parseFloat(avgScore),rating_count:approvedReviews.length};
}

function submitReview(productId,userId,ratingValue,reviewText){
if(ratingValue<1||ratingValue>5||!Number.isInteger(ratingValue))return{success:false,message:"Invalid rating. Must be between 1 and 5."};
const cleanText=reviewText?reviewText.trim():"";
if(cleanText===""||cleanText.length>500)return{success:false,message:"Review text must be between 1 and 500 characters."};
const existingIndex=eKhokhaReviews.findIndex(r=>r.product_id===productId&&r.user_id===userId);
const timestamp=new Date().toISOString();

if(existingIndex>-1){
eKhokhaReviews[existingIndex].rating=ratingValue;
eKhokhaReviews[existingIndex].review_text=cleanText;
eKhokhaReviews[existingIndex].updated_at=timestamp;
eKhokhaReviews[existingIndex].status="pending";
return{success:true,action:"updated",message:"Review updated and sent for approval."};
}

const newReview={review_id:`REV-${Date.now()}`,product_id:productId,user_id:userId,rating:ratingValue,review_text:cleanText,created_at:timestamp,updated_at:timestamp,status:"pending",is_verified_purchase:false};
eKhokhaReviews.push(newReview);
return{success:true,action:"created",message:"Review submitted for approval."};
}

async function loadEkhokhaCatalog(){
try{
const[categoriesRes,productsRes,variantsRes,specsRes,imagesRes]=await Promise.all([
supabaseClient.from("categories").select("*").eq("status","active").order("created_at",{ascending:true}),
supabaseClient.from("products").select("*").eq("status","active").order("created_at",{ascending:true}),
supabaseClient.from("product_variants").select("*").eq("status","active"),
supabaseClient.from("product_specs").select("*"),
supabaseClient.from("product_images").select("*").order("display_order",{ascending:true})
]);

if(categoriesRes.error)throw categoriesRes.error;
if(productsRes.error)throw productsRes.error;
if(variantsRes.error)throw variantsRes.error;
if(specsRes.error)throw specsRes.error;
if(imagesRes.error)throw imagesRes.error;

eKhokhaCategories=(categoriesRes.data||[]).map(cat=>({
category_id:cat.category_id,
name:cat.name,
slug:cat.slug,
icon:cat.icon||"category"
}));

eKhokhaProducts=(productsRes.data||[]).map(product=>{
const productVariants=(variantsRes.data||[]).filter(v=>v.product_id===product.product_id).map(v=>({
variant_id:v.variant_id,
variant_type:v.variant_type,
variant_value:v.variant_value,
stock_quantity:v.stock_quantity||0,
status:v.status
}));

const productSpecs={};
(specsRes.data||[]).filter(s=>s.product_id===product.product_id).forEach(s=>{
productSpecs[s.spec_name]=s.spec_value;
});

const productImages=(imagesRes.data||[])
.filter(i=>i.product_id===product.product_id)
.sort((a,b)=>a.display_order-b.display_order)
.map(i=>i.image_url);

const stockCount=productVariants.reduce((total,v)=>total+Number(v.stock_quantity||0),0);

let stockStatus="in_stock";
if(stockCount<=0)stockStatus="out_of_stock";
else if(stockCount<=5)stockStatus="low_stock";

const discount=product.discount_percentage!==null&&product.discount_percentage!==undefined
?Number(product.discount_percentage)
:(product.original_price>0
?Math.round(((product.original_price-product.current_price)/product.original_price)*100)
:0);

const categoryInfo=eKhokhaCategories.find(cat=>cat.category_id===product.category_id);

return{
product_id:product.product_id,
basic_info:{
name:product.name,
description:product.description||"",
category_id:product.category_id,
category:categoryInfo?categoryInfo.name:""
},
pricing:{
current_price:Number(product.current_price),
original_price:product.original_price!==null?Number(product.original_price):Number(product.current_price),
discount:discount
},
rating:{score:0,rating_count:0,review_count:0},
stock:{status:stockStatus,count:stockCount},
variants:productVariants,
specs:productSpecs,
images:productImages
};
});

console.log("✅ E-KHOKHA Catalog Loaded");
}catch(error){
console.error("❌ E-KHOKHA Catalog Load Failed:",error);
eKhokhaCategories=[];
eKhokhaProducts=[];
throw error;
}
}

window.getProductById=function(productId){
return eKhokhaProducts.find(product=>product.product_id===productId)||null;
};

window.eKhokhaDataReady=loadEkhokhaCatalog();

window.openProduct=function(productId){
localStorage.setItem("eKhokhaActiveProductId",productId);
window.location.href="pages/product.html";
};

function updateCartBadge(){
const badge=document.getElementById("cart-badge");
if(!badge)return;

let cart=[];
try{
cart=JSON.parse(localStorage.getItem("eKhokhaCart"))||[];
}catch(error){
console.error("Cart data error:",error);
}

const totalItems=cart.reduce((total,item)=>total+Number(item.quantity||0),0);
badge.textContent=totalItems;
badge.style.display=totalItems>0?"flex":"none";
}

async function updateNotificationBadge(){
const badge=document.getElementById("notif-badge");
if(!badge)return;

const{data:{user},error:userError}=await supabaseClient.auth.getUser();

if(userError||!user){
badge.style.display="none";
return;
}

const{count,error}=await supabaseClient
.from("notifications")
.select("notification_id",{count:"exact",head:true})
.eq("user_id",user.id)
.eq("is_read",false);

if(error){
console.error("Notification badge error:",error);
badge.style.display="none";
return;
}

const unread=count||0;

if(unread>0){
badge.textContent=unread>99?"99+":unread;
badge.style.display="flex";
}else{
badge.style.display="none";
}
}

document.addEventListener("DOMContentLoaded",async()=>{
try{
await window.eKhokhaDataReady;
}catch(error){
console.error("E-KHOKHA data initialization failed:",error);
}

updateCartBadge();
updateNotificationBadge();

const homeSearchBox=document.querySelector(".search-container");
const homeSearchInput=document.querySelector(".search-box input");

if(homeSearchBox){
homeSearchBox.style.cursor="pointer";
homeSearchBox.addEventListener("click",()=>{
window.location.href="pages/search.html";
});
}

if(homeSearchInput){
homeSearchInput.style.cursor="pointer";
homeSearchInput.addEventListener("click",e=>{
e.stopPropagation();
window.location.href="pages/search.html";
});
}

const homeCatList=document.getElementById("home-category-list");

if(homeCatList){
homeCatList.innerHTML=`
<div class="category-card active" onclick="window.location.href='pages/category.html?category=all'">
<div class="cat-icon"><span class="material-symbols-outlined">apps</span></div>
<span>All</span>
</div>
`;

eKhokhaCategories.forEach(cat=>{
homeCatList.innerHTML+=`
<div class="category-card" onclick="window.location.href='pages/category.html?category=${encodeURIComponent(cat.slug)}'">
<div class="cat-icon"><span class="material-symbols-outlined">${cat.icon}</span></div>
<span>${cat.name}</span>
</div>
`;
});

homeCatList.innerHTML+=`
<div class="category-card" onclick="window.location.href='pages/category.html'">
<div class="cat-icon"><span class="material-symbols-outlined">more_horiz</span></div>
<span>More</span>
</div>
`;
}

const homeProductGrid=document.getElementById("home-product-grid");

if(homeProductGrid){
homeProductGrid.innerHTML="";

eKhokhaProducts.forEach(product=>{
const card=document.createElement("div");
card.className="product-card";
card.onclick=()=>openProduct(product.product_id);

const image=product.images[0]||"";
const name=product.basic_info.name||"Product";

card.innerHTML=`
<div class="product-image">
<img src="${image}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;">
</div>
<div class="product-info">
<p class="product-name">${name}</p>
<div class="price-row">
<span class="current-price">₹${product.pricing.current_price}</span>
<span class="original-price">₹${product.pricing.original_price}</span>
<span class="discount">${product.pricing.discount}% off</span>
</div>
<div class="rating">★ ${product.rating.score}</div>
</div>
`;

homeProductGrid.appendChild(card);
});
}
});

window.addEventListener("focus",()=>{
updateCartBadge();
updateNotificationBadge();
});