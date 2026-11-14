import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faPlus,
  faSync,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import { FaDownload } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatAppCurrency, formatAppDate } from "../../utils/formatters";
import CustomDatePicker from "../../Components/CustomDatePicker";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";

const AdminExpenses = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [autoSalaryTotal, setAutoSalaryTotal] = useState(0);
  const [manualOperatingTotal, setManualOperatingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM format

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Rent",
    amount: "",
    paymentMode: "Cash",
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    notes: ""
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/expenses/monthly?month=${selectedMonth}`
      );
      if (response.data.success) {
        const expList = response.data.expenses || [];
        setExpenses(expList);

        const summary = response.data.summary || {};
        const autoSal =
          summary.autoSalaryTotal ??
          expList
            .filter((e) => e.source === "AUTO_SALARY")
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const manualOp =
          summary.manualOperatingTotal ??
          expList
            .filter((e) => e.source !== "AUTO_SALARY")
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const totalExp = summary.totalExpenses ?? autoSal + manualOp;

        setTotalExpenses(totalExp);
        setAutoSalaryTotal(autoSal);
        setManualOperatingTotal(manualOp);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        description: formData.notes
          ? `${formData.title} (${formData.notes})`
          : formData.title
      };
      const response = await axiosInstance.post("/expenses/create", payload);
      if (response.data.success) {
        setShowModal(false);
        setFormData({
          title: "",
          category: "Rent",
          amount: "",
          paymentMode: "Cash",
          date: new Date().toISOString().slice(0, 10),
          notes: ""
        });
        fetchExpenses(); // Reload list & updated totals
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(
        error.response?.data?.message || "Failed to create operating expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "Rent":
        return "bg-primary text-white";
      case "Electricity Bill":
      case "Utilities":
        return "bg-warning text-dark";
      case "Equipment Maintenance":
        return "bg-info text-dark";
      case "Marketing & Ads":
        return "bg-danger text-white";
      case "Staff Salary":
        return "bg-dark text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const handleExport = () => {
    const dataToExport = expenses.map((expense) => ({
      Category: expense.category || "Miscellaneous",
      Description: expense.description || expense.title || "",
      Source: expense.source === "AUTO_SALARY" ? "Auto Salary Sync" : "Manual Entry",
      PaymentMode: expense.paymentMode || "Cash",
      Date: expense.date ? formatAppDate(expense.date) : "",
      Amount: expense.amount || 0
    }));
    exportToExcel(dataToExport, "Expenses", `expenses_${selectedMonth}`);
  };

  const handleExportPDF = () => {
    const header = [
      "Category",
      "Description / Title",
      "Source Type",
      "Payment Mode",
      "Date",
      "Amount"
    ];
    const rows = expenses.map((expense) => [
      expense.category || "Miscellaneous",
      expense.description || expense.title || "",
      expense.source === "AUTO_SALARY" ? "Auto Salary Sync" : "Manual Entry",
      expense.paymentMode || "Cash",
      expense.date ? formatAppDate(expense.date) : "",
      formatAppCurrency(expense.amount || 0, "INR")
    ]);
    exportToPDF(
      rows,
      header,
      `Expenses Report — ${selectedMonth}`,
      `expenses_${selectedMonth}`
    );
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center flex-wrap" style={{ fontSize: "1.65rem" }}>
            <FontAwesomeIcon icon={faCoins} className="text-primary me-2" />
            {t("expensesPage.title", "Monthly Expenses & Profit Tracker")}
          </h2>
          <p className="text-muted mb-0 small">
            {t("expensesPage.subtitle", "Automatically tracks staff salaries and allows manual logging of rent, utilities, and operating costs.")}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
          <div style={{ minWidth: "160px" }}>
            <input
              type="month"
              className="form-control shadow-sm"
              style={{ height: "38px" }}
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonth(e.target.value);
                }
              }}
            />
          </div>
          <button
            className="btn btn-outline-secondary shadow-sm px-3 d-inline-flex align-items-center justify-content-center"
            onClick={fetchExpenses}
            title={t("common.refresh", "Refresh")}
            style={{ height: "38px" }}
          >
            <FontAwesomeIcon icon={faSync} />
          </button>
          <div className="dropdown">
            <button
              className="btn btn-success dropdown-toggle shadow-sm fw-bold px-3 d-inline-flex align-items-center gap-1"
              type="button"
              id="exportExpensesDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ height: "38px", whiteSpace: "nowrap" }}
            >
              <FaDownload className="me-1" /> {t("expensesPage.export", "Export")}
            </button>
            <ul className="dropdown-menu shadow-sm border-0" aria-labelledby="exportExpensesDropdown">
              <li>
                <button className="dropdown-item text-success fw-medium" onClick={handleExport}>
                  <strong>CSV</strong> {t("expensesPage.exportCsv", "Export to CSV")}
                </button>
              </li>
              <li>
                <button className="dropdown-item text-danger fw-medium" onClick={handleExportPDF}>
                  <strong>PDF</strong> {t("expensesPage.exportPdf", "Export to PDF")}
                </button>
              </li>
            </ul>
          </div>
          <button
            className="btn btn-primary shadow-sm fw-bold px-3.5 d-inline-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
            style={{
              height: "38px",
              whiteSpace: "nowrap",
              background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)"
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{t("expensesPage.addOperatingExpense", "Add Operating Expense")}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #ef4444" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("expensesPage.thisMonthExpenses", "THIS MONTH EXPENSES")}</span>
            <h2 className="fw-bold text-danger mt-1 mb-1">
              ₹{(totalExpenses || 0).toLocaleString("en-IN")}
            </h2>
            <small className="text-muted">{t("expensesPage.combinedStaffSalaries", "Combined Staff Salaries & Operating Costs")}</small>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #3b82f6" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("expensesPage.autoSyncedStaffSalary", "AUTO-SYNCED STAFF SALARY")}</span>
            <h2 className="fw-bold text-primary mt-1 mb-1">
              ₹{(autoSalaryTotal || 0).toLocaleString("en-IN")}
            </h2>
            <small className="text-muted">{t("expensesPage.processedViaPayroll", "Processed automatically via Staff Payroll")}</small>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #10b981" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("expensesPage.manualOperatingExpense", "MANUAL OPERATING EXPENSE")}</span>
            <h2 className="fw-bold text-success mt-1 mb-1">
              ₹{(manualOperatingTotal || 0).toLocaleString("en-IN")}
            </h2>
            <small className="text-muted">{t("expensesPage.rentElectricityMisc", "Rent, Electricity, Marketing & Misc")}</small>
          </div>
        </div>
      </div>

      {/* Expenses List Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 fw-bold text-dark">
            {t("expensesPage.expenseBreakdown", {
              defaultValue: `Expense Breakdown (${expenses.length} Entries)`,
              count: expenses.length
            })}
          </h5>
          <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
            {t("expensesPage.monthLabel", {
              defaultValue: `Month: ${selectedMonth}`,
              month: selectedMonth
            })}
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">{t("expensesPage.expenseCategory", "Expense Category")}</th>
                  <th className="py-3">{t("expensesPage.descriptionTitle", "Description / Title")}</th>
                  <th className="py-3">{t("expensesPage.sourceType", "Source Type")}</th>
                  <th className="py-3">{t("expensesPage.paymentMode", "Payment Mode")}</th>
                  <th className="py-3">{t("expensesPage.date", "Date")}</th>
                  <th className="py-3 text-end px-4">{t("expensesPage.amount", "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      {t("expensesPage.loadingExpenses", "Loading monthly expenses...")}
                    </td>
                  </tr>
                ) : expenses.length > 0 ? (
                  expenses.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-4 py-3">
                        <span
                          className={`badge rounded-pill px-3 py-2 ${getCategoryBadge(
                            item.category
                          )}`}
                        >
                          {t(`expensesPage.categories.${item.category}`, item.category || "Miscellaneous")}
                        </span>
                      </td>
                      <td className="py-3 fw-semibold text-dark">
                        {item.description || item.title || item.category || t("expensesPage.expenseFallback", "Expense")}
                      </td>
                      <td className="py-3">
                        {item.source === "AUTO_SALARY" ? (
                          <span className="badge bg-dark bg-opacity-10 text-dark border">
                            {t("expensesPage.autoSalarySync", "Automated Salary Sync")}
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success border">
                            {t("expensesPage.manualEntry", "Manual Entry")}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="fw-semibold text-secondary">
                          {t(`expensesPage.paymentModes.${item.paymentMode}`, item.paymentMode || "Cash")}
                        </span>
                      </td>
                      <td className="py-3 text-muted small">
                        {item.date ? formatAppDate(item.date) : "—"}
                      </td>
                      <td className="py-3 text-end px-4 fw-bold text-danger">
                        {formatAppCurrency(item.amount || 0, "INR")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      {t("expensesPage.noExpensesRecorded", {
                        defaultValue: `No expenses recorded for ${selectedMonth}. Click "+ Add Operating Expense" above to log rent, electricity, or marketing costs.`,
                        month: selectedMonth
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Operating Expense Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <FontAwesomeIcon icon={faPlus} className="text-primary me-2" />
                  {t("expensesPage.logManualExpense", "Log Manual Operating Expense")}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {/* Expense Title */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">
                      {t("expensesPage.expenseTitleReason", "Expense Title / Reason *")}
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="form-control rounded-3"
                      placeholder={t("expensesPage.titlePlaceholder", "e.g. Gym Rent July, Treadmill Repair, Facebook Ads")}
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Category & Amount Row */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-secondary small">
                        {t("expensesPage.category", "Category *")}
                      </label>
                      <select
                        name="category"
                        className="form-select rounded-3"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="Rent">{t("expensesPage.categories.Rent", "Rent")}</option>
                        <option value="Electricity Bill">{t("expensesPage.categories.Electricity Bill", "Electricity Bill")}</option>
                        <option value="Utilities">{t("expensesPage.categories.Utilities", "Utilities & Water")}</option>
                        <option value="Equipment Maintenance">
                          {t("expensesPage.categories.Equipment Maintenance", "Equipment Maintenance")}
                        </option>
                        <option value="Marketing & Ads">{t("expensesPage.categories.Marketing & Ads", "Marketing & Ads")}</option>
                        <option value="Other Operating Expense">
                          {t("expensesPage.categories.Other Operating Expense", "Other Operating Expense")}
                        </option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-secondary small">
                        {t("expensesPage.amountLabel", "Amount (₹) *")}
                      </label>
                      <input
                        type="number"
                        name="amount"
                        className="form-control rounded-3"
                        placeholder={t("expensesPage.amountPlaceholder", "e.g. 15000")}
                        min="1"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Mode & Date Row */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-secondary small">
                        {t("expensesPage.paymentMode", "Payment Mode")}
                      </label>
                      <select
                        name="paymentMode"
                        className="form-select rounded-3"
                        value={formData.paymentMode}
                        onChange={handleInputChange}
                      >
                        <option value="Cash">{t("expensesPage.paymentModes.Cash", "Cash")}</option>
                        <option value="UPI / Online">{t("expensesPage.paymentModes.UPI / Online", "UPI / Online")}</option>
                        <option value="Bank Transfer">{t("expensesPage.paymentModes.Bank Transfer", "Bank Transfer")}</option>
                        <option value="Card">{t("expensesPage.paymentModes.Card", "Card")}</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-secondary small">
                        {t("expensesPage.expenseDate", "Expense Date *")}
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="form-control rounded-3"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold text-secondary small">
                      {t("expensesPage.additionalNotes", "Additional Notes (Optional)")}
                    </label>
                    <textarea
                      name="notes"
                      className="form-control rounded-3"
                      rows="2"
                      placeholder={t("expensesPage.notesPlaceholder", "Invoice number, vendor name, or transaction notes...")}
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top bg-light px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light border px-4 rounded-3 fw-semibold"
                    onClick={() => setShowModal(false)}
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 rounded-3 fw-bold d-flex align-items-center gap-2"
                    disabled={submitting}
                    style={{
                      background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                      border: "none"
                    }}
                  >
                    {submitting ? (
                      t("expensesPage.saving", "Saving...")
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheckCircle} /> {t("expensesPage.saveExpense", "Save Expense")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
