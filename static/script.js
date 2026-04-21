let timer = 0;
let running = false;

function format(t) {
    let m = String(Math.floor(t/60)).padStart(2,"0");
    let s = String(t%60).padStart(2,"0");
    return m+":"+s;
}

function updateUI() {
    document.getElementById("timer").innerText = format(timer);
}

function tick() {
    setInterval(()=>{
        if(running && timer>0){
            timer--;
            updateUI();
        }
    },1000);
}

async function sync() {
    let r = await fetch("/state");
    let d = await r.json();

    timer = d.timer;
    running = d.running;

    document.getElementById("phase").innerText = d.phase.toUpperCase();
    document.getElementById("team1_name").innerText = d.teams[0].name;
    document.getElementById("team2_name").innerText = d.teams[1].name;
    document.getElementById("team1_score").innerText = d.teams[0].score;
    document.getElementById("team2_score").innerText = d.teams[1].score;

    updateUI();
}

setInterval(sync,5000);

window.onload = ()=>{
    tick();
    sync();
};

/* 🔥 SECRET KEY → OPEN CONTROL PANEL */
document.addEventListener("keydown", function(e){
    if(e.ctrlKey && e.shiftKey && e.key==="A"){
        window.location.href="/control";
    }
});