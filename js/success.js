// ==========================================
// ✅ E-KHOKHA SUCCESS PAGE - SUPABASE
// ==========================================

document.addEventListener("DOMContentLoaded",async()=>{
    try{
        const {data:{user},error:authError}=await supabaseClient.auth.getUser();
        if(authError)throw authError;
        if(!user){
            window.location.href="login.html";
            return;
        }

        const stored=JSON.parse(localStorage.getItem("eKhokhaLatestOrder")||"null");
        if(!stored){
            window.location.href="../index.html";
            return;
        }

        const orderId=stored.order_id||stored.orderId||null;
        const orderCode=stored.order_code||stored.orderCode||null;

        if(!orderId&&!orderCode){
            window.location.href="../index.html";
            return;
        }

        let query=supabaseClient
            .from("orders")
            .select("order_id,order_code,user_id,item_total,discount_amount,delivery_fee,total_amount,coupon_id,coupon_code,payment_method,payment_status,order_status,estimated_delivery,shipping_name,shipping_mobile,shipping_house,shipping_street,shipping_city,shipping_state,shipping_pincode,created_at")
            .eq("user_id",user.id);

        query=orderId?query.eq("order_id",orderId):query.eq("order_code",orderCode);

        const {data:order,error:orderError}=await query.maybeSingle();
        if(orderError)throw orderError;
        if(!order){
            window.location.href="../index.html";
            return;
        }

        const {data:items,error:itemError}=await supabaseClient
            .from("order_items")
            .select("order_item_id,order_id,product_id,variant_id,product_name,variant_value,quantity,unit_price,original_price,item_total")
            .eq("order_id",order.order_id)
            .order("created_at",{ascending:true});

        if(itemError)throw itemError;

        await renderSuccessPage(order,items||[]);
        localStorage.removeItem("eKhokhaLatestOrder");
    }catch(error){
        console.error("Success page error:",error);
        showError();
    }
});

const setText=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value??"—";
};

const money=value=>"₹"+Number(value||0).toLocaleString("en-IN",{maximumFractionDigits:2});

function formatDate(value){
    if(!value)return"—";
    return new Date(value).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}

function formatStatus(status){
    if(!status)return"Order Confirmed";
    return status.split("_").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ");
}

async function renderSuccessPage(order,items){
    setText("success-order-id",order.order_code||order.order_id);
    setText("success-order-date",formatDate(order.created_at));

    const payment=(order.payment_method||"cod").toLowerCase();
    setText("success-payment",payment==="cod"?"Cash on Delivery":formatStatus(payment));

    setText("success-status",formatStatus(order.order_status));

    setText("success-subtotal",money(order.item_total));

    const discount=Number(order.discount_amount||0);
    const couponRow=document.getElementById("success-coupon-row");

    if(order.coupon_code&&discount>0){
        setText("success-coupon-label",`Coupon (${order.coupon_code})`);
        setText("success-coupon","-"+money(discount));
    }else{
        couponRow?.remove();
    }

    const deliveryFee=Number(order.delivery_fee||0);
    setText("success-delivery",deliveryFee>0?money(deliveryFee):"Free");

    setText("success-amount",money(order.total_amount));

    setText("success-name",order.shipping_name);
    setText("success-mobile",order.shipping_mobile);

    const addressParts=[
        order.shipping_house,
        order.shipping_street,
        order.shipping_city,
        order.shipping_state,
        order.shipping_pincode
    ].filter(Boolean);

    setText("success-address",addressParts.join(", "));

    setText(
        "success-date",
        order.estimated_delivery?"By "+formatDate(order.estimated_delivery):"Processing..."
    );

    await renderItems(items);
}

async function renderItems(items){
    const container=document.getElementById("success-items");
    container.innerHTML="";

    if(!items.length){
        const empty=document.createElement("p");
        empty.textContent="Order items could not be loaded.";
        empty.style.color="#636e72";
        container.appendChild(empty);
        return;
    }

    const productIds=[...new Set(items.map(item=>item.product_id).filter(Boolean))];

    let images=[];
    if(productIds.length){
        const {data,error}=await supabaseClient
            .from("product_images")
            .select("product_id,image_url,is_primary,display_order")
            .in("product_id",productIds)
            .order("is_primary",{ascending:false})
            .order("display_order",{ascending:true});

        if(!error)images=data||[];
    }

    items.forEach(item=>{
        const quantity=Number(item.quantity)||0;
        const unitPrice=Number(item.unit_price)||0;
        const originalPrice=Number(item.original_price)||unitPrice;
        const itemTotal=Number(item.item_total)||unitPrice*quantity;

        const productImage=images.find(img=>img.product_id===item.product_id);
        const imageSrc=productImage?.image_url||"https://placehold.co/100x100/eeeeee/333333?text=Product";

        const box=document.createElement("div");
        box.className="success-product";

        const image=document.createElement("img");
        image.className="product-image";
        image.src=imageSrc;
        image.alt=item.product_name||"Product";
        image.onerror=()=>{image.src="https://placehold.co/100x100/eeeeee/333333?text=Product";};

        const info=document.createElement("div");
        info.className="product-info";

        const name=document.createElement("h4");
        name.textContent=item.product_name||"Product";

        const variant=document.createElement("p");
        variant.textContent=item.variant_value
            ? `Variant: ${item.variant_value} • Qty: ${quantity}`
            : `Qty: ${quantity}`;

        const priceBox=document.createElement("div");
        priceBox.className="product-price";

        const current=document.createElement("strong");
        current.textContent=money(unitPrice);
        priceBox.appendChild(current);

        if(originalPrice>unitPrice){
            const oldPrice=document.createElement("del");
            oldPrice.textContent=money(originalPrice);

            const discount=document.createElement("span");
            discount.className="discount-badge";
            discount.textContent=Math.round(((originalPrice-unitPrice)/originalPrice)*100)+"% OFF";

            priceBox.append(oldPrice,discount);
        }

        const total=document.createElement("small");
        total.className="item-total";
        total.textContent=`${money(itemTotal)} total`;

        info.append(name,variant,priceBox,total);
        box.append(image,info);
        container.appendChild(box);
    });
}

function showError(){
    document.querySelector(".success-main").innerHTML=`
        <section class="order-card" style="text-align:center;margin-top:30px;">
            <span class="material-symbols-outlined" style="font-size:50px;color:#fd4f6a;">error</span>
            <h2 style="margin:15px 0 8px;">Unable to load order</h2>
            <p style="color:#636e72;">Please check your orders page for the latest order information.</p>
            <div class="action-buttons" style="margin-top:20px;">
                <a href="order.html" class="btn-primary">View My Orders</a>
            </div>
        </section>
    `;
}