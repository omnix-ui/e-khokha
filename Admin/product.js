let allProducts=[],editingProductId=null;
const MAX_IMAGES=6,MAX_IMAGE_SIZE=5*1024*1024,ALLOWED_TYPES=["image/jpeg","image/png","image/webp"];
let uploadedStoragePaths=new Set(),removedStoragePaths=new Set();

function setProductState(state,message=""){
const loading=document.getElementById("productsLoading"),empty=document.getElementById("productsEmpty"),table=document.getElementById("productsTable");
if(loading)loading.style.display=state==="loading"?"block":"none";
if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
if(table)table.style.display=state==="ready"?"table":"none";
}

async function loadProducts(){
setProductState("loading");
const{data,error}=await supabaseClient.from("products").select(`product_id,category_id,name,description,current_price,original_price,discount_percentage,status,created_at,updated_at,categories(name),product_variants(variant_id,variant_type,variant_value,stock_quantity,status)`).order("created_at",{ascending:false});
if(error){console.error("Products load error:",error);allProducts=[];setProductState("error","Unable to load products.");return}
allProducts=data||[];renderProducts();
}

function renderProducts(){
const body=document.getElementById("productsBody"),search=document.getElementById("productSearch").value.trim().toLowerCase(),status=document.getElementById("statusFilter").value;
body.innerHTML="";
const filtered=allProducts.filter(p=>{const name=String(p.name||"").toLowerCase();return(!search||name.includes(search))&&(status==="all"||p.status===status)});
if(!filtered.length){setProductState("empty","No products found.");return}
setProductState("ready");
filtered.forEach(p=>{
const row=document.createElement("tr"),name=document.createElement("td"),category=document.createElement("td"),price=document.createElement("td"),discount=document.createElement("td"),stock=document.createElement("td"),statusCell=document.createElement("td"),action=document.createElement("td");
name.className="product-name";name.textContent=p.name||"—";
category.textContent=p.categories?.name||"—";
price.textContent=`₹${Number(p.current_price||0).toLocaleString("en-IN")}`;
discount.textContent=p.discount_percentage!=null?`${Number(p.discount_percentage)}%`:"—";
stock.textContent=(p.product_variants||[]).reduce((t,v)=>t+Number(v.stock_quantity||0),0);
const badge=document.createElement("span");badge.className=`status-badge ${p.status==="active"?"active":"inactive"}`;badge.textContent=p.status||"unknown";statusCell.appendChild(badge);
const edit=document.createElement("button");edit.type="button";edit.className="small-btn";edit.textContent="Edit";edit.addEventListener("click",()=>openEditProduct(p.product_id));action.appendChild(edit);
row.append(name,category,price,discount,stock,statusCell,action);body.appendChild(row);
});
}

async function loadCategories(selectedId=""){
const select=document.getElementById("productCategory");select.innerHTML='<option value="">Select category</option>';
const{data,error}=await supabaseClient.from("categories").select("category_id,name,status").order("name",{ascending:true});
if(error){console.error("Categories load error:",error);return}
(data||[]).forEach(c=>{const o=document.createElement("option");o.value=c.category_id;o.textContent=c.name+(c.status==="inactive"?" (Inactive)":"");if(c.category_id===selectedId)o.selected=true;select.appendChild(o)});
}

function showProductMessage(message,type=""){
const box=document.getElementById("productFormMessage");box.textContent=message;box.className=`form-message ${type}`.trim();
}

function clearProductMessage(){
const box=document.getElementById("productFormMessage");box.textContent="";box.className="form-message";
}

function setImageStatus(message,type=""){
const box=document.getElementById("imageUploadStatus");if(!box)return;
box.textContent=message;box.style.color=type==="error"?"#d63031":type==="success"?"#168a42":"#555";
}

