let previousCount = null;

// ================================
// LOAD NOTIFICATIONS
// ================================
async function loadNotifications() {
    try {

        const res = await fetch("/notifications/data");
        

        if (!res.ok) {
            throw new Error("Failed to fetch notifications");
        }

        const data = await res.json();

        const unread = data.filter(n => !n.isRead);

        const count = unread.length;

        updateCounter(count);

        // animate if new notification arrives
        if (previousCount !== null && count > previousCount) {
          animateBell();
        }

        previousCount = count;

    } catch (err) {
        console.log("Notification error:", err.message);
    }
}



// ================================
// UPDATE COUNTER
// ================================
function updateCounter(count) {

    const value = count > 99 ? "99+" : count;

    const badges = [
        document.getElementById("notifCount"),
        document.getElementById("notifCountMobile")
    ];

    badges.forEach(badge => {

        if (!badge) return;

        if (count > 0) {
            badge.innerText = value;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }

    });

}



// ================================
// BELL ANIMATION
// ================================
function animateBell() {

    const bell = document.getElementById("notifBell");

    if (!bell) return;

    bell.classList.add("bell-ring");

    setTimeout(() => {
        bell.classList.remove("bell-ring");
    }, 700);
}



// ================================
// MARK ALL READ
// ================================
async function markAllAsRead() {

    try {

        const res = await fetch(
            "/notifications/read-all",
            {
                method:"PATCH"
            }
        );

        const data = await res.json();

        if(data.success){

            previousCount=0;

            loadNotifications();

            location.reload();
        }

    }
    catch(err){
        console.log(err);
    }
}


// initial load
loadNotifications();

setInterval(loadNotifications,5000);