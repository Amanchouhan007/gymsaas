import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBullhorn, 
  faPaperPlane, 
  faHistory, 
  faEnvelope, 
  faComments as faCommentsSolid, 
  faBell, 
  faUsers, 
  faUserTie, 
  faInfoCircle,
  faUser,
  faSearch,
  faCheckCircle,
  faTimesCircle,
  faRunning,
  faDumbbell,
  faCalendarAlt,
  faUtensils,
  faTrophy,
  faHeartbeat,
  faCreditCard,
  faChartLine,
  faTrash
} from "@fortawesome/free-solid-svg-icons";

// ── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "Attendance Update",           icon: faCalendarAlt, color: "#2563eb" },
  { key: "Body Transformation Progress",icon: faChartLine,   color: "#7c3aed" },
  { key: "Payment Reminder",            icon: faCreditCard,  color: "#dc2626" },
  { key: "Diet Plan",                   icon: faUtensils,    color: "#d97706" },
  { key: "Exercise Routine",            icon: faDumbbell,    color: "#059669" },
  { key: "Class Schedule",              icon: faRunning,     color: "#0891b2" },
  { key: "Fitness Assessment",          icon: faHeartbeat,   color: "#db2777" },
  { key: "Personal Achievement",        icon: faTrophy,      color: "#ea580c" },
];

