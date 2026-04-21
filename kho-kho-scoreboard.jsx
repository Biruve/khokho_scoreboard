import { useState, useEffect, useRef, useCallback } from "react";

const TURN_DURATION = 9 * 60;

const initialTeamState = (name, side) => ({
  name, side,
  score: 0, outs: 0, innings: 1, turnsLeft: 2,
  players: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `P${i + 1}`, status: "active" })),
  outLog: [],
});

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;600;700&family=Barlow+Condensed:ital,wght@0,400;0,600;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --deep:#08030a;--field:#100818;--panel:#130c1a;--glass:rgba(255,255,255,0.03);
  --gold:#f5c842;--gold2:#c89820;--ember:#e8501e;--ember2:#a03310;
  --cream:#f0e8d8;--muted:#6a5870;--border:rgba(245,200,66,0.14);--bright:rgba(245,200,66,0.5);
  --red:#d93b28;--red-l:#ff7b65;--blue:#1a4a9a;--blue-l:#5da8f0;
}
body{background:var(--deep)}
.root{
  min-height:100vh;
  background:var(--deep);
  background-image:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(245,200,66,0.06) 0%,transparent 70%),
    radial-gradient(ellipse 60% 40% at 20% 100%,rgba(232,80,30,0.05) 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 100%,rgba(26,74,154,0.05) 0%,transparent 60%),
    repeating-linear-gradient(0deg,rgba(255,255,255,0.012) 0,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 80px),
    repeating-linear-gradient(90deg,rgba(255,255,255,0.012) 0,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 80px);
  font-family:'Barlow Condensed',sans-serif;
  color:var(--cream);
}
/* HEADER */
.hdr{
  background:linear-gradient(180deg,rgba(20,10,30,0.98),rgba(16,8,24,0.95));
  border-bottom:1px solid var(--border);
  padding:0 28px;
  display:flex;align-items:center;justify-content:space-between;
  position:relative;overflow:hidden;
}
.hdr::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--red),var(--gold),var(--blue),transparent)}
.brand{display:flex;align-items:center;gap:16px;padding:16px 0}
.brand-orb{
  width:56px;height:56px;border-radius:50%;flex-shrink:0;
  background:conic-gradient(from 0deg,var(--ember),var(--gold),var(--ember));
  display:flex;align-items:center;justify-content:center;font-size:28px;
  box-shadow:0 0 32px rgba(245,200,66,0.4),0 0 60px rgba(232,80,30,0.2);
  animation:spin-glow 8s linear infinite;
}
@keyframes spin-glow{0%,100%{box-shadow:0 0 32px rgba(245,200,66,0.4),0 0 60px rgba(232,80,30,0.2)}50%{box-shadow:0 0 48px rgba(245,200,66,0.7),0 0 80px rgba(232,80,30,0.3)}}
.brand-title{font-family:'Bebas Neue',sans-serif;font-size:48px;line-height:1;color:var(--gold);letter-spacing:4px;text-shadow:0 0 30px rgba(245,200,66,0.4)}
.brand-sub{font-size:11px;letter-spacing:5px;color:var(--muted);text-transform:uppercase;margin-top:2px}
.live-pill{
  display:flex;align-items:center;gap:7px;
  font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:2px;
  padding:6px 16px;border-radius:20px;
  border:1px solid rgba(232,80,30,0.5);
  color:var(--ember);background:rgba(232,80,30,0.08);
}
.ldot{width:8px;height:8px;border-radius:50%;background:var(--ember);animation:pulse 1.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.6)}}

/* TABS */
.tabs{display:flex;background:rgba(12,6,18,0.95);border-bottom:1px solid var(--border);padding:0 28px}
.tab{padding:13px 24px;font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:2.5px;text-transform:uppercase;
  cursor:pointer;border:none;background:transparent;color:var(--muted);
  border-bottom:2px solid transparent;transition:all 0.2s;position:relative}
.tab.on{color:var(--gold);border-bottom-color:var(--gold)}
.tab:hover:not(.on){color:var(--cream)}

/* MAIN */
.main{max-width:1080px;margin:0 auto;padding:28px 20px 60px}

/* SCOREBOARD */
.sboard{
  display:grid;grid-template-columns:1fr 200px 1fr;
  border:1px solid var(--border);border-radius:6px;overflow:hidden;
  background:var(--panel);
  box-shadow:0 20px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.02),0 0 120px rgba(245,200,66,0.04);
  margin-bottom:18px;position:relative;
}
.sboard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--red),40%,var(--gold),60%,var(--blue));z-index:2}

/* Team cards */
.tc{padding:30px 26px 24px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.tc::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 120% 100% at var(--ox,0%) 50%,var(--oc,transparent) 0%,transparent 70%);
  pointer-events:none;opacity:0.07}
