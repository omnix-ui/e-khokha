let allInventory=[],editingVariantId=null;

function setInventoryState(state,message=""){
 const loading=document.getElementById("inventoryLoading"),empty=document.getElementById("inventoryEmpty"),table=document.getElementById("inventoryTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}

function getStockStatus(stock){
 stock=Number(stock||0);
 if(stock<=0)return"out";
 if(stock<=5)return"low";
 return"in";
}

async function loadInventory(){
 setInventoryState("loading");
 const {data,error}=await supabaseClient.from("product_variants").select("variant_id,product_id,variant_type,variant_value,stock_quantity,status,updated_at,products(name,status)").order("updated_at",{ascending:false});
 if(error){
  console.error("Inventory load error:",error);
  allInventory=[];
  setInventoryState("error","Unable to load inventory.");
  return;
 }
 allInventory=data||[];
 renderInventory();
}

function renderInventory(){
 const body=document.getElementById("inventoryBody"),search=document.getElementById("inventorySearch").value.trim().toLowerCase(),filter=document.getElementById("inventoryFilter").value;
 body.innerHTML="";
 const filtered=allInventory.filter(v=>{
  const product=String(v.products?.name||"").toLowerCase();
  const variant=`${v.variant_type||""} ${v.variant_value||""}`.toLowerCase();
  const stockStatus=getStockStatus(v.stock_quantity);
  return (!search||product.includes(search)||variant.includes(search))&&(filter==="all"||stockStatus===filter);
 });
 if(!filtered.length){setInventoryState("empty","No inventory found.");return}
 setInventoryState("ready");
 filtered.forEach(v=>{
  const row=document.createElement("tr"),product=document.createElement("td"),variant=document.createElement("td"),stock=document.createElement("td"),status=document.createElement("td"),action=document.createElement("td");
  product.className="product-name";
  product.textContent=v.products?.name||"—";
  variant.textContent=v.variant_type&&v.variant_value?`${v.variant_type}: ${v.variant_value}`:v.variant_value||v.variant_type||"—";
  stock.textContent=Number(v.stock_quantity||0);
  const stockStatus=getStockStatus(v.stock_quantity);
  const badge=document.createElement("span");
  badge.className=`stock-badge ${stockStatus}`;
  badge.textContent=stockStatus==="in"?"In Stock":stockStatus==="low"?"Low Stock":"Out of Stock";
  status.appendChild(badge);
  const edit=document.createElement("button");
  edit.type="button";
  edit.className="small-btn";
  edit.textContent="Update";
  edit.addEventListener("click",()=>openStockModal(v));
  action.appendChild(edit);
  row.append(product,variant,stock,status,action);
  body.appendChild(row);
 });
}

function showStockMessage(message,type=""){
 const box=document.getElementById("stockFormMessage");
 box.textContent=message;
 box.className=`form-message ${type}`.trim();
}

function clearStockMessage(){
 const box=document.getElementById("stockFormMessage");
 box.textContent="";
 box.className="form-message";
}

function openStockModal(v){
 editingVariantId=v.variant_id;
 document.getElementById("stockVariantId").value=v.variant_id;
 document.getElementById("stockProduct").value=v.products?.name||"—";
 document.getElementById("stockVariant").value=v.variant_type&&v.variant_value?`${v.variant_type}: ${v.variant_value}`:v.variant_value||v.variant_type||"—";
 document.getElementById("stockQuantity").value=Number(v.stock_quantity||0);
 document.getElementById("stockProductName").textContent=`Update stock for ${v.products?.name||"product"}.`;
 clearStockMessage();
 document.getElementById("stockModal").classList.remove("hidden");
 document.body.classList.add("modal-open");
 document.getElementById("stockQuantity").focus();
}

function closeStockModal(){
 document.getElementById("stockModal").classList.add("hidden");
 document.body.classList.remove("modal-open");
 editingVariantId=null;
 document.getElementById("stockForm").reset();
 document.getElementById("stockVariantId").value="";
 clearStockMessage();
}

async function saveStock(e){
 e.preventDefault();
 clearStockMessage();
 const quantity=Number(document.getElementById("stockQuantity").value);
 if(!Number.isInteger(quantity)||quantity<0){
  showStockMessage("Stock must be a whole number 0 or greater.","error");
  return;
 }
 if(!editingVariantId)return;
 const saveBtn=document.getElementById("saveStockBtn");
 saveBtn.disabled=true;
 saveBtn.textContent="Updating...";
 try{
  const {error}=await supabaseClient.from("product_variants").update({stock_quantity:quantity,updated_at:new Date().toISOString()}).eq("variant_id",editingVariantId);
  if(error)throw error;
  closeStockModal();
  await loadInventory();
 }catch(error){
  console.error("Stock update error:",error);
  showStockMessage(error?.message||"Unable to update stock.","error");
 }finally{
  saveBtn.disabled=false;
  saveBtn.textContent="Update Stock";
 }
}

document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();
 if(!ok)return;
 const search=document.getElementById("inventorySearch"),filter=document.getElementById("inventoryFilter"),close=document.getElementById("closeStockModal"),cancel=document.getElementById("cancelStockBtn"),form=document.getElementById("stockForm"),modal=document.getElementById("stockModal");
 if(search)search.addEventListener("input",renderInventory);
 if(filter)filter.addEventListener("change",renderInventory);
 if(close)close.addEventListener("click",closeStockModal);
 if(cancel)cancel.addEventListener("click",closeStockModal);
 if(form)form.addEventListener("submit",saveStock);
 if(modal)modal.addEventListener("click",e=>{if(e.target===modal)closeStockModal()});
 await loadInventory();
});