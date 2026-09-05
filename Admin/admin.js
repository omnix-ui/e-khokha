const ADMIN_LOGIN="login.html";

async function getAdminUser(){
    const {data:{user},error}=await supabaseClient.auth.getUser();
    if(error||!user)return null;
    const {data:profile,error:profileError}=await supabaseClient.from("profiles").select("user_id,role").eq("user_id",user.id).maybeSingle();
    if(profileError||!profile||profile.role!=="admin")return null;
    return {user,profile};
}

async function adminLogin(e){
    e.preventDefault();
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const message=document.getElementById("loginMessage");
    const button=document.getElementById("loginBtn");
    message.textContent="Logging in...";
    message.className="login-message";
    button.disabled=true;
    const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
    if(error){
        message.textContent="Invalid email or password.";
        message.className="login-message error";
        button.disabled=false;
        return;
    }
    const {data:profile,error:profileError}=await supabaseClient.from("profiles").select("role").eq("user_id",data.user.id).maybeSingle();
    if(profileError||!profile||profile.role!=="admin"){
        await supabaseClient.auth.signOut();
        message.textContent="Access denied. Admin account required.";
        message.className="login-message error";
        button.disabled=false;
        return;
    }
    message.textContent="Login successful...";
    message.className="login-message success";
    location.href="index.html";
}

async function protectAdminPage(){
    const result=await getAdminUser();
    if(!result){
        await supabaseClient.auth.signOut();
        location.href=ADMIN_LOGIN;
        return false;
    }
    const welcome=document.getElementById("adminWelcome");
    if(welcome)welcome.textContent="Admin access verified";
    return true;
}

async function adminLogout(){
    await supabaseClient.auth.signOut();
    location.href=ADMIN_LOGIN;
}

async function loadDashboard(){
    const [{count:products,error:pError},{count:orders,error:oError},{count:customers,error:cError},{count:reviews,error:rError}]=await Promise.all([
        supabaseClient.from("products").select("*",{count:"exact",head:true}),
        supabaseClient.from("orders").select("*",{count:"exact",head:true}),
        supabaseClient.from("profiles").select("*",{count:"exact",head:true}).eq("role","customer"),
        supabaseClient.from("reviews").select("*",{count:"exact",head:true}).eq("status","pending")
    ]);
    if(pError||oError||cError||rError){
        console.error("Dashboard data error",{pError,oError,cError,rError});
        return;
    }
    const totalProducts=document.getElementById("totalProducts");
    const totalOrders=document.getElementById("totalOrders");
    const totalCustomers=document.getElementById("totalCustomers");
    const pendingReviews=document.getElementById("pendingReviews");
    if(totalProducts)totalProducts.textContent=products??0;
    if(totalOrders)totalOrders.textContent=orders??0;
    if(totalCustomers)totalCustomers.textContent=customers??0;
    if(pendingReviews)pendingReviews.textContent=reviews??0;
}

document.addEventListener("DOMContentLoaded",()=>{
    const form=document.getElementById("adminLoginForm");
    const logout=document.getElementById("logoutBtn");
    const menu=document.getElementById("menuBtn");
    const sidebar=document.getElementById("sidebar");

    if(form)form.addEventListener("submit",adminLogin);
    if(logout)logout.addEventListener("click",adminLogout);
    if(menu&&sidebar)menu.addEventListener("click",()=>sidebar.classList.toggle("open"));

    if(!form){
        protectAdminPage().then(ok=>{
            if(ok)loadDashboard();
        });
    }
});