.tc.l{--ox:0%;--oc:var(--red);border-right:1px solid var(--border)}
.tc.r{--ox:100%;--oc:var(--blue);border-left:1px solid var(--border)}
.tc.att::before{opacity:0.13}
.tc.att{background:rgba(255,255,255,0.018)}
.att-tag{
  display:inline-flex;align-items:center;gap:5px;
  font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2.5px;
  color:var(--gold);background:rgba(245,200,66,0.1);border:1px solid rgba(245,200,66,0.35);
  padding:3px 10px;border-radius:2px;width:fit-content;margin-bottom:12px;text-transform:uppercase
}
.tname-row{display:flex;align-items:center;gap:9px;margin-bottom:4px}
.tcol-bar{width:4px;height:28px;border-radius:2px;flex-shrink:0}
.tname{font-family:'Oswald',sans-serif;font-size:24px;font-weight:700;letter-spacing:0.5px;line-height:1;cursor:pointer}
.tname:hover{opacity:0.7}
.edit-inp{
  font-family:'Oswald',sans-serif;font-size:21px;
  background:rgba(255,255,255,0.05);border:1px solid var(--bright);
  color:var(--cream);padding:4px 10px;border-radius:3px;outline:none;width:165px
}
.score-num{
  font-family:'Bebas Neue',sans-serif;font-size:108px;line-height:0.85;
  letter-spacing:-3px;margin:10px 0 6px;
}
.score-num.l{color:var(--red-l);text-shadow:0 0 50px rgba(217,59,40,0.5),0 0 100px rgba(217,59,40,0.2)}
.score-num.r{color:var(--blue-l);text-shadow:0 0 50px rgba(26,74,154,0.5),0 0 100px rgba(26,74,154,0.2)}
.tstats{display:flex;gap:22px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px}
.si{display:flex;flex-direction:column;gap:3px}
.sv{font-family:'Oswald',sans-serif;font-size:28px;font-weight:600;line-height:1}
.sl{font-size:10px;letter-spacing:2.5px;color:var(--muted);text-transform:uppercase}

/* Center */
.cp{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 14px;gap:14px;background:rgba(0,0,0,0.3)}
.clbl{font-size:10px;letter-spacing:3.5px;color:var(--muted);text-transform:uppercase}
.ctimer{
  font-family:'Bebas Neue',sans-serif;font-size:58px;line-height:1;letter-spacing:5px;
  transition:color 0.5s,text-shadow 0.5s;
}
.ctimer.ok{color:var(--gold);text-shadow:0 0 24px rgba(245,200,66,0.4)}
.ctimer.warn{color:var(--ember);text-shadow:0 0 24px rgba(232,80,30,0.6);animation:flkr 0.9s ease-in-out infinite}
@keyframes flkr{0%,100%{opacity:1}50%{opacity:0.65}}
.tbar-bg{width:100%;height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden}
.tbar-fg{height:100%;border-radius:3px;transition:width 1s linear,background 0.5s}
.vs{font-family:'Bebas Neue',sans-serif;font-size:30px;color:rgba(255,255,255,0.15);letter-spacing:4px}
.inn-lbl{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:2px;color:var(--muted);text-transform:uppercase}
.pause-btn{
  padding:6px 18px;border-radius:2px;border:1px solid var(--border);
  background:rgba(255,255,255,0.04);color:var(--cream);cursor:pointer;font-size:18px;
  transition:all 0.15s
}
.pause-btn:hover{background:rgba(255,255,255,0.09)}

/* COMMENTARY */
.comm{
  background:linear-gradient(135deg,rgba(245,200,66,0.05),rgba(232,80,30,0.03));
  border:1px solid var(--border);border-left:4px solid var(--gold);border-radius:4px;
  padding:18px 22px;display:flex;gap:16px;align-items:flex-start;margin-bottom:18px;
}
.comm-mic{font-size:30px;flex-shrink:0;line-height:1;margin-top:2px}
.comm-lbl{font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:3px;color:var(--gold);text-transform:uppercase;margin-bottom:7px}
.comm-txt{font-size:16px;line-height:1.65;color:rgba(240,232,216,0.9);font-style:italic}
.comm-txt.shim{color:var(--muted);font-size:14px;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:1}}

/* ACTIONS */
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.btn{
  font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:2px;text-transform:uppercase;
  padding:13px 24px;border-radius:3px;border:1px solid;cursor:pointer;
  transition:all 0.15s;flex:1;min-width:130px;text-align:center;
}
.btn:hover{transform:translateY(-2px)}
.btn:active{transform:translateY(0) scale(0.98)}
.bg{background:rgba(245,200,66,0.1);border-color:var(--gold2);color:var(--gold)}
.bg:hover{background:rgba(245,200,66,0.2);border-color:var(--gold)}
.be{background:rgba(232,80,30,0.1);border-color:var(--ember2);color:var(--ember)}
.be:hover{background:rgba(232,80,30,0.2);border-color:var(--ember)}
.bm{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.1);color:var(--muted)}
.bm:hover{background:rgba(255,255,255,0.07);color:var(--cream)}

