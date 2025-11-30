import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  CreditCard,
  Layout,
  Eye,
  Plus,
  Trash2,
  ChevronRight,
  Briefcase,
  Moon,
  Sun,
  Lock,
  Check,
  ArrowRight,
  LogIn,
  LogOut,
  Save,
  X,
  AlertTriangle,
  UploadCloud,
  Grid,
  Users,
  DollarSign,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURATION ---
const USE_FIREBASE = true;

// PASTE YOUR KEYS FROM FIREBASE HERE
const firebaseConfig = {
  apiKey: "AIzaSyC-1mCZG0TK6L_9-rspWa0RwHcTpPa6CH8",
  authDomain: "lumina-373f7.firebaseapp.com",
  projectId: "lumina-373f7",
  storageBucket: "lumina-373f7.firebasestorage.app",
  messagingSenderId: "429023395974",
  appId: "1:429023395974:web:2c0c3440af648f9a635107",
};

// Initialize Firebase
let app, auth, db;
try {
  if (USE_FIREBASE && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase init warning:", e);
}

// --- MISSING COMPONENTS (Fixed) ---

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    green:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    amber:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    slate:
      "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        colors[color] || colors.slate
      }`}
    >
      {children}
    </span>
  );
};

// --- TEMPLATE DATA ---
const NEW_PROJECT_TEMPLATE = {
  clientName: "New Client",
  projectName: "Untitled Project",
  freelancerName: "Freelancer",
  currentPhase: 0,
  accessPin: "0000",
  phases: [
    { id: 1, title: "Kickoff", status: "active", date: "Today" },
    { id: 2, title: "Development", status: "pending", date: "TBD" },
    { id: 3, title: "Handover", status: "pending", date: "" },
  ],
  assets: [],
  invoices: [],
};

// --- DEFAULT DATA ---
const INITIAL_PROJECTS = [
  {
    id: "p1",
    clientName: "Demo Corp",
    projectName: "Marketing Video",
    freelancerName: "Alex Creative",
    accessPin: "1234",
    phases: [
      { id: 1, title: "Scripting", status: "complete", date: "Oct 12" },
      { id: 2, title: "Rough Cut", status: "active", date: "In Progress" },
      { id: 3, title: "Final Polish", status: "pending", date: "Nov 01" },
    ],
    assets: [],
    invoices: [
      {
        id: 101,
        amount: "$1,500.00",
        status: "paid",
        date: "Oct 01",
        desc: "Deposit",
      },
    ],
  },
];

export default function LuminaPortal() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [viewState, setViewState] = useState("LOCKED");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    amount: "$0.00",
    desc: "Service Fee",
    date: "Due Today",
  });

  const project = projects.find((p) => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    if (USE_FIREBASE && db) {
      const unsub = onSnapshot(doc(db, "lumina", "data"), (doc) => {
        if (doc.exists() && doc.data().projects) {
          setProjects(doc.data().projects);
        } else if (!doc.exists()) {
          // Create initial doc if missing
          setDoc(doc.ref, { projects: INITIAL_PROJECTS });
        }
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    if (USE_FIREBASE && db && isAdmin && projects.length > 0) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          await setDoc(
            doc(db, "lumina", "data"),
            { projects },
            { merge: true }
          );
        } catch (err) {
          console.error("Error saving:", err);
        }
        setIsSaving(false);
      };
      const timeout = setTimeout(saveData, 1000);
      return () => clearTimeout(timeout);
    }
  }, [projects, isAdmin]);

  const handleClientLogin = (e) => {
    e.preventDefault();
    const foundProject = projects.find((p) => p.accessPin === pin);
    if (foundProject) {
      setActiveProjectId(foundProject.id);
      setIsAdmin(false);
      setViewState("PROJECT_VIEW");
      setErrorMsg("");
      setAnimateHeader(true);
    } else {
      setErrorMsg("Incorrect PIN.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    if (USE_FIREBASE && auth) {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
        setIsAdmin(true);
        setViewState("ADMIN_DASHBOARD");
        setErrorMsg("");
      } catch (err) {
        setErrorMsg("Login Failed: " + err.message);
      }
    } else {
      setTimeout(() => {
        if (adminPass === "admin") {
          setIsAdmin(true);
          setViewState("ADMIN_DASHBOARD");
          setErrorMsg("");
        } else {
          setErrorMsg("Invalid Credentials (Try pass: admin)");
        }
      }, 800);
    }
    setIsSaving(false);
  };

  const handleCreateProject = () => {
    const newId = "p" + Date.now();
    setProjects((prev) => [...prev, { ...NEW_PROJECT_TEMPLATE, id: newId }]);
  };

  const confirmDeleteProject = () => {
    if (deleteProjectId) {
      setProjects((prev) => prev.filter((p) => p.id !== deleteProjectId));
      setDeleteProjectId(null);
    }
  };

  const openProjectAsAdmin = (id) => {
    setActiveProjectId(id);
    setViewState("PROJECT_VIEW");
    setAnimateHeader(true);
  };

  const updateProjectData = (newData) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === activeProjectId ? { ...p, ...newData } : p))
    );
  };

  const updateProjectField = (field, value) => {
    updateProjectData({ [field]: value });
  };

  const updatePhaseStatus = (index, newStatus) => {
    const newPhases = [...project.phases];
    newPhases[index].status = newStatus;
    if (newStatus === "active") {
      for (let i = 0; i < index; i++) newPhases[i].status = "complete";
      for (let i = index + 1; i < newPhases.length; i++)
        newPhases[i].status = "pending";
    }
    updateProjectData({ phases: newPhases });
  };

  const updatePhaseField = (index, field, value) => {
    const newPhases = [...project.phases];
    newPhases[index][field] = value;
    updateProjectData({ phases: newPhases });
  };

  const addPhase = () => {
    updateProjectData({
      phases: [
        ...project.phases,
        { id: Date.now(), title: "New Phase", status: "pending", date: "TBD" },
      ],
    });
  };

  const deletePhase = (e, index) => {
    e.stopPropagation();
    const newPhases = project.phases.filter((_, i) => i !== index);
    updateProjectData({ phases: newPhases });
  };

  const toggleInvoiceStatus = (id) => {
    updateProjectData({
      invoices: project.invoices.map((inv) =>
        inv.id === id
          ? { ...inv, status: inv.status === "paid" ? "unpaid" : "paid" }
          : inv
      ),
    });
  };

  const handleAddInvoice = () => {
    const inv = {
      id: Date.now(),
      amount: newInvoice.amount,
      desc: newInvoice.desc,
      date: newInvoice.date,
      status: "unpaid",
    };
    updateProjectData({ invoices: [...project.invoices, inv] });
    setShowInvoiceModal(false);
    setNewInvoice({ amount: "$0.00", desc: "Service Fee", date: "Due Today" });
  };

  const deleteInvoice = () => {
    if (deleteInvoiceId) {
      updateProjectData({
        invoices: project.invoices.filter((inv) => inv.id !== deleteInvoiceId),
      });
      setDeleteInvoiceId(null);
    }
  };

  const updateInvoiceField = (id, field, value) => {
    updateProjectData({
      invoices: project.invoices.map((inv) =>
        inv.id === id ? { ...inv, [field]: value } : inv
      ),
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateProjectData({
        assets: [
          ...project.assets,
          {
            id: Date.now(),
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "document",
            url: reader.result,
          },
        ],
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteAsset = (id) => {
    updateProjectData({ assets: project.assets.filter((a) => a.id !== id) });
  };

  const updateAssetField = (id, field, value) => {
    updateProjectData({
      assets: project.assets.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  if (viewState === "LOCKED") {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Lock size={32} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Lumina Portal
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Enter client PIN to view status.
              </p>

              <form onSubmit={handleClientLogin} className="space-y-4">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN (e.g. 1234)"
                  className="w-full text-center text-2xl font-bold tracking-widest text-slate-800 dark:text-white dark:bg-slate-900 py-3 border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition-colors"
                  autoFocus
                />
                {errorMsg && (
                  <p className="text-red-500 text-xs font-semibold animate-pulse">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group"
                >
                  Access Portal{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </form>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-8">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-slate-400 hover:text-indigo-500 transition-colors"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => {
                  setViewState("ADMIN_LOGIN");
                  setErrorMsg("");
                }}
                className="text-xs text-slate-300 hover:text-slate-500 font-medium"
              >
                Owner Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "ADMIN_LOGIN") {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-sm">
            <button
              onClick={() => setViewState("LOCKED")}
              className="text-slate-500 hover:text-white mb-6 flex items-center gap-2 text-sm"
            >
              <ChevronRight className="rotate-180" size={14} /> Back to Portal
            </button>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Admin Access
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Login to the Command Center.
              </p>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg p-3 text-sm dark:text-white mt-1"
                  placeholder="admin@lumina.com"
                />
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg p-3 text-sm dark:text-white mt-1"
                  placeholder="••••••"
                />
                {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                >
                  {isSaving ? "Checking..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "ADMIN_DASHBOARD") {
    const totalRevenue = projects.reduce(
      (acc, curr) =>
        acc +
        curr.invoices.reduce(
          (sum, inv) => sum + parseFloat(inv.amount.replace(/[^0-9.-]+/g, "")),
          0
        ),
      0
    );
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20 p-6 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Command Center
                </h1>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  Welcome back.{" "}
                  {isSaving && (
                    <span className="text-indigo-500 font-bold animate-pulse">
                      Syncing...
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 shadow-sm"
                >
                  <Sun size={20} />
                </button>
                <button
                  onClick={() => setViewState("LOCKED")}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-500"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <Grid size={16} /> Active Projects
                </div>
                <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {projects.length}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <Users size={16} /> Clients Served
                </div>
                <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {projects.length}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <DollarSign size={16} /> Total Value
                </div>
                <div className="text-4xl font-extrabold text-slate-800 dark:text-white">
                  ${totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Your Projects</h2>
              <button
                onClick={handleCreateProject}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Plus size={16} /> New Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => openProjectAsAdmin(p.id)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {p.clientName.charAt(0)}
                    </div>
                    <Badge
                      color={
                        p.phases.some((ph) => ph.status === "active")
                          ? "green"
                          : "slate"
                      }
                    >
                      {p.phases.find((ph) => ph.status === "active")?.title ||
                        "Completed"}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                    {p.projectName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">{p.clientName}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                      <Lock size={12} /> PIN: {p.accessPin}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteProjectId(p.id);
                      }}
                      className="text-slate-300 hover:text-red-500 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {deleteProjectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-lg dark:text-white mb-2">
                  Delete Project?
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteProjectId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteProject}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                L
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">
                Lumina
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewState("ADMIN_DASHBOARD")}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Grid size={14} /> All Projects
                  </button>
                  <button
                    onClick={() => {
                      setIsAdmin(false);
                      setViewState("LOCKED");
                    }}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setViewState("LOCKED");
                    setPin("");
                  }}
                  className="text-sm text-slate-500 hover:text-indigo-600 font-medium"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
          <header
            className={`transition-all duration-700 transform ${
              animateHeader
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {isAdmin ? (
                    <input
                      value={project.clientName}
                      onChange={(e) =>
                        updateProjectField("clientName", e.target.value)
                      }
                      className="text-sm font-bold tracking-widest text-indigo-600 uppercase bg-transparent border-b border-dashed border-indigo-200 hover:border-indigo-500 focus:outline-none focus:border-indigo-600 w-auto dark:text-indigo-400 dark:border-indigo-800"
                    />
                  ) : (
                    <span className="text-sm font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                      {project.clientName}
                    </span>
                  )}
                  <Badge color="blue">Active Project</Badge>
                  {isSaving && (
                    <span className="text-xs text-indigo-500 animate-pulse font-bold ml-2">
                      Saving...
                    </span>
                  )}
                </div>
                {isAdmin ? (
                  <div className="space-y-2">
                    <input
                      value={project.projectName}
                      onChange={(e) =>
                        updateProjectField("projectName", e.target.value)
                      }
                      className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 focus:outline-none w-full"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Lock size={12} /> Client PIN:{" "}
                      <input
                        value={project.accessPin}
                        onChange={(e) =>
                          updateProjectField("accessPin", e.target.value)
                        }
                        className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono w-16 text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                    {project.projectName}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-slate-400 uppercase font-semibold">
                    Managed By
                  </p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {project.freelancerName}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <Briefcase size={18} />
                </div>
              </div>
            </div>
          </header>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Project Status
              </h2>
              {isAdmin && (
                <span className="text-xs text-slate-400 italic">
                  Click bubble to set active
                </span>
              )}
            </div>
            <Card className="p-8 md:p-10">
              <div className="relative">
                <div className="hidden md:block absolute top-6 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                  {project.phases.map((phase, idx) => {
                    const isActive = phase.status === "active";
                    const isComplete = phase.status === "complete";
                    return (
                      <div
                        key={phase.id}
                        className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-2 group cursor-default relative"
                      >
                        {isAdmin && (
                          <button
                            onClick={(e) => deletePhase(e, idx)}
                            className="absolute -top-3 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-top-4 w-5 h-5 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white transition-colors z-30"
                            title="Delete Phase"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        )}
                        <div
                          onClick={() =>
                            isAdmin && updatePhaseStatus(idx, "active")
                          }
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-20 ${
                            isAdmin ? "cursor-pointer hover:scale-110" : ""
                          } ${
                            isComplete
                              ? "bg-emerald-500 border-emerald-100 dark:border-emerald-900 text-white"
                              : isActive
                              ? "bg-indigo-600 border-indigo-100 dark:border-indigo-900 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle size={20} />
                          ) : isActive ? (
                            <Clock size={20} className="animate-pulse" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          )}
                        </div>
                        <div className="flex-1 md:flex-none text-left md:text-center w-full">
                          {isAdmin ? (
                            <div className="space-y-1">
                              <input
                                value={phase.title}
                                onChange={(e) =>
                                  updatePhaseField(idx, "title", e.target.value)
                                }
                                className="text-sm font-semibold bg-transparent text-left md:text-center w-full border-b border-dashed border-transparent hover:border-indigo-300 focus:outline-none"
                              />
                              <input
                                value={phase.date}
                                onChange={(e) =>
                                  updatePhaseField(idx, "date", e.target.value)
                                }
                                className="text-xs text-slate-500 bg-transparent text-left md:text-center w-full border-b border-dashed border-transparent hover:border-indigo-300 focus:outline-none placeholder-slate-300"
                                placeholder="Date (Optional)"
                              />
                            </div>
                          ) : (
                            <>
                              <p
                                className={`text-sm font-semibold ${
                                  isActive
                                    ? "text-indigo-900 dark:text-indigo-400"
                                    : isComplete
                                    ? "text-emerald-900 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-600"
                                }`}
                              >
                                {phase.title}
                              </p>
                              {phase.date && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                  {phase.date}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isAdmin && (
                    <div className="flex flex-col items-center justify-start pt-1">
                      <button
                        onClick={addPhase}
                        className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 text-slate-400 flex items-center justify-center hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                      <span className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                        Add Phase
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Layout size={20} className="text-slate-400" /> Deliverables
                </h2>
                {isAdmin && (
                  <>
                    <input
                      type="file"
                      id="hidden-file-input"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() =>
                        document.getElementById("hidden-file-input").click()
                      }
                      className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 flex items-center gap-1 transition-colors"
                    >
                      <UploadCloud size={12} /> Upload File
                    </button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {asset.type === "video" ? (
                          <Eye size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </div>
                      {isAdmin ? (
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <Badge color="slate">{asset.type}</Badge>
                      )}
                    </div>
                    {isAdmin ? (
                      <div className="space-y-2">
                        <input
                          value={asset.name}
                          onChange={(e) =>
                            updateAssetField(asset.id, "name", e.target.value)
                          }
                          className="block w-full text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:outline-none placeholder-slate-400"
                        />
                      </div>
                    ) : (
                      <>
                        <h3
                          className="text-sm font-semibold text-slate-900 dark:text-white mb-1 truncate"
                          title={asset.name}
                        >
                          {asset.name}
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                          Ready for download
                        </p>
                        <a
                          href={asset.url}
                          download={asset.name}
                          className="inline-flex items-center justify-center w-full py-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors gap-2"
                        >
                          <Download size={14} /> Download Asset
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CreditCard size={20} className="text-slate-400" /> Invoices
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Add Invoice
                  </button>
                )}
              </div>
              <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                {project.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative"
                  >
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-1">
                        {isAdmin ? (
                          <input
                            value={inv.amount}
                            onChange={(e) =>
                              updateInvoiceField(
                                inv.id,
                                "amount",
                                e.target.value
                              )
                            }
                            className="font-bold text-slate-800 dark:text-white bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:outline-none w-24"
                          />
                        ) : (
                          <p className="font-bold text-slate-800 dark:text-white">
                            {inv.amount}
                          </p>
                        )}
                        <button
                          onClick={() => isAdmin && toggleInvoiceStatus(inv.id)}
                          className={`${
                            isAdmin ? "cursor-pointer hover:opacity-80" : ""
                          }`}
                        >
                          <Badge
                            color={inv.status === "paid" ? "green" : "amber"}
                          >
                            {inv.status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </button>
                      </div>
                      {isAdmin ? (
                        <div className="space-y-1 mt-1">
                          <input
                            value={inv.desc}
                            onChange={(e) =>
                              updateInvoiceField(inv.id, "desc", e.target.value)
                            }
                            className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:outline-none w-full"
                          />
                          <input
                            value={inv.date}
                            onChange={(e) =>
                              updateInvoiceField(inv.id, "date", e.target.value)
                            }
                            className="text-[10px] text-slate-400 dark:text-slate-500 uppercase bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:outline-none w-full"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {inv.desc}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                            {inv.date}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteInvoiceId(inv.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {inv.status === "paid" && !isAdmin && (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {showInvoiceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-lg dark:text-white">
                    Add Invoice
                  </h3>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Amount
                    </label>
                    <input
                      value={newInvoice.amount}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, amount: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Description
                    </label>
                    <input
                      value={newInvoice.desc}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, desc: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Due Date
                    </label>
                    <input
                      value={newInvoice.date}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, date: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm dark:text-white mt-1"
                    />
                  </div>
                  <button
                    onClick={handleAddInvoice}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors mt-2"
                  >
                    Add Invoice
                  </button>
                </div>
              </div>
            </div>
          )}

          {deleteInvoiceId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white mb-2">
                    Delete Invoice?
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteInvoiceId(null)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteInvoice}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
