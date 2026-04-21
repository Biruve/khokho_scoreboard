function format(t) {
    let m = String(Math.floor(t / 60)).padStart(2, "0");
    let s = String(t % 60).padStart(2, "0");
    return m + ":" + s;
}

// 🔄 SYNC UI
async function sync() {
    let res = await fetch("/state");
    let data = await res.json();

    document.getElementById("timer").innerText = format(data.timer);
    document.getElementById("team1_score").innerText = data.teams[0].score;
    document.getElementById("team2_score").innerText = data.teams[1].score;

    // progress bar
    let percent = (data.timer / (7 * 60)) * 100;
    document.getElementById("progress").style.width = percent + "%";
}

// 🔁 AUTO UPDATE
setInterval(sync, 1000);

// ▶️ / ⏸ TOGGLE
async function toggleGame() {
    let res = await fetch("/state");
    let data = await res.json();

    if (data.running) {
        await fetch("/pause", { method: "POST" });
    } else {
        await fetch("/start", { method: "POST" });
    }

    sync();
}

// 🔄 RESET
async function resetGame() {
    let confirmReset = confirm("Reset match?");
    if (!confirmReset) return;

    await fetch("/reset", { method: "POST" });
    sync();
}

// 🔁 END TURN
async function endTurn() {
    await fetch("/end_turn", { method: "POST" });
    sync();
}

// LOAD
window.onload = sync;