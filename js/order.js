let userOrders=[];
const STATUS_LABELS={pending:"Pending",confirmed:"Confirmed",shipped:"Shipped",out_for_delivery:"Out for Delivery","out-for-delivery":"Out for Delivery","out for delivery":"Out for Delivery",delivered:"Delivered",cancelled:"Cancelled"};

document.addEventListener("DOMContentLoaded",initOrders);

async function initOrders(){
    setupOrderFilters();
    try{
        const {data:{session}}=await supabaseClient.auth.getSession();
        if(!session){
            window.location.href="login.html";
            return;
        }

        const {data:orders,error:ordersError}=await supabaseClient.from("orders").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});
        if(ordersError) throw ordersError;

        if(!orders||orders.length===0){
            userOrders=[];
            showOrders([]);
            return;
        }

        const orderIds=orders.map(o=>o.order_id);

        const {data:items,error:itemsError}=await supabaseClient.from("order_items").select("*").in("order_id",orderIds);
        if(itemsError) throw itemsError;

        const productIds=[...new Set((items||[]).map(i=>i.product_id).filter(Boolean))];

        let images=[];
        if(productIds.length){
            const {data:imageData,error:imageError}=await supabaseClient.from("product_images").select("product_id,image_url,display_order,is_primary").in("product_id",productIds).order("display_order",{ascending:true});
            if(imageError) console.warn("Product image error:",imageError);
            images=imageData||[];
        }

        const imageMap={};
        images.forEach(img=>{
            if(!imageMap[img.product_id]) imageMap[img.product_id]=img.image_url;
            if(img.is_primary) imageMap[img.product_id]=img.image_url;
        });

        const grouped={};
        (items||[]).forEach(item=>{
            if(!grouped[item.order_id]) grouped[item.order_id]=[];
            grouped[item.order_id].push({
                id:item.order_item_id,
                product_id:item.product_id,
                variant_id:item.variant_id,
                name:item.product_name||"Product",
                image:imageMap[item.product_id]||"https://placehold.co/150x150/1a1a1a/ffffff?text=Product",
                size:item.variant_value||"N/A",
                quantity:item.quantity||1,
                unit_price:Number(item.unit_price)||0,
                original_price:Number(item.original_price)||0,
                item_total:Number(item.item_total)||0
            });
        });

        userOrders=orders.map(order=>({
            id:order.order_id,
            orderId:order.order_code||order.order_id,
            date:formatDate(order.created_at),
            status:formatStatus(order.order_status),
            total:Number(order.total_amount)||0,
            paymentMethod:formatPaymentMethod(order.payment_method),
            estimatedDelivery:formatDateOnly(order.estimated_delivery),
            address:{
                name:order.shipping_name,
                mobile:order.shipping_mobile,
                house:order.shipping_house,
                street:order.shipping_street,
                city:order.shipping_city,
                state:order.shipping_state,
                pincode:order.shipping_pincode
            },
            items:grouped[order.order_id]||[]
        }));

        showOrders(userOrders);
    }catch(error){
        console.error("My Order Error:",error);
        showError();
    }
}

function setupOrderFilters(){
    document.querySelectorAll(".filter-tab").forEach(tab=>{
        tab.addEventListener("click",()=>{
            document.querySelectorAll(".filter-tab").forEach(t=>t.classList.remove("active"));
            tab.classList.add("active");
            const status=tab.dataset.status;
            const filtered=status==="All"?userOrders:userOrders.filter(order=>order.status===status);
            renderOrderCards(filtered);
        });
    });
}

function showOrders(orders){
    document.getElementById("order-loading").style.display="none";
    renderOrderCards(orders);
}

function showError(){
    const loading=document.getElementById("order-loading");
    loading.innerHTML=`<span class="material-symbols-outlined empty-icon">error</span><h2>Something went wrong</h2><p>Unable to load your orders.</p>`;
}

function formatStatus(status){
    const s=String(status||"").toLowerCase().trim();
    return STATUS_LABELS[s]||"Pending";
}

function formatPaymentMethod(method){
    if(String(method||"").toLowerCase()==="cod") return "Cash on Delivery";
    return method||"N/A";
}

