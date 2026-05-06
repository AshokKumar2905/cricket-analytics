from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import csv
import io
import os
import uuid

app = Flask(__name__)
CORS(app)

# Database Configuration[cite: 1]
client = MongoClient("mongodb://localhost:27017/")
db = client["cricket_db"]

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ======================
# HELPERS[cite: 1]
# ======================
def safe_object_id(id):
    try:
        return ObjectId(id)
    except:
        return None

def success(data):
    return jsonify({"status": "success", "data": data})

def error(msg):
    return jsonify({"status": "error", "message": msg}), 400

# ======================
# AUTH[cite: 1]
# ======================
USERS = {"admin": "cricket123", "user": "pass123"}
TOKENS = {}

@app.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username", "")
    password = data.get("password", "")
    if USERS.get(username) == password:
        token = str(uuid.uuid4())
        TOKENS[token] = username
        return success({"token": token, "username": username})
    return error("Invalid credentials")

@app.route("/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    TOKENS.pop(token, None)
    return success({"msg": "Logged out"})

@app.route("/verify-token", methods=["GET"])
def verify_token():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    username = TOKENS.get(token)
    if username:
        return success({"username": username})
    return error("Invalid token"), 401

# ======================
# PLAYERS[cite: 1]
# ======================
@app.route("/players", methods=["GET"])
def get_players():
    search = request.args.get("search", "")
    role_filter = request.args.get("role", "")
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if role_filter:
        query["role"] = role_filter
    players = []
    for p in db.players.find(query):
        players.append({
            "id":    str(p["_id"]),
            "name":  p.get("name"),
            "role":  p.get("role"),
            "photo": p.get("photo", ""),
            "team":  p.get("team", "")
        })
    return success(players)

@app.route("/players", methods=["POST"])
def add_player():
    data = request.json or {}
    if not data.get("name") or not data.get("role"):
        return error("Name and role required")
    result = db.players.insert_one({
        "name":  data["name"],
        "role":  data["role"],
        "photo": data.get("photo", ""),
        "team":  data.get("team", "")
    })
    return success({
        "id":    str(result.inserted_id),
        "name":  data["name"],
        "role":  data["role"],
        "photo": data.get("photo", ""),
        "team":  data.get("team", "")
    })

@app.route("/players/<id>", methods=["PUT"])
def update_player(id):
    oid = safe_object_id(id)
    if not oid: return error("Invalid ID")
    data = request.json or {}
    db.players.update_one(
        {"_id": oid},
        {"$set": {
            "name":  data.get("name"),
            "role":  data.get("role"),
            "photo": data.get("photo", ""),
            "team":  data.get("team", "")
        }}
    )
    player = db.players.find_one({"_id": oid})
    return success({
        "id": str(player["_id"]), "name": player.get("name"), 
        "role": player.get("role"), "photo": player.get("photo", ""), "team": player.get("team", "")
    })

@app.route("/players/<id>", methods=["DELETE"])
def delete_player(id):
    oid = safe_object_id(id)
    if not oid: return error("Invalid ID")
    db.players.delete_one({"_id": oid})
    return success({"msg": "Deleted"})

@app.route("/players/<id>/photo", methods=["POST"])
def upload_photo(id):
    oid = safe_object_id(id)
    if not oid: return error("Invalid ID")
    if "photo" not in request.files: return error("No file uploaded")
    file = request.files["photo"]
    allowed = {"png", "jpg", "jpeg", "webp", "gif"}
    if not file.filename or "." not in file.filename: return error("Invalid file")
    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext not in allowed: return error("Invalid file type")
    filename = f"{id}.{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    photo_url = f"/uploads/{filename}"
    db.players.update_one({"_id": oid}, {"$set": {"photo": photo_url}})
    return success({"photo": photo_url})

@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

# ======================
# MATCHES[cite: 1]
# ======================
@app.route("/matches", methods=["GET"])
def get_matches():
    search = request.args.get("search", "")
    fmt = request.args.get("format", "")
    query = {}
    if search:
        query["$or"] = [{"team1": {"$regex": search, "$options": "i"}}, {"team2": {"$regex": search, "$options": "i"}}]
    if fmt:
        query["format"] = fmt
    
    matches = []
    # Logic Update: Match center now requires current score totals
    for m in db.matches.find(query):
        mid = str(m["_id"])
        perfs = list(db.performances.find({"match_id": mid}))
        scores = {m.get("team1"): 0, m.get("team2"): 0}
        for p in perfs:
            t = p.get("team")
            if t in scores: scores[t] += p.get("runs", 0)

        matches.append({
            "id":     mid,
            "team1":  m.get("team1"),
            "team2":  m.get("team2"),
            "team1_runs": scores.get(m.get("team1"), 0),
            "team2_runs": scores.get(m.get("team2"), 0),
            "format": m.get("format"),
            "venue":  m.get("venue"),
            "date":   m.get("date", ""),
            "time":   m.get("time", ""),
            "status": m.get("status", "scheduled")
        })
    return success(matches)

@app.route("/matches", methods=["POST"])
def add_match():
    data = request.json or {}
    if not data.get("team1") or not data.get("team2"): return error("Teams required")
    result = db.matches.insert_one({
        "team1":  data.get("team1"),
        "team2":  data.get("team2"),
        "format": data.get("format", "T20"),
        "venue":  data.get("venue", ""),
        "date":   data.get("date", ""),
        "time":   data.get("time", ""),
        "status": data.get("status", "scheduled")
    })
    return success({"id": str(result.inserted_id), **data})

@app.route("/matches/<id>", methods=["PUT"])
def update_match(id):
    oid = safe_object_id(id)
    if not oid: return error("Invalid ID")
    data = request.json or {}
    # Enhanced Update: Allow granular status and venue changes for dynamic UI
    update_data = {
        "team1":  data.get("team1"),
        "team2":  data.get("team2"),
        "format": data.get("format"),
        "venue":  data.get("venue"),
        "date":   data.get("date"),
        "status": data.get("status", "scheduled")
    }
    db.matches.update_one({"_id": oid}, {"$set": {k: v for k, v in update_data.items() if v is not None}})
    m = db.matches.find_one({"_id": oid})
    return success({"id": str(m["_id"]), "status": m.get("status")})

@app.route("/matches/<id>", methods=["DELETE"])
def delete_match(id):
    oid = safe_object_id(id)
    if not oid: return error("Invalid ID")
    db.matches.delete_one({"_id": oid})
    return success({"msg": "Deleted"})

# ======================
# PERFORMANCE[cite: 1]
# ======================
@app.route("/performance", methods=["GET"])
def get_performances():
    players_map = {str(p["_id"]): p for p in db.players.find()}
    matches_map = {str(m["_id"]): m for m in db.matches.find()}
    perfs = []
    for p in db.performances.find():
        pid = p.get("player_id", "")
        mid = p.get("match_id", "")
        player = players_map.get(pid, {})
        match = matches_map.get(mid, {})
        perfs.append({
            "id": str(p["_id"]), "player_id": pid, "player_name": player.get("name", "Unknown"),
            "match_id": mid, "match_label": f"{match.get('team1','?')} vs {match.get('team2','?')}",
            "team": p.get("team", ""), "runs": p.get("runs", 0), "balls": p.get("balls", 0),
            "wickets": p.get("wickets", 0), "runs_conceded": p.get("runs_conceded", 0), "balls_bowled": p.get("balls_bowled", 0),
        })
    return success(perfs)

@app.route("/performance", methods=["POST"])
def add_performance():
    data = request.json or {}
    def safe_int(v):
        try: return int(v)
        except: return 0
    perf = {
        "player_id": data.get("player_id"), "match_id": data.get("match_id"), "team": data.get("team"),
        "runs": safe_int(data.get("runs")), "balls": safe_int(data.get("balls")),
        "wickets": safe_int(data.get("wickets")), "runs_conceded": safe_int(data.get("runs_conceded")),
        "balls_bowled": safe_int(data.get("balls_bowled"))
    }
    db.performances.insert_one(perf)
    return success({"msg": "Added"})

@app.route("/performance/<id>", methods=["DELETE"])
def delete_performance(id):
    oid = safe_object_id(id)
    if not oid: return error("Invalid ID")
    db.performances.delete_one({"_id": oid})
    return success({"msg": "Deleted"})

# ======================
# ANALYTICS & STATS[cite: 1]
# ======================
@app.route("/player-stats", methods=["GET"])
def player_stats():
    perfs = list(db.performances.find())
    players_map = {str(p["_id"]): p for p in db.players.find()}
    stats = {}
    for perf in perfs:
        pid = perf.get("player_id")
        if not pid: continue
        stats.setdefault(pid, {"runs": 0, "balls": 0, "wickets": 0, "runs_conceded": 0, "balls_bowled": 0, "matches": set()})
        stats[pid]["runs"] += int(perf.get("runs", 0))
        stats[pid]["balls"] += int(perf.get("balls", 0))
        stats[pid]["wickets"] += int(perf.get("wickets", 0))
        stats[pid]["runs_conceded"] += int(perf.get("runs_conceded", 0))
        stats[pid]["balls_bowled"] += int(perf.get("balls_bowled", 0))
        stats[pid]["matches"].add(perf.get("match_id", ""))
    
    result = []
    for pid, s in stats.items():
        player = players_map.get(pid)
        if not player: continue
        sr = round(s["runs"] / s["balls"] * 100, 2) if s["balls"] else 0.0
        od = s["balls_bowled"] / 6 if s["balls_bowled"] else 0
        eco = round(s["runs_conceded"] / od, 2) if od else 0.0
        result.append({
            "player_id": pid, "name": player.get("name"), "role": player.get("role"),
            "photo": player.get("photo", ""), "team": player.get("team", ""),
            "matches": len(s["matches"]), "runs": s["runs"], "balls": s["balls"],
            "strike_rate": sr, "wickets": s["wickets"], "runs_conceded": s["runs_conceded"],
            "overs": f"{s['balls_bowled'] // 6}.{s['balls_bowled'] % 6}", "economy": eco,
        })
    return success(result)

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    # Synchronized sorting logic for the Dashboard Chart[cite: 1]
    perfs = list(db.performances.find())
    stats = {}
    for p in perfs:
        team = p.get("team"); pid = p.get("player_id")
        if not team or not pid: continue
        stats.setdefault(team, {}).setdefault(pid, {"runs": 0, "balls": 0})
        stats[team][pid]["runs"] += int(p.get("runs", 0))
        stats[team][pid]["balls"] += int(p.get("balls", 0))
    
    players_map = {str(p["_id"]): p for p in db.players.find()}
    result = []
    for team, p_data in stats.items():
        t_players = []; total = 0
        for pid, val in p_data.items():
            player = players_map.get(pid)
            if not player: continue
            runs = val["runs"]; balls = val["balls"]
            sr = round(runs / balls * 100, 2) if balls else 0.0
            total += runs
            t_players.append({"player_id": pid, "name": player.get("name"), "runs": runs, "strike_rate": sr})
        result.append({"team": team, "total_runs": total, "players": sorted(t_players, key=lambda x: x["runs"], reverse=True)})
    
    return success(sorted(result, key=lambda x: x["total_runs"], reverse=True))

@app.route("/points-table", methods=["GET"])
def points_table():
    matches = list(db.matches.find())
    table = {}
    for m in matches:
        mid = str(m["_id"]); t1 = m.get("team1"); t2 = m.get("team2")
        if not t1 or not t2: continue
        for t in (t1, t2):
            table.setdefault(t, {"team": t, "played": 0, "won": 0, "lost": 0, "draw": 0, "points": 0, "nrr": 0.0})
        
        scores = {t1: 0, t2: 0}
        for p in db.performances.find({"match_id": mid}):
            team = p.get("team")
            if team in scores: scores[team] += int(p.get("runs", 0))

        table[t1]["played"] += 1; table[t2]["played"] += 1
        if scores[t1] > scores[t2]:
            table[t1]["won"] += 1; table[t1]["points"] += 2; table[t2]["lost"] += 1
        elif scores[t2] > scores[t1]:
            table[t2]["won"] += 1; table[t2]["points"] += 2; table[t1]["lost"] += 1
        else:
            table[t1]["draw"] += 1; table[t2]["draw"] += 1; table[t1]["points"] += 1; table[t2]["points"] += 1
        
        table[t1]["nrr"] += (scores[t1] - scores[t2]) / 100.0
        table[t2]["nrr"] += (scores[t2] - scores[t1]) / 100.0

    res = sorted(table.values(), key=lambda x: (-x["points"], -x["nrr"]))
    for r in res: r["nrr"] = round(r["nrr"], 2)
    return success(res)

@app.route("/match-result/<match_id>", methods=["GET"])
def match_result(match_id):
    oid = safe_object_id(match_id)
    if not oid: return error("Invalid Match ID")
    match = db.matches.find_one({"_id": oid})
    if not match: return error("Match not found")
    
    perfs = list(db.performances.find({"match_id": match_id}))
    scores = {match["team1"]: 0, match["team2"]: 0}
    for p in perfs:
        t = p.get("team")
        if t in scores: scores[t] += p.get("runs", 0)

    winner = "Draw"
    if scores[match["team1"]] > scores[match["team2"]]: winner = match["team1"]
    elif scores[match["team2"]] > scores[match["team1"]]: winner = match["team2"]

    # POTM Calculation Logic[cite: 1]
    best_player = "N/A"; best_score = -999
    players_map = {str(p["_id"]): p for p in db.players.find()}
    for p in perfs:
        score = (p.get("runs", 0) * 1.2) + (p.get("wickets", 0) * 25)
        if score > best_score:
            best_score = score
            player = players_map.get(p.get("player_id"))
            best_player = player.get("name") if player else "Unknown"

    return success({
        "match": {"team1": match["team1"], "team2": match["team2"], "team1_runs": scores[match["team1"]], "team2_runs": scores[match["team2"]], "winner": winner},
        "player_of_match": {"name": best_player, "score": round(best_score, 2)}
    })

@app.route("/bowling-stats", methods=["GET"])
def bowling_stats():
    # Re-using logic to match Bowling.jsx table[cite: 1]
    stats = {}
    for p in db.performances.find():
        pid = p.get("player_id")
        if not pid: continue
        stats.setdefault(pid, {"runs_conceded": 0, "balls": 0, "wickets": 0})
        stats[pid]["runs_conceded"] += int(p.get("runs_conceded", 0))
        stats[pid]["balls"] += int(p.get("balls_bowled", 0))
        stats[pid]["wickets"] += int(p.get("wickets", 0))
    
    players_map = {str(p["_id"]): p for p in db.players.find()}
    result = []
    for pid, s in stats.items():
        player = players_map.get(pid)
        if not player or s["balls"] == 0: continue
        od = s["balls"] / 6
        result.append({
            "name": player.get("name"), "wickets": s["wickets"], "runs_conceded": s["runs_conceded"],
            "overs": f"{s['balls'] // 6}.{s['balls'] % 6}", "economy": round(s["runs_conceded"] / od, 2)
        })
    return success(sorted(result, key=lambda x: (-x["wickets"], x["economy"])))

@app.route("/reset-all", methods=["DELETE"])
def reset_all():
    db.players.delete_many({}); db.matches.delete_many({}); db.performances.delete_many({})
    return success({"message": "Database purged successfully"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)