function updateImageCount(){
const count=document.querySelectorAll(".image-row").length,countEl=document.getElementById("imageCount"),upload=document.getElementById("productImageFiles");
if(countEl)countEl.textContent=`${count} / ${MAX_IMAGES} images`;
if(upload)upload.disabled=count>=MAX_IMAGES;
}

function openProductModal(){
document.getElementById("productModal").classList.remove("hidden");document.body.classList.add("modal-open");
}

function resetImageState(){
uploadedStoragePaths=new Set();removedStoragePaths=new Set();setImageStatus("");updateImageCount();
}

function closeProductModal(){
document.getElementById("productModal").classList.add("hidden");document.body.classList.remove("modal-open");editingProductId=null;resetImageState();
document.getElementById("productForm").reset();document.getElementById("productId").value="";
document.getElementById("editorTitle").textContent="Add Product";document.getElementById("editorSubtitle").textContent="Create a new product for your store.";
document.getElementById("variantsList").innerHTML="";document.getElementById("specsList").innerHTML="";document.getElementById("imagesList").innerHTML="";clearProductMessage();
}

async function openAddProduct(){
editingProductId=null;resetImageState();document.getElementById("productForm").reset();document.getElementById("productId").value="";
document.getElementById("editorTitle").textContent="Add Product";document.getElementById("editorSubtitle").textContent="Create a new product for your store.";
document.getElementById("variantsList").innerHTML="";document.getElementById("specsList").innerHTML="";document.getElementById("imagesList").innerHTML="";clearProductMessage();
await loadCategories();addVariantRow();addSpecRow();updateImageCount();openProductModal();
}

async function openEditProduct(productId){
clearProductMessage();resetImageState();
const{data,error}=await supabaseClient.from("products").select(`product_id,category_id,name,description,current_price,original_price,discount_percentage,status,product_variants(variant_id,variant_type,variant_value,stock_quantity,status),product_specs(spec_id,spec_name,spec_value),product_images(image_id,image_url,display_order,is_primary)`).eq("product_id",productId).maybeSingle();
if(error||!data){console.error("Product load error:",error);alert("Unable to load product.");return}
editingProductId=data.product_id;document.getElementById("productId").value=data.product_id;
document.getElementById("editorTitle").textContent="Edit Product";document.getElementById("editorSubtitle").textContent="Update product information and inventory.";
document.getElementById("productName").value=data.name||"";document.getElementById("productDescription").value=data.description||"";
document.getElementById("currentPrice").value=data.current_price??"";document.getElementById("originalPrice").value=data.original_price??"";
document.getElementById("discountPercentage").value=data.discount_percentage??"";document.getElementById("productStatus").value=data.status||"active";
await loadCategories(data.category_id);
document.getElementById("variantsList").innerHTML="";document.getElementById("specsList").innerHTML="";document.getElementById("imagesList").innerHTML="";
const variants=data.product_variants||[],specs=data.product_specs||[],images=(data.product_images||[]).sort((a,b)=>{if(a.is_primary&&!b.is_primary)return-1;if(!a.is_primary&&b.is_primary)return 1;return Number(a.display_order||0)-Number(b.display_order||0)});
variants.length?variants.forEach(addVariantRow):addVariantRow();specs.length?specs.forEach(addSpecRow):addSpecRow();images.forEach(addImageRow);
updateImageCount();openProductModal();
}

function addVariantRow(v={}){
const list=document.getElementById("variantsList"),row=document.createElement("div");row.className="dynamic-row variant-row";
row.innerHTML=`<input class="variant-id" type="hidden" value="${escapeAttr(v.variant_id||"")}"><div class="form-group"><label>Type</label><input class="variant-type" type="text" maxlength="50" placeholder="Size / Color" value="${escapeAttr(v.variant_type||"")}"></div><div class="form-group"><label>Value</label><input class="variant-value" type="text" maxlength="100" placeholder="XL / Black" value="${escapeAttr(v.variant_value||"")}"></div><div class="form-group"><label>Stock</label><input class="variant-stock" type="number" min="0" step="1" value="${Number(v.stock_quantity??0)}"></div><div class="form-group"><label>Status</label><select class="variant-status"><option value="active"${v.status==="active"||!v.status?" selected":""}>Active</option><option value="inactive"${v.status==="inactive"?" selected":""}>Inactive</option></select></div><button type="button" class="remove-row-btn">×</button>`;
row.querySelector(".remove-row-btn").addEventListener("click",()=>row.remove());list.appendChild(row);
}