// ── Group Broadcast Tab ───────────────────────────────────────────────────────
const GroupBroadcastTab = () => {
  const { t } = useTranslation();
  const [subject, setSubject]               = useState("");
  const [message, setMessage]               = useState("");
  const [image, setImage]                   = useState(null);
  const [emailChannel, setEmailChannel]     = useState(true);
  const [whatsappChannel, setWhatsappChannel] = useState(false);
  const [appPushChannel, setAppPushChannel] = useState(true);
  const [targetMembers, setTargetMembers]   = useState(true);
  const [targetStaff, setTargetStaff]       = useState(false);
  const [loading, setLoading]               = useState(false);
  const [statusMsg, setStatusMsg]           = useState({ type: "", text: "" });
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get("notif/admin/broadcast/history");
      if (res.data?.success) setHistory(res.data.history || []);
    } catch (err) {
      console.error("Failed to load broadcast history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await axiosInstance.delete(`/notif/announcement/${id}`);
      if (res.data?.success) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      alert(err.response?.data?.message || "Failed to delete announcement.");
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    const channels = [];
    if (appPushChannel)   channels.push("APP_PUSH");
    if (emailChannel)     channels.push("EMAIL");
    if (whatsappChannel)  channels.push("WHATSAPP");
    const targetAudience = [];
    if (targetMembers) targetAudience.push("MEMBERS");
    if (targetStaff)   targetAudience.push("STAFF");

    if (!channels.length) return setStatusMsg({ type: "danger", text: "Please select at least one delivery channel!" });
    if (!targetAudience.length) return setStatusMsg({ type: "danger", text: "Please select at least one target audience!" });

    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("channels", JSON.stringify(channels));
      formData.append("targetAudience", JSON.stringify(targetAudience));
      if (image) formData.append("image", image);

      const res = await axiosInstance.post("notif/admin/broadcast", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setStatusMsg({ type: "success", text: `Success! Broadcasted to ${res.data.result?.totalTargeted || 0} user(s).` });
        setSubject(""); setMessage(""); setImage(null);
        fetchHistory();
      } else {
        setStatusMsg({ type: "danger", text: res.data?.message || "Failed to send." });
      }
    } catch (err) {
      setStatusMsg({ type: "danger", text: err.response?.data?.message || "Error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-4">
      {/* Left: Form */}
      <div className="col-12 col-xl-5">
        <div 
          className="card border-0 p-3 p-sm-4 bg-white"
          style={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: '#0f172a' }}>
            <div className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </div>
            {t("announcementsPage.draftAnnouncement", "Draft Announcement")}
          </h5>

          {statusMsg.text && (
            <div 
              className={`alert alert-${statusMsg.type} alert-dismissible border-0 shadow-sm`} 
              role="alert" 
              style={{ borderRadius: "10px" }}
            >
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              {statusMsg.text}
              <button type="button" className="btn-close" onClick={() => setStatusMsg({ type: "", text: "" })} />
            </div>
          )}

          <form onSubmit={handleBroadcast}>
            {/* Target Audience */}
            <div className="mb-4">
              <label className="form-label fw-bold d-block mb-2" style={{ color: '#334155', fontSize: '0.88rem' }}>{t("announcementsPage.targetAudience", "Target Audience")}</label>
              <div className="d-flex gap-3 flex-wrap">
                {[
                  { id: "roleMembers", checked: targetMembers, onChange: setTargetMembers, icon: faUsers, color: "#16a34a", label: t("announcementsPage.allMembers", "All Members") },
                  { id: "roleStaff", checked: targetStaff, onChange: setTargetStaff, icon: faUserTie, color: "#2563eb", label: t("announcementsPage.allStaff", "All Staff") },
                ].map(({ id, checked, onChange, icon, color, label }) => (
                  <div 
                    key={id} 
                    className="form-check p-3 rounded-3 flex-grow-1"
                    style={{ 
                      minWidth: "130px", 
                      backgroundColor: checked ? "rgba(234, 88, 12, 0.08)" : "#f8fafc", 
                      border: `1.5px solid ${checked ? "#ea580c" : "#cbd5e1"}`, 
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => onChange(!checked)}
                  >
                    <input className="form-check-input" type="checkbox" id={id} checked={checked} readOnly style={{ cursor: "pointer", accentColor: "#ea580c" }} />
                    <label className="form-check-label fw-bold ms-1" htmlFor={id} style={{ cursor: "pointer", color: "#0f172a", fontSize: '0.9rem' }}>
                      <FontAwesomeIcon icon={icon} className="me-2" style={{ color }} />{label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="mb-4">
              <label className="form-label fw-bold d-block mb-2" style={{ color: '#334155', fontSize: '0.88rem' }}>{t("announcementsPage.deliveryChannels", "Delivery Channels")}</label>
              <div className="d-flex gap-2 flex-column">
                {[
                  { id: "chanApp", checked: appPushChannel, onChange: setAppPushChannel, icon: faBell, color: "#ea580c", label: t("announcementsPage.inAppBanner", "In-App Dashboard Banner") },
                  { id: "chanEmail", checked: emailChannel, onChange: setEmailChannel, icon: faEnvelope, color: "#d97706", label: t("announcementsPage.emailBroadcast", "Email Broadcast") },
                  { id: "chanWhatsApp", checked: whatsappChannel, onChange: setWhatsappChannel, icon: faCommentsSolid, color: "#16a34a", label: t("announcementsPage.whatsappNotification", "WhatsApp Notification") },
                ].map(({ id, checked, onChange, icon, color, label }) => (
                  <div 
                    key={id} 
                    className="form-check form-switch p-2.5 ps-5 rounded-3 d-flex align-items-center"
                    style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <input className="form-check-input" type="checkbox" role="switch" id={id} checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: "#ea580c" }} />
                    <label className="form-check-label fw-bold ms-2" htmlFor={id} style={{ color: "#0f172a", fontSize: '0.88rem' }}>
                      <FontAwesomeIcon icon={icon} className="me-2" style={{ color }} />{label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-3">
              <label htmlFor="subject" className="form-label fw-bold" style={{ color: '#334155', fontSize: '0.88rem' }}>{t("announcementsPage.subject", "Announcement Subject")} *</label>
              <input 
                type="text" 
                className="form-control" 
                id="subject"
                placeholder={t("announcementsPage.subjectPlaceholder", "e.g. Gym closed tomorrow / Special Offer")}
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                required 
                style={{ 
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  fontSize: '0.9rem'
                }} 
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label htmlFor="message" className="form-label fw-bold" style={{ color: '#334155', fontSize: '0.88rem' }}>{t("announcementsPage.messageContent", "Message Content")} *</label>
              <textarea 
                className="form-control" 
                id="message" 
                rows="4"
                placeholder={t("announcementsPage.messagePlaceholder", "Write notice details, updates, or offers here...")}
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                required 
                style={{ 
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  fontSize: '0.9rem',
                  resize: 'none'
                }} 
              />
            </div>

            {/* Optional Image */}
            <div className="mb-4">
              <label htmlFor="image" className="form-label fw-bold" style={{ color: '#334155', fontSize: '0.88rem' }}>{t("announcementsPage.attachImageOptional", "Attach Image / PDF (Optional)")}</label>
              <input 
                type="file" 
                className="form-control" 
                id="image" 
                accept="image/*,application/pdf"
                onChange={e => setImage(e.target.files[0])} 
                style={{ 
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  fontSize: '0.85rem'
                }} 
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-lg w-100 py-2.5 text-white fw-bold shadow-sm"
              disabled={loading} 
              style={{ 
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
              }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" />{t("common.loading", "Broadcasting...")}</>
              ) : (
                <><FontAwesomeIcon icon={faPaperPlane} className="me-2" />{t("announcementsPage.sendBroadcast", "Send Broadcast Now")}</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right: History */}
      <div className="col-12 col-xl-7">
        <div 
          className="card border-0 p-3 p-sm-4 bg-white" 
          style={{ 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            minHeight: '500px'
          }}
        >
          <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: '#0f172a' }}>
            <div className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <FontAwesomeIcon icon={faHistory} />
            </div>
            {t("announcementsPage.broadcastHistory", "Broadcast History")}
          </h5>
          {historyLoading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-5" style={{ color: '#64748b' }}>
              <FontAwesomeIcon icon={faBullhorn} size="3x" className="mb-3 text-warning opacity-50" />
              <h6 className="fw-bold text-dark">{t("announcementsPage.noBroadcasts", "No Broadcasts Sent Yet")}</h6>
              <p className="small mb-0">{t("announcementsPage.draftFirst", "Draft your first announcement above")}</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                <thead style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th className="fw-bold small px-3 py-2.5">Date</th>
                    <th className="fw-bold small px-3 py-2.5">Subject</th>
                    <th className="fw-bold small px-3 py-2.5">Audience</th>
                    <th className="fw-bold small px-3 py-2.5">Channels</th>
                    <th className="fw-bold small px-3 py-2.5 text-end">Action</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: 'none' }}>
                  {history.map(ann => (
                    <tr key={ann.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="px-3" style={{ fontSize: "11px", whiteSpace: "nowrap", color: '#64748b', fontWeight: '600' }}>
                        {new Date(ann.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3">
                        <div className="fw-bold text-dark small">{ann.subject}</div>
                        <small style={{ fontSize: "11px", color: '#64748b', display: 'block' }}>
                          {ann.message?.length > 60 ? ann.message.slice(0, 60) + "..." : ann.message}
                        </small>
                        {ann.imageUrl && (
                          <a href={ann.imageUrl} target="_blank" rel="noreferrer" className="badge bg-warning text-dark text-decoration-none mt-1 d-inline-block" style={{ fontSize: "9px" }}>
                            📎 View Attachment
                          </a>
                        )}
                      </td>
                      <td className="px-3">
                        {ann.targetRoles?.map((role, i) => (
                          <span key={i} className={`badge rounded-pill me-1 ${role === "MEMBERS" ? "bg-success text-white" : "bg-info text-dark"}`} style={{ fontSize: "10px", fontWeight: '700' }}>{role}</span>
                        ))}
                      </td>
                      <td className="px-3">
                        <div className="d-flex gap-1 flex-wrap">
                          {ann.channels?.map((ch, i) => (
                            <span key={i} className="badge bg-secondary rounded-pill" style={{ fontSize: "10px", fontWeight: '600' }}>
                              {ch === "EMAIL" ? "Email" : ch === "WHATSAPP" ? "WhatsApp" : "In-App"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 text-end">
                        <button 
                          className="btn btn-link text-danger p-1 border-0" 
                          onClick={() => handleDelete(ann.id)} 
                          title="Delete Broadcast"
                          style={{ fontSize: "14px" }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Personal Message Tab ──────────────────────────────────────────────────────
const PersonalMessageTab = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage]               = useState("");
  const [appPush, setAppPush]               = useState(true);
  const [whatsapp, setWhatsapp]             = useState(true);
  const [loading, setLoading]               = useState(false);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [statusMsg, setStatusMsg]           = useState({ type: "", text: "" });
  const [showDropdown, setShowDropdown]     = useState(false);
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const searchRef                           = useRef();
  const debounceRef                         = useRef();

  // Live search with debounce
  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axiosInstance.get(`/members/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        const members = res.data?.members || res.data?.data || [];
        setSearchResults(members);
        setShowDropdown(true);
      } catch (err) {
        console.error("Member search error:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPersonalHistory = async () => {
    try {
      const res = await axiosInstance.get("/notif/personal/history");
      if (res.data?.success) setHistory(res.data.history || []);
    } catch { /* silently fail */ } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchPersonalHistory(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedMember) return setStatusMsg({ type: "danger", text: "Please select a member!" });
    if (!selectedCategory) return setStatusMsg({ type: "danger", text: "Please select a notification category!" });
    if (!message.trim()) return setStatusMsg({ type: "danger", text: "Please write a message!" });

    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await axiosInstance.post("/notif/personal", {
        memberId: selectedMember.id,
        category: selectedCategory,
        message,
        channels: [
          ...(appPush ? ["APP_PUSH"] : []),
          ...(whatsapp ? ["WHATSAPP"] : [])
        ]
      });
      if (res.data?.success) {
        setStatusMsg({ type: "success", text: `✅ Notification sent to ${selectedMember.fullName} successfully!` });
        setSelectedMember(null); setSearchQuery(""); setSelectedCategory(null); setMessage("");
        fetchPersonalHistory();
      } else {
        setStatusMsg({ type: "danger", text: res.data?.message || "Failed to send." });
      }
    } catch (err) {
      setStatusMsg({ type: "danger", text: err.response?.data?.message || "Error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-4">
      {/* Left: Compose */}
      <div className="col-12 col-xl-5">
        <div 
          className="card border-0 p-3 p-sm-4 bg-white" 
          style={{ 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h5 className="fw-bold mb-1 d-flex align-items-center" style={{ color: "#0f172a" }}>
            <div className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <FontAwesomeIcon icon={faUser} />
            </div>
            Send Personal Notification
          </h5>
          <p className="small mb-4 text-muted">Send a personalized message to a specific member.</p>

          {statusMsg.text && (
            <div className={`alert alert-${statusMsg.type} alert-dismissible border-0 shadow-sm`} role="alert" style={{ borderRadius: "10px" }}>
              {statusMsg.text}
              <button type="button" className="btn-close" onClick={() => setStatusMsg({ type: "", text: "" })} />
            </div>
          )}

          <form onSubmit={handleSend}>
            {/* Step 1: Member Search */}
            <div className="mb-4">
              <label className="form-label fw-bold" style={{ color: '#334155', fontSize: '0.88rem' }}>
                <span className="badge rounded-circle me-2" style={{ backgroundColor: '#ea580c', color: '#fff', fontSize: '11px' }}>1</span>
                Select Member
              </label>
              <div className="position-relative" ref={searchRef}>
                <div className="input-group shadow-sm">
                  <span className="input-group-text border-end-0 bg-white" style={{ borderColor: '#cbd5e1', color: '#ea580c' }}>
                    {searchLoading
                      ? <span className="spinner-border spinner-border-sm text-warning" />
                      : <FontAwesomeIcon icon={faSearch} style={{ color: '#ea580c' }} />}
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0 ps-0 bg-white"
                    placeholder="Type member name to search..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSelectedMember(null); }}
                    style={{ 
                      color: '#0f172a', 
                      borderColor: '#cbd5e1', 
                      borderRadius: '0 10px 10px 0',
                      fontSize: '0.9rem'
                    }}
                    autoComplete="off"
                  />
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div 
                    className="position-absolute w-100 border rounded-3 shadow-lg mt-1 bg-white" 
                    style={{ 
                      zIndex: 1000, 
                      maxHeight: "220px", 
                      overflowY: "auto",
                      borderColor: '#cbd5e1'
                    }}
                  >
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center small text-muted">No members found</div>
                    ) : searchResults.map(m => (
                      <div 
                        key={m.id} 
                        className="d-flex align-items-center gap-2 px-3 py-2 border-bottom"
                        style={{ cursor: "pointer", borderColor: '#f1f5f9', transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fff7ed"}
                        onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                        onClick={() => { setSelectedMember(m); setSearchQuery(m.fullName); setShowDropdown(false); }}
                      >
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: "34px", height: "34px", fontSize: "13px", flexShrink: 0, background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}
                        >
                          {m.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold small text-dark">{m.fullName}</div>
                          <div style={{ fontSize: "11px", color: '#64748b' }}>{m.email || m.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected badge */}
              {selectedMember && (
                <div className="mt-2 d-flex align-items-center gap-2 p-2.5 rounded-3 bg-success bg-opacity-10 border border-success text-dark">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                  <span className="small fw-bold text-dark">{selectedMember.fullName}</span>
                  <button 
                    type="button" 
                    className="btn btn-sm ms-auto p-0 border-0 text-muted"
                    onClick={() => { setSelectedMember(null); setSearchQuery(""); }}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Category */}
            <div className="mb-4">
              <label className="form-label fw-bold" style={{ color: '#334155', fontSize: '0.88rem' }}>
                <span className="badge rounded-circle me-2" style={{ backgroundColor: '#ea580c', color: '#fff', fontSize: "11px" }}>2</span>
                Notification Category
              </label>
              <div className="row g-2">
                {CATEGORIES.map(cat => (
                  <div key={cat.key} className="col-6">
                    <div 
                      className="p-2.5 rounded-3 border d-flex align-items-center gap-2"
                      style={{
                        cursor: "pointer",
                        borderColor: selectedCategory === cat.key ? "#ea580c" : "#cbd5e1",
                        backgroundColor: selectedCategory === cat.key ? "rgba(234, 88, 12, 0.08)" : "#f8fafc",
                        transition: "all 0.15s"
                      }}
                      onClick={() => setSelectedCategory(cat.key)}
                    >
                      <FontAwesomeIcon icon={cat.icon} style={{ color: cat.color, fontSize: "14px", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", fontWeight: selectedCategory === cat.key ? "800" : "600", color: "#0f172a", lineHeight: 1.2 }}>
                        {cat.key}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Message */}
            <div className="mb-4">
              <label className="form-label fw-bold" style={{ color: '#334155', fontSize: '0.88rem' }}>
                <span className="badge rounded-circle me-2" style={{ backgroundColor: '#ea580c', color: '#fff', fontSize: "11px" }}>3</span>
                Personalized Message
              </label>
              <textarea 
                className="form-control shadow-sm bg-white" 
                rows="4"
                placeholder={selectedCategory
                  ? `Write your ${selectedCategory.toLowerCase()} message here...`
                  : "First select a category, then write your message here..."}
                value={message} 
                onChange={e => setMessage(e.target.value)}
                style={{ 
                  color: '#0f172a', 
                  borderColor: '#cbd5e1', 
                  borderRadius: '10px', 
                  padding: '9px 14px', 
                  fontSize: '0.9rem',
                  resize: 'none' 
                }} 
              />
            </div>

            {/* Delivery Channels */}
            <div className="mb-4">
              <label className="form-label fw-bold small" style={{ color: '#334155' }}>Delivery Channels</label>
              <div className="d-flex gap-3 flex-wrap">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="pAppPush"
                    checked={appPush} 
                    onChange={e => setAppPush(e.target.checked)} 
                    style={{ accentColor: '#ea580c' }}
                  />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="pAppPush">
                    <FontAwesomeIcon icon={faBell} className="me-1" style={{ color: '#ea580c' }} /> In-App
                  </label>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="pWhatsapp"
                    checked={whatsapp} 
                    onChange={e => setWhatsapp(e.target.checked)} 
                    style={{ accentColor: '#ea580c' }}
                  />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="pWhatsapp">
                    <FontAwesomeIcon icon={faCommentsSolid} className="me-1 text-success" /> WhatsApp
                  </label>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-lg w-100 text-white shadow-sm fw-bold py-2.5"
              disabled={loading} 
              style={{ 
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
              }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
              ) : (
                <><FontAwesomeIcon icon={faPaperPlane} className="me-2" />Send Personal Notification</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right: History */}
      <div className="col-12 col-xl-7">
        <div 
          className="card border-0 p-3 p-sm-4 bg-white" 
          style={{ 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            minHeight: '500px'
          }}
        >
          <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: "#0f172a" }}>
            <div className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <FontAwesomeIcon icon={faHistory} />
            </div>
            Personal Notification History
          </h5>
          {historyLoading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ height: "300px" }}>
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-5" style={{ color: '#64748b' }}>
              <FontAwesomeIcon icon={faUser} size="3x" className="mb-3 text-primary opacity-25" />
              <h6 className="fw-bold text-dark">No Personal Notifications Sent Yet</h6>
              <p className="small mb-0">Use the form to send your first personal notification.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3" style={{ maxHeight: "450px", overflowY: "auto" }}>
              {history.map(h => {
                const cat = CATEGORIES.find(c => c.key === h.category) || CATEGORIES[0];
                return (
                  <div key={h.id} className="d-flex gap-3 p-3 rounded-3 align-items-start border bg-light">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{ width: "38px", height: "38px", backgroundColor: cat.color, flexShrink: 0, fontSize: "14px" }}
                    >
                      <FontAwesomeIcon icon={cat.icon} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="fw-bold small text-dark">{h.memberName || `Member #${h.memberId}`}</span>
                          <span className="badge rounded-pill ms-2 px-2 py-1" style={{ backgroundColor: cat.color + "20", color: cat.color, fontSize: "10px", fontWeight: '700' }}>
                            {h.category}
                          </span>
                        </div>
                        <small style={{ fontSize: "10px", color: '#64748b', fontWeight: '600', whiteSpace: "nowrap" }}>
                          {new Date(h.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                      <p className="mb-0 small mt-1 text-dark" style={{ lineHeight: "1.4" }}>
                        {h.message?.length > 100 ? h.message.slice(0, 100) + "..." : h.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const AdminAnnouncements = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("group");

  const tabs = [
    { key: "group",    label: t("announcements.groupBroadcast", "Group Broadcast"),    icon: faBullhorn },
    { key: "personal", label: t("announcements.personalMessage", "Personal Message"),   icon: faUser },
  ];

  return (
    <div 
      className="container-fluid px-3 px-md-4 py-4" 
      style={{ 
        backgroundColor: '#f8fafc', 
        minHeight: '100vh', 
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <div 
          className="p-3 rounded-circle text-white d-flex align-items-center justify-content-center shadow"
          style={{ 
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', 
            width: "56px", 
            height: "56px"
          }}
        >
          <FontAwesomeIcon icon={activeTab === "group" ? faBullhorn : faUser} size="lg" />
        </div>
        <div>
          <h2 className="fw-extrabold mb-0 text-dark" style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{t("nav.announcements", "Announcements & Notifications")}</h2>
          <p className="mb-0 small fw-semibold text-secondary" style={{ color: '#475569' }}>{t("announcements.subtitle", "Broadcast to all members or send personalized messages.")}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button 
              key={tab.key} 
              type="button"
              className="btn d-flex align-items-center gap-2 px-4 py-2.5 shadow-sm"
              style={{
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "14px",
                background: isActive ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                border: isActive ? 'none' : '1px solid #cbd5e1',
                boxShadow: isActive ? '0 4px 14px rgba(234, 88, 12, 0.35)' : 'none',
                transition: "all 0.25s ease"
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <FontAwesomeIcon icon={tab.icon} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "group"    && <GroupBroadcastTab />}
      {activeTab === "personal" && <PersonalMessageTab />}
    </div>
  );
};

export default AdminAnnouncements;
