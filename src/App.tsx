import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  FileSpreadsheet, 
  FileJson,
  PlusCircle,
  Save,
  ChevronRight,
  Menu,
  X,
  Trash2,
  Edit2,
  UserPlus,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Teacher {
  id: number;
  name: string;
  email: string;
  school_id: number;
  school_name: string;
  role: "admin" | "teacher";
  is_class_teacher?: number;
}

interface Student {
  id: number;
  name: string;
  class: string;
  assessment_number: string;
  gender: "Male" | "Female" | "Other";
}

interface AttendanceRecord {
  student_id: number;
  status: "Present" | "Absent" | "Late";
}

interface SyllabusItem {
  id: number;
  strand: string;
  topic: string;
  subject: string;
  sub_strand: string;
  class: string;
  status: string;
  date: string;
  is_taught: number;
  is_assessed: number;
  taught_by?: string;
  assessed_by?: string;
  teacher_name?: string;
  term?: string;
}

interface TopicScore {
  student_id: number;
  score: string;
}

interface ProgressRecord {
  id: number;
  student_id: number;
  student_name: string;
  student_class: string;
  subject: string;
  term: string;
  marks: number;
  comments: string;
}

// --- Components ---
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-blue-950 mb-2">{title}</h3>
          <p className="text-slate-500">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (teacher: Teacher) => void }) => {
  const [email, setEmail] = useState("teacher@school.com");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<"teacher" | "admin">("teacher");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.teacher.role !== role) {
          setError(`This account is not registered as ${role}`);
          return;
        }
        onLogin(data.teacher);
        navigate("/dashboard");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-950 rounded-2xl flex items-center justify-center mb-4 border-b-4 border-red-600">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-blue-950">EduTrack Login</h1>
          <p className="text-slate-500 text-sm mt-1">Access your school dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                role === "teacher" ? "bg-white text-blue-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                role === "admin" ? "bg-white text-blue-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Admin
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-950 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-950 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-950 text-white py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors mt-4 border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

