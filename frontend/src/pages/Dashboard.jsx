import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from "recharts";

const BAR_COLORS = ["#e91052", "#38bdf8", "#22c55e", "#a855f7", "#f59e0b"];

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

  const topPlayerTour = useMemo(() => {
    const all = teams.flatMap(t => t.players || []);
    return all.length ? [...all].sort((a,b) => b.runs - a.runs)[0] : null;
  }, [teams]);

  const topTeam = mode === "match" 
    ? (matchData?.match ? { team: matchData.match.winner, total_runs: matchData.match.winner === matchData.match.team1 ? matchData.match.team1_runs : matchData.match.team2_runs } : null)
    : teams[0];

  if (loading && teams.length === 0) return <CardSkeleton count={4} />;

  return (
    <div className="page-fade-in">
      {/* 1. ICC HERO SPOTLIGHT SECTION */}
      <section style={heroSection}>
        <div style={heroOverlay}>
          <div style={heroContent}>
            <span style={heroTag}>FEATURED TOURNAMENT INTELLIGENCE</span>
            <h1 style={heroTitle}>
              {mode === "tournament" 
                ? "Elite Championship Standings" 
                : matchData?.match 
                  ? `${matchData.match.team1} vs ${matchData.match.team2}` 
                  : "Loading Match Data..."}
            </h1>
            <p style={heroSub}>
              {mode === "tournament" 
                ? "Real-time tracking of team dominance and player trajectories across the league." 
                : "Deep dive into ball-by-ball impact and player-of-the-match analytics."}
            </p>
            <div style={heroActions}>
                <button 
                    style={mode === "tournament" ? heroActiveBtn : heroBtn} 
                    onClick={() => setMode("tournament")}
                >
                    LEAGUE OVERVIEW
                </button>
                <button 
                    style={mode === "match" ? heroActiveBtn : heroBtn} 
                    onClick={() => setMode("match")}
                >
                    MATCH ANALYSIS
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC NEWS-STYLE HIGHLIGHT CARDS */}
      <div style={cardGridWrapper}>
        <div className="card-grid">
            <HighlightCard 
                label="LEADERBOARD TOP" 
                val={topTeam?.team || "—"} 
                sub={`${topTeam?.total_runs || 0} Aggregated Runs`} 
                icon="🏆"
            />
            <HighlightCard 
                label="ORANGE CAP" 
                val={topPlayerTour?.name || "—"} 
                sub={`${topPlayerTour?.runs || 0} Tournament Runs`} 
                icon="🏏"
            />
            <HighlightCard 
                label="MATCH STATUS" 
                val={matches.some(m => m.status === 'live') ? 'LIVE' : 'IDLE'} 
                sub="System Monitoring" 
                isLive={matches.some(m => m.status === 'live')}
            />
        </div>
      </div>

      {/* 3. DETAILED ANALYTICS AREA */}
      <div style={contentPadding}>
        <div style={mainContentLayout}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="card" style={chartCardStyle}>
                    <div style={cardHeader}>
                        <h2 style={cardTitle}>📊 Performance Distribution</h2>
                        {mode === "match" && (
                            <select style={matchSelector} value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
                                {matches.map(m => (
                                    <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    
                    {/* STABLE WRAPPER FOR CHART */}
                    <div style={chartWrapper}>
                        <ResponsiveContainer width="99%" height={350}>
                            <BarChart data={teams} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="team" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="total_runs" radius={[4, 4, 0, 0]} barSize={45}>
                                    {teams.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <div className="card" style={sidebarCard}>
                    <h2 style={cardTitle}>🥇 TOP PERFORMERS</h2>
                    <div style={leaderList}>
                        {(mode === "tournament" ? teams.flatMap(t => t.players || []).sort((a,b)=>b.runs-a.runs).slice(0, 5) : performances.filter(p => p.match_id === selectedMatch).sort((a,b)=>b.runs-a.runs)).map((p, i) => (
                            <div key={i} style={leaderItem} onClick={() => navigate(`/players/${p.player_id || p.id}`)}>
                                <div style={rankBadge}>{i + 1}</div>
                                <div style={{ flex: 1 }}>
                                    <p style={leaderName}>{p.name}</p>
                                    <p style={leaderSub}>{p.team}</p>
                                </div>
                                <div style={runsTag}>{p.runs}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Highlight Card Component
function HighlightCard({ label, val, sub, icon, isLive }) {
  return (
    <div className="card" style={hCardStyle}>
      <div style={hLabelRow}>
        <span style={hLabel}>{label}</span>
        {isLive && <span className="live-indicator"></span>}
      </div>
      <h2 style={hVal}>{val}</h2>
      <p style={hSub}>{sub}</p>
    </div>
  );
}

/* ================= ICC STYLES ================= */
const heroSection = {
  height: "550px",
  width: "100%",
  background: "url('https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop') center/cover",
  position: "relative",
  display: "flex",
  alignItems: "flex-end",
};

const heroOverlay = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(to top, #06083b 10%, transparent 90%)",
  display: "flex",
  alignItems: "flex-end",
  padding: "60px 5%",
};

const heroContent = { maxWidth: "800px" };
const heroTag = { color: "#38bdf8", fontWeight: "900", letterSpacing: "2px", fontSize: "12px" };
const heroTitle = { color: "white", fontSize: "56px", margin: "15px 0", fontWeight: "900", lineHeight: "1.1" };
const heroSub = { color: "#cbd5e1", fontSize: "18px", lineHeight: "1.6", marginBottom: "30px" };

const heroActions = { display: "flex", gap: "15px" };
const heroBtn = { background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid white", backdropFilter: "blur(10px)", padding: "12px 24px", cursor: "pointer", fontWeight: "700" };
const heroActiveBtn = { background: "#e91052", border: "none", color: "white", padding: "12px 24px", cursor: "pointer", fontWeight: "700" };

const cardGridWrapper = { marginTop: "-60px", position: "relative", zIndex: 10, padding: "0 5%" };
const contentPadding = { padding: "40px 5%" };

const hCardStyle = { padding: "25px", borderBottom: "4px solid #e91052", background: "#00195a" };
const hLabelRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" };
const hLabel = { color: "#94a3b8", fontSize: "11px", fontWeight: "800", letterSpacing: "1px" };
const hVal = { color: "white", fontSize: "24px", fontWeight: "900", margin: "0 0 5px 0" };
const hSub = { color: "#38bdf8", fontSize: "12px", fontWeight: "600" };

const mainContentLayout = { display: "flex", gap: "30px", flexWrap: "wrap" };
const chartCardStyle = { padding: "30px", background: "#00195a", minHeight: "450px" };
const sidebarCard = { padding: "25px", background: "#00195a" };

// NEW: Fixed wrapper style to force layout
const chartWrapper = { 
  display: 'block', 
  height: '350px', 
  width: '100%', 
  position: 'relative',
  overflow: 'hidden'
};

const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" };
const cardTitle = { fontSize: "14px", fontWeight: "900", letterSpacing: "1px", color: "white" };
const matchSelector = { background: "#06083b", border: "1px solid #1e293b", color: "white", padding: "8px", outline: "none" };

const leaderList = { display: "flex", flexDirection: "column", gap: "10px" };
const leaderItem = { display: "flex", alignItems: "center", gap: "15px", padding: "12px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", cursor: "pointer" };
const rankBadge = { color: "#e91052", fontWeight: "900", fontSize: "18px" };
const leaderName = { margin: 0, color: "white", fontWeight: "700", fontSize: "14px" };
const leaderSub = { margin: 0, color: "#94a3b8", fontSize: "11px" };
const runsTag = { marginLeft: "auto", color: "#38bdf8", fontWeight: "900", fontSize: "18px" };

const tooltipStyle = { background: "#06083b", border: "1px solid #e91052", color: "white", borderRadius: "8px" };