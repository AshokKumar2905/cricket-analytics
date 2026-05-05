import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const BAR_COLORS = ["#38bdf8","#22c55e","#a855f7","#f59e0b","#ef4444","#06b6d4","#ec4899"];

export default function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [mode, setMode] = useState("tournament");
  const [loading, setLoading] = useState(true);

  const [performances, setPerformances] = useState([]);
  const [pointsTable, setPointsTable] = useState([]); // ✅ ADDED

  const navigate = useNavigate();
  const { addToast } = useToast();
  const potm = matchData?.player_of_match;

  useEffect(() => {
    api.get("/matches")
      .then(res => {
        const list = res.data.data || [];
        setMatches(list);
        if (list.length > 0) setSelectedMatch(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/performance")
      .then(res => {
        setPerformances(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    if (mode === "tournament") {
      api.get("/leaderboard")
        .then(res => {
          setTeams(res.data.data || []);

          // ✅ FETCH POINTS TABLE
          return api.get("/points-table");
        })
        .then(res => {
          setPointsTable(res.data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      if (!selectedMatch) {
        setLoading(false);
        return;
      }
      api.get(`/match-result/${selectedMatch}`)
  .then(res => {
    setMatchData({
      ...res.data.data.match,
      player_of_match: res.data.data.player_of_match   // ✅ FIX
    });
    setLoading(false);
  })
        .catch(() => setLoading(false));
    }
  }, [mode, selectedMatch]);

  const handleReset = async () => {
    if (!window.confirm("⚠️ Delete ALL data?")) return;
    try {
      await api.delete("/reset-all");
      setTeams([]);
      setMatchData(null);
      setPerformances([]);
      setPointsTable([]); // ✅ ADDED
      addToast("All data reset successfully");
    } catch {
      addToast("Failed to reset", "error");
    }
  };

  const allPlayers = teams.flatMap(t => t.players || []);
  const topTeamTour = teams[0];

  const topPlayerTour = allPlayers.length
    ? [...allPlayers].sort((a,b)=>b.runs-a.runs)[0]
    : null;

  const matchPlayers = performances.filter(
    p => p.match_id === selectedMatch
  );

  const topPlayerMatch = matchPlayers.length
    ? [...matchPlayers].sort((a,b)=>b.runs-a.runs)[0]
    : null;

  const totalPlayersMatch = matchPlayers.length;

  const topTeamMatch = matchData ? {
    team: matchData.winner,
    total_runs:
      matchData.winner === matchData.team1
        ? matchData.team1_runs
        : matchData.team2_runs
  } : null;

  const topTeam   = mode === "match" ? topTeamMatch : topTeamTour;
  const topPlayer = mode === "match" ? topPlayerMatch : topPlayerTour;

  return (
    <div>

      <div className="hero">
        <div>
          <h1>🏏 Live Cricket Dashboard</h1>
          <p style={{ color:"#94a3b8" }}>
            Real-time match insights & player performance
          </p>
        </div>
        <div className="live-badge">LIVE</div>
      </div>

      <div style={{
        display:"flex", gap:12, marginBottom:20,
        flexWrap:"wrap", alignItems:"center"
      }}>
        <button onClick={() => setMode("tournament")}>
          🏆 Tournament
        </button>

        <button onClick={() => setMode("match")}>
          🏟 Match
        </button>

        {mode === "match" && (
          <select
            value={selectedMatch}
            onChange={e => setSelectedMatch(e.target.value)}
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.team1} vs {m.team2} ({m.format})
              </option>
            ))}
          </select>
        )}

        <button onClick={handleReset} style={{ marginLeft:"auto" }}>
          🗑 Reset All
        </button>
      </div>

      {/* SUMMARY */}
      <div className="top-cards">
        {[
          {
            label: mode==="match" ? "🏆 Winner" : "🏆 Top Team",
            val: topTeam?.team || "—",
            sub: `${topTeam?.total_runs ?? 0} Runs`
          },

          mode === "match"
            ? {
                label: "🏆 Player of Match",
                val: potm?.name || "—",
                sub: potm ? `Impact Score: ${potm.score}` : ""
              }
            : {
                label: "🥇 Best Batter",
                val: topPlayer?.name || "—",
                sub: `${topPlayer?.runs ?? 0} Runs`
              },

          {
            label: "👥 Teams",
            val: mode==="match" ? (matchData ? 2 : 0) : teams.length
          },
          {
            label: "🧑‍🤝‍🧑 Players",
            val: mode==="match" ? totalPlayersMatch : allPlayers.length
          }
        ].map((c,i) => (
          <div key={i} className="highlight-card">
            <p>{c.label}</p>
            <h2>{c.val}</h2>
            {c.sub && <p>{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* MATCH VIEW */}
      {mode === "match" && loading && <CardSkeleton />}

      {mode === "match" && !loading && matchData && (
        <div className="card">
          <h2>🏟 Match Summary</h2>

          <div style={row}>
            <span>{matchData.team1}</span>
            <span style={run}>{matchData.team1_runs} runs</span>
          </div>

          <div style={row}>
            <span>{matchData.team2}</span>
            <span style={run}>{matchData.team2_runs} runs</span>
          </div>
        </div>
      )}

      {/* TOURNAMENT */}
      {mode === "tournament" && loading && [1,2].map(i => <CardSkeleton key={i} />)}

      {mode === "tournament" && !loading && teams.length === 0 && (
        <p>No data yet.</p>
      )}

      {mode === "tournament" && teams.map(team => {
        const players = team.players || [];

        return (
          <div key={team.team} className="card">
            <h2>🏏 {team.team}</h2>

            {players.map((p,i) => (
              <div
                key={p.player_id || i}
                onClick={() => p.player_id && navigate(`/players/${p.player_id}`)}
              >
                {p.name} - {p.runs} runs
              </div>
            ))}
          </div>
        );
      })}

      {/* ✅ POINTS TABLE UI */}
      {mode === "tournament" && pointsTable.length > 0 && (
        <div className="card" style={{ marginTop:20 }}>
          <h2>📊 Points Table</h2>

          <table style={{ width:"100%", marginTop:10 }}>
            <thead>
              <tr style={{ color:"#94a3b8", textAlign:"left" }}>
                <th>Team</th>
                <th>P</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>Pts</th>
                <th>NRR</th>
              </tr>
            </thead>

            <tbody>
              {pointsTable.map((t,i) => (
                <tr key={i}>
                  <td>{t.team}</td>
                  <td>{t.played}</td>
                  <td>{t.won}</td>
                  <td>{t.lost}</td>
                  <td>{t.draw}</td>
                  <td style={{ color:"#22c55e" }}>{t.points}</td>
                  <td style={{ color:"#38bdf8" }}>{t.nrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

const row = {
  display:"flex",
  justifyContent:"space-between",
  padding:"12px",
  background:"rgba(255,255,255,0.04)",
  borderRadius:"10px",
  marginBottom:"8px"
};

const run = {
  color:"#38bdf8",
  fontWeight:"bold"
};