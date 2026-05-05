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

client = MongoClient("mongodb://localhost:27017/")
db = client["cricket_db"]

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ======================
# HELPERS
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
# AUTH
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
# PLAYERS
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
    if not oid:
        return error("Invalid ID")
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
        "id":    str(player["_id"]),
        "name":  player.get("name"),
        "role":  player.get("role"),
        "photo": player.get("photo", ""),
        "team":  player.get("team", "")
    })

@app.route("/players/<id>", methods=["DELETE"])
def delete_player(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    db.players.delete_one({"_id": oid})
    return success({"msg": "Deleted"})

# Photo upload
@app.route("/players/<id>/photo", methods=["POST"])
def upload_photo(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    if "photo" not in request.files:
        return error("No file uploaded")
    file = request.files["photo"]
    allowed = {"png", "jpg", "jpeg", "webp", "gif"}
    if not file.filename or "." not in file.filename:
        return error("Invalid file")
    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext not in allowed:
        return error("Invalid file type")
    filename = f"{id}.{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    photo_url = f"/uploads/{filename}"
    db.players.update_one({"_id": oid}, {"$set": {"photo": photo_url}})
    return success({"photo": photo_url})

@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

# ======================
# MATCHES  (with date/time/status)
# ======================
@app.route("/matches", methods=["GET"])
def get_matches():
    search = request.args.get("search", "")
    fmt    = request.args.get("format", "")
    query  = {}
    if search:
        query["$or"] = [
            {"team1": {"$regex": search, "$options": "i"}},
            {"team2": {"$regex": search, "$options": "i"}}
        ]
    if fmt:
        query["format"] = fmt
    matches = []
    for m in db.matches.find(query):
        matches.append({
            "id":     str(m["_id"]),
            "team1":  m.get("team1"),
            "team2":  m.get("team2"),
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
    if not data.get("team1") or not data.get("team2"):
        return error("Teams required")
    result = db.matches.insert_one({
        "team1":  data.get("team1"),
        "team2":  data.get("team2"),
        "format": data.get("format", "T20"),
        "venue":  data.get("venue", ""),
        "date":   data.get("date", ""),
        "time":   data.get("time", ""),
        "status": data.get("status", "scheduled")
    })
    return success({
        "id":     str(result.inserted_id),
        "team1":  data.get("team1"),
        "team2":  data.get("team2"),
        "format": data.get("format", "T20"),
        "venue":  data.get("venue", ""),
        "date":   data.get("date", ""),
        "time":   data.get("time", ""),
        "status": data.get("status", "scheduled")
    })

@app.route("/matches/<id>", methods=["PUT"])
def update_match(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    data = request.json or {}
    db.matches.update_one({"_id": oid}, {"$set": {
        "team1":  data.get("team1"),
        "team2":  data.get("team2"),
        "format": data.get("format"),
        "venue":  data.get("venue"),
        "date":   data.get("date", ""),
        "time":   data.get("time", ""),
        "status": data.get("status", "scheduled")
    }})
    m = db.matches.find_one({"_id": oid})
    return success({
        "id": str(m["_id"]), "team1": m.get("team1"), "team2": m.get("team2"),
        "format": m.get("format"), "venue": m.get("venue"),
        "date": m.get("date",""), "time": m.get("time",""), "status": m.get("status","scheduled")
    })

@app.route("/matches/<id>", methods=["DELETE"])
def delete_match(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    db.matches.delete_one({"_id": oid})
    return success({"msg": "Deleted"})

# ======================
# PERFORMANCE  (GET + POST + PUT + DELETE)
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
        match  = matches_map.get(mid, {})
        perfs.append({
            "id":            str(p["_id"]),
            "player_id":     pid,
            "player_name":   player.get("name", "Unknown"),
            "match_id":      mid,
            "match_label":   f"{match.get('team1','?')} vs {match.get('team2','?')}",
            "team":          p.get("team", ""),
            "runs":          p.get("runs", 0),
            "balls":         p.get("balls", 0),
            "wickets":       p.get("wickets", 0),
            "runs_conceded": p.get("runs_conceded", 0),
            "balls_bowled":  p.get("balls_bowled", 0),
        })
    return success(perfs)

@app.route("/performance", methods=["POST"])
def add_performance():
    data = request.json or {}
    def safe_int(v):
        try: return int(v)
        except: return 0
    perf = {
        "player_id":     data.get("player_id"),
        "match_id":      data.get("match_id"),
        "team":          data.get("team"),
        "runs":          safe_int(data.get("runs")),
        "balls":         safe_int(data.get("balls")),
        "wickets":       safe_int(data.get("wickets")),
        "runs_conceded": safe_int(data.get("runs_conceded")),
        "balls_bowled":  safe_int(data.get("balls_bowled"))
    }
    db.performances.insert_one(perf)
    return success({"msg": "Added"})

@app.route("/performance/<id>", methods=["PUT"])
def update_performance(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    data = request.json or {}
    def safe_int(v):
        try: return int(v)
        except: return 0
    db.performances.update_one({"_id": oid}, {"$set": {
        "player_id":     data.get("player_id"),
        "match_id":      data.get("match_id"),
        "team":          data.get("team"),
        "runs":          safe_int(data.get("runs")),
        "balls":         safe_int(data.get("balls")),
        "wickets":       safe_int(data.get("wickets")),
        "runs_conceded": safe_int(data.get("runs_conceded")),
        "balls_bowled":  safe_int(data.get("balls_bowled"))
    }})
    return success({"msg": "Updated"})

@app.route("/performance/<id>", methods=["DELETE"])
def delete_performance(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    db.performances.delete_one({"_id": oid})
    return success({"msg": "Deleted"})

# ======================
# PLAYER STATS
# ======================
@app.route("/player-stats", methods=["GET"])
def player_stats():
    perfs = list(db.performances.find())
    players_map = {str(p["_id"]): p for p in db.players.find()}
    stats = {}
    for perf in perfs:
        pid = perf.get("player_id")
        if not pid: continue
        if pid not in stats:
            stats[pid] = {"runs": 0, "balls": 0, "wickets": 0, "runs_conceded": 0, "balls_bowled": 0, "matches": set()}
        stats[pid]["runs"]          += int(perf.get("runs", 0))
        stats[pid]["balls"]         += int(perf.get("balls", 0))
        stats[pid]["wickets"]       += int(perf.get("wickets", 0))
        stats[pid]["runs_conceded"] += int(perf.get("runs_conceded", 0))
        stats[pid]["balls_bowled"]  += int(perf.get("balls_bowled", 0))
        stats[pid]["matches"].add(perf.get("match_id", ""))
    result = []
    for pid, s in stats.items():
        player = players_map.get(pid)
        if not player: continue
        bf  = s["balls"]; bb = s["balls_bowled"]
        sr  = round(s["runs"] / bf * 100, 2) if bf else 0.0
        od  = bb / 6 if bb else 0
        eco = round(s["runs_conceded"] / od, 2) if od else 0.0
        result.append({
            "player_id":     pid,
            "name":          player.get("name"),
            "role":          player.get("role"),
            "photo":         player.get("photo", ""),
            "team":          player.get("team", ""),
            "matches":       len(s["matches"]),
            "runs":          s["runs"],
            "balls":         bf,
            "strike_rate":   sr,
            "wickets":       s["wickets"],
            "runs_conceded": s["runs_conceded"],
            "overs":         f"{bb // 6}.{bb % 6}",
            "economy":       eco,
        })
    return success(result)

# player form — per-match performance for graph
@app.route("/player-form/<player_id>", methods=["GET"])
def player_form(player_id):
    perfs = list(db.performances.find({"player_id": player_id}))
    matches_map = {str(m["_id"]): m for m in db.matches.find()}
    form_data = []
    for p in perfs:
        mid   = p.get("match_id", "")
        match = matches_map.get(mid, {})
        label = f"{match.get('team1','?')} vs {match.get('team2','?')}"
        form_data.append({
            "match":    label,
            "date":     match.get("date", ""),
            "runs":     p.get("runs", 0),
            "wickets":  p.get("wickets", 0),
            "balls":    p.get("balls", 0),
            "sr":       round(p.get("runs",0)/p.get("balls",1)*100,1) if p.get("balls") else 0
        })
    form_data.sort(key=lambda x: x["date"])
    return success(form_data)

# ======================
# ALL-TIME RECORDS
# ======================
@app.route("/records", methods=["GET"])
def records():
    perfs = list(db.performances.find())
    players_map = {str(p["_id"]): p for p in db.players.find()}
    agg = {}
    for p in perfs:
        pid = p.get("player_id")
        if not pid: continue
        agg.setdefault(pid, {"runs": 0, "balls": 0, "wickets": 0, "runs_conceded": 0, "balls_bowled": 0, "matches": set()})
        agg[pid]["runs"]          += int(p.get("runs", 0))
        agg[pid]["balls"]         += int(p.get("balls", 0))
        agg[pid]["wickets"]       += int(p.get("wickets", 0))
        agg[pid]["runs_conceded"] += int(p.get("runs_conceded", 0))
        agg[pid]["balls_bowled"]  += int(p.get("balls_bowled", 0))
        agg[pid]["matches"].add(p.get("match_id", ""))
    rows = []
    for pid, s in agg.items():
        player = players_map.get(pid)
        if not player: continue
        bf = s["balls"]; bb = s["balls_bowled"]; od = bb/6 if bb else 0
        rows.append({
            "player_id":   pid, "name": player.get("name"), "role": player.get("role"),
            "matches":     len(s["matches"]),
            "runs":        s["runs"],
            "strike_rate": round(s["runs"]/bf*100,2) if bf else 0,
            "wickets":     s["wickets"],
            "economy":     round(s["runs_conceded"]/od,2) if od else 0,
        })
    return success({
        "most_runs":    sorted(rows, key=lambda x: -x["runs"])[:5],
        "most_wickets": sorted(rows, key=lambda x: -x["wickets"])[:5],
        "best_sr":      sorted([r for r in rows if r["runs"]>=20], key=lambda x: -x["strike_rate"])[:5],
        "best_economy": sorted([r for r in rows if r["wickets"]>0], key=lambda x: x["economy"])[:5],
    })

# ======================
# HEAD-TO-HEAD
# ======================
@app.route("/head-to-head", methods=["GET"])
def head_to_head():
    t1 = request.args.get("team1",""); t2 = request.args.get("team2","")
    if not t1 or not t2: return error("team1 and team2 required")
    matches = list(db.matches.find({"$or":[
        {"team1":t1,"team2":t2},{"team1":t2,"team2":t1}
    ]}))
    t1_wins=0; t2_wins=0; draws=0; history=[]
    for m in matches:
        mid = str(m["_id"])
        perfs = list(db.performances.find({"match_id":mid}))
        scores = {}
        for p in perfs:
            t = p.get("team")
            if t: scores[t] = scores.get(t,0)+p.get("runs",0)
        t1r=scores.get(m["team1"],0); t2r=scores.get(m["team2"],0)
        if t1r>t2r: winner=m["team1"]; (t1_wins if m["team1"]==t1 else t2_wins).__class__
        elif t2r>t1r: winner=m["team2"]
        else: winner="Draw"
        if winner==t1: t1_wins+=1
        elif winner==t2: t2_wins+=1
        else: draws+=1
        history.append({"match_id":mid,"team1":m["team1"],"team2":m["team2"],
                        "t1_runs":t1r,"t2_runs":t2r,"winner":winner,
                        "venue":m.get("venue",""),"date":m.get("date",""),"format":m.get("format","")})
    return success({"team1":t1,"team2":t2,"total":len(matches),
                    "team1_wins":t1_wins,"team2_wins":t2_wins,"draws":draws,"history":history})

# ======================
# POINTS TABLE
# ======================
@app.route("/points-table", methods=["GET"])
def points_table():
    matches = list(db.matches.find())
    table = {}

    for m in matches:
        mid = str(m["_id"])
        t1 = m.get("team1")
        t2 = m.get("team2")
        if not t1 or not t2:
            continue

        for t in (t1, t2):
            table.setdefault(t, {
                "team": t, "played": 0, "won": 0, "lost": 0,
                "draw": 0, "points": 0, "nrr": 0.0
            })

        perfs = list(db.performances.find({"match_id": mid}))
        scores = {}
        for p in perfs:
            team = p.get("team")
            if team:
                scores[team] = scores.get(team, 0) + int(p.get("runs", 0))

        t1r = scores.get(t1, 0)
        t2r = scores.get(t2, 0)

        table[t1]["played"] += 1
        table[t2]["played"] += 1

        if t1r > t2r:
            table[t1]["won"] += 1
            table[t1]["points"] += 2
            table[t2]["lost"] += 1
        elif t2r > t1r:
            table[t2]["won"] += 1
            table[t2]["points"] += 2
            table[t1]["lost"] += 1
        else:
            table[t1]["draw"] += 1
            table[t2]["draw"] += 1
            table[t1]["points"] += 1
            table[t2]["points"] += 1

        table[t1]["nrr"] += (t1r - t2r) / 100.0
        table[t2]["nrr"] += (t2r - t1r) / 100.0

    result = list(table.values())
    result.sort(key=lambda x: (-x["points"], -x["nrr"]))

    for r in result:
        r["nrr"] = round(r["nrr"], 2)

    return jsonify({"status": "success", "data": result})

# ======================
# MATCH RESULT + POTM
# ======================
@app.route("/match-result/<match_id>", methods=["GET"])
def match_result(match_id):
    oid=safe_object_id(match_id)
    if not oid: return error("Invalid Match ID")
    match=db.matches.find_one({"_id":oid})
    if not match: return error("Match not found")
    team1=match.get("team1"); team2=match.get("team2")
    perfs=list(db.performances.find({"match_id":match_id}))
    team_scores={}
    for p in perfs:
        t=p.get("team")
        if t: team_scores[t]=team_scores.get(t,0)+p.get("runs",0)
    t1r=team_scores.get(team1,0); t2r=team_scores.get(team2,0)
    if t1r>t2r: winner=team1
    elif t2r>t1r: winner=team2
    else: winner="Draw"
    def score_perf(p):
        runs=p.get("runs",0); wickets=p.get("wickets",0)
        balls=p.get("balls_bowled",0); conceded=p.get("runs_conceded",0)
        overs=balls/6 if balls else 0; economy=conceded/overs if overs else 0
        return (runs*1.2)+(wickets*25)-(economy*2)
    best_player="N/A"; best_score=-999
    players_map={str(p["_id"]):p for p in db.players.find()}
    candidates=perfs if winner=="Draw" else [p for p in perfs if p.get("team")==winner]
    if not candidates: candidates=perfs
    for p in candidates:
        s=score_perf(p)
        if s>best_score:
            best_score=s; player=players_map.get(p.get("player_id"))
            best_player=player.get("name") if player else "Unknown"
    return success({
        "match":{"team1":team1,"team2":team2,"team1_runs":t1r,"team2_runs":t2r,"winner":winner},
        "player_of_match":{"name":best_player,"score":round(best_score,2) if best_score!=-999 else 0}
    })

# ======================
# LEADERBOARD
# ======================
@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    perfs=list(db.performances.find()); stats={}
    for p in perfs:
        team=p.get("team"); pid=p.get("player_id")
        if not team or not pid: continue
        stats.setdefault(team,{}).setdefault(pid,{"runs":0,"balls":0})
        stats[team][pid]["runs"]+=int(p.get("runs",0))
        stats[team][pid]["balls"]+=int(p.get("balls",0))
    players_map={str(p["_id"]):p for p in db.players.find()}
    result=[]
    for team,players in stats.items():
        team_players=[]; total=0
        for pid,val in players.items():
            player=players_map.get(pid)
            if not player: continue
            runs=val["runs"]; balls=val["balls"]
            sr=round(runs/balls*100,2) if balls else 0.0; total+=runs
            team_players.append({"player_id":pid,"name":player.get("name"),"runs":runs,"strike_rate":sr})
        result.append({"team":team,"total_runs":total,
                       "players":sorted(team_players,key=lambda x:x["runs"],reverse=True)})
    result.sort(key=lambda x:x["total_runs"],reverse=True)
    return success(result)

# ======================
# BOWLING STATS
# ======================
@app.route("/bowling-stats", methods=["GET"])
def bowling_stats():
    perfs=list(db.performances.find()); stats={}
    for p in perfs:
        pid=p.get("player_id")
        if not pid: continue
        stats.setdefault(pid,{"runs_conceded":0,"balls":0,"wickets":0})
        stats[pid]["runs_conceded"]+=int(p.get("runs_conceded",0))
        stats[pid]["balls"]+=int(p.get("balls_bowled",0))
        stats[pid]["wickets"]+=int(p.get("wickets",0))
    players_map={str(p["_id"]):p for p in db.players.find()}
    result=[]
    for pid,s in stats.items():
        player=players_map.get(pid)
        if not player: continue
        if s["balls"]==0 and s["wickets"]==0 and s["runs_conceded"]==0: continue
        balls=s["balls"]; od=balls/6 if balls>0 else 0
        result.append({"name":player.get("name"),"wickets":s["wickets"],
                       "runs_conceded":s["runs_conceded"],
                       "overs":f"{balls//6}.{balls%6}",
                       "economy":round(s["runs_conceded"]/od,2) if od>0 else 0})
    result.sort(key=lambda x:(-x["wickets"],x["economy"]))
    return success(result)

# ======================
# EXPORT CSV
# ======================
@app.route("/export/batting", methods=["GET"])
def export_batting():
    perfs=list(db.performances.find())
    players_map={str(p["_id"]):p for p in db.players.find()}
    agg={}
    for p in perfs:
        pid=p.get("player_id")
        if not pid: continue
        agg.setdefault(pid,{"runs":0,"balls":0,"wickets":0})
        agg[pid]["runs"]+=int(p.get("runs",0))
        agg[pid]["balls"]+=int(p.get("balls",0))
        agg[pid]["wickets"]+=int(p.get("wickets",0))
    output=io.StringIO(); writer=csv.writer(output)
    writer.writerow(["Player","Role","Runs","Balls","Strike Rate","Wickets"])
    for pid,s in agg.items():
        player=players_map.get(pid)
        if not player: continue
        sr=round(s["runs"]/s["balls"]*100,2) if s["balls"] else 0
        writer.writerow([player.get("name"),player.get("role"),s["runs"],s["balls"],sr,s["wickets"]])
    output.seek(0)
    return send_file(io.BytesIO(output.getvalue().encode()),mimetype="text/csv",
                     as_attachment=True,download_name="batting_stats.csv")

@app.route("/export/bowling", methods=["GET"])
def export_bowling():
    perfs=list(db.performances.find())
    players_map={str(p["_id"]):p for p in db.players.find()}
    agg={}
    for p in perfs:
        pid=p.get("player_id")
        if not pid: continue
        agg.setdefault(pid,{"runs_conceded":0,"balls":0,"wickets":0})
        agg[pid]["runs_conceded"]+=int(p.get("runs_conceded",0))
        agg[pid]["balls"]+=int(p.get("balls_bowled",0))
        agg[pid]["wickets"]+=int(p.get("wickets",0))
    output=io.StringIO(); writer=csv.writer(output)
    writer.writerow(["Player","Wickets","Overs","Runs Conceded","Economy"])
    for pid,s in agg.items():
        player=players_map.get(pid)
        if not player: continue
        balls=s["balls"]; od=balls/6 if balls else 0
        eco=round(s["runs_conceded"]/od,2) if od else 0
        writer.writerow([player.get("name"),s["wickets"],f"{balls//6}.{balls%6}",s["runs_conceded"],eco])
    output.seek(0)
    return send_file(io.BytesIO(output.getvalue().encode()),mimetype="text/csv",
                     as_attachment=True,download_name="bowling_stats.csv")

    
# ======================
# RESET
# ======================
@app.route("/reset-all", methods=["DELETE"])
def reset_all():
    db.players.delete_many({}); db.matches.delete_many({}); db.performances.delete_many({})
    return success({"message": "All data reset"})

if __name__ == "__main__":
    app.run(debug=True)
