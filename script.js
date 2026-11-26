
// ========================================
// Settings
// ========================================

const SECONDS_PER_COIN = 60;
const WEBSOCKET_URL = "ws://localhost:21213/";
const TEST_MODE = true;

// ========================================
// Timer
// ========================================

const timer = document.getElementById("timer");

let endTime = 0;

function updateTimer() {
    const remaining = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
    );

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    timer.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function addTime(seconds) {
    endTime = Math.max(endTime, Date.now())
        + seconds * 1000;

    updateTimer();
}

function addCoins(coins) {
    if (!Number.isFinite(coins) || coins <= 0) {
        return;
    }

    addTime(coins * SECONDS_PER_COIN);
}

setInterval(updateTimer, 100);

// ========================================
// Gift Handler
// ========================================

function handleEvent(message) {
    if (message.event !== "gift") {
        return;
    }

    const data = message.data;

    if (!data) {
        return;
    }

    // Prevent duplicate counting of gift combos
    if (Number(data.giftType) === 1 && !data.repeatEnd) {
        return;
    }

    const coinValue = Number(data.diamondCount);
    const repeatCount = Number(data.repeatCount ?? 1);
    const totalCoins = coinValue * repeatCount;

    console.log("Gift:", data.giftName);
    console.log("Coins:", totalCoins);

    addCoins(totalCoins);
}

// ========================================
// TikFinity WebSocket
// ========================================

function connect() {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
        console.log("TikFinity: Connected");
    };

    socket.onmessage = (message) => {
        try {
            handleEvent(JSON.parse(message.data));
        } catch (error) {
            console.error(error);
        }
    };

    socket.onerror = () => {
        console.log("TikFinity: Connection Error");
    };

    socket.onclose = () => {
        console.log("TikFinity: Disconnected");
        setTimeout(connect, 3000);
    };
}

// ========================================
// Test Mode
// ========================================

if (TEST_MODE) {
    document.addEventListener("keydown", (event) => {
        if (event.repeat) {
            return;
        }

        const key = event.key.toLowerCase();

        const testCoins = {
            "1": 1,
            "2": 5,
            "3": 10
        };

        if (key in testCoins) {
            handleEvent({
                event: "gift",
                data: {
                    giftName: "Test Gift",
                    diamondCount: testCoins[key],
                    repeatCount: 1,
                    giftType: 1,
                    repeatEnd: true
                }
            });
        }

        if (key === "t") {
            endTime = Date.now() + 5000;
            updateTimer();
        }

        if (key === "r") {
            endTime = 0;
            updateTimer();
        }
    });
}

// ========================================
// Initialize
// ========================================

updateTimer();
connect();
