import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaEdit, FaTrashAlt, FaUserPlus, FaTimes, FaPlus } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../../Api/axiosInstance";
import CustomTimePicker from "../../Components/CustomTimePicker";
import BookingDetailsList from "../Admin/Bookings/BookingDetailsList";
import { useSocket } from "../../Context/SocketContext";

const PersonalTrainerClassesSchedule = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedClass, setSelectedClass] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [members, setMembers] = useState([]); // For member dropdown
  const [trainers, setTrainers] = useState([]); // For trainers from API


  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      return null;
    }
  };
  const user = getUserFromStorage();
  const trainerId = user?.id || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || null;
  const staffId = user?.staffId || null;
  const adminId = user?.adminId || null;

  useEffect(() => {
    if (!adminId) {
      setError("Admin ID not found. Please log in.");
      return;
    }
    fetchAllData();
  }, [adminId]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleRefresh = () => {
      console.log("Socket event received, refreshing PT classes...");
      fetchAllData();
    };

    socket.on("bookingCreated", handleRefresh);
    socket.on("classCreated", handleRefresh);
    socket.on("classCancelled", handleRefresh);
    socket.on("trainerAssigned", handleRefresh);
    socket.on("capacityUpdated", handleRefresh);
    socket.on("bookingUpdated", handleRefresh);
    socket.on("bookingCancelled", handleRefresh);

    return () => {
      socket.off("bookingCreated", handleRefresh);
      socket.off("classCreated", handleRefresh);
      socket.off("classCancelled", handleRefresh);
      socket.off("trainerAssigned", handleRefresh);
      socket.off("capacityUpdated", handleRefresh);
      socket.off("bookingUpdated", handleRefresh);
      socket.off("bookingCancelled", handleRefresh);
    };
  }, [socket, adminId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch classes
      const classesRes = await axiosInstance.get(`class/scheduled/all/${adminId}`);
      let allClasses = [];
      if (classesRes.data.success) {
        allClasses = classesRes.data.data || [];
      }

      // FILTER: Match current trainer's ID (user.id or staffId) or trainer name
      const trainerClasses = allClasses.filter((cls) => {
        const tid = parseInt(cls.trainerId);
        const matchesId = tid === parseInt(trainerId) || (staffId && tid === parseInt(staffId));
        const matchesName = name && (cls.trainerName === name || cls.trainer === name);
        return matchesId || matchesName;
      });

      const displayClasses = trainerClasses;

      const getDayFromDate = (dStr, givenDay) => {
        if (givenDay && givenDay.trim() && givenDay !== "Auto") return givenDay;
        if (!dStr) return "—";
        const dateObj = new Date(dStr);
        if (isNaN(dateObj.getTime())) return "—";
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[dateObj.getDay()] || "—";
      };

      // Transform data to match the new API response structure
      const transformedClasses = displayClasses.map(classItem => ({
        id: classItem.id,
        className: classItem.className,
        trainer: classItem.trainer || classItem.trainerName || name || "—",
        date: classItem.date,
        time: classItem.time,
        day: getDayFromDate(classItem.date, classItem.day),
        status: classItem.status,
        membersCount: classItem.membersCount || 0,
        members: classItem.members || []
      }));

      setClasses(transformedClasses);

      // Fetch trainers data
      try {
        const trainersRes = await axiosInstance.get(`class/trainers/personal-general?adminId=${adminId}`);
        if (trainersRes.data.success) {
          setTrainers(trainersRes.data.trainers || []);
        }
      } catch (trainerErr) {
        console.error("Error fetching trainers:", trainerErr);
        // Continue without trainers - we'll use the trainer name directly
      }

      // Fetch members data
      try {
        const membersRes = await axiosInstance.get(`members/admin/${adminId}`);
        if (membersRes.data.success) {
          setMembers(membersRes.data.data || []);
        }
      } catch (memberErr) {
        console.error("Error fetching members:", memberErr);
        // Continue without members
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a member
  const addMember = () => {
    if (!memberSearch.trim()) return;

    // Check if already added
    if (selectedClass?.members?.some((m) => m.name === memberSearch.trim())) {
      alert(`"${memberSearch}" is already in this class.`);
      return;
    }

    const newMember = {
      id: Date.now(), // Temporary ID
      name: memberSearch.trim(),
    };

    setSelectedClass({
      ...selectedClass,
      members: [...(selectedClass.members || []), newMember],
    });
    setMemberSearch("");
  };

  // Function to remove a member
  const removeMember = (memberToRemove) => {
    if (!selectedClass) return;
    setSelectedClass({
      ...selectedClass,
      members: selectedClass.members.filter((m) => m.id !== memberToRemove.id),
    });
  };

  const handleAddClick = () => {
    setSelectedClass({
      className: "",
      trainerId: trainerId,
      trainerName: name || "",
      date: "",
      startTime: "",
      endTime: "",
      capacity: 20,
      status: "Active",
      members: []
    });
    setModalType("add");
    setIsModalOpen(true);
  };

  const handleView = (gymClass) => {
    setModalType("view");
    // Parse the time string to get start and end times
    const timeString = gymClass.time || "";
    let startTime = "";
    let endTime = "";

    if (timeString.includes(" - ")) {
      const [start, end] = timeString.split(" - ");
      startTime = start.trim();
      endTime = end.trim();
    }

    // Since API returns trainer as a string, not an ID, we'll use it directly
    // Find trainer ID from name if trainers data is available
    let trainerId = "";
    let trainerName = gymClass.trainer || "";

    if (gymClass.trainer && trainers.length > 0) {
      const trainer = trainers.find((t) => t.fullName === gymClass.trainer);
      trainerId = trainer ? trainer.id : "";
    }

    setSelectedClass({
      ...gymClass,
      members: gymClass.members || [], 
      trainerId,
      trainerName, // Store the trainer name directly
      startTime,
      endTime,
    });
    setMemberSearch("");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (gymClass) => {
    setSelectedClass(gymClass);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // Assuming delete endpoint exists
      await axiosInstance.delete(`class/scheduled/delete/${selectedClass.id}`);
      setClasses((prev) => prev.filter((c) => c.id !== selectedClass.id));
      alert(`Class "${selectedClass.className}" has been deleted.`);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete class.");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
    setMemberSearch("");
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedClass(null);
  };

  const getDayTranslation = (dayName) => {
    if (!dayName) return "—";
    const key = dayName.toLowerCase();
    const dayMap = {
      sunday: t("days.sunday", "Sunday"),
      monday: t("days.monday", "Monday"),
      tuesday: t("days.tuesday", "Tuesday"),
      wednesday: t("days.wednesday", "Wednesday"),
      thursday: t("days.thursday", "Thursday"),
      friday: t("days.friday", "Friday"),
      saturday: t("days.saturday", "Saturday")
    };
    return dayMap[key] || dayName;
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      Active: "bg-success-subtle text-success-emphasis",
      Inactive: "bg-danger-subtle text-danger-emphasis",
    };
    const translatedStatus = status === "Active" ? t("status.active", "Active") : status === "Inactive" ? t("status.inactive", "Inactive") : status;
    return (
      <span
        className={`badge rounded-pill ${badgeClasses[status] || "bg-secondary"
          } px-3 py-1`}
      >
        {translatedStatus}
      </span>
    );
  };

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || "—";
  };

  const getTrainerName = (trainerId) => {
    // If we have a trainer name directly, use it
    if (selectedClass?.trainerName) {
      return selectedClass.trainerName;
    }

    // Otherwise try to find by ID
    const trainer = trainers.find((t) => t.id === trainerId);
    return trainer?.fullName || "—";
  };

  const saveClass = async () => {
    const {
      className,
      trainerId,
      trainerName, // Get trainer name directly
      // branchId, // Commented out branch field
      date,
      day,
      startTime,
      endTime,
      capacity,
      status,
    } = selectedClass;

    if (!className || !trainerName || !date || !startTime || !endTime) {
      alert(t("classes.fillRequiredAlert", "Please fill all required fields."));
      return;
    }

    setLoading(true);
    try {
      let finalTrainerId = trainerId;
      const foundTrainer = trainers.find(t => t.fullName === trainerName);
      if (foundTrainer) {
        finalTrainerId = foundTrainer.id;
      } else if (!finalTrainerId) {
        finalTrainerId = user?.id || parseInt(localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : 0);
      }

      const payload = {
        adminId: parseInt(adminId),
        trainerId: parseInt(finalTrainerId),
        className,
        trainer: trainerName,
        date,
        day,
        startTime,
        endTime,
        capacity: Number(capacity),
        status,
        members: selectedClass.members || []
      };

      if (modalType === "add") {
        const res = await axiosInstance.post(`class/schedule/create`, payload);
        if (res.data.success) {
          await fetchAllData();
          alert(t("classes.classAddedAlert", "New class added successfully!"));
        } else {
          throw new Error(res.data.message || "Failed to create class");
        }
      } else if (modalType === "edit") {
        const res = await axiosInstance.put(
          `class/scheduled/update/${selectedClass.id}`,
          payload
        );
        if (res.data.success) {
          await fetchAllData();
          alert(t("classes.classUpdatedAlert", "Class updated successfully!"));
        } else {
          throw new Error(res.data.message || "Failed to update class");
        }
      }
      closeModal();
    } catch (err) {
      console.error("Save error:", err);
      alert(
        err.response?.data?.message || t("classes.opFailedAlert", "Operation failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const MobileClassCard = ({ gymClass }) => (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">{gymClass.className}</h5>
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              title={t("common.view", "View")}
              onClick={() => handleView(gymClass)}
            >
              <FaEye size={14} />
            </button>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col-6">
            <p className="mb-1">
              <strong>{t("classes.trainer", "Trainer")}:</strong> {gymClass.trainer}
            </p>
            <p className="mb-1">
              <strong>{t("classes.members", "Members")}:</strong> <span className="badge bg-info">{gymClass.membersCount || 0}</span>
            </p>
          </div>
          <div className="col-6">
            <p className="mb-1">
              <strong>{t("classes.date", "Date")}:</strong>{" "}
              {gymClass.date ? gymClass.date.split("T")[0] : ""}
            </p>
            <p className="mb-1">
              <strong>{t("classes.time", "Time")}:</strong> {gymClass.time}
            </p>
            {gymClass.day && (
              <p className="mb-1">
                <strong>{t("classes.day", "Day")}:</strong> {getDayTranslation(gymClass.day)}
              </p>
            )}
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="me-2">
              <strong>{t("classes.day", "Day")}:</strong> {getDayTranslation(gymClass.day)}
            </span>
            <span>
              <strong>{t("classes.status", "Status")}:</strong> {getStatusBadge(gymClass.status)}
            </span>
          </div>
          <div>
            {gymClass.membersCount !== undefined &&
              gymClass.membersCount > 0 ? (
              <span className="badge bg-light text-dark">
                {gymClass.membersCount}{" "}
                {gymClass.membersCount === 1 ? t("classes.member", "Member") : t("classes.members", "Members")}
              </span>
            ) : (
              <span className="text-muted">{t("classes.noMembers", "No members")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const formatTime = (timeStr) => (timeStr ? timeStr.slice(0, 5) : "");

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold" style={{ color: '#ea580c' }}>{t("classes.ptScheduleTitle", "Personal Trainer Classes Schedule")}</h2>
          <p className="text-muted mb-0">
            {t("classes.ptScheduleSubtitle", "View and manage personal trainer classes (excluding general trainer classes).")}
          </p>
          {!loading && (
            <div className="mt-2">
              <span className="badge bg-info text-white me-2">
                {classes.length} {t("classes.ptClassesCount", "Personal Trainer Classes")}
              </span>
              <span className="badge bg-light text-dark">
                {t("classes.totalMembersEnrolled", "Total Members Enrolled:")} {classes.reduce((sum, cls) => sum + (cls.membersCount || 0), 0)}
              </span>
            </div>
          )}
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button className="btn text-white shadow-sm fw-semibold" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '8px' }} onClick={handleAddClick}>
            <FaPlus className="me-2" /> {t("classes.scheduleClass", "Schedule Class")}
          </button>
        </div>
      </div>

      {loading && classes.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t("common.loading", "Loading...")}</span>
          </div>
          <p className="mt-3">{t("classes.loadingClasses", "Loading classes...")}</p>
        </div>
      ) : (
        <>
          <div className="d-none d-md-block">
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>{t("table.className", "CLASS NAME")}</th>
                      <th>{t("table.trainer", "TRAINER")}</th>
                      <th>{t("table.date", "DATE")}</th>
                      <th>{t("table.time", "TIME")}</th>
                      <th>{t("table.day", "DAY")}</th>
                      <th>{t("table.members", "MEMBERS")}</th>
                      <th>{t("table.status", "STATUS")}</th>
                      <th className="text-center">{t("table.actions", "ACTIONS")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="fw-semibold">{c.className}</div>
                        </td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary-emphasis px-3 py-1">
                            {c.trainer}
                          </span>
                        </td>
                        <td>{c.date ? c.date.split("T")[0] : ""}</td>
                        <td>
                          <span className="badge bg-light text-dark">{c.time}</span>
                        </td>
                        <td>
                          {c.day && <span className="badge bg-secondary-subtle text-secondary-emphasis">{getDayTranslation(c.day)}</span>}
                        </td>
                        <td>
                          <span className="badge bg-info text-white">
                            {c.membersCount || 0} {t("classes.members", "members")}
                          </span>
                        </td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              title={t("common.view", "View")}
                              onClick={() => handleView(c)}
                            >
                              <FaEye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {classes.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    {t("classes.noClassesScheduled", "No classes scheduled.")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="d-md-none">
            {classes.length > 0 ? (
              classes.map((c) => <MobileClassCard key={c.id} gymClass={c} />)
            ) : (
              <div className="text-center py-4 text-muted">
                {t("classes.noClassesScheduled", "No classes scheduled.")}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && selectedClass && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div
                className="modal-header border-0 pb-0"
                style={{ backgroundColor: "#6EB2CC", color: "white" }}
              >
                <h5 className="modal-title fw-bold">
                  {modalType === "add"
                    ? t("classes.addNewClass", "Add New Class")
                    : modalType === "view"
                      ? t("classes.classDetails", "Class Details")
                      : t("classes.editClass", "Edit Class")}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                {modalType === "view" ? (
                  // View mode - display all information
                  <div>
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.className", "Class Name")}</label>
                        <input
                          className="form-control rounded-3"
                          value={selectedClass.className || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.trainer", "Trainer")}</label>
                        <input
                          className="form-control rounded-3"
                          value={selectedClass.trainer || ""}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.date", "Date")}</label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          value={
                            selectedClass.date
                              ? selectedClass.date.split("T")[0]
                              : ""
                          }
                          readOnly
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.time", "Time")}</label>
                        <input
                          className="form-control rounded-3"
                          value={selectedClass.time || ""}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.day", "Day")}</label>
                        <input
                          className="form-control rounded-3"
                          value={getDayTranslation(selectedClass.day) || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.status", "Status")}</label>
                        <div className="mt-2">
                          {getStatusBadge(selectedClass.status)}
                        </div>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.capacity", "Capacity")}</label>
                        <input
                          type="number"
                          className="form-control rounded-3"
                          value={selectedClass.capacity || 20}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.membersCount", "Members Count")}</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          value={
                            selectedClass.membersCount !== undefined
                              ? selectedClass.membersCount
                              : 0
                          }
                          readOnly
                        />
                      </div>
                    </div>
                    {/* View members list */}
                    {(selectedClass.members || []).length > 0 && (
                      <div className="mt-3">
                        <label className="form-label fw-semibold text-muted small uppercase">{t("classes.enrolledMembersList", "Enrolled Members List")}</label>
                        <div className="border rounded-3 p-3 bg-light d-flex flex-wrap gap-2">
                          {selectedClass.members.map((member) => (
                            <span
                              key={member.id}
                              className="badge bg-white text-dark border px-3 py-2 fw-medium shadow-sm"
                            >
                              {member.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Add/Edit mode
                  <div>
                    {trainers.length === 0 && (
                      <div className="alert alert-warning">
                        {t("classes.noTrainersWarning", "No trainers found. Please add trainers first before creating classes.")}
                      </div>
                    )}
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          {t("classes.className", "Class Name")} <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control rounded-3"
                          value={selectedClass.className || ""}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              className: e.target.value,
                            })
                          }
                          placeholder={t("classes.enterClassName", "Enter class name")}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          {t("classes.trainer", "Trainer")} <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select rounded-3"
                          value={selectedClass.trainerName || ""}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              trainerName: e.target.value,
                            })
                          }
                          disabled={trainers.length === 0}
                        >
                          <option value="">{t("classes.selectTrainer", "Select trainer")}</option>
                          <option value="Personal">{t("classes.personal", "Personal")}</option>
                          <option value="General">{t("classes.general", "General")}</option>
                          {trainers.map((t) => (
                            <option key={t.id} value={t.fullName}>
                              {t.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          {t("classes.date", "Date")} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          value={
                            selectedClass.date
                              ? selectedClass.date.split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            let calcDay = selectedClass.day;
                            if (dateVal) {
                              const dObj = new Date(dateVal);
                              if (!isNaN(dObj.getTime())) {
                                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                calcDay = days[dObj.getDay()];
                              }
                            }
                            setSelectedClass({
                              ...selectedClass,
                              date: dateVal,
                              day: calcDay,
                            });
                          }}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          {t("classes.startTime", "Start Time")} <span className="text-danger">*</span>
                        </label>
                        <CustomTimePicker
                          className="form-control rounded-3"
                          name="startTime"
                          value={formatTime(selectedClass.startTime)}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          {t("classes.endTime", "End Time")} <span className="text-danger">*</span>
                        </label>
                        <CustomTimePicker
                          className="form-control rounded-3"
                          name="endTime"
                          value={formatTime(selectedClass.endTime)}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.day", "Day")}</label>
                        <select
                          className="form-select rounded-3"
                          value={selectedClass.day || ""}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              day: e.target.value,
                            })
                          }
                        >
                          <option value="">{t("classes.auto", "Auto")}</option>
                          <option value="Monday">{t("days.monday", "Monday")}</option>
                          <option value="Tuesday">{t("days.tuesday", "Tuesday")}</option>
                          <option value="Wednesday">{t("days.wednesday", "Wednesday")}</option>
                          <option value="Thursday">{t("days.thursday", "Thursday")}</option>
                          <option value="Friday">{t("days.friday", "Friday")}</option>
                          <option value="Saturday">{t("days.saturday", "Saturday")}</option>
                          <option value="Sunday">{t("days.sunday", "Sunday")}</option>
                        </select>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.capacity", "Capacity")}</label>
                        <input
                          type="number"
                          className="form-control rounded-3"
                          value={selectedClass.capacity || 20}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              capacity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">{t("classes.status", "Status")}</label>
                        <select
                          className="form-select rounded-3"
                          value={selectedClass.status || "Active"}
                          onChange={(e) =>
                            setSelectedClass({
                              ...selectedClass,
                              status: e.target.value,
                            })
                          }
                        >
                          <option value="Active">{t("status.active", "Active")}</option>
                          <option value="Inactive">{t("status.inactive", "Inactive")}</option>
                        </select>
                      </div>
                    </div>

                    {/* Members section */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        {t("classes.members", "Members")}
                        <span className="text-muted ms-2">
                          {t("classes.addMembersFromPlan", "Add members from plan list")}
                        </span>
                      </label>
                      <div className="border rounded-3 p-3 bg-light">
                        <div className="d-flex flex-column flex-sm-row mb-3 gap-2">
                          <select
                            className="form-select rounded-3"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                          >
                            <option value="">{t("classes.selectMember", "Select a member")}</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.fullName || m.name}>
                                {m.fullName || m.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-primary rounded-3"
                            onClick={addMember}
                            disabled={!memberSearch}
                          >
                            {t("common.add", "Add")}
                          </button>
                        </div>

                        {/* Added members list */}
                        {(selectedClass?.members || []).length > 0 && (
                          <div>
                            <small className="text-muted d-block mb-2">
                              {selectedClass.members.length} {selectedClass.members.length > 1 ? t("classes.membersInClassPlural", "members in this class:") : t("classes.membersInClassSingular", "member in this class:")}
                            </small>
                            <div className="d-flex flex-wrap gap-2">
                              {(selectedClass?.members || []).map((member) => (
                                <span
                                  key={member.id}
                                  className="badge bg-light text-dark px-3 py-1 d-flex align-items-center"
                                >
                                  {member.name}
                                  <FaTimes
                                    className="ms-2"
                                    style={{
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                    onClick={() => removeMember(member)}
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                      <button
                        className="btn btn-outline-secondary me-2 px-4"
                        onClick={closeModal}
                      >
                        {t("common.cancel", "Cancel")}
                      </button>
                      <button
                        className="btn px-4 text-white"
                        style={{ background: "#ea580c", border: "none" }}
                        onClick={saveClass}
                        disabled={loading}
                      >
                        {loading
                          ? t("common.saving", "Saving...")
                          : modalType === "add"
                            ? t("classes.addClass", "Add Class")
                            : t("classes.updateClass", "Update Class")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedClass && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeDeleteModal}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div
                className="modal-header border-0 pb-0"
                style={{ backgroundColor: "#ea580c", color: "white" }}
              >
                <h5 className="modal-title fw-bold">{t("classes.confirmDeletion", "Confirm Deletion")}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeDeleteModal}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="display-6 text-danger mb-3">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h5>{t("common.areYouSure", "Are you sure?")}</h5>
                <p className="text-muted">
                  {t("classes.permanentDeleteWarning", "This will permanently delete")}{" "}
                  <strong>{selectedClass.className}</strong>.<br />
                  {t("classes.undoneWarning", "This action cannot be undone.")}
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button
                  className="btn btn-outline-secondary px-4"
                  onClick={closeDeleteModal}
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  className="btn btn-danger px-4"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? t("common.deleting", "Deleting...") : t("common.delete", "Delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Booking Details Section */}
      <div className="mt-5">
        <hr className="my-4" />
        <BookingDetailsList type="classes" />
      </div>
    </div>
  );
};

export default PersonalTrainerClassesSchedule;