/* SETUP */
.setup{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:22px}
.setup-ico{font-size:72px;filter:drop-shadow(0 0 30px rgba(245,200,66,0.3))}
.setup-title{font-family:'Bebas Neue',sans-serif;font-size:52px;color:var(--gold);letter-spacing:5px}
.setup-sub{font-size:15px;color:var(--muted);letter-spacing:1px}
.start-btn{
  font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:7px;
  padding:22px 60px;border-radius:4px;border:none;cursor:pointer;color:#fff;
  background:linear-gradient(135deg,#a02808,#e8501e,#f5c842,#e8501e,#a02808);
  background-size:300% 100%;animation:btn-anim 4s ease infinite;
  box-shadow:0 0 40px rgba(232,80,30,0.4),0 8px 32px rgba(0,0,0,0.5);
  transition:box-shadow 0.3s,transform 0.2s;
}
.start-btn:hover{box-shadow:0 0 70px rgba(232,80,30,0.7),0 12px 40px rgba(0,0,0,0.6);transform:translateY(-3px)}
@keyframes btn-anim{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

/* HALFTIME */
.htime{text-align:center;padding:36px 20px;display:flex;flex-direction:column;align-items:center;gap:18px}
.htime-title{font-family:'Bebas Neue',sans-serif;font-size:52px;color:var(--gold);letter-spacing:6px}
.hscores{display:flex;gap:24px;align-items:center}
.hteam{display:flex;flex-direction:column;align-items:center;gap:5px}
.hscore{font-family:'Bebas Neue',sans-serif;font-size:72px;line-height:1}
.hname{font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:2px;color:var(--muted);text-transform:uppercase}
.hsep{font-family:'Bebas Neue',sans-serif;font-size:40px;color:rgba(255,255,255,0.15)}

/* WIN */
.win{text-align:center;padding:44px 20px;display:flex;flex-direction:column;align-items:center;gap:16px}
.win-ico{font-size:80px;animation:float 2s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.win-title{font-family:'Bebas Neue',sans-serif;font-size:60px;color:var(--gold);letter-spacing:4px;text-shadow:0 0 50px rgba(245,200,66,0.5)}
.win-score{font-family:'Oswald',sans-serif;font-size:22px;letter-spacing:2px}

/* PLAYERS */
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.psec-title{font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:3px;text-transform:uppercase;
  margin-bottom:12px;display:flex;align-items:center;gap:8px}
.plist{display:flex;flex-direction:column;gap:5px}
.prow{
  display:flex;align-items:center;padding:9px 13px;border-radius:3px;
  border:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.025);transition:all 0.15s;
}
.prow.out{opacity:0.33;background:rgba(0,0,0,0.25)}
.prow.active:hover{border-color:rgba(255,255,255,0.1)}
.pdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.pnum{font-family:'Oswald',sans-serif;font-size:15px;font-weight:600;width:26px;text-align:center;color:var(--muted)}
.pname{font-size:14px;flex:1;margin-left:10px}
.tagbtn{
  font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
  padding:4px 12px;border-radius:2px;cursor:pointer;border:1px solid rgba(232,80,30,0.4);
  background:rgba(232,80,30,0.1);color:var(--ember);transition:all 0.15s;
}
.tagbtn:hover{background:rgba(232,80,30,0.25);border-color:var(--ember)}
.out-pill{font-size:10px;letter-spacing:2px;text-transform:uppercase;background:rgba(232,80,30,0.12);color:var(--ember);padding:2px 8px;border-radius:2px;border:1px solid rgba(232,80,30,0.25)}

/* LOG */
.logwrap{
  background:rgba(0,0,0,0.35);border:1px solid var(--border);border-radius:4px;
  max-height:380px;overflow-y:auto;
}
.logwrap::-webkit-scrollbar{width:4px}
.logwrap::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.loge{display:flex;gap:14px;padding:10px 18px;border-bottom:1px solid rgba(255,255,255,0.04)}
.loge:last-child{border-bottom:none}
.logts{font-family:'Oswald',sans-serif;font-size:11px;color:var(--muted);letter-spacing:1px;padding-top:1px;flex-shrink:0}
.logmsg{font-size:14px;line-height:1.45}
.log-empty{padding:44px;text-align:center;color:var(--muted);font-size:14px;letter-spacing:1px}

/* FOOTER STATS */
.fstats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
.fsc{background:var(--panel);border:1px solid var(--border);border-radius:3px;padding:16px;text-align:center}
.fscv{font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--gold);line-height:1;letter-spacing:1px}
.fscl{font-size:10px;color:var(--muted);letter-spacing:2.5px;text-transform:uppercase;margin-top:5px}

/* DIVIDER */
.section-hdr{
  display:flex;align-items:center;gap:12px;margin-bottom:14px;font-family:'Oswald',sans-serif;
  font-size:12px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;
}
.section-hdr::after{content:'';flex:1;height:1px;background:var(--border)}
`;

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function KhoKho() {
  const [teams, setTeams] = useState([initialTeamState("Red Kites", "l"), initialTeamState("Blue Hawks