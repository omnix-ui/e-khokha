let currentUser=null;
const loader=document.getElementById("address-loader");
const content=document.getElementById("address-content");
const list=document.getElementById("address-list");
const noAddress=document.getElementById("no-address");
const modal=document.getElementById("address-modal");
const form=document.getElementById("address-form");

document.getElementById("add-address-btn").addEventListener("click",()=>openAddressModal());
document.getElementById("empty-add-address").addEventListener("click",()=>openAddressModal());
document.getElementById("close-address-modal").addEventListener("click",closeAddressModal);
document.getElementById("cancel-address").addEventListener("click",closeAddressModal);
form.addEventListener("submit",saveAddress);

init();

async function init(){
    try{
        const {data,error}=await supabaseClient.auth.getSession();
        if(error) throw error;
        if(!data?.session?.user){
            window.location.href="login.html";
            return;
        }
        currentUser=data.session.user;
        await loadAddresses();
        loader.style.display="none";
        content.style.display="block";
    }catch(error){
        console.error("Address init error:",error);
        loader.innerHTML="<p>Unable to load addresses.</p>";
    }
}

async function loadAddresses(){
    const {data,error}=await supabaseClient.from("addresses").select("*").eq("user_id",currentUser.id).order("is_default",{ascending:false}).order("created_at",{ascending:false});
    if(error) throw error;
    renderAddresses(data||[]);
}

function renderAddresses(addresses){
    list.innerHTML="";
    if(!addresses.length){
        list.style.display="none";
        noAddress.style.display="flex";
        return;
    }
    list.style.display="grid";
    noAddress.style.display="none";
    addresses.forEach(address=>{
        const card=document.createElement("div");
        card.className="saved-address-card";
        card.innerHTML=`
            <div class="saved-address-top">
                <div class="saved-address-title">
                    <span class="material-symbols-outlined">location_on</span>
                    <strong>${escapeHtml(address.full_name)}</strong>
                    ${address.is_default?'<span class="default-address-badge">Default</span>':""}
                </div>
                <div class="saved-address-actions">
                    <button type="button" class="address-icon-btn edit-address" data-id="${address.address_id}" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                    <button type="button" class="address-icon-btn delete-address" data-id="${address.address_id}" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                </div>
            </div>
            <p>${escapeHtml(address.house)}</p>
            <p>${escapeHtml(address.street)}</p>
            <p>${escapeHtml(address.city)}, ${escapeHtml(address.state)} - ${escapeHtml(address.pincode)}</p>
            <p class="saved-address-mobile">Mobile: ${escapeHtml(address.mobile)}</p>
            ${address.is_default?'<div class="default-address-text"><span class="material-symbols-outlined">check_circle</span> Default delivery address</div>':`<button type="button" class="set-default-btn" data-id="${address.address_id}">Set as Default</button>`}
        `;
        list.appendChild(card);
    });
    document.querySelectorAll(".edit-address").forEach(btn=>btn.addEventListener("click",()=>editAddress(btn.dataset.id)));
    document.querySelectorAll(".delete-address").forEach(btn=>btn.addEventListener("click",()=>deleteAddress(btn.dataset.id)));
    document.querySelectorAll(".set-default-btn").forEach(btn=>btn.addEventListener("click",()=>setDefaultAddress(btn.dataset.id)));
}

function openAddressModal(address=null){
    clearMessages();
    form.reset();
    document.getElementById("address-id").value="";
    document.getElementById("address-modal-title").textContent=address?"Edit Address":"Add Address";
    if(address){
        document.getElementById("address-id").value=address.address_id;
        document.getElementById("address-name").value=address.full_name||"";
        document.getElementById("address-mobile").value=address.mobile||"";
        document.getElementById("address-house").value=address.house||"";
        document.getElementById("address-street").value=address.street||"";
        document.getElementById("address-city").value=address.city||"";
        document.getElementById("address-state").value=address.state||"";
        document.getElementById("address-pincode").value=address.pincode||"";
        document.getElementById("address-default").checked=!!address.is_default;
    }
    modal.style.display="flex";
}

function closeAddressModal(){
    modal.style.display="none";
    clearMessages();
}

async function editAddress(id){
    const {data,error}=await supabaseClient.from("addresses").select("*").eq("address_id",id).eq("user_id",currentUser.id).single();
    if(error){console.error(error);return;}
    openAddressModal(data);
}

async function saveAddress(e){
    e.preventDefault();
    clearMessages();
    const name=document.getElementById("address-name").value.trim();
    const mobile=document.getElementById("address-mobile").value.trim();
    const house=document.getElementById("address-house").value.trim();
    const street=document.getElementById("address-street").value.trim();
    const city=document.getElementById("address-city").value.trim();
    const state=document.getElementById("address-state").value.trim();
    const pincode=document.getElementById("address-pincode").value.trim();
    const isDefault=document.getElementById("address-default").checked;
    const id=document.getElementById("address-id").value;

    if(!/^\d{10}$/.test(mobile)){showError("Enter a valid 10-digit mobile number.");return;}
    if(!/^\d{6}$/.test(pincode)){showError("Enter a valid 6-digit pincode.");return;}

    const payload={user_id:currentUser.id,full_name:name,mobile,house,street,city,state,pincode,is_default:isDefault,updated_at:new Date().toISOString()};

    try{
        if(isDefault){
            const {error:defaultError}=await supabaseClient.from("addresses").update({is_default:false,updated_at:new Date().toISOString()}).eq("user_id",currentUser.id);
            if(defaultError) throw defaultError;
        }

        let error;
        if(id){
            ({error}=await supabaseClient.from("addresses").update(payload).eq("address_id",id).eq("user_id",currentUser.id));
        }else{
            ({error}=await supabaseClient.from("addresses").insert({...payload,created_at:new Date().toISOString()}));
        }

        if(error) throw error;
        closeAddressModal();
        await loadAddresses();
    }catch(error){
        console.error("Save address error:",error);
        showError("Unable to save address. Please try again.");
    }
}

async function setDefaultAddress(id){
    try{
        let result=await supabaseClient.from("addresses").update({is_default:false,updated_at:new Date().toISOString()}).eq("user_id",currentUser.id);
        if(result.error) throw result.error;
        result=await supabaseClient.from("addresses").update({is_default:true,updated_at:new Date().toISOString()}).eq("address_id",id).eq("user_id",currentUser.id);
        if(result.error) throw result.error;
        await loadAddresses();
    }catch(error){
        console.error("Default address error:",error);
    }
}

async function deleteAddress(id){
    if(!confirm("Delete this saved address?")) return;
    try{
        const {error}=await supabaseClient.from("addresses").delete().eq("address_id",id).eq("user_id",currentUser.id);
        if(error) throw error;
        await loadAddresses();
    }catch(error){
        console.error("Delete address error:",error);
    }
}

function showError(message){
    const el=document.getElementById("address-form-error");
    el.textContent=message;
    el.hidden=false;
}

function clearMessages(){
    document.getElementById("address-form-error").hidden=true;
    document.getElementById("address-form-success").hidden=true;
}

function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}