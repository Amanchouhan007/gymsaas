import React, { useState, useEffect, useRef } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTrashAlt,
  FaUser,
  FaUserPlus,
  FaBan,
  FaCheckCircle,
  FaClock,
  FaKey,
  FaDumbbell,
  FaBuilding,
  FaLock,
  FaCreditCard,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaCamera,
  FaSave,
  FaTimes,
  FaCalendarAlt,
  FaShieldAlt,
  FaCheck,
  FaTag
} from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import ImageCropper from "../../Components/ImageCropper";
// 🔽 New imports for export
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SuperAdminAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedAdminMembers, setSelectedAdminMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Extend Trial State
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedAdminForExtend, setSelectedAdminForExtend] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    fetchAdminsList();
  }, []);

  const fetchAdminsList = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/auth/admins");
      if (response.data?.success && Array.isArray(response.data.admins)) {
        setAdmins(response.data.admins);
      } else if (Array.isArray(response.data)) {
        setAdmins(response.data);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 BLOCK / ACTIVATE TOGGLE
  const handleToggleBlock = async (admin) => {
    const isCurrentlyActive = (admin.status || "").toLowerCase() === "active";
    const newStatus = isCurrentlyActive ? "inactive" : "active";
    const actionText = isCurrentlyActive ? "Block" : "Activate";

    if (!window.confirm(`Are you sure you want to ${actionText} admin "${admin.fullName}"?`)) return;

    try {
      const res = await axiosInstance.put(`/auth/user/${admin.id}`, { status: newStatus });
      if (res.data.success) {
        setAdmins(admins.map(a => a.id === admin.id ? { ...a, status: newStatus } : a));
        alert(`Admin "${admin.fullName}" has been ${isCurrentlyActive ? "blocked" : "activated"} successfully.`);
      } else {
        alert(res.data.message || `Failed to ${actionText.toLowerCase()} admin.`);
      }
    } catch (err) {
      console.error(`Error toggling admin status:`, err);
      alert(`Failed to ${actionText.toLowerCase()} admin.`);
    }
  };

  // 🔹 SEND RESET PASSWORD LINK
  const handleSendResetPassword = async (admin) => {
    if (!window.confirm(`Send password reset email to "${admin.email}"?`)) return;

    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email: admin.email });
      if (res.data.success) {
        alert(`Reset password email sent successfully to ${admin.email}.`);
      } else {
        alert(res.data.message || "Failed to send reset email.");
      }
    } catch (err) {
      console.error("Reset password link error:", err);
      alert(err.response?.data?.message || "Failed to send reset password email.");
    }
  };

  // 🔹 OPEN EXTEND TRIAL MODAL
  const openExtendTrialModal = (admin) => {
    setSelectedAdminForExtend(admin);
    setExtendDays(7);
    setIsExtendModalOpen(true);
  };

  // 🔹 SUBMIT EXTEND TRIAL
  const handleExtendTrialSubmit = async () => {
    if (!selectedAdminForExtend) return;
    setExtending(true);
    try {
      const currentExp = selectedAdminForExtend.licenseExpiryDate ? new Date(selectedAdminForExtend.licenseExpiryDate) : new Date();
      const baseDate = currentExp > new Date() ? currentExp : new Date();
      const newExpiry = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);
      const newExpiryStr = newExpiry.toISOString().slice(0, 10);

      const res = await axiosInstance.put(`/auth/user/${selectedAdminForExtend.id}`, {
        licenseExpiryDate: newExpiryStr,
        trialEndDate: newExpiryStr,
        trialStatus: 'Active',
        status: 'active'
      });

      if (res.data.success) {
        setAdmins(admins.map(a => a.id === selectedAdminForExtend.id ? {
          ...a,
          licenseExpiryDate: newExpiryStr,
          trialEndDate: newExpiryStr,
          trialStatus: 'Active',
          status: 'active'
        } : a));
        alert(`Trial successfully extended by ${extendDays} days for "${selectedAdminForExtend.fullName}". New expiry: ${newExpiryStr}`);
        setIsExtendModalOpen(false);
        setSelectedAdminForExtend(null);
      } else {
        alert(res.data.message || "Failed to extend trial.");
      }
    } catch (err) {
      console.error("Extend trial error:", err);
      alert("Failed to extend trial. Please try again.");
    } finally {
      setExtending(false);
    }
  };

  // 🔁 FETCH ADMINS
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axiosInstance.get("/auth/admins");
        if (response.data.success && Array.isArray(response.data.admins)) {
          setAdmins(response.data.admins);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        console.error("Failed to fetch admins:", error);
        setAdmins([]);
        alert("Failed to load admin list.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  // 🔁 FETCH PLANS
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get("/plans");
        if (response.data.success && Array.isArray(response.data.plans)) {
          const sortedPlans = [...response.data.plans].sort(
            (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)
          );
          setPlans(sortedPlans);
        } else {
          setPlans([]);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setPlans([]);
        alert("Failed to load plans.");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // 🔁 FETCH BRANCHES
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axiosInstance.get("/branches");
        if (response.data.success && Array.isArray(response.data.branches)) {
          setBranches(response.data.branches);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([]);
        alert("Failed to load branches.");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // 🔁 LOAD RAZORPAY
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const getBranchNameById = (branchId) => {
    if (!branchId) return "Not Assigned";
    const branch = branches.find((b) => b.id === branchId);
    return branch ? branch.name : "Unknown Branch";
  };

  const handleAddNew = () => {
    setModalType("add");
    setSelectedAdmin(null);
    setIsModalOpen(true);
  };

  const handleView = (admin) => {
    setModalType("view");
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleEdit = (admin) => {
    setModalType("edit");
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  // 🔹 NEW: Fetch members and open modal
  const handleViewMembers = async (admin) => {
    setSelectedAdmin(admin);
    setLoadingMembers(true);
    setIsMemberModalOpen(true);
    try {
      const response = await axiosInstance.get(`/members/admin/${admin.id}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        setSelectedAdminMembers(response.data.data);
      } else {
        setSelectedAdminMembers([]);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      alert("Failed to load members.");
      setSelectedAdminMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // 🔹 EXPORT TO EXCEL
  const exportMembersToExcel = () => {
    if (!selectedAdminMembers.length) return;

    const worksheetData = selectedAdminMembers.map(member => ({
      'Name': member.fullName,
      'Phone': member.phone,
      'Email': member.email,
      'Gender': member.gender,
      'Plan ID': member.planId || '—',
      'Interested In': member.interestedIn || '—',
      'Join Date': member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '—',
      'Status': member.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, `Members_of_${selectedAdmin?.fullName || 'Admin'}.xlsx`);
  };

  // 🔹 EXPORT TO PDF
const exportMembersToPDF = async () => {
  if (!selectedAdminMembers.length) return;

  // Dynamically import autoTable only when needed
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  // ✅ Manually attach autoTable to this doc instance
  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Phone', 'Email', 'Gender', 'Plan ID', 'Interested In', 'Join Date', 'Status']],
    body: selectedAdminMembers.map(member => [
      member.fullName,
      member.phone || '—',
      member.email || '—',
      member.gender || '—',
      member.planId || '—',
      member.interestedIn || '—',
      member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '—',
      member.status || '—',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [110, 178, 204] }, // #6EB2CC
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const title = `Members of ${selectedAdmin?.fullName || 'Admin'}`;
  doc.setFontSize(16);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

  // 🔹 EXPORT ADMINS TO EXCEL
  const exportAdminsToExcel = () => {
    if (!admins.length) return;

    const worksheetData = admins.map(admin => ({
      'Admin Name': admin.fullName,
      'Email': admin.email,
      'Subscription': admin.subscriptionPlan || '—',
      'Expiry Date': admin.licenseExpiryDate ? new Date(admin.licenseExpiryDate).toLocaleDateString() : 'Not Set',
      'Gym Name': admin.gymName || '—',
      'GST Number': admin.gstNumber || '—',
      'Tax Rate': `${admin.tax || '18'}%`,
      'Contact': admin.phone || '—',
      'Status': admin.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gym Owners");
    XLSX.writeFile(workbook, "Gym_Owners_List.xlsx");
  };

  // 🔹 EXPORT ADMINS TO PDF
  const exportAdminsToPDF = async () => {
    if (!admins.length) return;

    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape');

    // Add Title
    doc.setFontSize(16);
    doc.text("Gym Owners (Admin) Management List", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Admin Name', 'Email', 'Subscription', 'Expiry Date', 'Gym Name', 'GST', 'Tax', 'Contact', 'Status']],
      body: admins.map(admin => [
        admin.fullName,
        admin.email,
        admin.subscriptionPlan || '—',
        admin.licenseExpiryDate ? new Date(admin.licenseExpiryDate).toLocaleDateString() : 'Not Set',
        admin.gymName || '—',
        admin.gstNumber || '—',
        `${admin.tax || '18'}%`,
        admin.phone || '—',
        admin.status
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 167, 69] }
    });

    doc.save("Gym_Owners_List.pdf");
  };

  const confirmDelete = async () => {
    if (selectedAdmin) {
      try {
        const response = await axiosInstance.delete(
          `/auth/user/${selectedAdmin.id}`
        );
        if (response.data.success) {
          setAdmins(admins.filter((admin) => admin.id !== selectedAdmin.id));
          alert(`Admin "${selectedAdmin.fullName}" has been deleted successfully.`);
        } else {
          throw new Error("Failed to delete admin");
        }
      } catch (error) {
        console.error("Error deleting admin:", error);
        alert("Failed to delete admin. Please try again.");
      } finally {
        setIsDeleteModalOpen(false);
        setSelectedAdmin(null);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAdmin(null);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setSelectedAdmin(null);
    setSelectedAdminMembers([]);
  };

  useEffect(() => {
    document.body.style.overflow = isModalOpen || isDeleteModalOpen || isMemberModalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isDeleteModalOpen, isMemberModalOpen]);

  const getStatusBadge = (status) => {
    const normalized = (status || "inactive").toLowerCase();
    return (
      <span
        className="badge rounded-pill px-2 py-1 d-inline-block"
        style={{
          backgroundColor: normalized === "active" ? "#D1F4E1" : "#F8D7DA",
          color: normalized === "active" ? "#157347" : "#B02A37",
          fontWeight: "500",
          fontSize: "0.75rem",
        }}
      >
        {normalized === "active" ? "Active" : "Inactive"}
      </span>
    );
  };

  // ✅ Subscription Plan — shows plan name + category badge
  const getSubscriptionBadge = (plan, isTrial, planName, planCategory) => {
    // Determine category label and color
    const cat = (planCategory || plan || "").toLowerCase();
    let bg, color, label;
    if (isTrial || cat.includes("trial") || cat.includes("free") || (plan && plan.toLowerCase().includes("trial"))) {
      bg = "#E2F0D9"; color = "#385723"; label = "Trial";
    } else if (cat.includes("premium") || cat.includes("pro")) {
      bg = "#D1F4E1"; color = "#157347"; label = "Premium";
    } else if (cat.includes("growth")) {
      bg = "#FFF3CD"; color = "#856404"; label = "Growth";
    } else if (cat.includes("basic")) {
      bg = "#E8F4FD"; color = "#0969DA"; label = "Basic";
    } else {
      bg = "#F0F0F0"; color = "#555"; label = planCategory || plan || "Basic";
    }
    const displayName = planName || plan || "—";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }} title={displayName}>
          {displayName}
        </span>
        <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: bg, color, fontWeight: "600", fontSize: "0.68rem", width: "fit-content" }}>
          {label}
        </span>
      </div>
    );
  };

  // ✅ Expiry Date Badge — shows days remaining or expired
  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return <span className="text-muted" style={{ fontSize: "0.78rem" }}>Not Set</span>;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const dateStr = expiry.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    if (diffDays < 0) {
      return (
        <span>
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#F8D7DA", color: "#B02A37", fontSize: "0.73rem" }}>Expired</span>
          <br/><small className="text-muted" style={{ fontSize: "0.7rem" }}>{dateStr}</small>
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span>
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#FFF3CD", color: "#856404", fontSize: "0.73rem" }}>⚠ {diffDays}d left</span>
          <br/><small className="text-muted" style={{ fontSize: "0.7rem" }}>{dateStr}</small>
        </span>
      );
    } else {
      return (
        <span>
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#D1F4E1", color: "#157347", fontSize: "0.73rem" }}>Active</span>
          <br/><small className="text-muted" style={{ fontSize: "0.7rem" }}>{dateStr}</small>
        </span>
      );
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "add": return "Add New Admin";
      case "edit": return "Edit Admin Profile";
      case "view": return "Admin Profile Details";
      default: return "Admin Management";
    }
  };

  const getModalSubtitle = () => {
    switch (modalType) {
      case "add": return "Create and configure a new gym administrator account with subscription access";
      case "edit": return "Modify administrator credentials, gym settings, and subscription plan";
      case "view": return "View comprehensive administrator profile, gym details, and license status";
      default: return "";
    }
  };

  const getModalIcon = () => {
    switch (modalType) {
      case "add": return <FaUserPlus />;
      case "edit": return <FaEdit />;
      case "view": return <FaEye />;
      default: return <FaUser />;
    }
  };

  const handleFormSubmit = async (payload, profileImageFile) => {
    try {
      const formData = new FormData();

      formData.append("fullName", payload.fullName);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("roleId", 2);
      formData.append("branchId", payload.branchId || "");
      formData.append("gymName", payload.gymName);
      formData.append("address", payload.address);
      formData.append("planName", payload.planName);
      formData.append("price", payload.planPrice);
      formData.append("duration", payload.planDuration);
      formData.append("description", payload.planDescription);
      formData.append("status", payload.status.toLowerCase());
      formData.append("gstNumber", payload.gstNumber || "");
      formData.append("gymAddress", payload.gymAddress || "");
      formData.append("tax", payload.tax || "18");
      formData.append("subscriptionPlan", payload.subscriptionPlan || "Basic");
      formData.append("licenseExpiryDate", payload.licenseExpiryDate || "");

      if (modalType === "add") {
        formData.append("password", payload.password);
      }

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const executeRegistration = async (finalFormData) => {
        let response;
        if (modalType === "add") {
          response = await axiosInstance.post("/auth/register", finalFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else if (modalType === "edit" && selectedAdmin) {
          response = await axiosInstance.put(`/auth/user/${selectedAdmin.id}`, finalFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        if (response?.data?.success) {
          if (modalType === "add") {
            setAdmins([response.data.user, ...admins]);
            alert("New admin added successfully!");
          } else {
            const updatedAdmins = admins.map((admin) =>
              admin.id === selectedAdmin.id ? response.data.user : admin
            );
            setAdmins(updatedAdmins);
            alert("Admin updated successfully!");
          }
          closeModal();
        } else {
          throw new Error("Operation failed");
        }
      };

      if (modalType === "add" && payload.paymentMethod === "Razorpay") {
        // Razorpay Flow
        const amount = parseFloat(payload.planPrice) || 0;
        if (amount <= 0) {
          alert("Cannot process Razorpay for a 0 amount plan.");
          return;
        }

        const orderRes = await axiosInstance.post("/purchases/create-razorpay-order", { amount });
        if (!orderRes.data.success) {
          throw new Error(orderRes.data.message || "Failed to initialize payment");
        }

        const { order, key, isMock } = orderRes.data;

        if (isMock) {
          formData.append("paymentMethod", "Razorpay");
          formData.append("razorpay_order_id", order.id);
          formData.append("razorpay_payment_id", "pay_mock_" + Date.now());
          formData.append("razorpay_signature", "mock_signature");
          await executeRegistration(formData);
          return;
        }

        const options = {
          key: key,
          amount: order.amount,
          currency: order.currency,
          name: "Gym SaaS Software",
          description: `Admin Subscription: ${payload.planName}`,
          order_id: order.id,
          handler: async function (response) {
            try {
              formData.append("paymentMethod", "Razorpay");
              formData.append("razorpay_order_id", response.razorpay_order_id);
              formData.append("razorpay_payment_id", response.razorpay_payment_id);
              formData.append("razorpay_signature", response.razorpay_signature);
              await executeRegistration(formData);
            } catch (vErr) {
              console.error("Verification error:", vErr);
              alert("Error verifying payment and creating admin.");
            }
          },
          theme: { color: "#6EB2CC" }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.open();

      } else if (modalType === "add") {
        // Cash Flow
        formData.append("paymentMethod", "Cash");
        formData.append("transactionId", `CASH-${Date.now()}`);
        await executeRegistration(formData);
      } else {
        // Edit mode
        await executeRegistration(formData);
      }
    } catch (error) {
      console.error("Error saving admin:", error);
      const serverMessage = error.response?.data?.message || error.message;
      alert(serverMessage ? `Error: ${serverMessage}` : `Failed to ${modalType === "add" ? "add" : "update"} admin.`);
    }
  };

  return (
    <div className="container-fluid p-2 p-sm-3 p-md-4">
      {/* HEADER */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <h2 className="fw-bold fs-4 fs-md-3">Admin Management</h2>
          <p className="text-muted fs-6">Manage all gym admins and their profile details.</p>
        </div>
        <div className="col-12 col-md-4 text-md-end d-flex justify-content-md-end gap-2 align-items-center flex-wrap">
          <div className="dropdown w-100 w-md-auto">
            <button
              className="btn text-white dropdown-toggle d-flex align-items-center justify-content-center w-100"
              type="button"
              id="exportAdminsDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", border: "none", borderRadius: "10px", fontWeight: 600, padding: "10px 20px", fontSize: "0.9rem", boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)" }}
            >
              <i className="bi bi-download me-2"></i>
              Export
            </button>
            <ul className="dropdown-menu shadow-sm" aria-labelledby="exportAdminsDropdown" style={{ borderRadius: "10px", border: "1px solid rgba(234, 88, 12, 0.2)" }}>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={exportAdminsToExcel}>
                  <span style={{ color: "#ea580c", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={exportAdminsToPDF}>
                  <span style={{ color: "#dc2626", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export to PDF
                </button>
              </li>
            </ul>
          </div>
          <button
            className="btn text-white w-100 w-md-auto"
            style={{
              background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: "600",
              fontSize: "0.9rem",
              border: "none",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)"
            }}
            onClick={handleAddNew}
            disabled={loading}
          >
            + Add New Admin
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-4">Loading admins...</div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", background: "#ffffff" }}>
          <div className="card-body p-0">
            {/* DESKTOP TABLE */}
            <div className="table-responsive d-none d-md-block">
              <table className="table align-middle mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                <colgroup>
                  <col style={{ width: "80px" }} />   {/* PROFILE */}
                  <col style={{ width: "170px" }} />  {/* ADMIN NAME */}
                  <col style={{ width: "130px" }} />  {/* SUBSCRIPTION */}
                  <col style={{ width: "130px" }} />  {/* EXPIRY DATE */}
                  <col style={{ width: "130px" }} />  {/* GYM NAME */}
                  <col style={{ width: "130px" }} />  {/* GST NUMBER */}
                  <col style={{ width: "80px" }} />   {/* TAX */}
                  <col style={{ width: "130px" }} />  {/* CONTACT */}
                  <col style={{ width: "90px" }} />   {/* STATUS */}
                  <col style={{ width: "210px" }} />  {/* ACTIONS */}
                </colgroup>
                <thead style={{ background: "#F8F9FB" }}>
                  <tr>
                    <th className="py-3 px-3 text-center" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>PROFILE</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>ADMIN NAME</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>SUBSCRIPTION</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>EXPIRY DATE</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>GYM NAME</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>GST NUMBER</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>TAX</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>CONTACT</th>
                    <th className="py-3 px-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>STATUS</th>
                    <th className="py-3 px-3 text-center" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-4">
                        No admins found
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr
                        key={admin.id}
                        style={{ transition: "0.3s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1FBFF")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="text-center px-3">
                          <div
                            className="rounded-circle overflow-hidden mx-auto"
                            style={{ width: "40px", height: "40px", border: "1px solid #eee" }}
                          >
                            {admin.profileImage ? (
                              <img
                                src={admin.profileImage.trim()}
                                alt="Profile"
                                className="w-100 h-100 object-fit-cover"
                                onError={(e) => {
                                  e.target.src = '/assets/images/default-avatar.png';
                                }}
                              />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-dark fw-bold">
                                <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                                  {(admin.gymName && admin.gymName !== 'NA' ? admin.gymName : admin.fullName || '?').trim().charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3" style={{ fontSize: "0.855rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.fullName}</strong>
                          <small className="text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{admin.email}</small>
                        </td>
                        <td className="px-3" style={{ fontSize: "0.855rem", minWidth: "130px" }}>{getSubscriptionBadge(admin.subscriptionPlan, admin.isTrial, admin.planDisplayName || admin.planName, admin.planCategory)}</td>
                        <td className="px-3" style={{ fontSize: "0.855rem" }}>{getExpiryBadge(admin.licenseExpiryDate)}</td>
                        <td className="px-3" style={{ fontSize: "0.855rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.gymName || "—"}</td>
                        <td className="px-3" style={{ fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span className="text-muted">{admin.gstNumber || "—"}</span></td>
                        <td className="px-3" style={{ fontSize: "0.855rem" }}><span className="badge bg-info text-dark">{admin.tax || "18"}%</span></td>
                        <td className="px-3" style={{ fontSize: "0.855rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.phone || "—"}</td>
                        <td className="px-3" style={{ fontSize: "0.855rem" }}>{getStatusBadge(admin.status)}</td>
                        <td className="text-center px-3">
                          <div className="d-flex justify-content-center gap-1 flex-wrap">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(admin)} title="View Profile">
                              <FaEye size={12} />
                            </button>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(admin)} title="Edit Admin">
                              <FaEdit size={12} />
                            </button>
                            <button className="btn btn-sm btn-outline-info" onClick={() => handleViewMembers(admin)} title="View Gym Members">
                              <FaUser size={12} />
                            </button>
                            <button className="btn btn-sm btn-outline-warning" onClick={() => openExtendTrialModal(admin)} title="Extend Trial (+Days)">
                              <FaClock size={12} />
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleSendResetPassword(admin)} title="Send Password Reset Email">
                              <FaKey size={12} />
                            </button>
                            <button
                              className={`btn btn-sm ${ (admin.status || '').toLowerCase() === 'active' ? 'btn-outline-danger' : 'btn-outline-success' }`}
                              onClick={() => handleToggleBlock(admin)}
                              title={(admin.status || '').toLowerCase() === 'active' ? 'Block Admin Account' : 'Activate Admin Account'}
                            >
                              {(admin.status || '').toLowerCase() === 'active' ? <FaBan size={12} /> : <FaCheckCircle size={12} />}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(admin)} title="Delete Admin">
                              <FaTrashAlt size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="d-md-none p-3">
              {admins.length === 0 ? (
                <div className="text-center text-muted py-4">No admins found</div>
              ) : (
                admins.map((admin) => (
                  <div key={admin.id} className="card mb-3 shadow-sm" style={{ borderRadius: "12px" }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0 fw-bold">{admin.fullName}</h5>
                        {getStatusBadge(admin.status)}
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block">Gym</small>
                          <span>{admin.gymName || "-"}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Subscription</small>
                          {getSubscriptionBadge(admin.subscriptionPlan, admin.isTrial, admin.planDisplayName || admin.planName, admin.planCategory)}
                        </div>
                        <div className="col-12 mt-1">
                          <small className="text-muted d-block">Expiry</small>
                          {getExpiryBadge(admin.licenseExpiryDate)}
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Address</small>
                        <span>{admin.address || "-"}</span>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block">GST Number</small>
                          <span>{admin.gstNumber || "-"}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Tax Rate</small>
                          <span className="badge bg-info text-dark">{admin.tax || "18"}%</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Phone</small>
                        <span>{admin.phone || "-"}</span>
                      </div>
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(admin)} title="View">
                          <FaEye size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(admin)} title="Edit">
                          <FaEdit size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-info" onClick={() => handleViewMembers(admin)} title="Members">
                          <FaUser size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-warning" onClick={() => openExtendTrialModal(admin)} title="Extend Trial">
                          <FaClock size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleSendResetPassword(admin)} title="Reset Password">
                          <FaKey size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${ (admin.status || '').toLowerCase() === 'active' ? 'btn-outline-danger' : 'btn-outline-success' }`}
                          onClick={() => handleToggleBlock(admin)}
                          title={(admin.status || '').toLowerCase() === 'active' ? 'Block' : 'Activate'}
                        >
                          {(admin.status || '').toLowerCase() === 'active' ? <FaBan size={14} /> : <FaCheckCircle size={14} />}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(admin)} title="Delete">
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EXTEND TRIAL MODAL ── */}
      {isExtendModalOpen && selectedAdminForExtend && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 24px" }}>
                <h5 className="modal-title fw-bold">⏳ Extend Trial Period</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsExtendModalOpen(false)} />
              </div>
              <div className="modal-body p-4">
                <p className="text-muted fs-6 mb-3">
                  Admin: <strong>{selectedAdminForExtend.fullName}</strong><br />
                  Gym: <strong>{selectedAdminForExtend.gymName || "N/A"}</strong>
                </p>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary">Select Extension Days</label>
                  <select
                    className="form-select form-select-lg"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    style={{ borderRadius: "10px", fontSize: "0.95rem" }}
                  >
                    <option value={7}>+ 7 Days (1 Week)</option>
                    <option value={15}>+ 15 Days (Half Month)</option>
                    <option value={30}>+ 30 Days (1 Month)</option>
                    <option value={60}>+ 60 Days (2 Months)</option>
                  </select>
                </div>

                <div className="p-3 bg-light rounded-3 border mb-3 text-center">
                  <small className="text-muted d-block">Calculated New Expiry Date</small>
                  <strong className="fs-5 text-dark">
                    {new Date(
                      (selectedAdminForExtend.licenseExpiryDate && new Date(selectedAdminForExtend.licenseExpiryDate) > new Date()
                        ? new Date(selectedAdminForExtend.licenseExpiryDate)
                        : new Date()
                      ).getTime() + extendDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </strong>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary w-50"
                    style={{ borderRadius: "10px" }}
                    onClick={() => setIsExtendModalOpen(false)}
                    disabled={extending}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-warning text-dark fw-bold w-50"
                    style={{ borderRadius: "10px" }}
                    onClick={handleExtendTrialSubmit}
                    disabled={extending}
                  >
                    {extending ? "Extending..." : "Confirm Extension"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isModalOpen && (
        <ModalWrapper
          title={getModalTitle()}
          subtitle={getModalSubtitle()}
          icon={getModalIcon()}
          maxWidth="880px"
          onClose={closeModal}
        >
          <AdminForm
            mode={modalType}
            admin={selectedAdmin}
            onCancel={closeModal}
            onSubmit={handleFormSubmit}
            plans={plans}
            loadingPlans={loadingPlans}
            branches={branches}
            loadingBranches={loadingBranches}
          />
        </ModalWrapper>
      )}

      {isDeleteModalOpen && (
        <ModalWrapper title="Confirm Deletion" onClose={closeDeleteModal}>
          <div className="text-center py-4">
            <h5>Are you sure?</h5>
            <p className="text-muted">
              This will permanently delete <strong>{selectedAdmin?.fullName}</strong>.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <button className="btn btn-outline-secondary px-4" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="btn btn-danger px-4" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* 🔹 MEMBERS MODAL */}
      {isMemberModalOpen && (
        <ModalWrapper title={`Members of ${selectedAdmin?.fullName || "Admin"}`} onClose={closeMemberModal}>
          <div className="py-2" style={{ maxHeight: "70vh", maxWidth: "900px", overflowX: "hidden" }}>
            {loadingMembers ? (
              <div className="text-center py-4">Loading members...</div>
            ) : selectedAdminMembers.length === 0 ? (
              <div className="text-center text-muted py-4">No members found</div>
            ) : (
              <div className="row g-3">
                {selectedAdminMembers.map((member) => (
                  <div key={member.id} className="col-12">
                    <div className="d-flex align-items-start p-3 border rounded-3 bg-light">
                      <div
                        className="rounded-circle overflow-hidden flex-shrink-0 me-3"
                        style={{ width: "48px", height: "48px", border: "1px solid #ddd" }}
                      >
                        {member.profileImage ? (
                          <img
                            src={member.profileImage.trim()}
                            alt="Member"
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              e.target.src = '/assets/images/default-avatar.png';
                            }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary text-white">
                            <span className="fw-bold" style={{ fontSize: '0.7rem' }}>
                              {member.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="mb-1 fw-bold">{member.fullName}</h6>
                          {getStatusBadge(member.status)}
                        </div>
                        <p className="mb-1 text-muted" style={{ fontSize: '0.875rem' }}>
                          {member.phone} • {member.email}
                        </p>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {member.planId && (
                            <span className="badge bg-light text-dark border">Plan ID: {member.planId}</span>
                          )}
                          <span className="badge bg-light text-dark border">
                            Joined: {new Date(member.joinDate).toLocaleDateString()}
                          </span>
                          <span className="badge bg-light text-dark border">{member.gender}</span>
                          {member.interestedIn && (
                            <span className="badge bg-light text-dark border">{member.interestedIn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 🔽 Export Buttons */}
          <div className="d-flex justify-content-between align-items-center mt-3 px-3">
            <div>
              <button
                className="btn btn-sm btn-success me-2"
                onClick={exportMembersToExcel}
                disabled={loadingMembers || selectedAdminMembers.length === 0}
              >
                Download Excel
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={exportMembersToPDF}
                disabled={loadingMembers || selectedAdminMembers.length === 0}
              >
                Download PDF
              </button>
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={closeMemberModal}
            >
              Close
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

/* ------------------------- MODAL WRAPPER ------------------------- */
const ModalWrapper = ({ title, subtitle, icon, children, onClose, maxWidth = "600px" }) => (
  <div
    className="modal fade show"
    style={{
      display: "block",
      background: "rgba(18, 6, 2, 0.72)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      zIndex: 1050,
    }}
    onClick={onClose}
  >
    <div
      className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
      style={{
        maxWidth: maxWidth,
        width: "95%",
        margin: "1.25rem auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content border-0"
        style={{
          borderRadius: "18px",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 35px rgba(234, 88, 12, 0.15)",
        }}
      >
        {/* MODAL HEADER */}
        <div
          className="modal-header d-flex justify-content-between align-items-center py-3 px-4"
          style={{
            background: "linear-gradient(135deg, #120602 0%, #1c0b05 50%, #271107 100%)",
            borderBottom: "1px solid rgba(234, 88, 12, 0.25)",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            {icon && (
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
                  fontSize: "1.1rem",
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h5 className="modal-title fw-bold text-white m-0" style={{ letterSpacing: "-0.01em", fontSize: "1.15rem" }}>
                {title}
              </h5>
              {subtitle && (
                <small style={{ color: "#d1d5db", fontSize: "0.78rem", fontWeight: 400, display: "block", marginTop: "2px" }}>
                  {subtitle}
                </small>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
            aria-label="Close"
            style={{ cursor: "pointer", filter: "invert(1) grayscale(100%) brightness(200%)" }}
          ></button>
        </div>

        {/* MODAL BODY */}
        <div
          className="modal-body p-0"
          style={{
            maxHeight: "calc(86vh - 75px)",
            overflowY: "auto",
            backgroundColor: "#faf6f0",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  </div>
);

/* --------------------------- ADMIN FORM -------------------------- */
const AdminForm = ({ mode, admin, onCancel, onSubmit, plans, loadingPlans, branches, loadingBranches }) => {
  const isView = mode === "view";
  const isAdd = mode === "add";
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: admin?.fullName || "",
    gymName: admin?.gymName || "",
    address: admin?.address || admin?.address_city || "",
    phone: admin?.phone || "",
    email: admin?.email || "",
    password: "",
    status: admin?.status || "active",
    selectedPlanId: "",
    planName: admin?.planName || "",
    planPrice: admin?.price || "",
    planDuration: admin?.duration || "",
    planDescription: admin?.description || "",
    branchId: admin?.branchId || "",
    gstNumber: admin?.gstNumber || "",
    gymAddress: admin?.gymAddress || admin?.address_city || "",
    tax: admin?.tax || "18",
    subscriptionPlan: admin?.subscriptionPlan || "Basic",
    licenseExpiryDate: admin?.licenseExpiryDate
      ? new Date(admin.licenseExpiryDate).toISOString().split("T")[0]
      : "",
    paymentMethod: "Cash",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(admin?.profileImage || null);

  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  useEffect(() => {
    if (admin && plans.length > 0 && admin.planName) {
      let matchedPlan = plans.find(
        (p) => p.name.toLowerCase() === admin.planName.toLowerCase() && p.price.toString() === (admin.price || "").toString()
      );
      if (!matchedPlan) {
        matchedPlan = plans.find((p) => p.name.toLowerCase() === admin.planName.toLowerCase());
      }
      if (matchedPlan) {
        setFormData((prev) => ({ 
          ...prev, 
          selectedPlanId: matchedPlan.id,
          planName: matchedPlan.name,
          planPrice: matchedPlan.price.toString(),
          planDuration: matchedPlan.duration,
          planDescription: matchedPlan.description || prev.planDescription
        }));
      }
    }
    if (admin?.profileImage) {
      setProfilePreview(admin.profileImage);
    } else {
      setProfilePreview(null);
    }
  }, [admin, plans]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (planId) => {
    const selectedPlan = plans.find((p) => p.id == planId);
    if (selectedPlan) {
      // 1. Auto-determine the Subscription Tier (Basic, Growth, Premium)
      let subPlan = "Basic";
      const lowPlan = selectedPlan.name.toLowerCase();
      if (lowPlan.includes("trial") || lowPlan.includes("free") || selectedPlan.price == 0) subPlan = "7-Day Trial";
      else if (lowPlan.includes("premium") || lowPlan.includes("pro")) subPlan = "Premium";
      else if (lowPlan.includes("growth")) subPlan = "Growth";

      // 2. Auto-calculate the Expiry Date based on duration string
      const durationStr = selectedPlan.duration ? selectedPlan.duration.toLowerCase() : "";
      const startDate = new Date();
      let expiryDate = new Date(startDate);
      
      if (durationStr.includes("year")) {
         const match = durationStr.match(/(\d+)/);
         const years = match ? parseInt(match[1], 10) : 1;
         expiryDate.setFullYear(expiryDate.getFullYear() + years);
      } else if (durationStr.includes("month")) {
         const match = durationStr.match(/(\d+)/);
         const months = match ? parseInt(match[1], 10) : 1;
         expiryDate.setMonth(expiryDate.getMonth() + months);
      } else if (durationStr.includes("day")) {
         const match = durationStr.match(/(\d+)/);
         const days = match ? parseInt(match[1], 10) : 7;
         expiryDate.setDate(expiryDate.getDate() + days);
      } else {
         // Default fallback to 1 month
         expiryDate.setMonth(expiryDate.getMonth() + 1);
      }

      setFormData((prev) => ({
        ...prev,
        selectedPlanId: planId,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price.toString(),
        planDuration: selectedPlan.duration,
        planDescription: selectedPlan.description || `Plan for ${selectedPlan.duration} @ ₹${selectedPlan.price}`,
        subscriptionPlan: subPlan,
        licenseExpiryDate: expiryDate.toISOString().split("T")[0]
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedPlanId: "",
        planName: "",
        planPrice: "",
        planDuration: "",
        planDescription: "",
        subscriptionPlan: "Basic",
        licenseExpiryDate: ""
      }));
    }
  };

  const handleStatusToggle = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "active" ? "inactive" : "active",
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, WEBP).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage) => {
    if (!croppedImage || !croppedImage.blob) {
      console.error("Crop failed: no blob");
      return;
    }
    const file = new File([croppedImage.blob], "profile.jpg", { type: "image/jpeg" });
    setProfileImageFile(file);
    setProfilePreview(croppedImage.url);
    setShowCropper(false);
    setTempImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSkipCrop = () => {
    if (tempImageSrc) {
      try {
        const arr = tempImageSrc.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: mime });
        const file = new File([blob], "profile.jpg", { type: mime });
        setProfileImageFile(file);
        setProfilePreview(tempImageSrc);
      } catch (err) {
        console.error("Skip crop error:", err);
      }
    }
    setShowCropper(false);
    setTempImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return onCancel();
    setIsSubmitting(true);
    try {
      await onSubmit(formData, profileImageFile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ margin: 0 }}>
        <div className="p-3 p-md-4">

          {/* ─── 1. PROFILE PICTURE HERO CARD ─── */}
          <div
            className="card border-0 mb-4"
            style={{
              background: "#ffffff",
              border: "1px solid #ebd9c8",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(234, 88, 12, 0.04)",
              padding: "18px 24px",
            }}
          >
            <div className="d-flex flex-column flex-sm-row align-items-center gap-4">
              <div
                className="position-relative rounded-circle overflow-hidden flex-shrink-0"
                style={{
                  width: "92px",
                  height: "92px",
                  border: "3px solid #ea580c",
                  boxShadow: "0 4px 15px rgba(234, 88, 12, 0.25)",
                  background: "#fff7ed",
                  cursor: !isView ? "pointer" : "default",
                }}
                onClick={() => !isView && fileInputRef.current?.click()}
                title={!isView ? "Click to upload profile photo" : ""}
              >
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                    <FaCamera size={26} style={{ color: "#ea580c" }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, marginTop: "4px", color: "#9a3412" }}>
                      Photo
                    </span>
                  </div>
                )}
                {!isView && (
                  <div
                    className="position-absolute bottom-0 start-0 end-0 text-center text-white py-1"
                    style={{
                      background: "rgba(18, 6, 2, 0.65)",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}
                  >
                    Edit
                  </div>
                )}
              </div>

              <div className="text-center text-sm-start flex-grow-1">
                <h6 className="fw-bold mb-1" style={{ color: "#1e293b", fontSize: "1rem" }}>
                  Administrator Profile Picture
                </h6>
                <p className="text-muted mb-2" style={{ fontSize: "0.82rem" }}>
                  Upload a clear professional headshot or gym avatar. JPG, PNG, WEBP (Max 5MB).
                </p>
                {!isView && (
                  <div className="d-flex gap-2 justify-content-center justify-content-sm-start flex-wrap align-items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: "0.8rem", padding: "6px 14px", borderRadius: "8px" }}
                    >
                      <FaCamera size={12} />
                      {profilePreview ? "Change Photo" : "Upload Photo"}
                    </button>
                    {profilePreview && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                        onClick={handleRemoveImage}
                        style={{ fontSize: "0.8rem", padding: "6px 14px", borderRadius: "8px" }}
                      >
                        <FaTimes size={12} />
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── 2. PERSONAL INFORMATION ─── */}
          <div
            className="card border-0 mb-4"
            style={{
              background: "#ffffff",
              border: "1px solid #ebd9c8",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(234, 88, 12, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-between px-3 py-2 px-md-4 py-md-3"
              style={{
                background: "linear-gradient(90deg, #fff7ed 0%, #fffdf9 100%)",
                borderBottom: "1px solid #f3e5d8",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <FaUser style={{ color: "#ea580c" }} />
                <span className="fw-bold" style={{ color: "#431407", fontSize: "0.95rem" }}>
                  Personal Information
                </span>
              </div>
              <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                Required *
              </span>
            </div>

            <div className="p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    name="fullName"
                    className="form-control"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="e.g. admin@gymdomain.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Personal / Residential Address <span className="text-danger">*</span>
                  </label>
                  <input
                    name="address"
                    className="form-control"
                    placeholder="e.g. Flat 302, Lake View Towers, Delhi"
                    value={formData.address}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. GYM & BUSINESS DETAILS ─── */}
          <div
            className="card border-0 mb-4"
            style={{
              background: "#ffffff",
              border: "1px solid #ebd9c8",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(234, 88, 12, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-between px-3 py-2 px-md-4 py-md-3"
              style={{
                background: "linear-gradient(90deg, #fff7ed 0%, #fffdf9 100%)",
                borderBottom: "1px solid #f3e5d8",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <FaDumbbell style={{ color: "#ea580c" }} />
                <span className="fw-bold" style={{ color: "#431407", fontSize: "0.95rem" }}>
                  Gym & Business Profile
                </span>
              </div>
              <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                Commercial Info
              </span>
            </div>

            <div className="p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Gym / Club Name <span className="text-danger">*</span>
                  </label>
                  <input
                    name="gymName"
                    className="form-control"
                    placeholder="e.g. Titan Power Fitness"
                    value={formData.gymName}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    GST Number (Tax ID)
                  </label>
                  <input
                    name="gstNumber"
                    className="form-control"
                    placeholder="e.g. 29ABCDE1234F1Z5 (Optional)"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    readOnly={isView}
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Tax Rate applied on Memberships <span className="text-danger">*</span>
                  </label>
                  <select
                    name="tax"
                    className="form-select"
                    value={formData.tax}
                    onChange={handleInputChange}
                    disabled={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  >
                    <option value="18">18% (Standard GST)</option>
                    <option value="12">12% (Reduced GST)</option>
                    <option value="5">5% (Minimal)</option>
                    <option value="28">28% (Luxury)</option>
                    <option value="0">0% (Exempt)</option>
                  </select>
                </div>

                {branches && branches.length > 0 && (
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                      Assigned Branch
                    </label>
                    <select
                      name="branchId"
                      className="form-select"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      disabled={isView}
                      style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                    >
                      <option value="">-- Main Branch / Not Assigned --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-12">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Gym Physical Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="gymAddress"
                    className="form-control"
                    rows="2"
                    placeholder="e.g. 2nd Floor, Grand Mall, Near Metro Pillar 142, Andheri East"
                    value={formData.gymAddress}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 4. LOGIN CREDENTIALS (ONLY IN ADD MODE) ─── */}
          {isAdd && (
            <div
              className="card border-0 mb-4"
              style={{
                background: "#ffffff",
                border: "1px solid #ebd9c8",
                borderRadius: "14px",
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.04)",
                overflow: "hidden",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between px-3 py-2 px-md-4 py-md-3"
                style={{
                  background: "linear-gradient(90deg, #fff7ed 0%, #fffdf9 100%)",
                  borderBottom: "1px solid #f3e5d8",
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <FaLock style={{ color: "#ea580c" }} />
                  <span className="fw-bold" style={{ color: "#431407", fontSize: "0.95rem" }}>
                    Login Credentials
                  </span>
                </div>
                <span className="badge rounded-pill bg-warning text-dark border" style={{ fontSize: "0.7rem" }}>
                  Security
                </span>
              </div>

              <div className="p-3 p-md-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                      Initial Admin Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Create strong password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                        style={{ padding: "0 14px", borderLeft: "none" }}
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    <small className="text-muted d-block mt-1" style={{ fontSize: "0.78rem" }}>
                      Admin will use their registered email and this password to sign into the gym management portal.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── 5. SUBSCRIPTION & PLAN SETTINGS ─── */}
          <div
            className="card border-0 mb-4"
            style={{
              background: "#ffffff",
              border: "1px solid #ebd9c8",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(234, 88, 12, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-between px-3 py-2 px-md-4 py-md-3"
              style={{
                background: "linear-gradient(90deg, #fff7ed 0%, #fffdf9 100%)",
                borderBottom: "1px solid #f3e5d8",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <FaFileInvoiceDollar style={{ color: "#ea580c" }} />
                <span className="fw-bold" style={{ color: "#431407", fontSize: "0.95rem" }}>
                  Subscription & License Plan
                </span>
              </div>
              <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                Package Details
              </span>
            </div>

            <div className="p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Select Subscription Plan
                  </label>
                  {loadingPlans ? (
                    <div className="form-control" style={{ fontSize: "0.9rem" }} disabled>
                      Loading subscription plans...
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={formData.selectedPlanId}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      disabled={isView}
                      style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                    >
                      <option value="">-- Choose a Subscription Plan --</option>
                      {[...plans]
                        .filter((p) => {
                          const name = (p.name || "").toLowerCase().trim();
                          return ["7-day free trial", "starter", "growth", "pro", "custom plan"].some((valid) =>
                            name.includes(valid)
                          );
                        })
                        .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
                        .map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name === "Custom Plan"
                              ? "Custom Plan (Tailored Enterprise)"
                              : `${plan.name} — ₹${plan.price} (${plan.duration})`}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Plan Summary Card when selected */}
                {formData.selectedPlanId && (
                  <div className="col-12">
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                        border: "1px solid #fed7aa",
                      }}
                    >
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <FaTag style={{ color: "#ea580c" }} />
                          <strong style={{ color: "#7c2d12", fontSize: "1rem" }}>
                            {formData.planName}
                          </strong>
                        </div>
                        <span
                          className="badge"
                          style={{
                            background: "#ea580c",
                            color: "#fff",
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: "12px",
                          }}
                        >
                          Tier: {formData.subscriptionPlan}
                        </span>
                      </div>

                      <div className="row g-2 mt-1">
                        <div className="col-6 col-md-3">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Price</small>
                          <span className="fw-bold" style={{ color: "#1e293b", fontSize: "0.95rem" }}>
                            ₹{formData.planPrice || "0"}
                          </span>
                        </div>
                        <div className="col-6 col-md-3">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Duration</small>
                          <span className="fw-bold" style={{ color: "#1e293b", fontSize: "0.95rem" }}>
                            {formData.planDuration || "N/A"}
                          </span>
                        </div>
                        <div className="col-12 col-md-6">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Plan Description</small>
                          <span style={{ color: "#475569", fontSize: "0.85rem" }}>
                            {formData.planDescription || "Standard software license package"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    License Expiry Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    className="form-control"
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                    readOnly={isView}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    style={{ fontSize: "0.9rem", padding: "9px 12px" }}
                  />
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.75rem" }}>
                    Auto-calculated from selected plan duration. You can adjust it manually if needed.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 6. PAYMENT & ACCOUNT STATUS ─── */}
          <div
            className="card border-0 mb-3"
            style={{
              background: "#ffffff",
              border: "1px solid #ebd9c8",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(234, 88, 12, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-between px-3 py-2 px-md-4 py-md-3"
              style={{
                background: "linear-gradient(90deg, #fff7ed 0%, #fffdf9 100%)",
                borderBottom: "1px solid #f3e5d8",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <FaCreditCard style={{ color: "#ea580c" }} />
                <span className="fw-bold" style={{ color: "#431407", fontSize: "0.95rem" }}>
                  Payment Method & Status
                </span>
              </div>
              <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                Activation
              </span>
            </div>

            <div className="p-3 p-md-4">
              <div className="row g-3 align-items-center">
                {isAdd && (
                  <div className="col-12 col-md-7">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "#334155" }}>
                      Payment Mode <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-3">
                      <label
                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border"
                        style={{
                          cursor: "pointer",
                          background: formData.paymentMethod === "Cash" ? "#fff7ed" : "#ffffff",
                          borderColor: formData.paymentMethod === "Cash" ? "#ea580c" : "#e2e8f0",
                          borderWidth: "1.5px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="Cash"
                          checked={formData.paymentMethod === "Cash"}
                          onChange={handleInputChange}
                          style={{ accentColor: "#ea580c" }}
                        />
                        <span className="fw-semibold" style={{ fontSize: "0.88rem", color: "#1e293b" }}>
                          💵 Cash / Offline
                        </span>
                      </label>

                      <label
                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border"
                        style={{
                          cursor: "pointer",
                          background: formData.paymentMethod === "Razorpay" ? "#fff7ed" : "#ffffff",
                          borderColor: formData.paymentMethod === "Razorpay" ? "#ea580c" : "#e2e8f0",
                          borderWidth: "1.5px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="Razorpay"
                          checked={formData.paymentMethod === "Razorpay"}
                          onChange={handleInputChange}
                          style={{ accentColor: "#ea580c" }}
                        />
                        <span className="fw-semibold" style={{ fontSize: "0.88rem", color: "#1e293b" }}>
                          ⚡ Razorpay (Online)
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold d-block" style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Account Status
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check form-switch m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="adminStatusSwitch"
                        checked={formData.status === "active"}
                        onChange={handleStatusToggle}
                        disabled={isView}
                        style={{
                          cursor: isView ? "default" : "pointer",
                          width: "2.8em",
                          height: "1.4em",
                          accentColor: "#15803d",
                        }}
                      />
                    </div>
                    <span
                      className="badge rounded-pill px-3 py-1"
                      style={{
                        backgroundColor: formData.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: formData.status === "active" ? "#15803d" : "#b91c1c",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        border: `1px solid ${formData.status === "active" ? "#bbf7d0" : "#fca5a5"}`,
                      }}
                    >
                      {formData.status === "active" ? "✓ Active Account" : "✕ Inactive / Suspended"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ─── STICKY BOTTOM ACTION FOOTER ─── */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-3"
          style={{
            position: "sticky",
            bottom: 0,
            background: "#ffffff",
            borderTop: "1px solid #ebd9c8",
            zIndex: 10,
            boxShadow: "0 -4px 15px rgba(0, 0, 0, 0.05)",
          }}
        >
          <button
            type="button"
            className="btn btn-outline-secondary px-4"
            onClick={onCancel}
            style={{ borderRadius: "10px", fontWeight: 500, fontSize: "0.9rem" }}
          >
            {isView ? "Close" : "Cancel"}
          </button>

          {!isView && (
            <button
              type="submit"
              className="btn text-white px-4 d-flex align-items-center gap-2"
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.92rem",
                boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
                border: "none",
                padding: "10px 24px",
              }}
            >
              <FaCheckCircle size={15} />
              {isSubmitting
                ? "Processing..."
                : mode === "add"
                ? "Create Admin Account"
                : "Save Changes"}
            </button>
          )}
        </div>
      </form>

      {/* Image Cropper Modal */}
      {showCropper && tempImageSrc && (
        <ImageCropper
          image={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          onSkip={handleSkipCrop}
        />
      )}
    </>
  );
};

export default SuperAdminAdmin;