function addSpecRow(s={}){
const list=document.getElementById("specsList"),row=document.createElement("div");row.className="dynamic-row spec-row";
row.innerHTML=`<input class="spec-id" type="hidden" value="${escapeAttr(s.spec_id||"")}"><div class="form-group"><label>Specification</label><input class="spec-name" type="text" maxlength="100" placeholder="Material" value="${escapeAttr(s.spec_name||"")}"></div><div class="form-group"><label>Value</label><input class="spec-value" type="text" maxlength="500" placeholder="Cotton" value="${escapeAttr(s.spec_value||"")}"></div><button type="button" class="remove-row-btn">×</button>`;
row.querySelector(".remove-row-btn").addEventListener("click",()=>row.remove());list.appendChild(row);
}

function addImageRow(i={}){
const list=document.getElementById("imagesList"),row=document.createElement("div");row.className="dynamic-row image-row";row.dataset.imageUrl=i.image_url||"";
const preview=document.createElement("div");preview.className="image-preview";
const img=document.createElement("img");img.alt="Product image preview";img.src=i.image_url||"";img.onerror=()=>img.style.display="none";preview.appendChild(img);
const info=document.createElement("div");info.className="image-info";
const id=document.createElement("input");id.className="image-id";id.type="hidden";id.value=i.image_id||"";
const path=document.createElement("input");path.className="image-storage-path";path.type="hidden";path.value=i.storage_path||"";
const name=document.createElement("div");name.className="image-file-name";name.textContent=i.file_name||"Uploaded image";
const order=document.createElement("div");order.className="form-group image-order-group";order.innerHTML=`<label>Order</label><input class="image-order" type="number" min="1" max="6" step="1" value="${Number(i.display_order??1)}">`;
const primary=document.createElement("label");primary.className="image-primary-label";
const radio=document.createElement("input");radio.className="image-primary";radio.type="radio";radio.name="primaryProductImage";radio.checked=Boolean(i.is_primary);
primary.append(radio,document.createTextNode(" Primary"));
const remove=document.createElement("button");remove.type="button";remove.className="image-remove-btn";remove.textContent="Remove";
remove.addEventListener("click",()=>{const p=path.value.trim();if(p)removedStoragePaths.add(p);row.remove();updateImageCount()});
info.append(id,path,name,order,primary,remove);row.append(preview,info);list.appendChild(row);
radio.addEventListener("change",()=>{if(radio.checked)document.querySelectorAll(".image-primary").forEach(x=>{if(x!==radio)x.checked=false})});
}

