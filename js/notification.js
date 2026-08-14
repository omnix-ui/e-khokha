// ==========================================
// 🔔 E-KHOKHA NOTIFICATION ENGINE
// ==========================================

const MOCK_USER_ID = "auth-uuid-placeholder-001";

document.addEventListener('DOMContentLoaded', () => {
    renderNotifications();
});

// Helper Function: Date to "X hours ago"
function timeSince(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "Just now";
}

function renderNotifications() {
    const listContainer = document.getElementById('notification-list');
    const emptyState = document.getElementById('empty-state');
    const markAllBtn = document.getElementById('mark-all-btn');

    // Rule 7: Fetch Read State from LocalStorage (Mutate nahi karna master data ko)
    const readList = JSON.parse(localStorage.getItem('eKhokhaReadNotifications')) || [];

    // Rule 4: Filter & Sort (Newest First)
    let userNotifications = eKhokhaNotifications.filter(n => n.user_id === MOCK_USER_ID);
    userNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (userNotifications.length === 0) {
        listContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        markAllBtn.style.display = 'none';
        return;
    }

    listContainer.innerHTML = '';
    let hasUnread = false;

    userNotifications.forEach(notif => {
        // Checking if read logically
        const isRead = notif.is_read || readList.includes(notif.notification_id);
        if (!isRead) hasUnread = true;

        // Dynamic Icon & Colors based on Type
        let iconName = 'notifications';
        let iconColor = '#636e72';
        let bgColor = '#f1f2f6';

        if (notif.type === 'order') { iconName = 'shopping_bag'; iconColor = '#0984e3'; bgColor = '#e6f2ff'; }
        else if (notif.type === 'delivery') { iconName = 'local_shipping'; iconColor = '#00b894'; bgColor = '#e6fff9'; }
        else if (notif.type === 'coupon') { iconName = 'local_offer'; iconColor = '#fd4f6a'; bgColor = '#fff0f2'; }

        const card = document.createElement('div');
        // Unread styling: Background highlight
        card.style.background = isRead ? '#fff' : '#f8faff';
        card.style.borderRadius = '12px';
        card.style.padding = '15px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        card.style.display = 'flex';
        card.style.gap = '15px';
        card.style.cursor = 'pointer';
        card.style.border = isRead ? '1px solid #f1f2f6' : '1px solid #dfe6e9';
        
        // Action on Click
        card.onclick = () => handleNotificationClick(notif.notification_id, notif.type);

        card.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${bgColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span class="material-symbols-outlined" style="color: ${iconColor}; font-size: 20px;">${iconName}</span>
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="font-weight: ${isRead ? '600' : '700'}; color: ${isRead ? '#2d3436' : '#1a1a1a'}; font-size: 15px;">
                        ${notif.title}
                    </div>
                    <!-- Rule 5: Unread Blue Dot -->
                    ${!isRead ? `<div style="width: 8px; height: 8px; background: #0984e3; border-radius: 50%; margin-top: 4px;"></div>` : ''}
                </div>
                <div style="color: ${isRead ? '#636e72' : '#2d3436'}; font-size: 13px; margin-top: 4px; line-height: 1.4;">
                    ${notif.message}
                </div>
                <div style="color: #a4b0be; font-size: 11px; font-weight: 500; margin-top: 8px;">
                    ${timeSince(notif.created_at)}
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });

    // Toggle 'Mark all as read' button visibility
    markAllBtn.style.visibility = hasUnread ? 'visible' : 'hidden';

}

// 🔴 Action Handler (Rule 6 & 7)
function handleNotificationClick(notifId, type) {
    // 1. Mark as Read in LocalStorage
    let readList = JSON.parse(localStorage.getItem('eKhokhaReadNotifications')) || [];
    if (!readList.includes(notifId)) {
        readList.push(notifId);
        localStorage.setItem('eKhokhaReadNotifications', JSON.stringify(readList));
    }

    // 2. Redirect Rules
    if (type === 'order' || type === 'delivery') {
        window.location.href = "order.html"; // Assume order history page
    } else if (type === 'coupon') {
        window.location.href = "coupon.html";
    } else {
        // General notification, just re-render to remove the unread dot
        renderNotifications();
    }
}

// 🔴 Mark All As Read Logic (Rule 8)
window.markAllAsRead = function() {
    let readList = JSON.parse(localStorage.getItem('eKhokhaReadNotifications')) || [];
    
    // Find all unread notifications for this user
    let unreadIds = eKhokhaNotifications
        .filter(n => n.user_id === MOCK_USER_ID && !n.is_read && !readList.includes(n.notification_id))
        .map(n => n.notification_id);

    if (unreadIds.length > 0) {
        readList = [...readList, ...unreadIds];
        localStorage.setItem('eKhokhaReadNotifications', JSON.stringify(readList));
        renderNotifications(); // UI Refresh
    }
};
