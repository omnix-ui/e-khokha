let allCategories=[],editingCategoryId=null;

function setCategoryState(state,message=""){
 const loading=document.getElementById("categoriesLoading"),empty=document.getElementById("categoriesEmpty"),table=document.getElementById("categoriesTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}

async function loadCategories(){
 setCategoryState("loading");
 const {data,error}=await supabaseClient.from("categories").select("category_id,name,slug,icon,status,created_at,updated_at,products(product_id)").order("created_at",{ascending:false});
 if(error){
  console.error("Categories load error:",error);
  allCategories=[];
  setCategoryState("error","Unable to load categories.");
  return;
 }
 allCategories=data||[];
 renderCategories();
}

function renderCategories(){
 const body=document.getElementById("categoriesBody"),search=document.getElementById("categorySearch").value.trim().toLowerCase(),status=document.getElementById("statusFilter").value;
 body.innerHTML="";
 const filtered=allCategories.filter(c=>{
  const name=String(c.name||"").toLowerCase(),slug=String(c.slug||"").toLowerCase();
  return (!search||name.includes(search)||slug.includes(search))&&(status==="all"||c.status===status);
 });
 if(!filtered.length){setCategoryState("empty","No categories found.");return}
 setCategoryState("ready");
 filtered.forEach(c=>{
  const row=document.createElement("tr"),name=document.createElement("td"),slug=document.createElement("td"),products=document.createElement("td"),statusCell=document.createElement("td"),action=document.createElement("td");
  name.className="product-name";
  name.textContent=`${c.icon?c.icon+" ":""}${c.name||"—"}`;
  slug.textContent=c.slug||"—";
  products.textContent=(c.products||[]).length;
  const badge=document.createElement("span");
  badge.className=`status-badge ${c.status==="active"?"active":"inactive"}`;
  badge.textContent=c.status||"unknown";
  statusCell.appendChild(badge);
  const edit=document.createElement("button");
  edit.type="button";
  edit.className="small-btn";
  edit.textContent="Edit";
  edit.addEventListener("click",()=>openEditCategory(c.category_id));
  action.appendChild(edit);
  row.append(name,slug,products,statusCell,action);
  body.appendChild(row);
 });
}

function showCategoryMessage(message,type=""){
 const box=document.getElementById("categoryFormMessage");
 box.textContent=message;
 box.className=`form-message ${type}`.trim();
}

function clearCategoryMessage(){
 const box=document.getElementById("categoryFormMessage");
 box.textContent="";
 box.className="form-message";
}

function generateSlug(value){
 return value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
}

function openCategoryModal(){
 document.getElementById("categoryModal").classList.remove("hidden");
 document.body.classList.add("modal-open");
}

function closeCategoryModal(){
 document.getElementById("categoryModal").classList.add("hidden");
 document.body.classList.remove("modal-open");
 editingCategoryId=null;
 document.getElementById("categoryForm").reset();
 document.getElementById("categoryId").value="";
 document.getElementById("categoryEditorTitle").textContent="Add Category";
 document.getElementById("categoryEditorSubtitle").textContent="Create a new category for your store.";
 clearCategoryMessage();
}

function openAddCategory(){
 editingCategoryId=null;
 document.getElementById("categoryForm").reset();
 document.getElementById("categoryId").value="";
 document.getElementById("categoryEditorTitle").textContent="Add Category";
 document.getElementById("categoryEditorSubtitle").textContent="Create a new category for your store.";
 document.getElementById("categoryStatus").value="active";
 clearCategoryMessage();
 openCategoryModal();
 document.getElementById("categoryName").focus();
}

async function openEditCategory(categoryId){
 clearCategoryMessage();
 const {data,error}=await supabaseClient.from("categories").select("category_id,name,slug,icon,status").eq("category_id",categoryId).maybeSingle();
 if(error||!data){
  console.error("Category load error:",error);
  alert("Unable to load category.");
  return;
 }
 editingCategoryId=data.category_id;
 document.getElementById("categoryId").value=data.category_id;
 document.getElementById("categoryEditorTitle").textContent="Edit Category";
 document.getElementById("categoryEditorSubtitle").textContent="Update category information.";
 document.getElementById("categoryName").value=data.name||"";
 document.getElementById("categorySlug").value=data.slug||"";
 document.getElementById("categoryIcon").value=data.icon||"";
 document.getElementById("categoryStatus").value=data.status||"active";
 openCategoryModal();
}

function validateCategoryForm(){
 const name=document.getElementById("categoryName").value.trim();
 const slug=document.getElementById("categorySlug").value.trim();
 if(!name)return"Category name is required.";
 if(!slug)return"Category slug is required.";
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return"Slug can contain only lowercase letters, numbers and hyphens.";
 return null;
}

async function saveCategory(e){
 e.preventDefault();
 clearCategoryMessage();
 const validation=validateCategoryForm();
 if(validation){showCategoryMessage(validation,"error");return}
 const saveBtn=document.getElementById("saveCategoryBtn");
 saveBtn.disabled=true;
 saveBtn.textContent="Saving...";
 try{
  const payload={
   name:document.getElementById("categoryName").value.trim(),
   slug:document.getElementById("categorySlug").value.trim(),
   icon:document.getElementById("categoryIcon").value.trim()||null,
   status:document.getElementById("categoryStatus").value,
   updated_at:new Date().toISOString()
  };
  if(editingCategoryId){
   const {error}=await supabaseClient.from("categories").update(payload).eq("category_id",editingCategoryId);
   if(error)throw error;
  }else{
   const {error}=await supabaseClient.from("categories").insert(payload);
   if(error)throw error;
  }
  closeCategoryModal();
  await loadCategories();
 }catch(error){
  console.error("Save category error:",error);
  showCategoryMessage(error?.message||"Unable to save category.","error");
 }finally{
  saveBtn.disabled=false;
  saveBtn.textContent="Save Category";
 }
}

document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();
 if(!ok)return;
 const search=document.getElementById("categorySearch"),status=document.getElementById("statusFilter"),add=document.getElementById("addCategoryBtn"),close=document.getElementById("closeCategoryModal"),cancel=document.getElementById("cancelCategoryBtn"),form=document.getElementById("categoryForm"),modal=document.getElementById("categoryModal"),name=document.getElementById("categoryName"),slug=document.getElementById("categorySlug");
 if(search)search.addEventListener("input",renderCategories);
 if(status)status.addEventListener("change",renderCategories);
 if(add)add.addEventListener("click",openAddCategory);
 if(close)close.addEventListener("click",closeCategoryModal);
 if(cancel)cancel.addEventListener("click",closeCategoryModal);
 if(form)form.addEventListener("submit",saveCategory);
 if(name)name.addEventListener("input",()=>{
  if(!editingCategoryId||!slug.value.trim())slug.value=generateSlug(name.value);
 });
 if(modal)modal.addEventListener("click",e=>{if(e.target===modal)closeCategoryModal()});
 await loadCategories();
});