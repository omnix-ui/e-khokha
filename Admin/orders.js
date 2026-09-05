let allOrders=[],editingOrderId=null;

const ORDER_STATUSES=["pending","confirmed","processing","shipped","delivered","cancelled"];
const PAYMENT_STATUSES=["pending","paid","failed"];

function setOrderState(state,message=""){
 const loading=document.getElementById("ordersLoading"),empty=document.getElementById("ordersEmpty"),table=document.getElementById("ordersTable");
 if(loading)loading.style.display=state==="loading"?"block":"none";
 if(empty){empty.style.display=state==="empty"||state==="error"?"block":"none";if(message)empty.textContent=message}
 if(table)table.style.display=state==="ready"?"table":"none";
}

function formatDate(value){
 if(!value)return"—";
 return new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}

function formatMoney(value){
 return`₹${Number(value||0).toLocaleString("en-IN")}`;
}

function statusClass(value){
 return String(value||"pending").toLowerCase().replace(/\s+/g,"-");
}

async function loadOrders(){
 setOrderState("loading");
 const {data,error}=await supabaseClient.from("orders").select("order_id,order_code,user_id,item_total,discount_amount,delivery_fee,total_amount,coupon_id,coupon_code,payment_method,payment_status,order_status,estimated_delivery,shipping_name,shipping_mobile,shipping_house,shipping_street,shipping_city,shipping_state,shipping_pincode,created_at,updated_at").order("created_at",{ascending:false});
 if(error){
  console.error("Orders load error:",error);
  allOrders=[];
  setOrderState("error","Unable to load orders.");
  return;
 }
 allOrders=data||[];
 renderOrders();
}

function renderOrders(){
 const body=document.getElementById("ordersBody"),search=document.getElementById("orderSearch").value.trim().toLowerCase(),filter=document.getElementById("orderStatusFilter").value;
 body.innerHTML="";
 const filtered=allOrders.filter(o=>{
  const code=String(o.order_code||"").toLowerCase();
  const customer=String(o.shipping_name||"").toLowerCase();
  return(!search||code.includes(search)||customer.includes(search))&&(filter==="all"||o.order_status===filter);
 });
 if(!filtered.length){setOrderState("empty","No orders found.");return}
 setOrderState("ready");
 filtered.forEach(o=>{
  const row=document.createElement("tr"),order=document.createElement("td"),customer=document.createElement("td"),date=document.createElement("td"),total=document.createElement("td"),payment=document.createElement("td"),status=document.createElement("td"),action=document.createElement("td");
  order.className="product-name";
  order.textContent=o.order_code||"—";
  customer.textContent=o.shipping_name||"Guest";
  date.textContent=formatDate(o.created_at);
  total.textContent=formatMoney(o.total_amount);
  const paymentBadge=document.createElement("span");
  paymentBadge.className=`payment-status ${statusClass(o.payment_status)}`;
  paymentBadge.textContent=o.payment_status||"pending";
  payment.appendChild(paymentBadge);
  const orderBadge=document.createElement("span");
  orderBadge.className=`order-status ${statusClass(o.order_status)}`;
  orderBadge.textContent=o.order_status||"pending";
  status.appendChild(orderBadge);
  const view=document.createElement("button");
  view.type="button";
  view.className="small-btn";
  view.textContent="View";
  view.addEventListener("click",()=>openOrderDetails(o.order_id));
  action.appendChild(view);
  row.append(order,customer,date,total,payment,status,action);
  body.appendChild(row);
 });
}

function createDetailRow(label,value){
 const div=document.createElement("div");
 div.className="order-detail-row";
 const strong=document.createElement("strong");
 strong.textContent=label;
 const span=document.createElement("span");
 span.textContent=value??"—";
 div.append(strong,span);
 return div;
}

function createSelect(label,value,options,id){
 const wrap=document.createElement("div");
 wrap.className="form-group";
 const title=document.createElement("label");
 title.textContent=label;
 const select=document.createElement("select");
 select.id=id;
 options.forEach(option=>{
  const o=document.createElement("option");
  o.value=option;
  o.textContent=option.charAt(0).toUpperCase()+option.slice(1);
  if(option===value)o.selected=true;
  select.appendChild(o);
 });
 wrap.append(title,select);
 return wrap;
}

