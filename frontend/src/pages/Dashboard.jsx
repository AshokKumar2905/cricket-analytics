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
  const [teams, setTeams]             = useState([]);
  const [matches, setMatches]         = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [matchData, setMatchData]     = useState(null);
  const [mode, setMode]               = useState("tournament");
  const [loading, setLoading]         = useState(true);
  const navigate                      = useNavigate();
  const { addToast }                  = useToast();

  // load match list for selector
  useEffect(() => {
    api.get("/matches").then(res => {
      const list = res.data.data || [];
      setMatches(list);
      if (list.length > 0) setSelectedMatch(list[0].id);
    });
  }, []);

  // load data based on mode
  useEffect(() => {
    setLoading(true);
    if (mode === "tournament") {
      api.get("/leaderboard")
        .then(res => { setTeams(res.data.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      if (!selectedMatch) { setLoading(false); return; }
      api.get(`/dashboard/${selectedMatch}`)
        .then(res => { setMatchData(res.data.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [mode, selectedMatch]);

  const handleReset = async () => {
    if (!window.confirm("⚠️ Delete ALL data? This cannot be undone.")) return;
    try {
      await api.delete("/reset-all");
      setTeams([]); setMatchData(null);
      addToast("All data reset successfully");
    } catch { addToast("Failed to reset", "error"); }
  };

  // summary numbers
  const allPlayers   = teams.flatMap(t => t.players || []);
  const topTeamTour  = teams[0];
  const topPlayerTour = [...allPlayers].sort((a,b)=>b.runs-a.runs)[0];

  const topTeamMatch  = matchData ? { team: matchData.top_team, total_runs: matchData.team_runs?.[matchData.top_team] ?? 0 } : null;
  const topPlayerMatch = matchData?.best_batter;

  const topTeam   = mode === "match" ? topTeamMatch  : topTeamTour;
  const topPlayer = mode === "match" ? topPlayerMatch : topPlayerTour;

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div>
          <h1>🏏 Live Cricket Dashboard</h1>
          <p style={{ color:"#94a3b8" }}>Real-time match insights & player performance</p>
        </div>
        <div className="live-badge">LIVE</div>
      </div>

      {/* CONTROLS ROW */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <button
          onClick={() => setMode("tournament")}
          style={{ background: mode==="tournament" ? "linear-gradient(90deg,#22c55e,#38bdf8)" : "#1e293b",
                   border: mode==="tournament" ? "none" : "1px solid #334155" }}
        >
          🏆 Tournament
        </button>
        <button
          onClick={() => setMode("match")}
          style={{ background: mode==="match" ? "linear-gradient(90deg,#22c55e,#38bdf8)" : "#1e293b",
                   border: mode==="match" ? "none" : "1px solid #334155" }}
        >
          🏟 Match
        </button>

        {mode === "match" && (
          <select
            value={selectedMatch}
            onChange={e => setSelectedMatch(e.target.value)}
            style={{ padding:"9px 12px", borderRadius:8, background:"#0f172a", color:"white", border:"1px solid #334155" }}
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>{m.team1} vs {m.team2} ({m.format})</option>
            ))}
          </select>
        )}

        <button onClick={handleReset} style={{ background:"#dc2626", marginLeft:"auto" }}>
          🗑 Reset All
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="top-cards" style={{ flexWrap:"wrap" }}>
        {[
          { label: mode==="match" ? "🏆 Winner" : "🏆 Top Team", val: topTeam?.team||"—", sub: `${topTeam?.total_runs??0} Runs` },
          { label: "🥇 Best Batter", val: topPlayer?.name||"—", sub: `${topPlayer?.runs??0} Runs` },
          { label: "👥 Teams", val: mode==="match" ? (matchData?.teams?.length??0) : teams.length },
          { label: "🧑‍🤝‍🧑 Players", val: mode==="match" ? (matchData?.total_players??0) : allPlayers.length },
        ].map((c,i) => (
          <div key={i} className="highlight-card">
            <p style={{ color:"#64748b", fontSize:13, margin:"0 0 6px" }}>{c.label}</p>
            <h2 style={{ margin:"0 0 4px", color:"white", fontSize:20 }}>{c.val}</h2>
            {c.sub && <p style={{ color:"#38bdf8", margin:0, fontSize:13 }}>{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* MATCH VIEW */}
      {mode === "match" && loading && <CardSkeleton />}
      {mode === "match" && !loading && matchData && (
        <div className="card">
          <h2 style={{ marginBottom:16 }}>🏟 Match Summary</h2>
          {matchData.teams?.map(team => (
            <div key={team} style={{ display:"flex", justifyContent:"space-between",
              padding:"12px 16px", background:"rgba(255,255,255,0.04)",
              borderRadius:10, marginBottom:8 }}>
              <span>{team}</span>
              <span style={{ color:"#38bdf8", fontWeight:"bold" }}>{matchData.team_runs?.[team] ?? 0} runs</span>
            </div>
          ))}
        </div>
      )}

      {/* TOURNAMENT VIEW */}
      {mode === "tournament" && loading && [1,2].map(i => <CardSkeleton key={i} />)}
      {mode === "tournament" && !loading && teams.length === 0 && (
        <p style={{ color:"#64748b" }}>No data yet. Add matches and performances first.</p>
      )}
      {mode === "tournament" && !loading && teams.map(team => {
        const players = team.players || [];
        const avgSR   = players.length
          ? (players.reduce((s,p)=>s+(p.strike_rate||0),0)/players.length).toFixed(2)
          : "0.00";

        return (
          <div key={team.team} className="card">
            <h2 style={{ marginBottom:16 }}>🏏 {team.team}</h2>

            <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
              {[
                { label:"Players",    value: players.length },
                { label:"Total Runs", value: team.total_runs ?? 0 },
                { label:"Avg SR",     value: avgSR },
              ].map(s => (
                <div key={s.label} style={statBox}>
                  <p style={{ color:"#64748b", fontSize:12, margin:"0 0 4px" }}>{s.label}</p>
                  <p style={{ fontWeight:"bold", fontSize:18, margin:0, color:"white" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {players.map((p,i) => (
              <div
                key={p.player_id||i}
                className="player-row"
                style={{
                  background: i===0 ? "linear-gradient(90deg,#166534,#15803d)" : "rgba(255,255,255,0.04)",
                  cursor: p.player_id ? "pointer":"default"
                }}
                onClick={() => p.player_id && navigate(`/players/${p.player_id}`)}
              >
                <span className="rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
                <span style={{ flex:1, paddingLeft:8 }}>{p.name}</span>
                <span style={{ color:"#94a3b8", fontSize:13, marginRight:16 }}>SR {p.strike_rate}</span>
                <span className="runs">{p.runs} runs</span>
              </div>
            ))}

            {players.length > 0 && (
              <div style={{ marginTop:20 }}>
                <p style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>Runs per player</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={players} margin={{ top:5,right:10,left:-10,bottom:5 }}>
                    <XAxis dataKey="name" stroke="#475569" tick={{ fill:"#94a3b8", fontSize:12 }} />
                    <YAxis stroke="#475569" tick={{ fill:"#94a3b8", fontSize:12 }} />
                    <Tooltip contentStyle={{ backgroundColor:"#1e293b", border:"1px solid #334155", borderRadius:8, color:"white" }}
                             cursor={{ fill:"rgba(255,255,255,0.05)" }} />
                    <Bar dataKey="runs" radius={[6,6,0,0]} maxBarSize={60}>
                      {players.map((_,i) => <Cell key={i} fill={BAR_COLORS[i%BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const statBox = {
  background:"#0f172a", border:"1px solid #1e293b",
  padding:"12px 18px", borderRadius:10, minWidth:110, textAlign:"center"
};