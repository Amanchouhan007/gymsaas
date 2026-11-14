import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { FaUserCircle } from "react-icons/fa";
import GetAdminId from "../../Api/GetAdminId";
import axiosInstance from "../../Api/axiosInstance";
import ImageCropper from "../../Components/ImageCropper";
import MemberPlansDisplay from "../../Components/MemberPlansDisplay";

const Account = () => {
  const adminId = GetAdminId();
  
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      return null;
    }
  };
  const userObj = getUserFromStorage();
  const userId = userObj?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [userRole, setUserRole] = useState("");

  // In-App Account Deletion State (Google Play Store Compliance)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  const [personal, setPersonal] = useState({
    member_id: "M23456789",
    first_name: "",
    last_name: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    profile_picture: null,
    profile_preview: null,
  });

  const [membership, setMembership] = useState({
    membership_plan: "",
    plan_start_date: "",
    plan_end_date: "",
    status: "",
    membership_type: "",
    membership_fee: "",
  });
  const [assignedPlans, setAssignedPlans] = useState([]); // ✅ Multiple plans

  const [gymInfo, setGymInfo] = useState({
    gymName: "",
    gstNumber: "",
    gymAddress: "",
    tax: "5",
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const [passwordErrors, setPasswordErrors] = useState({
    newMatch: "",
    minLength: "",
  });

  const getFallbackAvatar = (gender) => {
    return null;
  };

  // ✅ Extract fetch logic into reusable function
  const fetchProfile = async () => {
    if (!adminId) {
      setError("Admin ID not found. Please log in again.");
      setShowErrorAlert(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(`member-self/profile/${userId}`);

      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;

        const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
        setUserRole(profile.role || storedRole || "MEMBER");

        let rawImg = profile.profileImage?.trim();
        let profileImageUrl = (rawImg && !rawImg.includes('randomuser.me') && !rawImg.includes('portraits')) ? rawImg : null;

        setPersonal({
          member_id: `M${profile.userId}`,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          gender: profile.gender || "",
          dob: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : "",
          email: profile.email || "",
          phone: profile.phone || "",
          address_street: profile.address_street || "",
          address_city: profile.address_city || "",
          address_state: profile.address_state || "",
          address_zip: profile.address_zip || "",
          profile_picture: null,
          profile_preview: profileImageUrl,
        });

        setMembership({
          membership_plan: profile.membership_plan || "",
          plan_start_date: profile.plan_start_date || "",
          plan_end_date: profile.plan_end_date || "",
          status: profile.membership_status || "",
          membership_type: profile.membership_type || "Standard",
          membership_fee: profile.membership_fee?.toString() || "",
        });
        setAssignedPlans(profile.assignedPlans || []); // ✅ Set multiple plans

        setGymInfo({
          gymName: profile.gymName || "",
          gstNumber: profile.gstNumber || "",
          gymAddress: profile.gymAddress || "",
          tax: profile.tax?.toString() || "5",
        });

        setError(null);
        setShowErrorAlert(false);
      } else {
        setError("Data not found");
        setShowErrorAlert(true);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile");
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [adminId]);

  const handlePersonalChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_picture" && files?.[0]) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      setPersonal((p) => ({ ...p, [name]: value }));
    }
  };

  const handleCropComplete = (croppedImage) => {
    const file = new File([croppedImage.blob], "profile.jpg", { type: "image/jpeg" });
    setPersonal((p) => ({
      ...p,
      profile_picture: file,
      profile_preview: croppedImage.url,
    }));
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleMembershipChange = (e) => {
    const { name, value } = e.target;
    setMembership((m) => ({ ...m, [name]: value }));
  };

  const handleGymInfoChange = (e) => {
    const { name, value } = e.target;
    setGymInfo((g) => ({ ...g, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword((p) => ({ ...p, [name]: value }));

    if (name === "new") {
      setPasswordErrors((prev) => ({
        ...prev,
        minLength: value.length < 8 ? "Password must be at least 8 characters" : "",
        newMatch: password.confirm && value !== password.confirm ? "Passwords do not match" : "",
      }));
    }

    if (name === "confirm") {
      setPasswordErrors((prev) => ({
        ...prev,
        newMatch: value !== password.new ? "Passwords do not match" : "",
      }));
    }
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setPersonal((prev) => ({
        ...prev,
        profile_picture: null,
        profile_preview: prev.profile_preview,
      }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      setSaving(true);
      try {
        const formData = new FormData();
        formData.append("first_name", personal.first_name);
        formData.append("last_name", personal.last_name);
        formData.append("email", personal.email);
        formData.append("phone", personal.phone);
        formData.append("gender", personal.gender || "");
        formData.append("date_of_birth", personal.dob || "");
        formData.append("address_street", personal.address_street);
        formData.append("address_city", personal.address_city);
        formData.append("address_state", personal.address_state);
        formData.append("address_zip", personal.address_zip);

        if (userRole === "ADMIN") {
          formData.append("gstNumber", gymInfo.gstNumber || "");
          formData.append("gymAddress", gymInfo.gymAddress || "");
          formData.append("tax", gymInfo.tax || "5");
        }

        if (personal.profile_picture) {
          formData.append("profileImage", personal.profile_picture);
        }

        const response = await axiosInstance.put(`member-self/profile/${userId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          alert("Profile updated successfully!");
          await fetchProfile(); // ✅ Auto-refresh profile from server
          setIsEditMode(false);
        } else {
          alert("Failed to update profile. Please try again.");
        }
      } catch (err) {
        console.error("Error updating profile:", err);
        alert("Failed to update profile. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditMode(true);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!password.new || !password.confirm || passwordErrors.minLength || passwordErrors.newMatch) {
      alert("Please fix password errors before saving.");
      return;
    }
    if (password.new !== password.confirm) {
      alert("New passwords do not match!");
      return;
    }
    if (password.current.trim() === "") {
      alert("Current password is required!");
      return;
    }

    try {
      setUpdatingPassword(true);
      const payload = {
        current: password.current,
        new: password.new,
      };

      const response = await axiosInstance.put(`member-self/password/${userId}`, payload);

      if (response.data.success) {
        alert("Password updated successfully!");
        setPassword({ current: "", new: "", confirm: "" });
      } else {
        alert("Failed to update password. Please try again.");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      alert("Failed to update password. Please try again.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const todayISO = format(new Date(), "yyyy-MM-dd");

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="">
      {showErrorAlert && (
        <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
          <strong>Warning!</strong> {error || "Data not found"}.
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowErrorAlert(false)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="fw-bold mb-0">Personal Information</h1>
                <button
                  className={`btn ${isEditMode ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleEditModeToggle}
                >
                  {isEditMode ? 'Cancel' : 'Update Profile'}
                </button>
              </div>

              <div className="text-center mb-4">
                {(personal.profile_preview && !personal.profile_preview.includes('randomuser.me')) ? (
                  <img
                    src={personal.profile_preview}
                    alt="Profile"
                    className="rounded-circle mb-3"
                    style={{ width: "120px", height: "120px", objectFit: "cover", border: "3px solid #ea580c", boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      setPersonal(prev => ({ ...prev, profile_preview: null }));
                    }}
                  />
                ) : (
                  <div 
                    className="rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: "120px", height: "120px", background: "linear-gradient(135deg, #fff3eb 0%, #ffedd5 100%)", border: "2px dashed #ea580c" }}
                  >
                    <FaUserCircle size={80} style={{ color: "#ea580c" }} />
                  </div>
                )}
                {isEditMode && (
                  <div>
                    <label htmlFor="profile_picture" className="btn btn-outline-primary btn-sm mt-1">
                      📷 {personal.profile_preview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <input
                      type="file"
                      id="profile_picture"
                      name="profile_picture"
                      accept="image/*"
                      className="d-none"
                      onChange={handlePersonalChange}
                    />
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Member ID</label>
                    <input className="form-control" value={personal.member_id} readOnly />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      name="first_name"
                      className="form-control"
                      value={personal.first_name}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      name="last_name"
                      className="form-control"
                      value={personal.last_name}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={personal.gender}
                      onChange={handlePersonalChange}
                      disabled={!isEditMode}
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      className="form-control"
                      value={personal.dob}
                      onChange={handlePersonalChange}
                      max={todayISO}
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={personal.email}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={personal.phone}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address (optional)</label>
                    <div className="row g-2">
                      <div className="col-12">
                        <input
                          name="address_street"
                          className="form-control"
                          placeholder="Street address"
                          value={personal.address_street}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <input
                          name="address_city"
                          className="form-control"
                          placeholder="City"
                          value={personal.address_city}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div className="col-6 col-sm-3">
                        <input
                          name="address_state"
                          className="form-control"
                          placeholder="State"
                          value={personal.address_state}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div className="col-6 col-sm-3">
                        <input
                          name="address_zip"
                          className="form-control"
                          placeholder="Zip / Pincode"
                          value={personal.address_zip}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                    </div>
                  </div>

                  {userRole === "ADMIN" && (
                    <>
                      <div className="col-12">
                        <hr className="my-3" />
                        <h6 className="fw-bold text-primary mb-3">Gym Information</h6>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Gym Name</label>
                        <input
                          name="gymName"
                          className="form-control"
                          value={gymInfo.gymName}
                          onChange={handleGymInfoChange}
                          readOnly={!isEditMode}
                          placeholder="Enter gym name"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Gym Address</label>
                        <textarea
                          name="gymAddress"
                          className="form-control"
                          rows="2"
                          value={gymInfo.gymAddress}
                          onChange={handleGymInfoChange}
                          readOnly={!isEditMode}
                          placeholder="Full gym address"
                        ></textarea>
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label">GST Number</label>
                        <input
                          name="gstNumber"
                          className="form-control"
                          value={gymInfo.gstNumber}
                          onChange={handleGymInfoChange}
                          readOnly={!isEditMode}
                          placeholder="e.g. 29ABCDE1234F1Z5"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label">Tax Rate</label>
                        <select
                          name="tax"
                          className="form-select"
                          value={gymInfo.tax}
                          onChange={handleGymInfoChange}
                          disabled={!isEditMode}
                        >
                          <option value="5">5%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                {isEditMode && (
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleEditModeToggle}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {userRole === "MEMBER" && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Membership Information</h5>
                {assignedPlans && assignedPlans.length > 0 ? (
                  <div>
                    <MemberPlansDisplay plans={assignedPlans} compact={false} />
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Membership Plan</label>
                      <input
                        className="form-control"
                        value={membership.membership_plan}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={membership.plan_start_date}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={membership.plan_end_date}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">Status</label>
                      <input
                        className="form-control"
                        value={membership.status || "N/A"}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">Membership Type</label>
                      <input
                        className="form-control"
                        value={membership.membership_type}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-sm-3">
                      <label className="form-label">Membership Fee</label>
                      <input
                        type="text"
                        className="form-control"
                        value={membership.membership_fee ? `₹${membership.membership_fee}` : "Free"}
                        readOnly
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Change Password</h5>
              <p className="text-muted small">
                Enter your current password and set a new one. Password must be at least 8 characters.
              </p>

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label">
                    Current Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="current"
                      className="form-control"
                      value={password.current}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      <i className={`bi bi-eye${showPassword.current ? "-slash" : ""}`}></i>
                    </button>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="new"
                      className={`form-control ${passwordErrors.minLength || passwordErrors.newMatch ? 'is-invalid' : ''}`}
                      value={password.new}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      <i className={`bi bi-eye${showPassword.new ? "-slash" : ""}`}></i>
                    </button>
                    {passwordErrors.minLength && (
                      <div className="invalid-feedback">{passwordErrors.minLength}</div>
                    )}
                    {passwordErrors.newMatch && (
                      <div className="invalid-feedback">{passwordErrors.newMatch}</div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">
                    Confirm New Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirm"
                      className={`form-control ${passwordErrors.newMatch ? 'is-invalid' : ''}`}
                      value={password.confirm}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      <i className={`bi bi-eye${showPassword.confirm ? "-slash" : ""}`}></i>
                    </button>
                    {passwordErrors.newMatch && (
                      <div className="invalid-feedback">{passwordErrors.newMatch}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Danger Zone: Account Deletion (Google Play Compliance) ── */}
        <div className="col-12 mt-4">
          <div className="card shadow-sm border-danger">
            <div className="card-header bg-danger text-white d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Danger Zone — Delete Account
              </h5>
              <span className="badge bg-light text-danger">Permanent Action</span>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                Deleting your account is permanent. All your membership history, attendance logs, fitness assessments, and credentials will be purged permanently from our database. This action cannot be reversed.
              </p>
              <button
                type="button"
                className="btn btn-outline-danger fw-semibold"
                onClick={() => {
                  setDeleteError("");
                  setDeletePassword("");
                  setShowDeleteModal(true);
                }}
              >
                <i className="bi bi-trash3-fill me-2"></i>
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-danger shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>
                  Confirm Permanent Account Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                ></button>
              </div>
              <div className="modal-body">
                <p className="fw-semibold text-danger">
                  Warning: This action will permanently delete your account, your workout & diet records, and all associated personal data!
                </p>

                {/* Google Play Subscription Policy Warning */}
                <div className="alert alert-warning py-2 px-3 small mb-3 border-0 rounded-3">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-exclamation-triangle-fill text-warning mt-1 flex-shrink-0"></i>
                    <div>
                      <strong>Important:</strong> Deleting your account will not automatically cancel your active Google Play subscription. Please manage or cancel recurring subscriptions in your{" "}
                      <a 
                        href="https://play.google.com/store/account/subscriptions" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="fw-bold text-decoration-underline text-dark"
                      >
                        Google Play Subscriptions settings
                      </a>.
                    </div>
                  </div>
                </div>

                <p className="small text-muted mb-3">
                  To confirm, please enter your current account password below:
                </p>
                {deleteError && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                    {deleteError}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label small fw-bold">Enter Password to Confirm</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    disabled={deletingAccount}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-bold"
                  disabled={deletingAccount || !deletePassword}
                  onClick={async () => {
                    if (!deletePassword) {
                      setDeleteError("Password is required to confirm account deletion.");
                      return;
                    }
                    setDeletingAccount(true);
                    setDeleteError("");
                    try {
                      const res = await axiosInstance.delete("/auth/delete-account", {
                        data: { password: deletePassword }
                      });
                      if (res.data?.success) {
                        localStorage.clear();
                        window.location.href = "/login";
                      } else {
                        setDeleteError(res.data?.message || "Failed to delete account.");
                        setDeletingAccount(false);
                      }
                    } catch (err) {
                      setDeleteError(err.response?.data?.message || "Incorrect password or error deleting account.");
                      setDeletingAccount(false);
                    }
                  }}
                >
                  {deletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCropper && tempImageSrc && (
        <ImageCropper
          image={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default Account;