async function openOrderDetails(orderId){
 const order=allOrders.find(o=>o.order_id===orderId);
 if(!order)return;
 editingOrderId=orderId;
 const details=document.getElementById("orderDetails");
 details.innerHTML="";
 document.getElementById("orderModalSubtitle").textContent=order.order_code||"Order details";

 const heading=document.createElement("h3");
 heading.textContent=order.order_code||"Order";
 heading.style.marginBottom="16px";
 details.appendChild(heading);

 const info=document.createElement("div");
 info.className="order-info-grid";
 info.append(
  createDetailRow("Customer",order.shipping_name),
  createDetailRow("Mobile",order.shipping_mobile),
  createDetailRow("Order Date",formatDate(order.created_at)),
  createDetailRow("Payment Method",String(order.payment_method||"cod").toUpperCase()),
  createDetailRow("Subtotal",formatMoney(order.item_total)),
  createDetailRow("Discount",formatMoney(order.discount_amount)),
  createDetailRow("Delivery",Number(order.delivery_fee||0)===0?"Free":formatMoney(order.delivery_fee)),
  createDetailRow("Total",formatMoney(order.total_amount)),
  createDetailRow("Coupon",order.coupon_code||"None"),
  createDetailRow("Estimated Delivery",formatDate(order.estimated_delivery))
 );
 details.appendChild(info);

 const address=document.createElement("div");
 address.className="order-detail-section";
 const addressTitle=document.createElement("h3");
 addressTitle.textContent="Shipping Address";
 const addressText=document.createElement("p");
 addressText.textContent=[order.shipping_house,order.shipping_street,order.shipping_city,order.shipping_state,order.shipping_pincode].filter(Boolean).join(", ")||"—";
 address.append(addressTitle,addressText);
 details.appendChild(address);

 const itemsSection=document.createElement("div");
 itemsSection.className="order-detail-section";
 const itemsTitle=document.createElement("h3");
 itemsTitle.textContent="Order Items";
 itemsSection.appendChild(itemsTitle);

 const {data:items,error}=await supabaseClient.from("order_items").select("order_item_id,product_id,variant_id,product_name,variant_value,quantity,unit_price,original_price,item_total").eq("order_id",orderId).order("created_at",{ascending:true});
 if(error){
  console.error("Order items load error:",error);
 }else if(items?.length){
  const list=document.createElement("div");
  list.className="order-items-list";
  items.forEach(item=>{
   const itemBox=document.createElement("div");
   itemBox.className="order-item-box";
   itemBox.append(
    createDetailRow("Product",item.product_name),
    createDetailRow("Variant",item.variant_value||"—"),
    createDetailRow("Quantity",String(item.quantity)),
    createDetailRow("Unit Price",formatMoney(item.unit_price)),
    createDetailRow("Item Total",formatMoney(item.item_total))
   );
   list.appendChild(itemBox);
  });
  itemsSection.appendChild(list);
 }else{
  const empty=document.createElement("p");
  empty.textContent="No items found.";
  itemsSection.appendChild(empty);
 }
 details.appendChild(itemsSection);

 const updateSection=document.createElement("div");
 updateSection.className="order-detail-section";
 const updateTitle=document.createElement("h3");
 updateTitle.textContent="Update Order";
 const grid=document.createElement("div");
 grid.className="form-grid";
 grid.append(
  createSelect("Order Status",order.order_status||"pending",ORDER_STATUSES,"detailOrderStatus"),
  createSelect("Payment Status",order.payment_status||"pending",PAYMENT_STATUSES,"detailPaymentStatus")
 );
 const message=document.createElement("div");
 message.id="orderUpdateMessage";
 message.className="form-message";
 const save=document.createElement("button");
 save.type="button";
 save.className="primary-btn";
 save.id="updateOrderBtn";
 save.textContent="Update Order";
 save.style.marginTop="18px";
 save.style.width="100%";
 save.addEventListener("click",updateOrder);
 updateSection.append(updateTitle,grid,message,save);
 details.appendChild(updateSection);

 document.getElementById("orderModal").classList.remove("hidden");
 document.body.classList.add("modal-open");
}

async function updateOrder(){
 if(!editingOrderId)return;
 const orderStatus=document.getElementById("detailOrderStatus").value;
 const paymentStatus=document.getElementById("detailPaymentStatus").value;
 const button=document.getElementById("updateOrderBtn"),message=document.getElementById("orderUpdateMessage");
 button.disabled=true;
 button.textContent="Updating...";
 message.textContent="";
 try{
  const {error}=await supabaseClient.from("orders").update({order_status:orderStatus,payment_status:paymentStatus,updated_at:new Date().toISOString()}).eq("order_id",editingOrderId);
  if(error)throw error;
  message.textContent="Order updated successfully.";
  message.className="form-message success";
  await loadOrders();
  const updated=allOrders.find(o=>o.order_id===editingOrderId);
  if(updated){
   document.getElementById("detailOrderStatus").value=updated.order_status;
   document.getElementById("detailPaymentStatus").value=updated.payment_status;
  }
 }catch(error){
  console.error("Order update error:",error);
  message.textContent=error?.message||"Unable to update order.";
  message.className="form-message error";
 }finally{
  button.disabled=false;
  button.textContent="Update Order";
 }
}

function closeOrderModal(){
 document.getElementById("orderModal").classList.add("hidden");
 document.body.classList.remove("modal-open");
 editingOrderId=null;
 document.getElementById("orderDetails").innerHTML="";
}

document.addEventListener("DOMContentLoaded",async()=>{
 const ok=await protectAdminPage();
 if(!ok)return;
 const search=document.getElementById("orderSearch"),filter=document.getElementById("orderStatusFilter"),close=document.getElementById("closeOrderModal"),modal=document.getElementById("orderModal");
 if(search)search.addEventListener("input",renderOrders);
 if(filter)filter.addEventListener("change",renderOrders);
 if(close)close.addEventListener("click",closeOrderModal);
 if(modal)modal.addEventListener("click",e=>{if(e.target===modal)closeOrderModal()});
 await loadOrders();
});