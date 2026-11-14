import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../Api/axiosInstance.jsx";
import { useTranslation } from "react-i18next";

const priorityColor = (p) => ({ Low: "#22c55e", Medium: "#f59e0b", High: "#f97316", Urgent: "#dc2626" }[p] || "#64748b");
const statusColor  = (s) => ({ Open: "#3b82f6", Replied: "#a855f7", Closed: "#22c55e" }[s] || "#64748b");
const statusBg     = (s) => ({ Open: "#eff6ff", Replied: "#faf5ff", Closed: "#f0fdf4" }[s] || "#f1f5f9");

export default function SuperAdminSupportTickets() {
  const { t } = useTranslation();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState("list");
  const [selected, setSelected]     = useState(null);
  const [replies, setReplies]       = useState([]);
  const [replyText, setReplyText]   = useState("");
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [counts, setCounts]         = useState({});
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [toast, setToast]           = useState(null);
  const bottomRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchAll(); fetchCounts(); }, []);
  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [replies]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const r = await axiosInstance.get("/support/all", { params });
      setTickets(r.data.tickets || []);
    } catch { showToast(t("common.somethingWentWrong", "Failed to load tickets"), "error"); }
    finally { setLoading(false); }
  };

  const fetchCounts = async () => {
    try {
      const r = await axiosInstance.get("/support/counts");
      setCounts(r.data.counts || {});
    } catch {}
  };

  const applyFilter = () => { fetchAll(); };

  const openDetail = async (tTicket) => {
    setSelected(tTicket);
    setView("detail");
    setReplyText("");
    setReplyImage(null);
    setReplyImagePreview(null);
    try {
      const r = await axiosInstance.get(`/support/${tTicket.id}`);
      setReplies(r.data.replies || []);
      setSelected(r.data.ticket);
    } catch { showToast(t("common.somethingWentWrong", "Failed to load ticket"), "error"); }
  };

  const handleReplyImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReplyImage(file);
      setReplyImagePreview(URL.createObjectURL(file));
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() && !replyImage) { showToast(t("validation.required", "Please type a message or select an image"), "error"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("message", replyText);
      if (replyImage) {
        formData.append("image", replyImage);
      }

      await axiosInstance.post(`/support/${selected.id}/reply`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setReplyText("");
      setReplyImage(null);
      setReplyImagePreview(null);
      const r = await axiosInstance.get(`/support/${selected.id}`);
      setReplies(r.data.replies || []);
      setSelected(r.data.ticket);
      fetchAll(); fetchCounts();
      showToast(t("common.success", "Reply sent!"));
    } catch { showToast(t("common.somethingWentWrong", "Failed to send reply"), "error"); }
    finally { setSubmitting(false); }
  };

  const changeStatus = async (status) => {
    try {
      await axiosInstance.patch(`/support/${selected.id}/status`, { status });
      setSelected(prev => ({ ...prev, status }));
      fetchAll(); fetchCounts();
      showToast(`Ticket marked as ${status}`);
    } catch { showToast("Failed to update status", "error"); }
  };

  const S = styles;
  const kpis = [
    { label: t("superadmin.total", "Total"), value: counts.total || 0, color: "#ea580c", bg: "#fff7ed" },
    { label: t("superadmin.open", "Open"), value: counts.open_count || 0, color: "#3b82f6", bg: "#eff6ff" },
    { label: t("superadmin.replied", "Replied"), value: counts.replied_count || 0, color: "#a855f7", bg: "#faf5ff" },
    { label: t("superadmin.closed", "Closed"), value: counts.closed_count || 0, color: "#22c55e", bg: "#f0fdf4" },
  ];

  return (
    <div style={S.page}>
      {toast && <div style={{ ...S.toast, background: toast.type === "error" ? "#dc2626" : "#22c55e" }}>{toast.type === "error" ? "❌" : "✅"} {toast.msg}</div>}

      <div style={S.header}>
        <div>
          <h1 style={S.title}>🎧 {t("superadmin.supportTitle", "Help Desk")}</h1>
          <p style={S.subtitle}>{t("superadmin.supportSubtitle", "Manage all gym owner support requests")}</p>
        </div>
        {view !== "list" && <button style={S.btnOutline} onClick={() => { setView("list"); setSelected(null); }}>{t("superadmin.backToList", "← Back to List")}</button>}
      </div>

      {/* KPI Cards */}
      {view === "list" && (
        <div style={S.kpiRow}>
          {kpis.map(k => (
            <div key={k.label} style={{ ...S.kpiCard, borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 700 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {view === "list" && (
        <div style={{ ...S.card, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={S.label}>{t("superadmin.status", "Status")}</label>
            <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{t("superadmin.all", "All")}</option>
              {["Open", "Replied", "Closed"].map(s => <option key={s} value={s}>{t(`superadmin.${s.toLowerCase()}`, s)}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>{t("superadmin.priority", "Priority")}</label>
            <select style={S.select} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">{t("superadmin.all", "All")}</option>
              {["Low", "Medium", "High", "Urgent"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button style={S.btnPrimary} onClick={applyFilter}>{t("superadmin.applyFilters", "Apply Filters")}</button>
          <button style={S.btnOutline} onClick={() => { setFilterStatus(""); setFilterPriority(""); setTimeout(fetchAll, 100); }}>{t("superadmin.reset", "Reset")}</button>
        </div>
      )}

      {/* Ticket Detail */}
      {view === "detail" && selected && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>{selected.ticketNumber}</div>
              <h3 style={{ color: "#0f172a", fontWeight: 700, margin: "4px 0" }}>{selected.subject}</h3>
              <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                {selected.gymName && <span>🏢 {selected.gymName} · </span>}
                <span>👤 {selected.adminName}</span>
                {selected.adminEmail && <span> · {selected.adminEmail}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ ...S.badge, background: statusBg(selected.status), color: statusColor(selected.status) }}>{t(`superadmin.${selected.status.toLowerCase()}`, selected.status)}</span>
              <span style={{ ...S.badge, background: "#fff7ed", color: priorityColor(selected.priority) }}>{selected.priority}</span>
              <span style={{ ...S.badge, background: "#f1f5f9", color: "#475569" }}>{selected.category}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["Open", "Replied", "Closed"].map(s => (
              <button key={s} onClick={() => changeStatus(s)}
                style={{ ...S.btnSm, background: selected.status === s ? statusColor(s) : "rgba(234, 88, 12, 0.08)", color: selected.status === s ? "#fff" : "#ea580c" }}>
                {t(`superadmin.${s.toLowerCase()}`, s)}
              </button>
            ))}
          </div>
          <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: 16 }} />
          {(selected.imageUrl || selected.attachmentUrl) && (
            <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ea580c", marginBottom: 6 }}>📷 {t("superadmin.attachedPhoto", "Attached Screenshot / Photo:")}</div>
              <a href={selected.imageUrl || selected.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <img src={selected.imageUrl || selected.attachmentUrl} alt="Attached Screenshot" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8, border: "1px solid #cbd5e1", display: "block" }} />
              </a>
            </div>
          )}
          <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, paddingRight: 4 }}>
            {replies.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: (r.senderRole === "Superadmin" || r.senderRole === "Subadmin") ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", background: (r.senderRole === "Superadmin" || r.senderRole === "Subadmin") ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)" : "#f1f5f9", color: (r.senderRole === "Superadmin" || r.senderRole === "Subadmin") ? "#fff" : "#0f172a", borderRadius: (r.senderRole === "Superadmin" || r.senderRole === "Subadmin") ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: 4, opacity: 0.9 }}>{r.senderRole} · {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
                  {r.message && <div style={{ fontSize: "0.88rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.message}</div>}
                  {(r.imageUrl || r.attachmentUrl) && (
                    <div style={{ marginTop: 8 }}>
                      <a href={r.imageUrl || r.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <img src={r.imageUrl || r.attachmentUrl} alt="Attachment" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", display: "block", marginTop: 4 }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {selected.status !== "Closed" && (
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
              {replyImagePreview && (
                <div style={{ marginBottom: 10, position: "relative", display: "inline-block" }}>
                  <img src={replyImagePreview} alt="Preview" style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  <button type="button" onClick={() => { setReplyImage(null); setReplyImagePreview(null); }} style={{ position: "absolute", top: -6, right: -6, background: "#dc2626", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <textarea style={{ ...S.input, flex: 1, height: 50, resize: "none" }} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={t("superadmin.typeReply", "Type your reply to the admin...")} />
                <label style={{ cursor: "pointer", padding: "10px 14px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 4 }}>
                  📷 {t("superadmin.photo", "Photo")}
                  <input type="file" accept="image/*" onChange={handleReplyImageChange} style={{ display: "none" }} />
                </label>
                <button style={{ ...S.btnPrimary, padding: "10px 22px" }} onClick={sendReply} disabled={submitting}>
                  {submitting ? t("superadmin.sending", "Sending...") : t("superadmin.send", "Send")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket List */}
      {view === "list" && (
        <div style={S.card}>
          {loading ? <div style={{ textAlign: "center", padding: 40, color: "#64748b", fontWeight: 600 }}>{t("superadmin.loadingTickets", "Loading tickets...")}</div>
            : tickets.length === 0 ? <div style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div><p style={{ color: "#475569", fontWeight: 600, fontSize: "1rem" }}>{t("superadmin.noTicketsFound", "No tickets found.")}</p></div>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {[t("superadmin.ticketNo", "Ticket #"), t("superadmin.gymAdmin", "Gym / Admin"), t("superadmin.subject", "Subject"), t("superadmin.priority", "Priority"), t("superadmin.status", "Status"), t("superadmin.updated", "Updated"), t("superadmin.action", "Action")].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(tTicket => (
                      <tr key={tTicket.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={S.td}><span style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace", fontWeight: 600 }}>{tTicket.ticketNumber}</span></td>
                        <td style={S.td}><div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{tTicket.gymName || "—"}</div><div style={{ fontSize: "0.78rem", color: "#64748b" }}>{tTicket.adminName}</div></td>
                        <td style={{ ...S.td, maxWidth: 200 }}><span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>{tTicket.subject}</span></td>
                        <td style={S.td}><span style={{ ...S.badge, background: "#fff7ed", color: priorityColor(tTicket.priority) }}>{tTicket.priority}</span></td>
                        <td style={S.td}><span style={{ ...S.badge, background: statusBg(tTicket.status), color: statusColor(tTicket.status) }}>{t(`superadmin.${tTicket.status.toLowerCase()}`, tTicket.status)}</span></td>
                        <td style={S.td}><span style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 500 }}>{new Date(tTicket.updatedAt).toLocaleDateString("en-IN")}</span></td>
                        <td style={S.td}><button style={S.btnSm} onClick={() => openDetail(tTicket)}>{t("superadmin.openBtn", "Open →")}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "24px", fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 1150, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  title: { fontSize: "1.65rem", fontWeight: 800, color: "#ea580c", margin: 0 },
  subtitle: { color: "#475569", fontSize: "0.9rem", fontWeight: 500, margin: "4px 0 0" },
  kpiRow: { display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" },
  kpiCard: { background: "#ffffff", borderRadius: 12, padding: "16px 22px", flex: "1 1 120px", boxShadow: "0 4px 14px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  card: { background: "#ffffff", borderRadius: 14, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", marginBottom: 16 },
  btnPrimary: { background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)" },
  btnOutline: { background: "transparent", color: "#ea580c", border: "1.5px solid #ea580c", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" },
  btnSm: { background: "rgba(234, 88, 12, 0.1)", color: "#ea580c", border: "1px solid rgba(234, 88, 12, 0.3)", borderRadius: 6, padding: "6px 14px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" },
  badge: { display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700 },
  label: { display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  select: { padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: "0.88rem", background: "#ffffff", color: "#0f172a", outline: "none", fontWeight: 500 },
  input: { width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: "0.88rem", boxSizing: "border-box", outline: "none", color: "#0f172a", background: "#ffffff" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" },
  td: { padding: "14px 14px", verticalAlign: "middle", color: "#0f172a", fontSize: "0.88rem" },
  toast: { position: "fixed", top: 20, right: 20, zIndex: 99999, color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }
};