function formatDate(date){
    if(!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}

function formatDateOnly(date){
    if(!date) return "N/A";
    const d=new Date(date);
    if(Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}

function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function getStatusClasses(status){
    switch(status){
        case"Pending":return{bg:"status-pending",text:"text-pending"};
        case"Confirmed":return{bg:"status-confirmed",text:"text-confirmed"};
        case"Shipped":return{bg:"status-shipped",text:"text-shipped"};
        case"Out for Delivery":return{bg:"status-out-for-delivery",text:"text-out-for-delivery"};
        case"Delivered":return{bg:"status-delivered",text:"text-delivered"};
        case"Cancelled":return{bg:"status-cancelled",text:"text-cancelled"};
        default:return{bg:"status-pending",text:"text-pending"};
    }
}

function renderOrderCards(ordersArray){
    const container=document.getElementById("order-list-container");
    const emptyState=document.getElementById("empty-state");

    if(ordersArray.length===0){
        container.style.display="none";
        emptyState.style.display="flex";
        return;
    }

    emptyState.style.display="none";
    container.style.display="flex";
    container.innerHTML="";

    ordersArray.forEach(order=>{
        if(!order.items.length) return;

        const firstItem=order.items[0];
        const extraItems=order.items.length>1?`<span class="more-items-badge">+${order.items.length-1} more items</span>`:"";
        const statusClasses=getStatusClasses(order.status);
        const displayName=escapeHtml(firstItem.name);
        const displayImage=escapeHtml(firstItem.image);
        const displaySize=escapeHtml(firstItem.size);

        container.innerHTML+=`
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-id">#${escapeHtml(order.orderId)}</span>
                <span class="order-date">${escapeHtml(order.date)}</span>
            </div>
            <div class="order-card-body">
                <div class="order-image">
                    <img src="${displayImage}" alt="${displayName}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
                </div>
                <div class="order-details">
                    <div class="order-product-name">${displayName} ${extraItems}</div>
                    <div class="order-product-meta">Variant: ${displaySize} &nbsp;|&nbsp; Qty: ${firstItem.quantity}</div>
                    <div class="order-price-payment">
                        <span class="order-price">₹${order.total.toLocaleString("en-IN")}</span>
                        <span class="order-payment">${escapeHtml(order.paymentMethod)}</span>
                    </div>
                </div>
            </div>
            <div class="order-card-footer">
                <div class="order-status ${statusClasses.text}">
                    <span class="status-dot ${statusClasses.bg}"></span> ${escapeHtml(order.status)}
                </div>
                <button class="view-details-btn" onclick="openOrderModal('${escapeHtml(order.id)}')">View Details</button>
            </div>
        </div>`;
    });
}

window.openOrderModal=function(orderId){
    const order=userOrders.find(o=>o.id===orderId);
    if(!order)return;

    document.getElementById("modal-order-id").innerText="#"+order.orderId;
    document.getElementById("modal-order-date").innerText=order.date;

    const statusEl=document.getElementById("modal-order-status");
    statusEl.innerText=order.status;
    statusEl.className=getStatusClasses(order.status).text;

    document.getElementById("modal-est-delivery").innerText=order.estimatedDelivery;
    document.getElementById("modal-payment-method").innerText=order.paymentMethod;
    document.getElementById("modal-total-amount").innerText="₹"+order.total.toLocaleString("en-IN");

    const address=order.address;
    document.getElementById("modal-address").innerHTML=`
    <strong>${escapeHtml(address.name||"N/A")}</strong><br>
    ${escapeHtml(address.house||"")}, ${escapeHtml(address.street||"")}<br>
    ${escapeHtml(address.city||"")}, ${escapeHtml(address.state||"")} - ${escapeHtml(address.pincode||"")}<br>
    Mobile: ${escapeHtml(address.mobile||"N/A")}`;

    const productsList=document.getElementById("modal-products-list");
    productsList.innerHTML="";

    order.items.forEach(item=>{
        productsList.innerHTML+=`
        <div class="modal-product-item">
            <div style="display:flex;gap:12px;align-items:center;">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
                <div class="modal-product-info">
                    <span class="modal-product-name">${escapeHtml(item.name)}</span>
                    <span class="modal-product-meta">Variant: ${escapeHtml(item.size)} | Qty: ${item.quantity}</span>
                </div>
            </div>
            <span class="modal-product-price">₹${item.item_total.toLocaleString("en-IN")}</span>
        </div>`;
    });

    document.getElementById("order-modal").classList.add("active");
};

window.closeOrderModal=function(){
    document.getElementById("order-modal").classList.remove("active");
};

window.handleBackButton=function(event){
    event.preventDefault();
    if(window.history.length>1&&document.referrer!=="") window.history.back();
    else window.location.href="../index.html";
};

document.getElementById("order-modal")?.addEventListener("click",e=>{
    if(e.target.id==="order-modal") closeOrderModal();
});