import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBookOpen,
  FaSearch,
  FaRocket,
  FaUsers,
  FaUserTie,
  FaCreditCard,
  FaBoxes,
  FaDatabase,
  FaChartLine,
  FaQrcode,
  FaCoins,
  FaCheckCircle,
  FaChevronRight,
  FaQuestionCircle,
  FaLightbulb,
  FaArrowRight,
  FaShieldAlt,
  FaClock,
  FaFileInvoice,
  FaDumbbell
} from "react-icons/fa";

export default function HowToUse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    try {
      const p = (location?.pathname || window.location.pathname || "").toLowerCase();
      if (p.includes("superadmin")) {
        setActiveCategory("superadmin");
        return;
      }
      if (p.includes("receptionist")) {
        setActiveCategory("receptionist");
        return;
      }
      if (p.includes("personaltrainer")) {
        setActiveCategory("personaltrainer");
        return;
      }
      if (p.includes("generaltrainer")) {
        setActiveCategory("generaltrainer");
        return;
      }
      if (p.includes("sales")) {
        setActiveCategory("sales");
        return;
      }
      if (p.includes("manager")) {
        setActiveCategory("manager");
        return;
      }
      if (p.includes("housekeeping")) {
        setActiveCategory("housekeeping");
        return;
      }
      if (p.includes("member")) {
        setActiveCategory("member");
        return;
      }
      if (p.includes("admin")) {
        setActiveCategory("all");
        return;
      }

      // Fallback to localStorage user role
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const r = (u?.role || u?.roleName || u?.role_name || u?.roleId || "").toString().toLowerCase();
        if (r.includes("superadmin") || r.includes("super admin") || r.includes("subadmin") || r === "1") {
          setActiveCategory("superadmin");
        } else if (r.includes("personaltrainer") || r.includes("personal trainer") || r === "pt") {
          setActiveCategory("personaltrainer");
        } else if (r.includes("generaltrainer") || r.includes("general trainer") || r === "gt") {
          setActiveCategory("generaltrainer");
        } else if (r.includes("sales")) {
          setActiveCategory("sales");
        } else if (r.includes("receptionist") || r.includes("reception")) {
          setActiveCategory("receptionist");
        } else if (r.includes("manager")) {
          setActiveCategory("manager");
        } else if (r.includes("housekeeping")) {
          setActiveCategory("housekeeping");
        } else if (r.includes("member")) {
          setActiveCategory("member");
        } else if (r.includes("admin")) {
          setActiveCategory("all");
        }
      }
    } catch (e) {}
  }, [location]);

  const guideModules = [
    {
      id: "superadmin-workflow",
      category: "superadmin",
      icon: <FaShieldAlt className="text-danger" size={24} />,
      title: t("howToUse.superAdminTitle", "Super Admin Operations Guide (How Super Admin Works)"),
      badge: "SaaS Control Center",
      badgeBg: "bg-danger text-white",
      description: t("howToUse.superAdminDesc", "Complete platform management guide for Super Administrators overseeing SaaS Gym owners, revenue, sub-admins, and Help Desk support."),
      steps: [
        {
          title: t("howToUse.saStep1", "1. SaaS Platform Overview & Revenue Analytics"),
          desc: t("howToUse.saStep1Desc", "Open SuperAdmin Dashboard to monitor Total SaaS Revenue, Monthly Revenue, Active Paid Gym Owners, 7-Day Free Trial Gyms, and Upcoming SaaS Renewals.")
        },
        {
          title: t("howToUse.saStep2", "2. Gym Tenant Management & SaaS Subscription Plans"),
          desc: t("howToUse.saStep2Desc", "Navigate to SaaS Payments & Tenant Management. View registered gym owners, approve 7-day free trials, update subscription tiers (Starter ₹700, Standard ₹900, Pro ₹1200), or extend trial validity.")
        },
        {
          title: t("howToUse.saStep3", "3. Sub-Admin & Staff Access Delegation"),
          desc: t("howToUse.saStep3Desc", "Go to Manage Sub Admins to create specialized platform sub-administrators with granular permissions for support, billing, or tenant verification.")
        },
        {
          title: t("howToUse.saStep4", "4. Help Desk Ticket System & Escalation Management"),
          desc: t("howToUse.saStep4Desc", "Click the 'Help Desk' button in the top header menu (or go to Support Tickets). Review all incoming tickets submitted by Gym Admins & Receptionists, post official replies, and mark tickets as In Progress or Resolved.")
        },
        {
          title: t("howToUse.saStep5", "5. System Backups & Global Infrastructure"),
          desc: t("howToUse.saStep5Desc", "Navigate to System Backups to create instant database snapshots, download SQL backups, restore historical data, or adjust platform-wide payment gateway credentials.")
        }
      ],
      actionPath: "/superadmin/dashboard",
      actionLabel: t("howToUse.goToSuperAdmin", "Go to SuperAdmin Dashboard")
    },
    {
      id: "pt-workflow",
      category: "personaltrainer",
      icon: <FaDumbbell className="text-info" size={24} />,
      title: t("howToUse.ptTitle", "Personal Trainer Operations Guide (How Personal Trainer Works)"),
      badge: "1-on-1 PT Training",
      badgeBg: "bg-info text-dark",
      description: t("howToUse.ptDesc", "Complete workflow for Personal Trainers managing assigned clients, custom diet plans, workout routines, and transformation tracking."),
      steps: [
        {
          title: t("howToUse.ptStep1", "1. View Assigned Clients & Member Roster"),
          desc: t("howToUse.ptStep1Desc", "Open Personal Trainer Dashboard -> Members to view all clients assigned to you for 1-on-1 personal training. Review their active plan, goal targets, and contact details.")
        },
        {
          title: t("howToUse.ptStep2", "2. Conduct Fitness & Body Assessments"),
          desc: t("howToUse.ptStep2Desc", "Navigate to New Assessment / Body Builder. Record client body weight, BMI, body fat %, muscle mass, waist measurements, and initial fitness evaluation.")
        },
        {
          title: t("howToUse.ptStep3", "3. Build Customized Diet Plans"),
          desc: t("howToUse.ptStep3Desc", "Go to Diet Builder. Create customized meal plans (Breakfast, Lunch, Snacks, Dinner) with specific calorie, protein, carb, and fat macros tailored to client weight loss or muscle gain goals.")
        },
        {
          title: t("howToUse.ptStep4", "4. Create Tailored Workout Routines"),
          desc: t("howToUse.ptStep4Desc", "Open Workout Builder. Design weekly workout split schedules (Push/Pull/Legs, Upper/Lower, Cardio) with specific exercise names, target sets, reps, and weights.")
        },
        {
          title: t("howToUse.ptStep5", "5. 1-on-1 Session Bookings & Progress Tracking"),
          desc: t("howToUse.ptStep5Desc", "Manage 1-on-1 PT slot bookings under Session Bookings. Track weekly client transformation logs, weight progress graphs, and attendance records under Client Progress.")
        }
      ],
      actionPath: "/personaltrainer/dashboard",
      actionLabel: t("howToUse.goToPT", "Go to PT Dashboard")
    },
    {
      id: "gt-workflow",
      category: "generaltrainer",
      icon: <FaDumbbell className="text-primary" size={24} />,
      title: t("howToUse.gtTitle", "General Trainer Operations Guide (How General Trainer Works)"),
      badge: "Gym Floor Trainer",
      badgeBg: "bg-primary text-white",
      description: t("howToUse.gtDesc", "Complete workflow for General Trainers supervising gym floor members, general fitness assessments, workout routines, and equipment safety."),
      steps: [
        {
          title: t("howToUse.gtStep1", "1. Gym Floor Supervision & Member Guidance"),
          desc: t("howToUse.gtStep1Desc", "Open General Trainer Dashboard -> Members to view all active gym members. Guide members on proper exercise form, warm-ups, and gym floor safety.")
        },
        {
          title: t("howToUse.gtStep2", "2. Conduct General Body & BMI Assessments"),
          desc: t("howToUse.gtStep2Desc", "Go to New Assessment / Body Builder. Measure member height, weight, BMI, and body fat % to record baseline fitness data for general gym members.")
        },
        {
          title: t("howToUse.gtStep3", "3. Standard Workout & Diet Guidelines"),
          desc: t("howToUse.gtStep3Desc", "Use Workout Builder & Diet Builder to assign general exercise routines (Beginner, Intermediate, Advanced splits) and basic nutrition plans.")
        },
        {
          title: t("howToUse.gtStep4", "4. Group Fitness Classes & Shift Roster"),
          desc: t("howToUse.gtStep4Desc", "View assigned morning/evening shift timings under Shift Management. Conduct group fitness sessions, stretching classes, or HIIT workouts under Classes Schedule.")
        },
        {
          title: t("howToUse.gtStep5", "5. Equipment Issue Reporting & Support Tickets"),
          desc: t("howToUse.gtStep5Desc", "Report damaged or malfunctioning gym equipment under Inventory & Requests. Use the top header 'Help Desk' button to send tickets to Admin or SuperAdmin.")
        }
      ],
      actionPath: "/generaltrainer/dashboard",
      actionLabel: t("howToUse.goToGT", "Go to General Trainer Dashboard")
    },
    {
      id: "sales-workflow",
      category: "sales",
      icon: <FaChartLine className="text-success" size={24} />,
      title: t("howToUse.salesTitle", "Sales Agent Operations Guide (How Sales Agent Works)"),
      badge: "Sales & Conversion",
      badgeBg: "bg-success text-white",
      description: t("howToUse.salesDesc", "Complete workflow for Sales Agents managing lead inquiries, member enrollment, plan renewals, and revenue targets."),
      steps: [
        {
          title: t("howToUse.salesStep1", "1. Sales Dashboard & Funnel Metrics"),
          desc: t("howToUse.salesStep1Desc", "Open Sales Department Dashboard to monitor monthly sales revenue, active pipeline inquiries, new registrations, and lead conversion charts.")
        },
        {
          title: t("howToUse.salesStep2", "2. Lead Capture & Prospect Follow-ups"),
          desc: t("howToUse.salesStep2Desc", "Navigate to Leads / Inquiries. Add walk-in, phone, or website prospects. Set follow-up reminders and update lead statuses (New, In Progress, Converted).")
        },
        {
          title: t("howToUse.salesStep3", "3. Member Registration & Plan Enrollment"),
          desc: t("howToUse.salesStep3Desc", "Go to New Registrations. Enroll interested prospects into gym membership plans (Monthly, Quarterly, Annual), process cash/UPI payments, and issue digital invoices.")
        },
        {
          title: t("howToUse.salesStep4", "4. Renewals & Membership Retention"),
          desc: t("howToUse.salesStep4Desc", "Open Renewals & Follow-ups to view expiring member plans within 7 days. Contact members for plan renewals and process renewal transactions.")
        },
        {
          title: t("howToUse.salesStep5", "5. Sales Reports & Help Desk Escalations"),
          desc: t("howToUse.salesStep5Desc", "Export monthly sales performance reports under Attendance Logs / Sales Reports. Use the header 'Help Desk' button to resolve billing or software issues.")
        }
      ],
      actionPath: "/sales/dashboard",
      actionLabel: t("howToUse.goToSales", "Go to Sales Dashboard")
    },
    {
      id: "receptionist-workflow",
      category: "receptionist",
      icon: <FaUsers className="text-warning" size={24} />,
      title: t("howToUse.receptionistTitle", "Receptionist Operations Guide (How Receptionist Works)"),
      badge: "Reception Desk",
      badgeBg: "bg-warning text-dark",
      description: t("howToUse.receptionistDesc", "Complete step-by-step workflow for Receptionists managing member check-ins, registrations, payments, and inquiries."),
      steps: [
        {
          title: t("howToUse.recStep1", "1. Register New Members & Assign Membership Plans"),
          desc: t("howToUse.recStep1Desc", "Navigate to Reception Dashboard -> New Registrations (or Members -> Add Member). Enter member's name, phone number, email, address, upload photo, and select their membership plan (Monthly, Quarterly, Yearly).")
        },
        {
          title: t("howToUse.recStep2", "2. Daily Attendance & QR Code Check-in"),
          desc: t("howToUse.recStep2Desc", "Open QR Check-in or Daily Attendance. Scan member's unique QR code or search by member name to instantly record their daily attendance and verify plan validity.")
        },
        {
          title: t("howToUse.recStep3", "3. Collect Payments & Manage Renewals"),
          desc: t("howToUse.recStep3Desc", "Go to Payments & Member Attendance or Renewals & Follow-ups. Record cash / UPI payment details, generate digital receipts, and track expiring plans within 7 days.")
        },
        {
          title: t("howToUse.recStep4", "4. Lead Management & Inquiry Follow-ups"),
          desc: t("howToUse.recStep4Desc", "Log new walk-in or online inquiries under Leads / Inquiries. Set follow-up dates, update status (Interested, Follow-up Needed, Converted), and turn leads into active members.")
        },
        {
          title: t("howToUse.recStep5", "5. Help Desk Support & Escalations"),
          desc: t("howToUse.recStep5Desc", "If you encounter software errors or need assistance, click the 'Help Desk' button in the top header menu to submit a ticket directly to SuperAdmin support.")
        }
      ],
      actionPath: "/reception/dashboard",
      actionLabel: t("howToUse.goToReception", "Go to Reception Dashboard")
    },
    {
      id: "manager-workflow",
      category: "manager",
      icon: <FaUserTie className="text-primary" size={24} />,
      title: t("howToUse.managerTitle", "Manager Operations Guide (How Manager Works)"),
      badge: "Branch Management",
      badgeBg: "bg-primary text-white",
      description: t("howToUse.managerDesc", "Complete workflow for Gym Managers supervising daily staff rosters, class schedules, member analytics, and inventory."),
      steps: [
        {
          title: t("howToUse.mgrStep1", "1. Manager Dashboard & Branch Performance"),
          desc: t("howToUse.mgrStep1Desc", "Open Manager Dashboard to monitor active members, staff duty rosters, daily attendance trends, and revenue performance.")
        },
        {
          title: t("howToUse.mgrStep2", "2. Duty Roster & Staff Management"),
          desc: t("howToUse.mgrStep2Desc", "Navigate to Duty Roster. Assign morning/evening shifts to receptionists, trainers, and sales agents across branch locations.")
        },
        {
          title: t("howToUse.mgrStep3", "3. Group Class Schedules & Booking Audits"),
          desc: t("howToUse.mgrStep3Desc", "Open Class Schedule to schedule group fitness sessions, assign instructors, set max capacity, and review booking attendance.")
        },
        {
          title: t("howToUse.mgrStep4", "4. Inventory Audits & Repair Approval"),
          desc: t("howToUse.mgrStep4Desc", "Go to Inventory to monitor gym equipment conditions, review staff maintenance requests, and track merchandise stock.")
        },
        {
          title: t("howToUse.mgrStep5", "5. Reports & Help Desk Support"),
          desc: t("howToUse.mgrStep5Desc", "Export branch performance reports under Reports. Click the header 'Help Desk' button to send support tickets to Admin or SuperAdmin.")
        }
      ],
      actionPath: "/manager/dashboard",
      actionLabel: t("howToUse.goToManager", "Go to Manager Dashboard")
    },
    {
      id: "housekeeping-workflow",
      category: "housekeeping",
      icon: <FaClock className="text-secondary" size={24} />,
      title: t("howToUse.hkTitle", "Housekeeping Operations Guide (How Housekeeping Works)"),
      badge: "Facility Care",
      badgeBg: "bg-secondary text-white",
      description: t("howToUse.hkDesc", "Complete workflow for Housekeeping staff tracking daily sanitation tasks, QR check-ins, and facility maintenance."),
      steps: [
        {
          title: t("howToUse.hkStep1", "1. View Assigned Maintenance Tasks"),
          desc: t("howToUse.hkStep1Desc", "Open Housekeeping Dashboard -> My Tasks to view your daily facility cleaning checklists and assigned duty tasks.")
        },
        {
          title: t("howToUse.hkStep2", "2. Staff Duty QR Check-in"),
          desc: t("howToUse.hkStep2Desc", "Scan reception QR code under QR Check-in to mark your daily shift attendance and duty check-in.")
        },
        {
          title: t("howToUse.hkStep3", "3. Update Task Completion Status"),
          desc: t("howToUse.hkStep3Desc", "Update cleaning task status (Pending, In Progress, Completed) after inspecting gym workout floors, restrooms, and equipment.")
        },
        {
          title: t("howToUse.hkStep4", "4. Report Equipment Malfunctions & Issues"),
          desc: t("howToUse.hkStep4Desc", "If you notice broken gym equipment, water leaks, or damaged gear, report them under Inventory & Requests.")
        },
        {
          title: t("howToUse.hkStep5", "5. Help Desk Support"),
          desc: t("howToUse.hkStep5Desc", "Click the 'Help Desk' button in the top header menu to submit support tickets directly to Admin or SuperAdmin.")
        }
      ],
      actionPath: "/housekeeping/dashboard",
      actionLabel: t("howToUse.goToHK", "Go to Housekeeping Dashboard")
    },
    {
      id: "member-workflow",
      category: "member",
      icon: <FaUsers className="text-success" size={24} />,
      title: t("howToUse.memberGuideTitle", "Gym Member Operations Guide (How Member Works)"),
      badge: "Member Portal",
      badgeBg: "bg-success text-white",
      description: t("howToUse.memberGuideDesc", "Complete guide for Gym Members to track active memberships, scan QR check-in, access diet/workout plans, and view attendance."),
      steps: [
        {
          title: t("howToUse.memStep1", "1. Member Dashboard & Active Plan"),
          desc: t("howToUse.memStep1Desc", "Open Member Dashboard to view your active membership plan, expiration countdown, digital membership card, and gym notices.")
        },
        {
          title: t("howToUse.memStep2", "2. QR Code Check-in at Reception"),
          desc: t("howToUse.memStep2Desc", "Show your personal QR code at reception or scan the reception QR code using QR Check-in for instant entry.")
        },
        {
          title: t("howToUse.memStep3", "3. Assigned Workout Routines & Health Log"),
          desc: t("howToUse.memStep3Desc", "Open My Workouts to view custom exercise routines assigned by your trainer. Track your weight and BMI trends under My Health Log.")
        },
        {
          title: t("howToUse.memStep4", "4. Personalized Diet & Nutrition Plans"),
          desc: t("howToUse.memStep4Desc", "Open My Diet Plan to view daily meal schedules, calorie goals, and macro breakdowns designed by your personal/general trainer.")
        },
        {
          title: t("howToUse.memStep5", "5. Group Classes & Leaderboard Ranking"),
          desc: t("howToUse.memStep5Desc", "View upcoming group fitness sessions under Class Schedule and check your monthly check-in ranking on the Gym Leaderboard.")
        }
      ],
      actionPath: "/member/dashboard",
      actionLabel: t("howToUse.goToMember", "Go to Member Dashboard")
    },
    {
      id: "getting-started",
      category: "setup",
      icon: <FaRocket className="text-primary" size={24} />,
      title: t("howToUse.setupTitle", "1. Getting Started & Initial Setup"),
      badge: "Step 1",
      badgeBg: "bg-primary",
      description: t("howToUse.setupDesc", "Configure your Gym SaaS software branding, currency, branches, and administrator access."),
      steps: [
        {
          title: t("howToUse.step1_1", "Configure Business Profile & Logo"),
          desc: t("howToUse.step1_1_desc", "Navigate to Admin Panel -> Settings -> Website Settings. Upload your gym logo, update gym name, address, GST number, and contact details for official member invoices.")
        },
        {
          title: t("howToUse.step1_2", "Set Global Currency"),
          desc: t("howToUse.step1_2_desc", "Go to Settings -> Currency. Select your country's currency (e.g. INR ₹, USD $, EUR €, AED د.إ, GBP £). The entire dashboard will update monetary values dynamically.")
        },
        {
          title: t("howToUse.step1_3", "Set Up Branches & Admin Roles"),
          desc: t("howToUse.step1_3_desc", "Go to Settings -> Branch Management to add multiple gym locations. Define custom staff roles and granular permissions under Settings -> Role Management.")
        }
      ],
      actionPath: "/admin/settings",
      actionLabel: t("howToUse.goToSettings", "Go to Settings")
    },
    {
      id: "member-management",
      category: "members",
      icon: <FaUsers className="text-success" size={24} />,
      title: t("howToUse.memberTitle", "2. Member Registration & Attendance"),
      badge: "Core Feature",
      badgeBg: "bg-success",
      description: t("howToUse.memberDesc", "Manage gym member profiles, membership plan assignments, and daily check-ins."),
      steps: [
        {
          title: t("howToUse.step2_1", "Register New Gym Members"),
          desc: t("howToUse.step2_1_desc", "Open Members -> Add Member. Fill in full name, phone number, email, assigned branch, and select their membership plan (Monthly, Quarterly, Yearly).")
        },
        {
          title: t("howToUse.step2_2", "QR Code & Biometric Check-In"),
          desc: t("howToUse.step2_2_desc", "Members can scan their unique QR Code at the reception or staff can mark daily attendance under Daily Attendance / QR Check-in. Real-time geo-radius enforcement is supported.")
        },
        {
          title: t("howToUse.step2_3", "Diet & Workout Assessment"),
          desc: t("howToUse.step2_3_desc", "General & Personal Trainers can create customized Bodybuilding Assessments, Diet Plans, and Workout Routines assigned directly to members.")
        }
      ],
      actionPath: "/admin/AdminMember",
      actionLabel: t("howToUse.goToMembers", "Go to Member Management")
    },
    {
      id: "staff-management",
      category: "staff",
      icon: <FaUserTie style={{ color: "#ea580c" }} size={24} />,
      title: t("howToUse.staffTitle", "3. Staff, Trainers & Salary Calculator"),
      badge: "Staff Operations",
      badgeBg: "bg-warning text-dark",
      description: t("howToUse.staffDesc", "Organize gym staff, assign shifts, manage rosters, and compute monthly salaries automatically."),
      steps: [
        {
          title: t("howToUse.step3_1", "Add Staff & Assign Department Roles"),
          desc: t("howToUse.step3_1_desc", "Open Staff -> Manage Staff. Create accounts for Managers, General Trainers, Personal Trainers, Receptionists, or Sales Agents.")
        },
        {
          title: t("howToUse.step3_2", "Configure Shifts & Duty Rosters"),
          desc: t("howToUse.step3_2_desc", "Set morning, evening, and custom shift timings under Shift Management. Assign duty rosters to staff members per branch.")
        },
        {
          title: t("howToUse.step3_3", "Automated Salary Calculator"),
          desc: t("howToUse.step3_3_desc", "Open Staff -> Salary Calculator. Compute salaries based on monthly fixed rates or hourly shifts minus attendance deductions.")
        }
      ],
      actionPath: "/admin/staff/manage-staff",
      actionLabel: t("howToUse.goToStaff", "Go to Staff Management")
    },
    {
      id: "plans-billing",
      category: "billing",
      icon: <FaCreditCard className="text-info" size={24} />,
      title: t("howToUse.plansTitle", "4. Membership Plans, Payments & Invoices"),
      badge: "Billing & Revenue",
      badgeBg: "bg-info text-dark",
      description: t("howToUse.plansDesc", "Set up membership packages, process payments online/offline, and issue PDF tax invoices."),
      steps: [
        {
          title: t("howToUse.step4_1", "Create Membership Packages"),
          desc: t("howToUse.step4_1_desc", "Go to Settings -> Plans or Membership & Plans. Set prices, duration (days/months/years), and discount percentages for quarterly/yearly subscriptions.")
        },
        {
          title: t("howToUse.step4_2", "Configure Payment Gateways"),
          desc: t("howToUse.step4_2_desc", "Go to Settings -> Payment Gateways to enable Razorpay, UPI ID, Paytm, GPay, or Card payments for member checkouts and SaaS renewals.")
        },
        {
          title: t("howToUse.step4_3", "Generate Invoices & Download Receipts"),
          desc: t("howToUse.step4_3_desc", "After payment, members automatically receive downloadable PDF tax invoices with gym branding and GST details.")
        }
      ],
      actionPath: "/admin/settings",
      actionLabel: t("howToUse.goToBilling", "Go to Plans & Payment Gateways")
    },
    {
      id: "inventory",
      category: "inventory",
      icon: <FaBoxes style={{ color: "#8b5cf6" }} size={24} />,
      title: t("howToUse.inventoryTitle", "5. Inventory & Equipment Maintenance"),
      badge: "Stock Control",
      badgeBg: "bg-secondary",
      description: t("howToUse.inventoryDesc", "Track gym merchandise, supplements, cardio/strength equipment, and staff requests."),
      steps: [
        {
          title: t("howToUse.step5_1", "Add Products & Equipment"),
          desc: t("howToUse.step5_1_desc", "Open Inventory. Register gym products (protein, merchandise) and gym equipment with purchase cost, condition, and maintenance dates.")
        },
        {
          title: t("howToUse.step5_2", "Equipment Repair & Maintenance Requests"),
          desc: t("howToUse.step5_2_desc", "Staff can submit equipment maintenance requests directly. Admins can review, approve, or reject repair requests.")
        }
      ],
      actionPath: "/admin/inventory",
      actionLabel: t("howToUse.goToInventory", "Go to Inventory Management")
    },
    {
      id: "backups-security",
      category: "backups",
      icon: <FaDatabase className="text-danger" size={24} />,
      title: t("howToUse.backupTitle", "6. Automatic System Backup & Disaster Recovery"),
      badge: "System Security",
      badgeBg: "bg-danger",
      description: t("howToUse.backupDesc", "Ensure complete data protection with automated server backups, verification checksums, and safety restores."),
      steps: [
        {
          title: t("howToUse.step6_1", "Configure Automatic Server Backups"),
          desc: t("howToUse.step6_1_desc", "Open Settings -> Backup & Restore. Enable automatic backup, set frequency (Every 1, 3, 7, 15, or 30 days), backup time, and admin email.")
        },
        {
          title: t("howToUse.step6_2", "Generate Instant Manual Backup ZIP"),
          desc: t("howToUse.step6_2_desc", "Click 'Create Backup Now'. The backend generates a complete downloadable ZIP package containing database SQL dumps, uploaded files, and SHA-256 verification hash.")
        },
        {
          title: t("howToUse.step6_3", "Safe Database Restoration"),
          desc: t("howToUse.step6_3_desc", "Under the Restore Data tab, select any backup package. The system automatically creates a pre-restore safety backup before restoring current records.")
        }
      ],
      actionPath: "/admin/system-backups",
      actionLabel: t("howToUse.goToBackups", "Go to Backup & Restore")
    },
    {
      id: "reports-support",
      category: "reports",
      icon: <FaChartLine style={{ color: "#06b6d4" }} size={24} />,
      title: t("howToUse.reportsTitle", "7. Reports & Support Tickets"),
      badge: "Analytics",
      badgeBg: "bg-dark",
      description: t("howToUse.reportsDesc", "Analyze business metrics, generate sales & attendance reports, and request technical support."),
      steps: [
        {
          title: t("howToUse.step7_1", "Sales & Attendance Reports"),
          desc: t("howToUse.step7_1_desc", "Open Reports -> Sales Report or Attendance Report. Export comprehensive CSV or PDF analytics for any date range.")
        },
        {
          title: t("howToUse.step7_3", "Support Tickets"),
          desc: t("howToUse.step7_3_desc", "Submit questions or technical tickets directly to the Super Admin team under Support Tickets.")
        }
      ],
      actionPath: "/admin/sales-report",
      actionLabel: t("howToUse.goToReports", "Go to Reports")
    }
  ];

  const faqs = [
    {
      q: t("howToUse.faq1_q", "How do I change the currency across the entire software?"),
      a: t("howToUse.faq1_a", "Go to Admin Panel -> Settings -> Currency. Select your country's currency from the searchable dropdown and click 'Save Selected Currency'. The entire system will automatically format monetary values live.")
    },
    {
      q: t("howToUse.faq2_q", "Do automated server backups run if my browser is closed?"),
      a: t("howToUse.faq2_a", "Yes! Automated backups run on the backend server scheduler (cron job) independently of your browser. As long as your server is online, backups will execute automatically based on your configured frequency.")
    },
    {
      q: t("howToUse.faq3_q", "How do members check in using QR code?"),
      a: t("howToUse.faq3_a", "Each member gets a unique QR code upon registration. Receptionists or trainers can scan member QR codes using the QR Check-In module or members can scan gym reception QR codes.")
    },
    {
      q: t("howToUse.faq4_q", "How does the automatic Salary Calculator work?"),
      a: t("howToUse.faq4_a", "Navigate to Staff -> Salary Calculator. Select the staff member and month. The software calculates base pay, hourly shifts worked, overtime, and deductions based on attendance records.")
    },
    {
      q: t("howToUse.faq5_q", "What happens when a SaaS subscription license expires?"),
      a: t("howToUse.faq5_a", "A grace period alert is displayed on your admin dashboard. You can navigate to 'My Subscription' to renew your plan online via Razorpay/UPI or submit an offline request to the Super Admin.")
    }
  ];

  const filteredModules = guideModules.filter((m) => {
    const matchesCategory = activeCategory === "all" || m.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      m.title.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      m.steps.some(
        (s) => s.title.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query)
      );
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <FaBookOpen style={{ color: "#ea580c" }} />
            {t("howToUse.heroTitle", "How To Use Gym Management SaaS")}
          </h3>
          <p className="text-muted mb-0 small">
            {t("howToUse.heroSubtitle", "Complete step-by-step documentation, module workflows, and interactive guides to operate your gym efficiently.")}
          </p>
        </div>

        {/* Compact Search Bar */}
        <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white border" style={{ maxWidth: "420px" }}>
          <span className="input-group-text bg-white border-0 ps-3">
            <FaSearch className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-0 py-2 shadow-none text-dark fw-medium small"
            placeholder={t("howToUse.searchPlaceholder", "Search features (e.g., Add Member, Backup, Currency)...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn bg-white border-0 text-muted pe-3" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="d-flex overflow-auto gap-2 mb-4 pb-2" style={{ scrollbarWidth: "none" }}>
        {[
          { key: "all", label: t("howToUse.filterAll", "All Modules") },
          { key: "superadmin", label: "Super Admin" },
          { key: "receptionist", label: "Receptionist" },
          { key: "personaltrainer", label: "Personal Trainer" },
          { key: "generaltrainer", label: "General Trainer" },
          { key: "sales", label: "Sales Agent" },
          { key: "manager", label: "Manager" },
          { key: "housekeeping", label: "Housekeeping" },
          { key: "member", label: "Member" },
          { key: "setup", label: t("howToUse.filterSetup", "Initial Setup") },
          { key: "members", label: t("howToUse.filterMembers", "Members & Attendance") },
          { key: "staff", label: t("howToUse.filterStaff", "Staff & Payroll") },
          { key: "billing", label: t("howToUse.filterBilling", "Plans & Billing") },
          { key: "inventory", label: t("howToUse.filterInventory", "Inventory") },
          { key: "backups", label: t("howToUse.filterBackups", "Backups & Security") },
          { key: "reports", label: t("howToUse.filterReports", "Reports & Audit") },
        ].map((pill) => (
          <button
            key={pill.key}
            className={`btn rounded-pill px-3 py-2 fw-semibold flex-shrink-0 ${
              activeCategory === pill.key ? "btn-primary shadow-sm" : "btn-white text-muted border"
            }`}
            style={{ fontSize: "13px" }}
            onClick={() => setActiveCategory(pill.key)}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Guide Modules List */}
      <div className="row g-4 mb-5">
        {filteredModules.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 border shadow-sm">
            <FaQuestionCircle size={40} className="text-muted mb-3" />
            <h5 className="fw-bold text-dark">{t("howToUse.noResultsTitle", "No guides match your search")}</h5>
            <p className="text-muted small mb-0">{t("howToUse.noResultsDesc", "Try searching for keywords like 'Member', 'Backup', 'Currency', or 'Staff'.")}</p>
          </div>
        ) : (
          filteredModules.map((module) => (
            <div className="col-12" key={module.id}>
              <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
                <div className="card-header bg-white border-bottom p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 rounded-3 bg-light">{module.icon}</div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className={`badge ${module.badgeBg} rounded-pill px-2.5 py-1 small fw-bold`}>
                          {module.badge}
                        </span>
                        <h5 className="fw-bold mb-0 text-dark">{module.title}</h5>
                      </div>
                      <p className="text-muted small mb-0">{module.description}</p>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline-primary rounded-pill btn-sm fw-bold px-3 d-flex align-items-center gap-2 align-self-start align-self-md-auto"
                    onClick={() => navigate(module.actionPath)}
                  >
                    {module.actionLabel}
                    <FaArrowRight size={12} />
                  </button>
                </div>

                <div className="card-body p-4 bg-light bg-opacity-50">
                  <div className="row g-3">
                    {module.steps.map((step, sIdx) => (
                      <div className="col-12 col-md-4" key={sIdx}>
                        <div className="p-3.5 bg-white rounded-3 border h-100 shadow-sm d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="badge bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-inline-flex justify-content-center align-items-center" style={{ width: "26px", height: "26px", fontSize: "12px" }}>
                                {sIdx + 1}
                              </span>
                              <h6 className="fw-bold mb-0 text-dark fs-6">{step.title}</h6>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: "0.84rem", lineHeight: "1.5" }}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="card border-0 rounded-4 shadow-sm bg-white p-4 p-md-5 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <FaQuestionCircle className="text-primary" size={24} />
          <h4 className="fw-bold text-dark mb-0">{t("howToUse.faqTitle", "Frequently Asked Questions & Quick Help")}</h4>
        </div>

        <div className="d-flex flex-column gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div key={idx} className="border rounded-3 overflow-hidden transition-all">
                <button
                  type="button"
                  className="w-100 p-3.5 text-start bg-white border-0 fw-bold text-dark d-flex align-items-center justify-content-between cursor-pointer"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                >
                  <span className="d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                    <span className="text-primary fw-bold">Q:</span> {faq.q}
                  </span>
                  <FaChevronRight className={`text-muted transition-transform ${isOpen ? "rotate-90 text-primary" : ""}`} />
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 bg-light text-muted small border-top" style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
