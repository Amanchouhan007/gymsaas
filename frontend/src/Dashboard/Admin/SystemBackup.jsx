import React from "react";
import BackupRestoreSettings from "./Settings/BackupRestoreSettings";

const SystemBackup = () => {
  return (
    <div className="container-fluid py-3 py-md-4" style={{ backgroundColor: "#f4f7f6", minHeight: "100dvh" }}>
      <BackupRestoreSettings />
    </div>
  );
};

export default SystemBackup;
