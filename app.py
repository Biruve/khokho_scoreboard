from flask import Flask, render_template, jsonify, request
import time

app = Flask(__name__)

TURN_DURATION = 7 * 60
BREAK_DURATION = 2 * 60 + 59

# ---------------- TEAM ---------------- #
def initial_team(name, side):
    return {
        "name": name,
        "side": side,
        "score": 0
    }

# ---------------- GAME STATE ---------------- #
game_state = {
    "teams": [
        initial_team("Red Kites", "l"),
        initial_team("Blue Hawks", "r")
    ],
    "start_time": None,
    "paused_time": TURN_DURATION,
    "running": False,
    "phase": "turn"
}

# ---------------- TIMER ---------------- #
def get_duration():
    return TURN_DURATION if game_state["phase"] == "turn" else BREAK_DURATION

def switch_phase():
    if game_state["phase"] == "turn":
        game_state["phase"] = "break"
        game_state["paused_time"] = BREAK_DURATION
    else:
        game_state["phase"] = "turn"
        game_state["paused_time"] = TURN_DURATION

    game_state["start_time"] = time.monotonic()

def get_time():
    if not game_state["running"]:
        return game_state["paused_time"]

    elapsed = time.monotonic() - game_state["start_time"]
    remaining = get_duration() - elapsed

    if remaining <= 0:
        switch_phase()
        return game_state["paused_time"]

    return int(remaining)

# ---------------- ROUTES ---------------- #

@app.route("/")
def display():
    return render_template("display.html")

@app.route("/control")
def control():
    return render_template("control.html")

@app.route("/state")
def state():
    return jsonify({
        "teams": game_state["teams"],
        "timer": get_time(),
        "running": game_state["running"],
        "phase": game_state["phase"]
    })

# ▶️ START
@app.route("/start", methods=["POST"])
def start():
    if not game_state["running"]:
        duration = get_duration()
        game_state["start_time"] = time.monotonic() - (duration - game_state["paused_time"])
        game_state["running"] = True
    return jsonify({"status": "ok"})

# ⏸ PAUSE
@app.route("/pause", methods=["POST"])
def pause():
    if game_state["running"]:
        game_state["paused_time"] = get_time()
        game_state["running"] = False
    return jsonify({"status": "ok"})

# 🔄 RESET MATCH
@app.route("/reset", methods=["POST"])
def reset():
    print("RESET CALLED")

    game_state["teams"] = [
        initial_team("Red Kites", "l"),
        initial_team("Blue Hawks", "r")
    ]
    game_state["paused_time"] = TURN_DURATION
    game_state["running"] = False
    game_state["start_time"] = None
    game_state["phase"] = "turn"

    return jsonify({"status": "reset"})

# 🔁 END TURN
@app.route("/end_turn", methods=["POST"])
def end_turn():
    print("END TURN CALLED")

    if game_state["phase"] == "turn":
        game_state["phase"] = "break"
        game_state["paused_time"] = BREAK_DURATION
    else:
        game_state["phase"] = "turn"
        game_state["paused_time"] = TURN_DURATION

    game_state["start_time"] = time.monotonic()
    game_state["running"] = True

    return jsonify({"status": "ok"})

# ➕ SCORE
@app.route("/score", methods=["POST"])
def score():
    t = request.json["team"]
    game_state["teams"][t]["score"] += 1
    return jsonify({"status": "ok"})

# ➖ SCORE
@app.route("/score/decrement", methods=["POST"])
def minus():
    t = request.json["team"]
    if game_state["teams"][t]["score"] > 0:
        game_state["teams"][t]["score"] -= 1
    return jsonify({"status": "ok"})

# ---------------- RUN ---------------- #
if __name__ == "__main__":
    app.run(debug=True)