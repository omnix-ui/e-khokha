// ==========================================
// 🔔 E-KHOKHA SUPABASE NOTIFICATION ENGINE
// ==========================================

let currentUser = null;
let notifications = [];

document.addEventListener("DOMContentLoaded", loadNotifications);

async function loadNotifications() {
    const loading = document.getElementById("loading-state");
    const empty = document.getElementById("empty-state");
    const list = document.getElementById("notification-list");
    const markAll = document.getElementById("mark-all-btn");
    
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        
        currentUser = user;
        
        const { data, error } = await supabaseClient
            .from("notifications")
            .select("notification_id,user_id,type,title,message,related_order_id,related_coupon_id,related_review_id,is_read,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        notifications = data || [];
        loading.style.display = "none";
        
        if (!notifications.length) {
            list.style.display = "none";
            empty.style.display = "flex";
            markAll.style.visibility = "hidden";
            return;
        }
        
        empty.style.display = "none";
        list.style.display = "flex";
        renderNotifications();
    } catch (error) {
        console.error("Notification load error:", error);
        loading.style.display = "none";
        list.style.display = "none";
        empty.style.display = "flex";
        empty.querySelector("h2").textContent = "Unable to load notifications";
        empty.querySelector("p").textContent = "Please try again later.";
    }
}

function timeSince(dateString) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " mins ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
    if (seconds < 172800) return "Yesterday";
    if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago";
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getNotificationStyle(type) {
    if (type === "order") return { icon: "shopping_bag", iconColor: "#0984e3", bgColor: "#e6f2ff" };
    if (type === "delivery") return { icon: "local_shipping", iconColor: "#00b894", bgColor: "#e6fff9" };
    if (type === "coupon") return { icon: "local_offer", iconColor: "#fd4f6a", bgColor: "#fff0f2" };
    if (type === "review") return { icon: "star", iconColor: "#f39c12", bgColor: "#fff8e6" };
    return { icon: "notifications", iconColor: "#636e72", bgColor: "#f1f2f6" };
}

function renderNotifications() {
    const list = document.getElementById("notification-list");
    const markAll = document.getElementById("mark-all-btn");
    list.innerHTML = "";
    let hasUnread = false;
    
    notifications.forEach(notif => {
        const isRead = notif.is_read === true;
        if (!isRead) hasUnread = true;
        
        const style = getNotificationStyle(notif.type);
        const card = document.createElement("div");
        card.style.cssText = `background:${isRead?"#fff":"#f8faff"};border-radius:12px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,0.04);display:flex;gap:15px;cursor:pointer;border:1px solid ${isRead?"#f1f2f6":"#dfe6e9"};`;
        
        const iconBox = document.createElement("div");
        iconBox.style.cssText = `width:40px;height:40px;border-radius:50%;background:${style.bgColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.style.cssText = `color:${style.iconColor};font-size:20px;`;
        icon.textContent = style.icon;
        iconBox.appendChild(icon);
        
        const content = document.createElement("div");
        content.style.flex = "1";
        
        const titleRow = document.createElement("div");
        titleRow.style.cssText = "display:flex;justify-content:space-between;align-items:flex-start;";
        
        const title = document.createElement("div");
        title.style.cssText = `font-weight:${isRead?"600":"700"};color:${isRead?"#2d3436":"#1a1a1a"};font-size:15px;`;
        title.textContent = notif.title || "Notification";
        
        titleRow.appendChild(title);
        
        if (!isRead) {
            const dot = document.createElement("div");
            dot.style.cssText = "width:8px;height:8px;background:#0984e3;border-radius:50%;margin-top:4px;flex-shrink:0;";
            titleRow.appendChild(dot);
        }
        
        const message = document.createElement("div");
        message.style.cssText = `color:${isRead?"#636e72":"#2d3436"};font-size:13px;margin-top:4px;line-height:1.4;`;
        message.textContent = notif.message || "";
        
        const time = document.createElement("div");
        time.style.cssText = "color:#a4b0be;font-size:11px;font-weight:500;margin-top:8px;";
        time.textContent = timeSince(notif.created_at);
        
        content.appendChild(titleRow);
        content.appendChild(message);
        content.appendChild(time);
        card.appendChild(iconBox);
        card.appendChild(content);
        
        card.onclick = () => handleNotificationClick(notif);
        list.appendChild(card);
    });
    
    markAll.style.visibility = hasUnread ? "visible" : "hidden";
}

async function handleNotificationClick(notif) {
    try {
        if (!notif.is_read) {
            const { error } = await supabaseClient
                .from("notifications")
                .update({ is_read: true })
                .eq("notification_id", notif.notification_id)
                .eq("user_id", currentUser.id);
            
            if (error) throw error;
            
            notif.is_read = true;
            renderNotifications();
        }
        
        if (notif.type === "order" || notif.type === "delivery") {
            window.location.href = "order.html";
        } else if (notif.type === "coupon") {
            window.location.href = "coupon.html";
        }
    } catch (error) {
        console.error("Mark notification read error:", error);
    }
}

window.markAllAsRead = async function() {
    if (!currentUser) return;
    
    const unread = notifications.filter(n => !n.is_read);
    if (!unread.length) return;
    
    const { error } = await supabaseClient
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);
    
    if (error) {
        console.error("Mark all read error:", error);
        return;
    }
    
    notifications.forEach(n => n.is_read = true);
    renderNotifications();
};