const Teachers = ({ schoolId }: { schoolId: number }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", password: "", role: "teacher", is_class_teacher: false });
  const [message, setMessage] = useState("");

  const fetchTeachers = useCallback(() => {
    fetch(`/api/teachers?school_id=${schoolId}`)
      .then(res => res.json())
      .then(data => setTeachers(data));
  }, [schoolId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTeacher, school_id: schoolId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Teacher added successfully!");
        setNewTeacher({ name: "", email: "", password: "", role: "teacher", is_class_teacher: false });
        setShowAdd(false);
        fetchTeachers();
      } else {
        setMessage("Error: " + data.message);
      }
    } catch (err) {
      setMessage("Error: Failed to connect");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this teacher?")) return;
    try {
      const res = await fetch(`/api/teachers/${id}?school_id=${schoolId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchTeachers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-blue-950 italic serif">Teacher Management</h2>
          <p className="text-slate-500 text-sm">Add or remove teachers from the system</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-950 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} />
          {showAdd ? "Cancel" : "Add Teacher"}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-950 rounded-xl border border-blue-100 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {message}
        </div>
      )}

      {showAdd && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Teacher Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="email@school.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={newTeacher.role}
                onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isClassTeacher"
                checked={newTeacher.is_class_teacher}
                onChange={(e) => setNewTeacher({ ...newTeacher, is_class_teacher: e.target.checked })}
                className="w-4 h-4 text-blue-950 border-slate-300 rounded focus:ring-blue-950"
              />
              <label htmlFor="isClassTeacher" className="text-sm font-medium text-slate-700">Is Class Teacher?</label>
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-950 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
              >
                Register Teacher
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Class Teacher</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-blue-950">{t.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{t.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    t.role === 'admin' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {t.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {t.is_class_teacher === 1 ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Yes</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Dashboard = ({ schoolId }: { schoolId: number }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/stats?school_id=${schoolId}`)
      .then(res => res.json())
      .then(data => setStats(data));
  }, [schoolId]);

  if (!stats) return <div className="p-8">Loading stats...</div>;

  const syllabusData = stats.syllabus.map((s: any) => ({ name: s.status, value: s.count }));
  const COLORS = ["#172554", "#dc2626", "#94a3b8"];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-slate-400 w-6 h-6" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Students</span>
          </div>
          <p className="text-4xl font-bold text-blue-950">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="text-slate-400 w-6 h-6" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Strands Covered</span>
          </div>
          <p className="text-4xl font-bold text-blue-950">{stats.syllabus.find((s: any) => s.status === "Covered")?.count || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-slate-400 w-6 h-6" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg. Class Marks</span>
          </div>
          <p className="text-4xl font-bold text-blue-950">{stats.avgMarks.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-blue-950 mb-6 italic serif">Quick Reports</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.open(`/api/attendance/download?date=${new Date().toISOString().split("T")[0]}&school_id=${schoolId}`, "_blank")}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all flex flex-col items-center gap-2"
            >
              <Clock className="text-blue-950" size={24} />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Daily Attendance</span>
            </button>
            <button
              onClick={() => window.open(`/api/staff-attendance/download?date=${new Date().toISOString().split("T")[0]}&school_id=${schoolId}`, "_blank")}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all flex flex-col items-center gap-2"
            >
              <Users className="text-blue-950" size={24} />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Staff Attendance</span>
            </button>
            <button
              onClick={() => window.open(`/api/syllabus/download?school_id=${schoolId}`, "_blank")}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all flex flex-col items-center gap-2"
            >
              <BookOpen className="text-blue-950" size={24} />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Strand Tracker</span>
            </button>
            <button
              onClick={() => window.location.href = "/reports"}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all flex flex-col items-center gap-2"
            >
              <Download className="text-blue-950" size={24} />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Full Reports</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-blue-950 mb-6 italic serif">Syllabus Coverage</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={syllabusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {syllabusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-blue-950 mb-6 italic serif">Progress Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: "Class Avg", value: stats.avgMarks }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" fill="#172554" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Attendance = ({ schoolId }: { schoolId: number }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClass = searchParams.get("class") || "Grade 1";
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [records, setRecords] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", class: initialClass, assessment_number: "", gender: "Male" });
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; isOpen: boolean }>({ id: 0, isOpen: false });

  const availableClasses = Array.from(new Set(students.map(s => s.class))).sort((a, b) => {
    const order = ["Play Group", "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];
    return order.indexOf(a as string) - order.indexOf(b as string);
  });

  useEffect(() => {
    setNewStudent(prev => ({ ...prev, class: selectedClass }));
  }, [selectedClass]);

  useEffect(() => {
    fetch(`/api/students?school_id=${schoolId}`).then(res => res.json()).then(data => setStudents(data));
    fetch(`/api/attendance?date=${date}&school_id=${schoolId}`)
      .then(res => res.json())
      .then(data => {
        const initial: Record<number, string> = {};
        data.forEach((r: any) => initial[r.student_id] = r.status);
        setRecords(initial);
      });
  }, [date, schoolId]);

  useEffect(() => {
    const classParam = searchParams.get("class");
    if (classParam) {
      setSelectedClass(classParam);
    }
  }, [searchParams]);

  const filteredStudents = students.filter(s => s.class === selectedClass);

  const handleStatusChange = (studentId: number, status: string) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const newRecords = { ...records };
    filteredStudents.forEach(s => {
      newRecords[s.id] = "Present";
    });
    setRecords(newRecords);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStudent, school_id: schoolId }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => [...prev, { id: data.id, ...newStudent } as Student]);
        setNewStudent({ name: "", class: selectedClass, assessment_number: "", gender: "Male" });
        setShowAdd(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async () => {
    const { id } = confirmDelete;
    try {
      await fetch(`/api/students/${id}?school_id=${schoolId}`, { method: "DELETE" });
      setStudents(prev => prev.filter(s => s.id !== id));
      setConfirmDelete({ id: 0, isOpen: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = Object.entries(records)
      .filter(([id]) => students.find(s => s.id === parseInt(id))?.class === selectedClass)
      .map(([id, status]) => ({
        student_id: parseInt(id),
        status
      }));

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records: payload, school_id: schoolId }),
      });
      setMessage("Attendance saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error saving attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const url = `/api/attendance/download?date=${date}&school_id=${schoolId}&class=${selectedClass}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-bottom border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-blue-950 italic serif">Daily Attendance</h2>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-sm">Mark attendance for your class</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200"
          >
            <PlusCircle size={18} />
            Add Learner
          </button>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSearchParams({ class: e.target.value });
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
            >
              {availableClasses.length > 0 ? (
                availableClasses.map(c => <option key={c} value={c}>{c}</option>)
              ) : (
                <option value="">No classes found</option>
              )}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
            />
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="p-6 bg-slate-50 border-y border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-blue-950 mb-4 uppercase tracking-wider">Quick Add Learner to {selectedClass}</h3>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                placeholder="Full Name"
                required
              />
            </div>
            <div>
              <input
                type="text"
                value={newStudent.assessment_number}
                onChange={(e) => setNewStudent({ ...newStudent, assessment_number: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                placeholder="Assessment #"
                required
              />
            </div>
            <div>
              <select
                value={newStudent.gender}
                onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-950 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg font-semibold text-slate-500 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="px-6 py-4 bg-slate-50 border-y border-slate-200 flex justify-between items-center">
        <span className="text-sm text-slate-500 font-medium">
          Showing {filteredStudents.length} learners in {selectedClass}
        </span>
        <button
          onClick={markAllPresent}
          disabled={filteredStudents.length === 0}
          className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1"
        >
          <CheckCircle2 size={16} />
          Mark All Present
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-blue-950">{student.name}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{student.gender}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, "Present")}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        records[student.id] === "Present" ? "bg-blue-950 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "Absent")}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        records[student.id] === "Absent" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      <XCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "Late")}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        records[student.id] === "Late" ? "bg-blue-950 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      <Clock size={20} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setConfirmDelete({ id: student.id, isOpen: true })}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove Learner"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                  No students found for this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={handleDeleteStudent}
        title="Remove Learner"
        message="Are you sure you want to remove this learner? This will also delete their attendance and progress records."
      />

      <div className="p-6 bg-slate-50 flex items-center justify-between border-b border-slate-200">
        <p className={cn("text-sm font-medium", message.includes("Error") ? "text-red-500" : "text-green-600")}>
          {message}
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            disabled={filteredStudents.length === 0}
            className="bg-white text-blue-950 border border-blue-950 px-8 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <Download size={18} />
            Download List
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || filteredStudents.length === 0}
            className="bg-red-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Daily Analysis Section */}
      <div className="p-8 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-blue-950" size={20} />
          <h3 className="text-lg font-bold text-blue-950 italic serif">Daily Attendance Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Learners</p>
            <p className="text-2xl font-bold text-blue-950">{filteredStudents.length}</p>
          </div>
          
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
            <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider mb-1">Present</p>
            <p className="text-2xl font-bold text-blue-950">
              {filteredStudents.filter(s => records[s.id] === "Present").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-red-100 bg-red-50/30">
            <p className="text-[10px] font-bold text-red-600/60 uppercase tracking-wider mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredStudents.filter(s => records[s.id] === "Absent").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
            <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider mb-1">Late</p>
            <p className="text-2xl font-bold text-amber-600">
              {filteredStudents.filter(s => records[s.id] === "Late").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-950/10 bg-blue-950/5">
            <p className="text-[10px] font-bold text-blue-950/60 uppercase tracking-wider mb-1">Attendance Rate</p>
            <p className="text-2xl font-bold text-blue-950">
              {filteredStudents.length > 0 
                ? Math.round((filteredStudents.filter(s => records[s.id] === "Present" || records[s.id] === "Late").length / filteredStudents.length) * 100)
                : 0}%
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs text-slate-400 italic">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-950" />
            <span>Present/Late counts as attended</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            <span>Absent counts as missed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Syllabus = ({ teacherId, schoolId }: { teacherId: number, schoolId: number }) => {
  console.log("Syllabus component rendered with:", { teacherId, schoolId });
  const [items, setItems] = useState<SyllabusItem[]>([]);
  const [allHistory, setAllHistory] = useState<SyllabusItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("Grade 1");
  const [showAdd, setShowAdd] = useState(false);
  const [newTopic, setNewTopic] = useState({ strand: "Mathematics", topic: "", subject: "", sub_strand: "", taught_by: "", assessed_by: "", term: "Term 1" });
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; isOpen: boolean }>({ id: 0, isOpen: false });
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [topicScores, setTopicScores] = useState<Record<number, string>>({});
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [syllabusMessage, setSyllabusMessage] = useState("");

  const CLASSES = [
    "Play Group", "PP1", "PP2", 
    "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", 
    "Grade 7", "Grade 8", "Grade 9"
  ];

  const fetchHistory = useCallback(() => {
    fetch(`/api/syllabus?school_id=${schoolId}`)
      .then(res => res.json())
      .then(data => setAllHistory(data));
  }, [schoolId]);

  useEffect(() => {
    fetch(`/api/syllabus?school_id=${schoolId}&date=${date}&class=${selectedClass}`)
      .then(res => res.json())
      .then(data => setItems(data));
    fetchHistory();
    fetch(`/api/students?school_id=${schoolId}`).then(res => res.json()).then(data => setStudents(data));
  }, [teacherId, date, selectedClass, schoolId, fetchHistory]);

  useEffect(() => {
    if (selectedTopicId) {
      fetch(`/api/topic-scores?syllabus_id=${selectedTopicId}&school_id=${schoolId}`)
        .then(res => res.json())
        .then(data => {
          const scores: Record<number, string> = {};
          data.forEach((s: any) => scores[s.student_id] = s.score);
          setTopicScores(scores);
        });
    }
  }, [selectedTopicId, schoolId]);

  const toggleStatus = async (id: number, field: "status" | "is_taught" | "is_assessed", currentValue: any) => {
    let newValue;
    if (field === "status") {
      newValue = currentValue === "Covered" ? "Not Covered" : "Covered";
    } else {
      newValue = currentValue === 1 ? 0 : 1;
    }

    try {
      await fetch("/api/syllabus/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: newValue, school_id: schoolId }),
      });
      setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: newValue } : item));
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingTopic(true);
    setSyllabusMessage("");
    try {
      const res = await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...newTopic, 
          topic: newTopic.strand, 
          subject: newTopic.strand,
          teacher_id: teacherId, 
          school_id: schoolId, 
          date, 
          class: selectedClass, 
          is_taught: 0, 
          is_assessed: 0,
          term: newTopic.term
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => [...prev, { id: data.id, ...newTopic, topic: newTopic.strand, date, class: selectedClass, is_taught: 0, is_assessed: 0, status: "Not Covered" } as SyllabusItem]);
        setNewTopic({ strand: "Mathematics", topic: "", subject: "", sub_strand: "", taught_by: "", assessed_by: "", term: "Term 1" });
        setShowAdd(false);
        setSyllabusMessage("Strand added successfully!");
        fetchHistory();
        setTimeout(() => setSyllabusMessage(""), 3000);
      } else {
        setSyllabusMessage("Error: " + (data.message || "Failed to add strand"));
      }
    } catch (err) {
      console.error(err);
      setSyllabusMessage("Error: Failed to connect to server");
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleDeleteTopic = async () => {
    const { id } = confirmDelete;
    try {
      await fetch(`/api/syllabus/${id}?school_id=${schoolId}`, { method: "DELETE" });
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedTopicId === id) setSelectedTopicId(null);
      setConfirmDelete({ id: 0, isOpen: false });
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSyllabusMessage("");
    try {
      const res = await fetch("/api/syllabus/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingItem.id, 
          strand: editingItem.strand, 
          topic: editingItem.strand,
          subject: editingItem.strand,
          sub_strand: editingItem.sub_strand,
          date: editingItem.date,
          class: editingItem.class,
          school_id: schoolId,
          taught_by: editingItem.taught_by,
          assessed_by: editingItem.assessed_by
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(item => item.id === editingItem.id ? { ...editingItem, topic: editingItem.strand } : item));
        setEditingItem(null);
        setSyllabusMessage("Strand updated successfully!");
        fetchHistory();
        setTimeout(() => setSyllabusMessage(""), 3000);
      } else {
        setSyllabusMessage("Error: " + (data.message || "Failed to update strand"));
      }
    } catch (err) {
      console.error(err);
      setSyllabusMessage("Error: Failed to connect to server");
    }
  };

  const handleSaveAsNew = async () => {
    if (!editingItem) return;
    setIsAddingTopic(true);
    setSyllabusMessage("");
    try {
      const res = await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          strand: editingItem.strand,
          topic: editingItem.strand,
          subject: editingItem.strand,
          sub_strand: editingItem.sub_strand,
          teacher_id: teacherId, 
          school_id: schoolId, 
          date: editingItem.date, 
          class: editingItem.class, 
          is_taught: 0, 
          is_assessed: 0,
          taught_by: editingItem.taught_by,
          assessed_by: editingItem.assessed_by
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => [...prev, { 
          id: data.id, 
          strand: editingItem.strand,
          topic: editingItem.strand,
          sub_strand: editingItem.sub_strand,
          date: editingItem.date, 
          class: editingItem.class, 
          is_taught: 0, 
          is_assessed: 0, 
          status: "Not Covered",
          taught_by: editingItem.taught_by,
          assessed_by: editingItem.assessed_by
        } as SyllabusItem]);
        setEditingItem(null);
        setSyllabusMessage("Strand added as new successfully!");
        fetchHistory();
        setTimeout(() => setSyllabusMessage(""), 3000);
      } else {
        setSyllabusMessage("Error: " + (data.message || "Failed to add strand"));
      }
    } catch (err) {
      console.error(err);
      setSyllabusMessage("Error: Failed to connect to server");
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleSaveScores = async () => {
    if (!selectedTopicId) return;
    setIsSavingScores(true);
    const scores = Object.entries(topicScores).map(([studentId, score]) => ({
      student_id: parseInt(studentId),
      score
    }));

    try {
      await fetch("/api/topic-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabus_id: selectedTopicId, scores, school_id: schoolId }),
      });
      setSyllabusMessage("Scores saved successfully!");
      setTimeout(() => setSyllabusMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSyllabusMessage("Error saving scores");
      setTimeout(() => setSyllabusMessage(""), 3000);
    } finally {
      setIsSavingScores(false);
    }
  };

  const handleDownloadSyllabus = () => {
    const url = `/api/syllabus/download?school_id=${schoolId}&class=${selectedClass}&date=${date}`;
    window.open(url, "_blank");
  };

  const handleDownloadAssessment = () => {
    if (!selectedTopicId) return;
    const url = `/api/topic-scores/download?syllabus_id=${selectedTopicId}&school_id=${schoolId}`;
    window.open(url, "_blank");
  };

  const coveredCount = items.filter(i => i.status === "Covered").length;
  const progressPercent = items.length > 0 ? Math.round((coveredCount / items.length) * 100) : 0;
  const filteredStudents = students.filter(s => s.class === selectedClass);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-blue-950 italic serif">Strand Tracker</h2>
            <p className="text-slate-500 text-sm">Track strands and assessments by date</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>
            <button
              onClick={handleDownloadSyllabus}
              className="bg-white text-blue-950 border border-blue-950 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download size={18} />
              Download List
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200 cursor-pointer"
            >
              <PlusCircle size={18} />
              Add Strand
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-blue-950 h-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xl font-bold text-blue-950">{progressPercent}%</span>
        </div>
        <p className="text-slate-500 text-sm">{coveredCount} of {items.length} topics covered for this date</p>
        {syllabusMessage && (
          <p className={cn(
            "mt-4 text-sm font-medium animate-in fade-in duration-300",
            syllabusMessage.includes("Error") ? "text-red-500" : "text-green-600"
          )}>
            {syllabusMessage}
          </p>
        )}
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddTopic} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Strand</label>
              <input
                type="text"
                value={newTopic.strand}
                onChange={(e) => setNewTopic({ ...newTopic, strand: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="e.g. Mathematics"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sub-strand</label>
              <input
                type="text"
                value={newTopic.sub_strand}
                onChange={(e) => setNewTopic({ ...newTopic, sub_strand: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="e.g. Limits"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
              <select
                value={newTopic.term}
                onChange={(e) => setNewTopic({ ...newTopic, term: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taught By</label>
              <input
                type="text"
                value={newTopic.taught_by}
                onChange={(e) => setNewTopic({ ...newTopic, taught_by: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Teacher Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assessed By</label>
              <input
                type="text"
                value={newTopic.assessed_by}
                onChange={(e) => setNewTopic({ ...newTopic, assessed_by: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Teacher Name"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-6 py-2 rounded-lg font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingTopic}
                className="bg-blue-950 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {isAddingTopic ? "Adding..." : "Add Strand"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Strand</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Sub-strand</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Taught By</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Assessed By</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Taught</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Assessed</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer",
                      selectedTopicId === item.id && "bg-blue-50 hover:bg-blue-50"
                    )}
                    onClick={() => setSelectedTopicId(item.id)}
                  >
                    <td className="px-6 py-4 font-medium text-blue-950">{item.strand}</td>
                    <td className="px-6 py-4 text-slate-500">{item.sub_strand}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{item.class}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.taught_by || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.assessed_by || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, "is_taught", item.is_taught); }}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          item.is_taught === 1 ? "bg-blue-950 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, "is_assessed", item.is_assessed); }}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          item.is_assessed === 1 ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, "status", item.status); }}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold transition-all uppercase",
                          item.status === "Covered" 
                            ? "bg-blue-950 text-white" 
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {item.status}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                        className="p-1 text-slate-400 hover:text-blue-950 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: item.id, isOpen: true }); }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Topic"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                      No strands scheduled for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider">Learner Scores</h3>
            {selectedTopicId && (
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadAssessment}
                  className="bg-white text-blue-950 border border-blue-950 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={handleSaveScores}
                  disabled={isSavingScores}
                  className="bg-blue-950 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors flex items-center gap-1 shadow-md shadow-blue-100 disabled:opacity-50"
                >
                  <Save size={14} />
                  {isSavingScores ? "Saving..." : "Save Scores"}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {!selectedTopicId ? (
              <div className="p-8 text-center text-slate-400 text-sm italic">
                Select a topic to enter learner scores
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <div key={student.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-blue-950 truncate">{student.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{student.class}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {["BE", "AE", "ME", "EE"].map(level => (
                        <button
                          key={level}
                          onClick={() => setTopicScores(prev => ({ ...prev, [student.id]: level }))}
                          className={cn(
                            "w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold transition-all border",
                            topicScores[student.id] === level
                              ? "bg-blue-950 text-white border-blue-950"
                              : "bg-white text-slate-400 border-slate-200 hover:border-blue-950"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-blue-950 italic serif">Complete History (Filled or Edited Strands)</h3>
          <p className="text-slate-500 text-sm">A full list of all strands recorded for this school</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Strand</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Sub-strand</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Taught/Assessed</th>
              </tr>
            </thead>
            <tbody>
              {allHistory.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.date}</td>
                  <td className="px-6 py-4 font-medium text-blue-950">{item.strand}</td>
                  <td className="px-6 py-4 text-slate-500">{item.sub_strand}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{item.class}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      item.status === "Covered" ? "bg-blue-950 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {item.is_taught === 1 && <span className="text-[10px] font-bold text-blue-950 bg-blue-50 px-2 py-1 rounded border border-blue-100">TAUGHT</span>}
                      {item.is_assessed === 1 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">ASSESSED</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {allHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={handleDeleteTopic}
        title="Remove Strand"
        message="Are you sure you want to remove this strand from the tracker?"
      />

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-blue-950 mb-4 italic serif">Edit Strand Details</h3>
              <form onSubmit={handleUpdateTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Strand</label>
                  <input
                    type="text"
                    value={editingItem.strand}
                    onChange={(e) => setEditingItem({ ...editingItem, strand: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-strand</label>
                  <input
                    type="text"
                    value={editingItem.sub_strand}
                    onChange={(e) => setEditingItem({ ...editingItem, sub_strand: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taught By</label>
                  <input
                    type="text"
                    value={editingItem.taught_by || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, taught_by: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assessed By</label>
                  <input
                    type="text"
                    value={editingItem.assessed_by || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, assessed_by: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                  <select
                    value={editingItem.class}
                    onChange={(e) => setEditingItem({ ...editingItem, class: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                  >
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                    required
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    disabled={isAddingTopic}
                    className="px-4 py-2 rounded-lg font-semibold bg-slate-100 text-blue-950 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {isAddingTopic ? "Adding..." : "Add as New"}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg font-semibold bg-blue-950 text-white hover:bg-blue-900 transition-colors shadow-lg shadow-blue-200"
                  >
                    Save Changes
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

const Students = ({ schoolId }: { schoolId: number }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", class: "Grade 1", assessment_number: "", gender: "Male" });
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; isOpen: boolean }>({ id: 0, isOpen: false });
  const navigate = useNavigate();

  const CLASSES = [
    "Play Group", "PP1", "PP2", 
    "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", 
    "Grade 7", "Grade 8", "Grade 9"
  ];

  useEffect(() => {
    fetch(`/api/students?school_id=${schoolId}`).then(res => res.json()).then(data => setStudents(data));
  }, [schoolId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStudent, school_id: schoolId }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => [...prev, { id: data.id, ...newStudent } as Student]);
        setNewStudent({ name: "", class: "Grade 1", assessment_number: "", gender: "Male" });
        setShowAdd(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async () => {
    const { id } = confirmDelete;
    try {
      await fetch(`/api/students/${id}?school_id=${schoolId}`, { method: "DELETE" });
      setStudents(prev => prev.filter(s => s.id !== id));
      setConfirmDelete({ id: 0, isOpen: false });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-blue-950 italic serif">Learner Management</h2>
          <p className="text-slate-500 text-sm">Manage students and classes</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200"
        >
          <PlusCircle size={18} />
          Add Learner
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Number</label>
              <input
                type="text"
                value={newStudent.assessment_number}
                onChange={(e) => setNewStudent({ ...newStudent, assessment_number: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="e.g. ASS-2026-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={newStudent.gender}
                onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <select
                value={newStudent.class}
                onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950"
                required
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-6 py-2 rounded-lg font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-950 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
              >
                Save Learner
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Learner Name</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Assessment #</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Class</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-400 text-xs font-mono">#{student.id.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4 font-medium text-blue-950">{student.name}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{student.gender}</td>
                <td className="px-6 py-4 text-slate-500 font-mono text-sm">{student.assessment_number}</td>
                <td className="px-6 py-4 text-slate-500">{student.class}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/attendance?class=${student.class}`)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
                    >
                      <Clock size={16} />
                      Register
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: student.id, isOpen: true })}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={handleDeleteStudent}
        title="Remove Learner"
        message="Are you sure you want to remove this learner? This will also delete their attendance and progress records."
      />
    </div>
  );
};

const SystemMonitor = ({ schoolId }: { schoolId: number }) => {
  const [stats, setStats] = useState<any>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);

  useEffect(() => {
    fetch(`/api/stats?school_id=${schoolId}`).then(res => res.json()).then(data => setStats(data));
    fetch(`/api/progress?school_id=${schoolId}`).then(res => res.json()).then(data => setProgress(data));
  }, [schoolId]);

  if (!stats) return <div className="p-8">Loading system data...</div>;

  const genderData = stats.genderStats?.map((g: any) => ({ name: g.gender, value: g.count })) || [];
  const GENDER_COLORS = ["#172554", "#dc2626", "#94a3b8"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-950 italic serif">Major System Monitor</h2>
          <p className="text-slate-500">Global institutional performance overview</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-lg text-sm font-bold">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live Monitoring Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase mb-2">Total Learners</p>
          <p className="text-3xl font-bold text-blue-950">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase mb-2">Global Avg Marks</p>
          <p className="text-3xl font-bold text-blue-950">{stats.avgMarks.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-blue-950 mb-6 italic serif">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {genderData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-blue-950 mb-6 italic serif">Institutional Progress</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="student_name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="marks" fill="#172554" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ProgressRecords = ({ schoolId }: { schoolId: number }) => {
  const [records, setRecords] = useState<SyllabusItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("All");

  useEffect(() => {
    fetch(`/api/syllabus?school_id=${schoolId}`).then(res => res.json()).then(data => setRecords(data));
  }, [schoolId]);

  const handleDownload = () => {
    const url = `/api/syllabus/download?school_id=${schoolId}&class=${selectedClass}`;
    window.open(url, "_blank");
  };

  const CLASSES = [
    "All", "Play Group", "PP1", "PP2", 
    "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", 
    "Grade 7", "Grade 8", "Grade 9"
  ];

  const groupedByClass = records.reduce((acc, record) => {
    const className = record.class || "Unassigned";
    if (!acc[className]) acc[className] = [];
    acc[className].push(record);
    return acc;
  }, {} as Record<string, SyllabusItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-blue-950 italic serif">Progress Records</h2>
          <p className="text-slate-500 text-sm">View teaching progress records</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm"
          >
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleDownload}
            className="bg-white text-blue-950 border border-blue-950 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={16} />
            Download Report
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {(Object.entries(groupedByClass) as [string, SyllabusItem[]][])
          .filter(([className]) => selectedClass === "All" || className === selectedClass)
          .map(([className, classRecords]) => (
            <div key={className} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-blue-950 uppercase tracking-widest">{className}</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strand</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-strand</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Taught</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRecords.map(record => (
                      <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-blue-950">{record.teacher_name || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{record.subject || record.strand}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{record.strand}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{record.sub_strand || "-"}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{record.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{record.term || "Term 1"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        {Object.keys(groupedByClass).length === 0 && (
          <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
            No progress records found.
          </div>
        )}
      </div>
    </div>
  );
};

const SelfAttendance = ({ teacherId, schoolId }: { teacherId: number, schoolId: number }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [status, setStatus] = useState("Present");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchRecords = useCallback(() => {
    fetch(`/api/staff-attendance/self?teacher_id=${teacherId}&school_id=${schoolId}`)
      .then(res => res.json())
      .then(data => setRecords(data));
  }, [teacherId, schoolId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async () => {
    setLoading(true);
    const date = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch("/api/staff-attendance/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, date, status, school_id: schoolId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Attendance marked successfully!");
        fetchRecords();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Error marking attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-blue-950 italic serif mb-2">My Daily Attendance</h2>
        <p className="text-slate-500 text-sm mb-6">Mark your attendance for today: {new Date().toLocaleDateString()}</p>

        <div className="flex flex-wrap items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm font-semibold text-blue-950"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Duty">Duty</option>
          </select>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-950 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Marking..." : "Mark Attendance"}
          </button>
        </div>

        {message && (
          <p className={cn("mt-4 text-sm font-medium", message.includes("Error") ? "text-red-500" : "text-green-600")}>
            {message}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-blue-950 italic serif">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-blue-950">{record.date}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      record.status === "Present" ? "bg-green-100 text-green-700" :
                      record.status === "Absent" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StaffAttendance = ({ schoolId, currentTeacherId }: { schoolId: number, currentTeacherId: number }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/teachers?school_id=${schoolId}`).then(res => res.json()).then(data => setTeachers(data));
    fetch(`/api/staff-attendance?date=${date}&school_id=${schoolId}`)
      .then(res => res.json())
      .then(data => {
        const initial: Record<number, string> = {};
        data.forEach((r: any) => initial[r.teacher_id] = r.status);
        setRecords(initial);
      });
  }, [date, schoolId]);

  const handleStatusChange = (teacherId: number, status: string) => {
    setRecords(prev => ({ ...prev, [teacherId]: status }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = Object.entries(records).map(([id, status]) => ({
      teacher_id: parseInt(id),
      status
    }));

    try {
      await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records: payload, school_id: schoolId }),
      });
      setMessage("Staff attendance saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error saving attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const url = `/api/staff-attendance/download?date=${date}&school_id=${schoolId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-blue-950 italic serif">Staff Attendance</h2>
          <p className="text-slate-500 text-sm">Record daily attendance for teachers</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm font-semibold text-blue-950"
          />
          <button
            onClick={handleDownload}
            className="bg-white text-blue-950 border border-blue-950 px-6 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={18} />
            Download List
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-950 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-950 border-b border-blue-100 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Teacher Name</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-blue-950">
                  {t.name} {t.id === currentTeacherId && <span className="text-[10px] text-blue-500 ml-2">(You)</span>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{t.email}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {["Present", "Absent", "Late", "On Leave"].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(t.id, status)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border",
                          records[t.id] === status
                            ? "bg-blue-950 text-white border-blue-950"
                            : "bg-white text-slate-400 border-slate-200 hover:border-blue-950"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Analysis Section */}
      <div className="p-8 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-blue-950" size={20} />
          <h3 className="text-lg font-bold text-blue-950 italic serif">Daily Staff Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Staff</p>
            <p className="text-2xl font-bold text-blue-950">{teachers.length}</p>
          </div>
          
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
            <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider mb-1">Present</p>
            <p className="text-2xl font-bold text-blue-950">
              {teachers.filter(t => records[t.id] === "Present").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-red-100 bg-red-50/30">
            <p className="text-[10px] font-bold text-red-600/60 uppercase tracking-wider mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-600">
              {teachers.filter(t => records[t.id] === "Absent").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
            <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider mb-1">Late</p>
            <p className="text-2xl font-bold text-amber-600">
              {teachers.filter(t => records[t.id] === "Late").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30">
            <p className="text-[10px] font-bold text-purple-600/60 uppercase tracking-wider mb-1">On Leave</p>
            <p className="text-2xl font-bold text-purple-600">
              {teachers.filter(t => records[t.id] === "On Leave").length}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-950/10 bg-blue-950/5">
            <p className="text-[10px] font-bold text-blue-950/60 uppercase tracking-wider mb-1">Attendance Rate</p>
            <p className="text-2xl font-bold text-blue-950">
              {teachers.length > 0 
                ? Math.round((teachers.filter(t => records[t.id] === "Present" || records[t.id] === "Late").length / teachers.length) * 100)
                : 0}%
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs text-slate-400 italic">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-950" />
            <span>Present/Late counts as active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-600" />
            <span>On Leave counts as excused</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Reports = ({ schoolId, teacher }: { schoolId: number, teacher: Teacher }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<SyllabusItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [reportType, setReportType] = useState<"progress" | "learners" | "assessment" | "subject_tracking" | "attendance" | "staff_attendance">("progress");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch(`/api/students?school_id=${schoolId}`).then(res => res.json()).then(data => setStudents(data));
    fetch(`/api/syllabus?school_id=${schoolId}`).then(res => res.json()).then(data => setProgress(data));
  }, [schoolId]);

  const CLASSES = [
    "All", "Play Group", "PP1", "PP2", 
    "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", 
    "Grade 7", "Grade 8", "Grade 9"
  ];

  const groupedByClass = progress.reduce((acc, record) => {
    const className = record.class || "Unassigned";
    if (!acc[className]) acc[className] = [];
    acc[className].push(record);
    return acc;
  }, {} as Record<string, SyllabusItem[]>);

  const exportToExcel = () => {
    if (reportType === "attendance") {
      window.open(`/api/attendance/download?date=${date}&school_id=${schoolId}`, "_blank");
      return;
    }
    if (reportType === "staff_attendance") {
      window.open(`/api/staff-attendance/download?date=${date}&school_id=${schoolId}`, "_blank");
      return;
    }

    let dataToExport: any[] = [];
    let fileName = "";
    let sheetName = "";

    if (reportType === "progress") {
      dataToExport = progress;
      fileName = "Progress_Records_Report.xlsx";
      sheetName = "Progress Records";
    } else if (reportType === "learners") {
      dataToExport = students;
      fileName = "Learners_Roll.xlsx";
      sheetName = "Learners Roll";
    } else if (reportType === "assessment") {
      dataToExport = progress.filter(p => p.is_assessed === 1);
      fileName = "Assessment_Documentation.xlsx";
      sheetName = "Assessment Documentation";
    } else if (reportType === "subject_tracking") {
      dataToExport = progress.sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
      fileName = "Subject_Tracking_Documents.xlsx";
      sheetName = "Subject Tracking";
    }

    const now = new Date().toLocaleString();
    const dataWithDate = dataToExport.map(item => ({ ...item, "Report Date": now }));

    const worksheet = XLSX.utils.json_to_sheet(dataWithDate);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    if (reportType === "attendance") {
      window.open(`/api/attendance/download?date=${date}&school_id=${schoolId}`, "_blank");
      return;
    }
    if (reportType === "staff_attendance") {
      window.open(`/api/staff-attendance/download?date=${date}&school_id=${schoolId}`, "_blank");
      return;
    }

    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    
    if (reportType === "progress") {
      doc.text("Progress Records Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${now}`, 14, 22);
      (doc as any).autoTable({
        startY: 25,
        head: [["Teacher", "Subject", "Strand", "Sub-strand", "Date Taught", "Term"]],
        body: progress.map(p => [p.teacher_name || "N/A", p.subject || p.strand, p.strand, p.sub_strand || "-", p.date, p.term || "Term 1"]),
      });
      doc.save("Progress_Records_Report.pdf");
    } else if (reportType === "learners") {
      doc.text("Learners Roll", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${now}`, 14, 22);
      (doc as any).autoTable({
        startY: 25,
        head: [["Name", "Class", "Assessment #", "Gender"]],
        body: students.map(s => [s.name, s.class, s.assessment_number, s.gender]),
      });
      doc.save("Learners_Roll.pdf");
    } else if (reportType === "assessment") {
      doc.text("Assessment Documentation", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${now}`, 14, 22);
      (doc as any).autoTable({
        startY: 25,
        head: [["Strand", "Sub-strand", "Class", "Assessed By", "Date"]],
        body: progress.filter(p => p.is_assessed === 1).map(p => [p.strand, p.sub_strand || "-", p.class, p.assessed_by || "-", p.date]),
      });
      doc.save("Assessment_Documentation.pdf");
    } else if (reportType === "subject_tracking") {
      doc.text("Subject Tracking Documents", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${now}`, 14, 22);
      (doc as any).autoTable({
        startY: 25,
        head: [["Subject", "Strand", "Sub-strand", "Class", "Status"]],
        body: progress.sort((a, b) => (a.subject || "").localeCompare(b.subject || "")).map(p => [p.subject || p.strand, p.strand, p.sub_strand || "-", p.class, p.status]),
      });
      doc.save("Subject_Tracking_Documents.pdf");
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-blue-950 italic serif">Reports & Analytics</h2>
            <p className="text-slate-500 text-sm">Choose document type and export format</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm font-semibold text-blue-950"
            >
              <option value="progress">Progress Records</option>
              <option value="learners">Learners Roll</option>
              <option value="assessment">Assessment Documentation</option>
              <option value="subject_tracking">Subject Tracking Documents</option>
              <option value="attendance">Daily Learner Attendance</option>
              <option value="staff_attendance">Daily Staff Attendance</option>
            </select>

            {(reportType === "attendance" || reportType === "staff_attendance") && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-blue-950 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                <FileSpreadsheet size={18} />
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-blue-950 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                <FileJson size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-blue-950 font-bold text-2xl">{students.length}</p>
            <p className="text-blue-900/60 text-xs uppercase font-bold tracking-wider">Total Learners</p>
          </div>
          <div className="p-6 bg-red-50 rounded-xl border border-red-100">
            <p className="text-red-600 font-bold text-2xl">{progress.length}</p>
            <p className="text-red-600/60 text-xs uppercase font-bold tracking-wider">Progress Records</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-blue-950 italic serif">Master Sheet (Class-wise)</h3>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-950 text-sm"
          >
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-8">
          {(Object.entries(groupedByClass) as [string, SyllabusItem[]][])
            .filter(([className]) => selectedClass === "All" || className === selectedClass)
            .map(([className, records]) => (
              <div key={className} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{className}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strand</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-strand</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Taught</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => (
                        <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-blue-950">{record.teacher_name || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{record.subject || record.strand}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{record.strand}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{record.sub_strand || "-"}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{record.date}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{record.term || "Term 1"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          {Object.keys(groupedByClass).length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">
              No progress records found.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-blue-950 mb-6 italic serif">Teaching Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="strand" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="is_taught" fill="#172554" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [teacher, setTeacher] = useState<Teacher | null>(() => {
    const saved = localStorage.getItem("teacher");
    return saved ? JSON.parse(saved) : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogin = (t: Teacher) => {
    setTeacher(t);
    localStorage.setItem("teacher", JSON.stringify(t));
  };

  const handleLogout = () => {
    setTeacher(null);
    localStorage.removeItem("teacher");
  };

  if (!teacher) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className={cn(
          "bg-blue-950 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}>
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && <span className="text-xl font-bold tracking-tighter italic text-red-600">CIS Management System</span>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-blue-900 rounded">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={isSidebarOpen} />
            <SidebarLink to="/students" icon={<Users size={20} />} label="Learners" isOpen={isSidebarOpen} />
            {teacher.role === 'admin' && (
              <SidebarLink to="/teachers" icon={<ShieldCheck size={20} />} label="Teachers" isOpen={isSidebarOpen} />
            )}
            <SidebarLink to="/attendance" icon={<Clock size={20} />} label="Learner Attendance" isOpen={isSidebarOpen} />
            <SidebarLink to="/self-attendance" icon={<UserCheck size={20} />} label="My Attendance" isOpen={isSidebarOpen} />
            <SidebarLink to="/staff-attendance" icon={<Clock size={20} />} label="Staff Attendance" isOpen={isSidebarOpen} />
            <SidebarLink to="/syllabus" icon={<BookOpen size={20} />} label="Strand Tracker" isOpen={isSidebarOpen} />
            <SidebarLink to="/progress" icon={<BarChart3 size={20} />} label="Progress Records" isOpen={isSidebarOpen} />
            <SidebarLink to="/monitor" icon={<LayoutDashboard size={20} />} label="System Monitor" isOpen={isSidebarOpen} />
            <SidebarLink to="/reports" icon={<Download size={20} />} label="Reports" isOpen={isSidebarOpen} />
          </nav>

          <div className="p-4 border-t border-blue-900">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white hover:bg-blue-900 rounded-lg transition-all"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          isSidebarOpen ? "ml-64" : "ml-20"
        )}>
          <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
            <h1 className="text-lg font-semibold text-blue-950">Welcome Teacher {teacher.name}</h1>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs border border-red-600">
                {teacher.name.charAt(0)}
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard schoolId={teacher.school_id} />} />
              <Route path="/students" element={<Students schoolId={teacher.school_id} />} />
              {teacher.role === 'admin' && (
                <Route path="/teachers" element={<Teachers schoolId={teacher.school_id} />} />
              )}
              <Route path="/attendance" element={<Attendance schoolId={teacher.school_id} />} />
              <Route path="/self-attendance" element={<SelfAttendance teacherId={teacher.id} schoolId={teacher.school_id} />} />
              <Route path="/staff-attendance" element={<StaffAttendance schoolId={teacher.school_id} currentTeacherId={teacher.id} />} />
              <Route path="/syllabus" element={<Syllabus teacherId={teacher.id} schoolId={teacher.school_id} />} />
              <Route path="/progress" element={<ProgressRecords schoolId={teacher.school_id} />} />
              <Route path="/monitor" element={<SystemMonitor schoolId={teacher.school_id} />} />
              <Route path="/reports" element={<Reports schoolId={teacher.school_id} teacher={teacher} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

function SidebarLink({ to, icon, label, isOpen }: { to: string, icon: React.ReactNode, label: string, isOpen: boolean }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white hover:bg-blue-900 rounded-lg transition-all group"
    >
      <div className="group-hover:scale-110 transition-transform group-hover:text-red-500">{icon}</div>
      {isOpen && <span className="font-medium">{label}</span>}
    </Link>
  );
}