function escapeAttr(v){
return String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function collectVariants(){
return[...document.querySelectorAll(".variant-row")].map(r=>({variant_type:r.querySelector(".variant-type").value.trim(),variant_value:r.querySelector(".variant-value").value.trim(),stock_quantity:Number(r.querySelector(".variant-stock").value||0),status:r.querySelector(".variant-status").value})).filter(v=>v.variant_type||v.variant_value);
}

function collectSpecs(){
return[...document.querySelectorAll(".spec-row")].map(r=>({spec_name:r.querySelector(".spec-name").value.trim(),spec_value:r.querySelector(".spec-value").value.trim()})).filter(s=>s.spec_name||s.spec_value);
}

function collectImages(){
return[...document.querySelectorAll(".image-row")].map((r,i)=>({image_id:r.querySelector(".image-id").value.trim()||null,image_url:r.dataset.imageUrl||"",storage_path:r.querySelector(".image-storage-path").value.trim()||null,display_order:Number(r.querySelector(".image-order").value||i+1),is_primary:r.querySelector(".image-primary").checked})).filter(i=>i.image_url);
}

function validateImages(){
const rows=[...document.querySelectorAll(".image-row")];
if(!rows.length)return"Add at least one product image.";
if(rows.length>MAX_IMAGES)return`Maximum ${MAX_IMAGES} images are allowed per product.`;
if(!rows.some(r=>r.querySelector(".image-primary").checked))rows[0].querySelector(".image-primary").checked=true;
const orders=rows.map(r=>Number(r.querySelector(".image-order").value));
if(orders.some(n=>!Number.isInteger(n)||n<1||n>6))return"Image order must be between 1 and 6.";
if(new Set(orders).size!==orders.length)return"Each image must have a different display order.";
return null;
}
function validateProductForm(){
const name=document.getElementById("productName").value.trim(),category=document.getElementById("productCategory").value,current=Number(document.getElementById("currentPrice").value),ov=document.getElementById("originalPrice").value,dv=document.getElementById("discountPercentage").value,original=ov===""?null:Number(ov),discount=dv===""?null:Number(dv);
if(!name)return"Product name is required.";
if(!category)return"Please select a category.";
if(!Number.isFinite(current)||current<0)return"Enter a valid current price.";
if(original!==null&&(!Number.isFinite(original)||original<0))return"Enter a valid original price.";
if(discount!==null&&(!Number.isFinite(discount)||discount<0||discount>100))return"Discount must be between 0 and 100.";
for(const v of collectVariants())if(!v.variant_type||!v.variant_value)return"Each variant needs type and value.";
for(const v of collectVariants())if(!Number.isInteger(v.stock_quantity)||v.stock_quantity<0)return"Variant stock must be a whole number.";
return validateImages();
}

async function deleteStoragePaths(paths){
const clean=[...new Set((paths||[]).filter(Boolean))];if(!clean.length)return;
const{error}=await supabaseClient.storage.from("product-images").remove(clean);
if(error)console.error("Storage cleanup error:",error);
}

async function handleImageFiles(e){
const files=[...e.target.files||[]];if(!files.length)return;
const current=document.querySelectorAll(".image-row").length,available=MAX_IMAGES-current;
if(files.length>available){setImageStatus(`Only ${available} image(s) can be added. Maximum is ${MAX_IMAGES}.`,"error");e.target.value="";return}
for(const file of files){
if(!ALLOWED_TYPES.includes(file.type)){setImageStatus(`${file.name}: only JPG, PNG and WEBP are allowed.`,"error");e.target.value="";return}
if(file.size>MAX_IMAGE_SIZE){setImageStatus(`${file.name}: maximum size is 5 MB.`,"error");e.target.value="";return}
}
files.forEach((file,index)=>{
const url=URL.createObjectURL(file);
addImageRow({image_url:url,file_name:file.name,display_order:current+index+1,is_primary:current===0&&index===0});
const row=[...document.querySelectorAll(".image-row")].at(-1);
row._file=file;row._objectUrl=url;
});
updateImageCount();setImageStatus(`${files.length} image(s) ready to upload.`,"success");e.target.value="";
}

async function uploadNewImages(productId){
const rows=[...document.querySelectorAll(".image-row")].filter(r=>r._file);
for(const row of rows){
const file=row._file,ext=file.name.split(".").pop().toLowerCase(),safeExt=["jpg","jpeg","png","webp"].includes(ext)?ext:"jpg";
const path=`products/${productId}/${crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2)}.${safeExt}`;
const{error}=await supabaseClient.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false});
if(error)throw error;
uploadedStoragePaths.add(path);
const{data}=supabaseClient.storage.from("product-images").getPublicUrl(path);
row.querySelector(".image-storage-path").value=path;
row.dataset.imageUrl=data.publicUrl;
const img=row.querySelector(".image-preview img");if(img)img.src=data.publicUrl;
row._file=null;
}
}

