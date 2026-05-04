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
    players = []
    for p in db.players.find():
        players.append({
            "id": str(p["_id"]),
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
        "id": str(result.inserted_id),
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
        {"$set": {
            "name": data.get("name"),
            "role": data.get("role")
        }}
    )

    player = db.players.find_one({"_id": oid})

    return success({
        "id": str(player["_id"]),
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
    matches = []
    for m in db.matches.find():
        matches.append({
            "id": str(m["_id"]),
            "team1": m.get("team1"),
            "team2": m.get("team2"),
            "format": m.get("format"),
            "venue": m.get("venue")
        })
    return success(matches)


@app.route("/matches", methods=["POST"])
def add_match():
    data = request.json or {}

    if not data.get("team1") or not data.get("team2"):
        return error("Teams required")

    result = db.matches.insert_one({
        "team1": data.get("team1"),
        "team2": data.get("team2"),
        "format": data.get("format"),
        "venue": data.get("venue")
    })

    return success({
        "id": str(result.inserted_id),
        "team1": data.get("team1"),
        "team2": data.get("team2"),
        "format": data.get("format"),
        "venue": data.get("venue")
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
    data = request.json

    def safe_int(value):
        try:
            return int(value)
        except:
            return 0

    perf = {
        "player_id": data.get("player_id"),
        "match_id": data.get("match_id"),
        "team": data.get("team"),
        "runs": safe_int(data.get("runs")),
        "balls": safe_int(data.get("balls")),
        "wickets": safe_int(data.get("wickets")),
        "runs_conceded": safe_int(data.get("runs_conceded")),
        "balls_bowled": safe_int(data.get("balls_bowled"))
    }

    db.performances.insert_one(perf)
    return success({"msg": "Added"})

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

    # ✅ FIX DRAW CASE
    if team1_runs > team2_runs:
        winner = team1
    elif team2_runs > team1_runs:
        winner = team2
    else:
        winner = "Draw"

    best_player = ""
    best_score = -999

    players_map = {str(p["_id"]): p for p in db.players.find()}

    for p in perfs:
        if p.get("team") != winner:
            continue

        runs = p.get("runs", 0)
        wickets = p.get("wickets", 0)
        balls = p.get("balls_bowled", 0)
        conceded = p.get("runs_conceded", 0)

        overs = balls / 6 if balls else 0
        economy = conceded / overs if overs else 0

        score = (runs * 1.2) + (wickets * 25) - (economy * 2)

        if score > best_score:
            best_score = score
            player = players_map.get(p.get("player_id"))
            best_player = player.get("name") if player else "Unknown"

    return success({
        "match": {
            "team1": team1,
            "team2": team2,
            "team1_runs": team1_runs,
            "team2_runs": team2_runs,
            "winner": winner
        },
        "player_of_match": {
            "name": best_player,
            "score": round(best_score, 2)
        }
    })


# ======================
# LEADERBOARD
# ======================
@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    perfs = list(db.performances.find())

    stats = {}

    for p in perfs:
        team = p.get("team")
        pid = p.get("player_id")

        if not team:
            continue

        stats.setdefault(team, {}).setdefault(pid, {"runs": 0, "balls": 0})

        stats[team][pid]["runs"] += p.get("runs", 0)
        stats[team][pid]["balls"] += p.get("balls", 0)

    players_map = {str(p["_id"]): p for p in db.players.find()}

    result = []

    for team, players in stats.items():
        team_players = []
        total = 0

        for pid, val in players.items():
            player = players_map.get(pid)
            if not player:
                continue

            runs = val["runs"]
            balls = val["balls"]
            sr = (runs / balls * 100) if balls else 0

            total += runs

            team_players.append({
                "name": player.get("name"),
                "runs": runs,
                "strike_rate": round(sr, 2)
            })

        result.append({
            "team": team,
            "total_runs": total,
            "players": sorted(team_players, key=lambda x: x["runs"], reverse=True)
        })

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

        stats.setdefault(pid, {
            "runs_conceded": 0,
            "balls": 0,
            "wickets": 0
        })

        stats[pid]["runs_conceded"] += int(p.get("runs_conceded", 0))
        stats[pid]["balls"] += int(p.get("balls_bowled", 0))
        stats[pid]["wickets"] += int(p.get("wickets", 0))

    players_map = {str(p["_id"]): p for p in db.players.find()}

    result = []

    for pid, s in stats.items():
        player = players_map.get(pid)
        if not player:
            continue

        balls = s["balls"]

        overs_decimal = balls / 6 if balls > 0 else 0
        overs_display = f"{balls // 6}.{balls % 6}"

        economy = (s["runs_conceded"] / overs_decimal) if overs_decimal > 0 else 0

        result.append({
            "name": player.get("name"),
            "wickets": s["wickets"],
            "runs_conceded": s["runs_conceded"],
            "overs": overs_display,
            "economy": round(economy, 2)
        })

    # sort like real cricket
    result.sort(key=lambda x: (-x["wickets"], x["economy"]))

    return success(result)

# ======================
# RUN
# ======================
if __name__ == "__main__":
    app.run(debug=True)