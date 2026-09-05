let allReviews=[];
async function loadReviews(){
 setReviewState("loading");
 const {data,error}=await supabaseClient.from("reviews").select(`review_id,product_id,user_id,rating,review_text,status,is_verified_purchase,created_at,updated_at,products(name)`).order("created_at",{ascending:false});
 if(error){console.error("Reviews load error:",error);setReviewState("error","Unable to load reviews.");return}
 allReviews=data||[];
 const ids=[...new Set(allReviews.map(r=>r.user_id).filter(Boolean))];
 let profiles=[];
 if(ids.length){
  const {data:p,error:pError}=await supabaseClient.from("profiles").select("user_id,full_name").in("user_id",ids);
  if(!pError)profiles=p||[];
 }
 const map=new Map(profiles.map(p=>[p.user_id,p.full_name]));
 allReviews=allReviews.map(r=>({...r,customer_name:map.get(r.user_id)||"Customer"}));
 renderReviews();
}
function setReviewState(state,message=""){
 const loading=document.getElementById("reviewsLoading"),empty=document.getElementById("reviewsEmpty"),table=document.getElementById("reviewsTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}
function renderReviews(){
 const body=document.getElementById("reviewsBody"),search=(document.getElementById("reviewSearch")?.value||"").trim().toLowerCase(),filter=document.getElementById("reviewFilter")?.value||"all";
 if(!body)return;
 body.innerHTML="";
 const filtered=allReviews.filter(r=>{
  const text=`${r.products?.name||""} ${r.customer_name||""} ${r.review_text||""}`.toLowerCase();
  return(!search||text.includes(search))&&(filter==="all"||r.status===filter);
 });
 if(!filtered.length){setReviewState("empty","No reviews found.");return}
 setReviewState("ready");
 filtered.forEach(r=>{
  const row=document.createElement("tr");
  const product=document.createElement("td"),customer=document.createElement("td"),rating=document.createElement("td"),review=document.createElement("td"),verified=document.createElement("td"),date=document.createElement("td"),status=document.createElement("td"),action=document.createElement("td");
  product.textContent=r.products?.name||"—";
  customer.textContent=r.customer_name||"Customer";
  rating.textContent=`${Number(r.rating||0)}/5`;
  review.textContent=r.review_text||"—";
  review.className="review-text";
  verified.textContent=r.is_verified_purchase?"Yes":"No";
  const d=r.created_at?new Date(r.created_at):null;
  date.textContent=d&&!isNaN(d)?d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const badge=document.createElement("span");
  badge.className=`status-badge ${r.status==="approved"?"active":r.status==="rejected"?"inactive":"pending"}`;
  badge.textContent=r.status||"pending";
  status.appendChild(badge);
  const view=document.createElement("button");
  view.type="button";view.className="small-btn";view.textContent="View";
  view.addEventListener("click",()=>viewReview(r));
  action.appendChild(view);
  if(r.status==="pending"){
   const approve=document.createElement("button"),reject=document.createElement("button");
   approve.type="button";approve.className="small-btn approve-btn";approve.textContent="Approve";
   reject.type="button";reject.className="small-btn reject-btn";reject.textContent="Reject";
   approve.addEventListener("click",()=>updateReviewStatus(r.review_id,"approved"));
   reject.addEventListener("click",()=>updateReviewStatus(r.review_id,"rejected"));
   action.append(approve,reject);
  }
  row.append(product,customer,rating,review,verified,date,status,action);
  body.appendChild(row);
 });
}
function viewReview(r){
 const old=document.getElementById("reviewDetailModal");if(old)old.remove();
 const overlay=document.createElement("div");overlay.id="reviewDetailModal";overlay.className="modal-overlay";
 const modal=document.createElement("div");modal.className="product-modal review-detail-modal";
 modal.innerHTML=`<div class="modal-header"><div><h2>Review Details</h2><p>${escapeHtml(r.products?.name||"Product")}</p></div><button type="button" class="modal-close" id="closeReviewModal">×</button></div><div id="reviewDetailContent" style="padding:24px"></div>`;
 overlay.appendChild(modal);document.body.appendChild(overlay);document.body.classList.add("modal-open");
 const box=document.getElementById("reviewDetailContent");
 const items=[["Customer",r.customer_name||"Customer"],["Rating",`${Number(r.rating||0)}/5`],["Verified Purchase",r.is_verified_purchase?"Yes":"No"],["Status",r.status||"pending"],["Date",r.created_at?new Date(r.created_at).toLocaleString("en-IN"):"—"]];
 items.forEach(([label,value])=>{
  const div=document.createElement("div");div.style.marginBottom="18px";
  const l=document.createElement("strong");l.textContent=label;l.style.display="block";l.style.marginBottom="6px";
  const v=document.createElement("div");v.textContent=value;v.style.color="#555";
  div.append(l,v);box.appendChild(div);
 });
 const title=document.createElement("strong");title.textContent="Review";title.style.display="block";title.style.marginBottom="6px";
 const text=document.createElement("div");text.textContent=r.review_text||"No review text.";text.style.padding="15px";text.style.background="#f7f7f7";text.style.borderRadius="10px";text.style.lineHeight="1.5";
 box.append(title,text);
 document.getElementById("closeReviewModal").addEventListener("click",closeReviewModal);
 overlay.addEventListener("click",e=>{if(e.target===overlay)closeReviewModal()});
}
function closeReviewModal(){
 const modal=document.getElementById("reviewDetailModal");if(modal)modal.remove();
 document.body.classList.remove("modal-open");
}
function escapeHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
async function updateReviewStatus(reviewId,status){
 if(!["approved","rejected"].includes(status))return;
 const action=status==="approved"?"approve":"reject";
 if(!confirm(`Are you sure you want to ${action} this review?`))return;
 const {error}=await supabaseClient.from("reviews").update({status,updated_at:new Date().toISOString()}).eq("review_id",reviewId);
 if(error){console.error("Review update error:",error);alert(error.message||"Unable to update review.");return}
 await loadReviews();
}
document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();if(!ok)return;
 const search=document.getElementById("reviewSearch"),filter=document.getElementById("reviewFilter");
 if(search)search.addEventListener("input",renderReviews);
 if(filter)filter.addEventListener("change",renderReviews);
 await loadReviews();
});