import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../Api/axiosInstance.jsx";
import { useTranslation } from "react-i18next";

const CATEGORIES = ["General", "Billing", "Technical", "Account", "Feature Request", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const priorityColor = (p) => ({ Low: "#22c55e", Medium: "#f59e0b", High: "#f97316", Urgent: "#dc2626" }[p] || "#64748b");
const statusColor  = (s) => ({ Open: "#3b82f6", Replied: "#a855f7", Closed: "#22c55e" }[s] || "#64748b");
const statusBg     = (s) => ({ Open: "#eff6ff", Replied: "#faf5ff", Closed: "#f0fdf4" }[s] || "#f1f5f9");

export default function AdminSupportTickets() {
  const { t } = useTranslation();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState("list"); // list | new | detail
  const [selected, setSelected]     = useState(null);
  const [replies, setReplies]       = useState([]);
  const [replyText, setReplyText]   = useState("");
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);
  const [form, setForm]             = useState({ subject: "", category: "General", priority: "Medium", message: "" });
  const [ticketImage, setTicketImage] = useState(null);
  const [ticketImagePreview, setTicketImagePreview] = useState(null);

  const bottomRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [replies]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get("/support/my");
      setTickets(r.data.tickets || []);
    } catch { showToast("Failed to load tickets", "error"); }
    finally { setLoading(false); }
  };

  const openDetail = async (t) => {
    setSelected(t);
    setView("detail");
    setReplyText("");
    setReplyImage(null);
    setReplyImagePreview(null);
    try {
      const r = await axiosInstance.get(`/support/${t.id}`);
      setReplies(r.data.replies || []);
      setSelected(r.data.ticket);
    } catch { showToast("Failed to load ticket details", "error"); }
  };

  const handleTicketImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTicketImage(file);
      setTicketImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReplyImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReplyImage(file);
      setReplyImagePreview(URL.createObjectURL(file));
    }
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { showToast("Subject and message required", "error"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subject", form.subject);
      formData.append("category", form.category);
      formData.append("priority", form.priority);
      formData.append("message", form.message);
      if (ticketImage) {
        formData.append("image", ticketImage);
      }

      await axiosInstance.post("/support", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showToast("Ticket created successfully!");
      setForm({ subject: "", category: "General", priority: "Medium", message: "" });
      setTicketImage(null);
      setTicketImagePreview(null);
      setView("list");
      fetchTickets();
    } catch { showToast("Failed to create ticket", "error"); }
    finally { setSubmitting(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim() && !replyImage) { showToast("Please type a message or select an image", "error"); return; }
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
      fetchTickets();
      showToast("Reply sent!");
    } catch { showToast("Failed to send reply", "error"); }
    finally { setSubmitting(false); }
  };

  const S = styles;
  return (
    <div style={S.page}>
      {toast && <div style={{ ...S.toast, background: toast.type === "error" ? "#dc2626" : "#22c55e" }}>{toast.type === "error" ? "❌" : "✅"} {toast.msg}</div>}

      {/* HEADER */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>🎧 {t("nav.helpDesk", "Help Desk")}</h1>
          <p style={S.subtitle}>{t("support.subtitle", "Raise an issue or track existing tickets")}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {view !== "list" && <button style={{ ...S.btnOutline }} onClick={() => { setView("list"); setSelected(null); }}>← {t("common.back", "Back")}</button>}
          {view === "list" && <button style={S.btnPrimary} onClick={() => setView("new")}>+ {t("support.newTicket", "New Ticket")}</button>}
        </div>
      </div>

      {/* NEW TICKET FORM */}
      {view === "new" && (
        <div style={S.card}>
          <h3 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 20 }}>{t("support.createNewTicket", "Create New Ticket")}</h3>
          <form onSubmit={submitTicket}>
            <div style={S.formRow}>
              <div style={{ flex: 2 }}>
                <label style={S.label}>{t("support.subject", "Subject")} *</label>
                <input style={S.input} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder={t("support.subjectPlaceholder", "Brief description of your issue")} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>{t("support.category", "Category")}</label>
                <select style={S.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`support.categories.${c}`, c)}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>{t("support.priority", "Priority")}</label>
                <select style={S.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{t(`support.priorities.${p}`, p)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>{t("support.message", "Message")} *</label>
              <textarea style={{ ...S.input, height: 120, resize: "vertical" }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={t("support.messagePlaceholder", "Describe your issue in detail...")} />
            </div>

            {/* Image Attachment Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>📷 {t("support.attachScreenshot", "Attach Screenshot / Image (Optional)")}</label>
              <input type="file" accept="image/*" onChange={handleTicketImageChange} style={{ fontSize: "0.85rem", color: "#1e293b" }} />
              {ticketImagePreview && (
                <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                  <img src={ticketImagePreview} alt="Preview" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  <button type="button" onClick={() => { setTicketImage(null); setTicketImagePreview(null); }} style={{ position: "absolute", top: -8, right: -8, background: "#dc2626", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>×</button>
                </div>
              )}
            </div>

            <button type="submit" style={{ ...S.btnPrimary, marginTop: 4 }} disabled={submitting}>
              {submitting ? t("common.submitting", "Submitting...") : `🚀 ${t("support.submitTicketBtn", "Submit Ticket")}`}
            </button>
          </form>
        </div>
      )}

      {/* TICKET DETAIL */}
      {view === "detail" && selected && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 4 }}>{selected.ticketNumber}</div>
              <h3 style={{ color: "#0f172a", fontWeight: 700, margin: 0 }}>{selected.subject}</h3>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ ...S.badge, background: statusBg(selected.status), color: statusColor(selected.status) }}>{t(`support.statuses.${selected.status}`, selected.status)}</span>
              <span style={{ ...S.badge, background: "#fff7ed", color: priorityColor(selected.priority) }}>{t(`support.priorities.${selected.priority}`, selected.priority)}</span>
              <span style={{ ...S.badge, background: "#f1f5f9", color: "#475569" }}>{t(`support.categories.${selected.category}`, selected.category)}</span>
            </div>
          </div>
          <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: 16 }} />
          {(selected.imageUrl || selected.attachmentUrl) && (
            <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ea580c", marginBottom: 6 }}>📷 {t("support.attachedScreenshot", "Attached Screenshot / Photo:")}</div>
              <a href={selected.imageUrl || selected.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <img src={selected.imageUrl || selected.attachmentUrl} alt="Attached Screenshot" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8, border: "1px solid #cbd5e1", display: "block" }} />
              </a>
            </div>
          )}
          <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, paddingRight: 4 }}>
            {replies.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: r.senderRole === "Admin" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", background: r.senderRole === "Admin" ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)" : "#f1f5f9", color: r.senderRole === "Admin" ? "#fff" : "#0f172a", borderRadius: r.senderRole === "Admin" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
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
                <textarea style={{ ...S.input, flex: 1, height: 50, resize: "none" }} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={t("support.replyPlaceholder", "Type your reply...")} />
                <label style={{ cursor: "pointer", padding: "10px 14px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 4 }}>
                  📷 {t("support.photo", "Photo")}
                  <input type="file" accept="image/*" onChange={handleReplyImageChange} style={{ display: "none" }} />
                </label>
                <button style={{ ...S.btnPrimary, padding: "10px 22px" }} onClick={sendReply} disabled={submitting}>
                  {submitting ? t("common.sending", "Sending...") : t("common.send", "Send")}
                </button>
              </div>
            </div>
          )}
          {selected.status === "Closed" && <p style={{ color: "#64748b", textAlign: "center", fontSize: "0.88rem", fontWeight: 600 }}>🔒 {t("support.ticketClosedMsg", "This ticket is closed.")}</p>}
        </div>
      )}

      {/* TICKET LIST */}
      {view === "list" && (
        <div style={S.card}>
          {loading ? (<div style={{ textAlign: "center", padding: 40, color: "#64748b", fontWeight: 600 }}>{t("support.loadingTickets", "Loading tickets...")}</div>) : tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
              <p style={{ color: "#475569", fontSize: "0.98rem", fontWeight: 600 }}>{t("support.noTicketsYet", "No support tickets yet.")}</p>
              <button style={S.btnPrimary} onClick={() => setView("new")}>{t("support.createFirstTicket", "Create First Ticket")}</button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[t("support.ticketId", "Ticket #"), t("support.subject", "Subject"), t("support.category", "Category"), t("support.priority", "Priority"), t("support.status", "Status"), t("support.lastUpdated", "Last Updated"), t("common.actions", "Action")].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={S.td}><span style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace", fontWeight: 600 }}>{t.ticketNumber}</span></td>
                    <td style={{ ...S.td, maxWidth: 220 }}><span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>{t.subject}</span></td>
                    <td style={S.td}><span style={{ ...S.badge, background: "#f1f5f9", color: "#475569" }}>{t.category}</span></td>
                    <td style={S.td}><span style={{ ...S.badge, background: "#fff7ed", color: priorityColor(t.priority) }}>{t.priority}</span></td>
                    <td style={S.td}><span style={{ ...S.badge, background: statusBg(t.status), color: statusColor(t.status) }}>{t.status}</span></td>
                    <td style={S.td}><span style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 500 }}>{new Date(t.updatedAt).toLocaleDateString("en-IN")}</span></td>
                    <td style={S.td}><button style={S.btnSm} onClick={() => openDetail(t)}>View →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "24px", fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 1150, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  title: { fontSize: "1.65rem", fontWeight: 800, color: "#ea580c", margin: 0 },
  subtitle: { color: "#475569", fontSize: "0.9rem", fontWeight: 500, margin: "4px 0 0" },
  card: { background: "#ffffff", borderRadius: 14, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" },
  btnPrimary: { background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)" },
  btnOutline: { background: "transparent", color: "#ea580c", border: "1.5px solid #ea580c", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" },
  btnSm: { background: "rgba(234, 88, 12, 0.1)", color: "#ea580c", border: "1px solid rgba(234, 88, 12, 0.3)", borderRadius: 6, padding: "6px 14px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" },
  badge: { display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700 },
  formRow: { display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" },
  label: { display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  input: { width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: "0.88rem", boxSizing: "border-box", outline: "none", color: "#0f172a", background: "#ffffff" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" },
  td: { padding: "14px 14px", verticalAlign: "middle", color: "#0f172a", fontSize: "0.88rem" },
  toast: { position: "fixed", top: 20, right: 20, zIndex: 99999, color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }
};

