import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from "recharts";

const BAR_COLORS = ["#38bdf8", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];

export default function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [mode, setMode] = useState("tournament");
  const [loading, setLoading] = useState(true);
  const [performances, setPerformances] = useState([]);
  const [pointsTable, setPointsTable] = useState([]);

  const navigate = useNavigate();
  const { addToast } = useToast();

  // Logic: Initial Fetch - Synchronized with Flask app.py
  useEffect(() => {
    const initFetch = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          api.get("/matches"),
          api.get("/performance")
        ]);
        const matchList = mRes.data.data || [];
        setMatches(matchList);
        setPerformances(pRes.data.data || []);
        if (matchList.length > 0) setSelectedMatch(matchList[0].id);
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      }
    };
    initFetch();
  }, []);

  // Logic: Mode Switching - Fetches Leaderboard or specific Match Results
  useEffect(() => {
    const fetchModeData = async () => {
      setLoading(true);
      try {
        if (mode === "tournament") {
          const [lRes, ptRes] = await Promise.all([
            api.get("/leaderboard"),
            api.get("/points-table")
          ]);
          setTeams(lRes.data.data || []);
          setPointsTable(ptRes.data.data || []);
        } else if (selectedMatch) {
          const res = await api.get(`/match-result/${selectedMatch}`);
          setMatchData(res.data.data);
        }
      } catch (err) {
        addToast("Failed to fetch analytics", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchModeData();
  }, [mode, selectedMatch, addToast]);

  // Analytics Helpers using useMemo for efficiency
  const topPlayerTour = useMemo(() => {
    const all = teams.flatMap(t => t.players || []);
    return all.length ? [...all].sort((a,b) => b.runs - a.runs)[0] : null;
  }, [teams]);

  const matchPlayers = useMemo(() => 
    performances.filter(p => p.match_id === selectedMatch),
  [performances, selectedMatch]);

  const topTeam = mode === "match" 
    ? (matchData ? { team: matchData.match.winner, total_runs: matchData.match.winner === matchData.match.team1 ? matchData.match.team1_runs : matchData.match.team2_runs } : null)
    : teams[0];

  const handleReset = async () => {
    if (!window.confirm("⚠️ Reset ALL tournament data?")) return;
    try {
      await api.delete("/reset-all");
      setTeams([]); setPointsTable([]); setPerformances([]);
      addToast("Database Cleared", "success");
      window.location.reload(); 
    } catch {
      addToast("Reset Failed", "error");
    }
  };

  return (
    <div className="page-fade-in">
      {/* HEADER WITH DYNAMIC LIVE BADGE */}
      <div style={headerSection}>
        <div>
          <h1 className="glow-text">🏏 Cric Analytics Pro</h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>Precision Tournament Intelligence</p>
        </div>
        <div className="live-badge" style={{ 
          background: matches.some(m => m.status === 'live') ? '#ef4444' : '#1e293b' 
        }}>
          {matches.some(m => m.status === 'live') ? 'LIVE UPDATES' : 'SYSTEM READY'}
        </div>
      </div>

      {/* DASHBOARD CONTROLS */}
      <div style={controlsRow}>
        <div style={toggleGroup}>
          <button style={mode === "tournament" ? activeBtn : inactiveBtn} onClick={() => setMode("tournament")}>🏆 Tournament</button>
          <button style={mode === "match" ? activeBtn : inactiveBtn} onClick={() => setMode("match")}>🏟 Match View</button>
        </div>

        {mode === "match" && (
          <select style={matchSelector} value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
            {matches.map(m => (
              <option key={m.id} value={m.id}>{m.team1} vs {m.team2} ({m.date})</option>
            ))}
          </select>
        )}
        <button onClick={handleReset} style={resetBtn}>🗑 Full Reset</button>
      </div>

      {/* DYNAMIC ANALYTICS CARDS */}
      <div className="top-cards">
        <HighlightCard 
          label={mode === "match" ? "Match Winner" : "Tourney Leader"} 
          val={topTeam?.team || "—"} 
          sub={topTeam ? `${topTeam.total_runs} Total Runs` : "No Records"} 
        />
        <HighlightCard 
          label={mode === "match" ? "Top Performer" : "Orange Cap"} 
          val={mode === "match" ? (matchData?.player_of_match?.name || "—") : (topPlayerTour?.name || "—")} 
          sub={mode === "match" ? `Impact: ${matchData?.player_of_match?.score || 0}` : `${topPlayerTour?.runs || 0} Runs`} 
        />
        <HighlightCard label="Active Teams" val={mode === "match" ? 2 : teams.length} sub="Squads" />
        <HighlightCard label="Registered Players" val={mode === "match" ? matchPlayers.length : performances.length} sub="Athletes" />
      </div>

      <div style={mainGrid}>
        <div style={{ flex: 2 }}>
          {mode === "tournament" ? (
            <>
              <div className="card" style={{ height: 350 }}>
                <h2>📊 Scoring Distribution by Team</h2>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={teams}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="team" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="total_runs" radius={[4, 4, 0, 0]}>
                      {teams.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* POINTS TABLE COMPONENT */}
              <div className="card" style={{ marginTop: 20 }}>
                <h2>📈 Live Standings (NRR Calculated)</h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeader}>
                        <th>TEAM</th><th>P</th><th>W</th><th>L</th><th>PTS</th><th>NRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsTable.map((t, i) => (
                        <tr key={i} style={tableRow}>
                          <td style={{ fontWeight: "bold" }}>{t.team}</td>
                          <td>{t.played}</td>
                          <td style={{ color: "#22c55e" }}>{t.won}</td>
                          <td style={{ color: "#ef4444" }}>{t.lost}</td>
                          <td style={{ color: "#38bdf8", fontWeight: "bold" }}>{t.points}</td>
                          <td style={{ color: t.nrr >= 0 ? "#22c55e" : "#ef4444" }}>{t.nrr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <h2>🏟 Match Scorecard Insights</h2>
              {matchData ? (
                <div style={scorecardContainer}>
                  <ScoreRow team={matchData.match.team1} runs={matchData.match.team1_runs} />
                  <div style={vsDivider}>VS</div>
                  <ScoreRow team={matchData.match.team2} runs={matchData.match.team2_runs} />
                </div>
              ) : <p>Select a match to load results.</p>}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div className="card">
            <h2>🥇 {mode === "tournament" ? "Tournament Top 5" : "Match Leaders"}</h2>
            <div style={leaderList}>
              {(mode === "tournament" ? teams.flatMap(t => t.players).sort((a,b)=>b.runs-a.runs).slice(0, 5) : matchPlayers.sort((a,b)=>b.runs-a.runs)).map((p, i) => (
                <div key={i} style={leaderItem} onClick={() => navigate(`/players/${p.player_id || p.id}`)}>
                  <span style={rankBadge}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={leaderName}>{p.name}</p>
                    <p style={leaderSub}>{p.team}</p>
                  </div>
                  <span style={leaderRuns}>{p.runs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function HighlightCard({ label, val, sub }) {
  return (
    <div className="highlight-card">
      <p style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</p>
      <h2 style={{ fontSize: "22px", margin: "0 0 2px 0", color: "#f8fafc" }}>{val}</h2>
      <p style={{ color: "#38bdf8", fontSize: "11px", margin: 0 }}>{sub}</p>
    </div>
  );
}

function ScoreRow({ team, runs }) {
  return (
    <div style={scoreRow}>
      <span style={{ fontSize: "16px", fontWeight: "bold" }}>{team}</span>
      <span style={{ fontSize: "22px", color: "#38bdf8", fontWeight: "800" }}>{runs}</span>
    </div>
  );
}

/* ================= STYLES (Synchronized with index.css) ================= */
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const controlsRow = { display: "flex", gap: "12px", marginBottom: "25px", flexWrap: "wrap", alignItems: "center" };
const toggleGroup = { display: "flex", background: "#0f172a", borderRadius: "10px", padding: "4px", border: "1px solid #1e293b" };
const activeBtn = { background: "#38bdf8", color: "#020617", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const inactiveBtn = { background: "transparent", color: "#94a3b8", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" };
const matchSelector = { background: "#0f172a", color: "white", border: "1px solid #1e293b", padding: "8px 12px", borderRadius: "8px" };
const resetBtn = { marginLeft: "auto", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" };
const mainGrid = { display: "flex", gap: "20px", flexWrap: "wrap" };
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: "15px" };
const tableHeader = { color: "#64748b", fontSize: "11px", textAlign: "left", textTransform: "uppercase" };
const tableRow = { borderBottom: "1px solid rgba(255,255,255,0.05)", height: "45px", fontSize: "13px" };
const leaderList = { display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" };
const leaderItem = { display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", cursor: "pointer" };
const rankBadge = { width: "22px", height: "22px", borderRadius: "50%", background: "#1e293b", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" };
const leaderName = { margin: 0, color: "#f8fafc", fontWeight: "bold", fontSize: "14px" };
const leaderSub = { margin: 0, color: "#64748b", fontSize: "10px" };
const leaderRuns = { color: "#38bdf8", fontWeight: "800", fontSize: "16px" };
const tooltipStyle = { background: "#020617", border: "1px solid #1e293b", borderRadius: "8px", color: "white" };
const scorecardContainer = { padding: "15px", textAlign: "center" };
const scoreRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", marginBottom: "8px" };
const vsDivider = { fontSize: "11px", color: "#64748b", margin: "8px 0" };