async function saveProductImages(productId){
await uploadNewImages(productId);
const images=collectImages();
const{error:deleteError}=await supabaseClient.from("product_images").delete().eq("product_id",productId);
if(deleteError)throw deleteError;
if(images.length){
const{error}=await supabaseClient.from("product_images").insert(images.map(i=>({product_id:productId,image_url:i.image_url,display_order:i.display_order,is_primary:i.is_primary})));
if(error)throw error;
}
await deleteStoragePaths([...removedStoragePaths]);
}

async function cleanupCreatedProduct(productId){
await supabaseClient.from("product_images").delete().eq("product_id",productId);
await supabaseClient.from("product_specs").delete().eq("product_id",productId);
await supabaseClient.from("product_variants").delete().eq("product_id",productId);
await supabaseClient.from("products").delete().eq("product_id",productId);
}

async function saveProduct(e){
e.preventDefault();clearProductMessage();
const validation=validateProductForm();if(validation){showProductMessage(validation,"error");return}
const saveBtn=document.getElementById("saveProductBtn");saveBtn.disabled=true;saveBtn.textContent="Saving...";
let productId=editingProductId,createdNew=false;
try{
const payload={category_id:document.getElementById("productCategory").value,name:document.getElementById("productName").value.trim(),description:document.getElementById("productDescription").value.trim()||null,current_price:Number(document.getElementById("currentPrice").value),original_price:document.getElementById("originalPrice").value===""?null:Number(document.getElementById("originalPrice").value),discount_percentage:document.getElementById("discountPercentage").value===""?null:Number(document.getElementById("discountPercentage").value),status:document.getElementById("productStatus").value,updated_at:new Date().toISOString()};
if(productId){
const{error}=await supabaseClient.from("products").update(payload).eq("product_id",productId);if(error)throw error;
}else{
const{data,error}=await supabaseClient.from("products").insert(payload).select("product_id").single();if(error)throw error;
productId=data.product_id;createdNew=true;
}
const variants=collectVariants(),specs=collectSpecs();
for(const table of["product_variants","product_specs"]){
const{error}=await supabaseClient.from(table).delete().eq("product_id",productId);if(error)throw error;
}
if(variants.length){
const{error}=await supabaseClient.from("product_variants").insert(variants.map(v=>({...v,product_id:productId})));if(error)throw error;
}
if(specs.length){
const{error}=await supabaseClient.from("product_specs").insert(specs.map(s=>({...s,product_id:productId})));if(error)throw error;
}
await saveProductImages(productId);
closeProductModal();await loadProducts();
}catch(error){
console.error("Save product error:",error);
if(createdNew&&productId)await cleanupCreatedProduct(productId);
await deleteStoragePaths([...uploadedStoragePaths]);
showProductMessage(error?.message||"Unable to save product.","error");
}finally{
saveBtn.disabled=false;saveBtn.textContent="Save Product";
}
}

document.addEventListener("DOMContentLoaded",async()=>{
const ok=await protectAdminPage();if(!ok)return;
document.getElementById("productSearch").addEventListener("input",renderProducts);
document.getElementById("statusFilter").addEventListener("change",renderProducts);
document.getElementById("addProductBtn").addEventListener("click",openAddProduct);
document.getElementById("closeProductModal").addEventListener("click",closeProductModal);
document.getElementById("cancelProductBtn").addEventListener("click",closeProductModal);
document.getElementById("addVariantBtn").addEventListener("click",()=>addVariantRow());
document.getElementById("addSpecBtn").addEventListener("click",()=>addSpecRow());
document.getElementById("productImageFiles").addEventListener("change",handleImageFiles);
document.getElementById("productForm").addEventListener("submit",saveProduct);
document.getElementById("productModal").addEventListener("click",e=>{if(e.target.id==="productModal")closeProductModal()});
await loadProducts();
});