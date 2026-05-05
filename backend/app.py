from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client["cricket_db"]

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
# PLAYERS
# ======================
@app.route("/players", methods=["GET"])
def get_players():
    search = request.args.get("search", "")
    role   = request.args.get("role", "")

    query = {}

    # 🔍 Search by name (case insensitive)
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    # 🎯 Filter by role
    if role:
        query["role"] = role

    players = []
    for p in db.players.find(query):
        players.append({
            "id":   str(p["_id"]),
            "name": p.get("name"),
            "role": p.get("role")
        })

    return success(players)


@app.route("/players", methods=["POST"])
def add_player():
    data = request.json or {}
    if not data.get("name") or not data.get("role"):
        return error("Name and role required")

    result = db.players.insert_one({
        "name": data["name"],
        "role": data["role"]
    })
    return success({
        "id":   str(result.inserted_id),
        "name": data["name"],
        "role": data["role"]
    })


@app.route("/players/<id>", methods=["PUT"])
def update_player(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")

    data = request.json or {}
    db.players.update_one(
        {"_id": oid},
        {"$set": {"name": data.get("name"), "role": data.get("role")}}
    )
    player = db.players.find_one({"_id": oid})
    return success({
        "id":   str(player["_id"]),
        "name": player.get("name"),
        "role": player.get("role")
    })


@app.route("/players/<id>", methods=["DELETE"])
def delete_player(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    db.players.delete_one({"_id": oid})
    return success({"msg": "Deleted"})


# ======================
# MATCHES
# ======================
@app.route("/matches", methods=["GET"])
def get_matches():
    search = request.args.get("search", "")
    format_filter = request.args.get("format", "")

    query = {}

    # 🔍 Search by team name
    if search:
        query["$or"] = [
            {"team1": {"$regex": search, "$options": "i"}},
            {"team2": {"$regex": search, "$options": "i"}}
        ]

    # 🎯 Filter by format
    if format_filter:
        query["format"] = format_filter

    matches = []
    for m in db.matches.find(query):
        matches.append({
            "id":     str(m["_id"]),
            "team1":  m.get("team1"),
            "team2":  m.get("team2"),
            "format": m.get("format"),
            "venue":  m.get("venue")
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
        "format": data.get("format"),
        "venue":  data.get("venue")
    })
    return success({
        "id":     str(result.inserted_id),
        "team1":  data.get("team1"),
        "team2":  data.get("team2"),
        "format": data.get("format"),
        "venue":  data.get("venue")
    })


@app.route("/matches/<id>", methods=["DELETE"])
def delete_match(id):
    oid = safe_object_id(id)
    if not oid:
        return error("Invalid ID")
    db.matches.delete_one({"_id": oid})
    return success({"msg": "Deleted"})


# ======================
# PERFORMANCE
# ======================
@app.route("/performance", methods=["POST"])
def add_performance():
    data = request.json or {}

    def safe_int(value):
        try:
            return int(value)
        except:
            return 0

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


# ======================
# PLAYER STATS
# Aggregates batting + bowling per player across all matches
# ======================
@app.route("/player-stats", methods=["GET"])
def player_stats():
    perfs = list(db.performances.find())
    players_map = {str(p["_id"]): p for p in db.players.find()}

    stats = {}
    for perf in perfs:
        pid = perf.get("player_id")
        if not pid:
            continue
        if pid not in stats:
            stats[pid] = {
                "runs": 0, "balls": 0,
                "wickets": 0, "runs_conceded": 0, "balls_bowled": 0
            }
        stats[pid]["runs"]          += int(perf.get("runs", 0))
        stats[pid]["balls"]         += int(perf.get("balls", 0))
        stats[pid]["wickets"]       += int(perf.get("wickets", 0))
        stats[pid]["runs_conceded"] += int(perf.get("runs_conceded", 0))
        stats[pid]["balls_bowled"]  += int(perf.get("balls_bowled", 0))

    result = []
    for pid, s in stats.items():
        player = players_map.get(pid)
        if not player:
            continue

        balls_faced  = s["balls"]
        balls_bowled = s["balls_bowled"]
        strike_rate  = round(s["runs"] / balls_faced * 100, 2) if balls_faced else 0.0
        overs_dec    = balls_bowled / 6 if balls_bowled else 0
        economy      = round(s["runs_conceded"] / overs_dec, 2) if overs_dec else 0.0

        result.append({
            "player_id":     pid,
            "name":          player.get("name"),
            "role":          player.get("role"),
            "runs":          s["runs"],
            "balls":         balls_faced,
            "strike_rate":   strike_rate,
            "wickets":       s["wickets"],
            "runs_conceded": s["runs_conceded"],
            "overs":         f"{balls_bowled // 6}.{balls_bowled % 6}",
            "economy":       economy,
        })
    return success(result)


# ======================
# MATCH RESULT + POTM
# ======================
@app.route("/match-result/<match_id>", methods=["GET"])
def match_result(match_id):
    oid = safe_object_id(match_id)
    if not oid:
        return error("Invalid Match ID")

    match = db.matches.find_one({"_id": oid})
    if not match:
        return error("Match not found")

    team1 = match.get("team1")
    team2 = match.get("team2")

    perfs = list(db.performances.find({"match_id": match_id}))

    team_scores = {}
    for p in perfs:
        team = p.get("team")
        if not team:
            continue
        team_scores[team] = team_scores.get(team, 0) + p.get("runs", 0)

    team1_runs = team_scores.get(team1, 0)
    team2_runs = team_scores.get(team2, 0)

    if team1_runs > team2_runs:
        winner = team1
    elif team2_runs > team1_runs:
        winner = team2
    else:
        winner = "Draw"

    def score_perf(p):
        runs     = p.get("runs", 0)
        wickets  = p.get("wickets", 0)
        balls    = p.get("balls_bowled", 0)
        conceded = p.get("runs_conceded", 0)
        overs    = balls / 6 if balls else 0
        economy  = conceded / overs if overs else 0
        return (runs * 1.2) + (wickets * 25) - (economy * 2)

    best_player = "N/A"
    best_score  = -999
    players_map = {str(p["_id"]): p for p in db.players.find()}

    candidates = perfs if winner == "Draw" else [p for p in perfs if p.get("team") == winner]
    if not candidates:
        candidates = perfs

    for p in candidates:
        s = score_perf(p)
        if s > best_score:
            best_score  = s
            player      = players_map.get(p.get("player_id"))
            best_player = player.get("name") if player else "Unknown"

    return success({
        "match": {
            "team1":      team1,
            "team2":      team2,
            "team1_runs": team1_runs,
            "team2_runs": team2_runs,
            "winner":     winner
        },
        "player_of_match": {
            "name":  best_player,
            "score": round(best_score, 2) if best_score != -999 else 0
        }
    })



@app.route("/dashboard/<match_id>", methods=["GET"])
def match_dashboard(match_id):
    oid = safe_object_id(match_id)
    if not oid:
        return error("Invalid Match ID")

    match = db.matches.find_one({"_id": oid})
    if not match:
        return error("Match not found")

    team1 = match.get("team1")
    team2 = match.get("team2")

    perfs = list(db.performances.find({"match_id": match_id}))

    players_map = {str(p["_id"]): p for p in db.players.find()}

    team_runs = {team1: 0, team2: 0}
    players = []

    for p in perfs:
        pid = p.get("player_id")
        player = players_map.get(pid)

        if not player:
            continue

        runs = int(p.get("runs", 0))
        team = p.get("team")

        team_runs[team] = team_runs.get(team, 0) + runs

        players.append({
            "name": player.get("name"),
            "runs": runs,
            "team": team
        })

    # 🏆 Top Team (match winner)
    winner = team1 if team_runs[team1] > team_runs[team2] else team2

    # 🥇 Best Batter (match only)
    best_batter = sorted(players, key=lambda x: x["runs"], reverse=True)[0] if players else None

    return success({
        "teams": [team1, team2],
        "team_runs": team_runs,
        "top_team": winner,
        "best_batter": best_batter,
        "total_players": len(players)
    })

# ======================
# LEADERBOARD
# BUG FIX: now includes player_id in each player object
# so the frontend can navigate to PlayerDetail
# ======================
@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    perfs = list(db.performances.find())
    stats = {}

    for p in perfs:
        team = p.get("team")
        pid  = p.get("player_id")
        if not team or not pid:
            continue

        stats.setdefault(team, {}).setdefault(pid, {"runs": 0, "balls": 0})
        stats[team][pid]["runs"]  += int(p.get("runs", 0))
        stats[team][pid]["balls"] += int(p.get("balls", 0))

    players_map = {str(p["_id"]): p for p in db.players.find()}
    result = []

    for team, players in stats.items():
        team_players = []
        total = 0

        for pid, val in players.items():
            player = players_map.get(pid)
            if not player:
                continue

            runs  = val["runs"]
            balls = val["balls"]
            sr    = round(runs / balls * 100, 2) if balls else 0.0
            total += runs

            team_players.append({
                "player_id":   pid,          # ← needed for navigation
                "name":        player.get("name"),
                "runs":        runs,
                "strike_rate": sr
            })

        result.append({
            "team":       team,
            "total_runs": total,
            "players":    sorted(team_players, key=lambda x: x["runs"], reverse=True)
        })

    result.sort(key=lambda x: x["total_runs"], reverse=True)
    return success(result)


# ======================
# BOWLING STATS
# ======================
@app.route("/bowling-stats", methods=["GET"])
def bowling_stats():
    perfs = list(db.performances.find())
    stats = {}

    for p in perfs:
        pid = p.get("player_id")
        if not pid:
            continue

        stats.setdefault(pid, {"runs_conceded": 0, "balls": 0, "wickets": 0})
        stats[pid]["runs_conceded"] += int(p.get("runs_conceded", 0))
        stats[pid]["balls"]         += int(p.get("balls_bowled", 0))
        stats[pid]["wickets"]       += int(p.get("wickets", 0))

    players_map = {str(p["_id"]): p for p in db.players.find()}
    result = []

    for pid, s in stats.items():
        player = players_map.get(pid)
        if not player:
            continue
        if s["balls"] == 0 and s["wickets"] == 0 and s["runs_conceded"] == 0:
            continue

        balls    = s["balls"]
        overs_d  = balls / 6 if balls > 0 else 0
        economy  = round(s["runs_conceded"] / overs_d, 2) if overs_d > 0 else 0

        result.append({
            "name":          player.get("name"),
            "wickets":       s["wickets"],
            "runs_conceded": s["runs_conceded"],
            "overs":         f"{balls // 6}.{balls % 6}",
            "economy":       economy
        })

    result.sort(key=lambda x: (-x["wickets"], x["economy"]))
    return success(result)


# ======================
# Reset All Data (for testing/demo purposes)
# ======================
@app.route("/reset-all", methods=["DELETE"])
def reset_all():
    db.players.delete_many({})
    db.matches.delete_many({})
    db.performances.delete_many({})

    return success({"message": "All cricket data reset successfully"})

# ======================
# RUN
# ======================
if __name__ == "__main__":
    app.run(debug=True)