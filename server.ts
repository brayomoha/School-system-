import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("school.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'teacher',
    is_class_teacher INTEGER DEFAULT 0,
    school_id INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
`);

try {
  db.prepare("ALTER TABLE teachers ADD COLUMN role TEXT DEFAULT 'teacher'").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE teachers ADD COLUMN is_class_teacher INTEGER DEFAULT 0").run();
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    assessment_number TEXT,
    gender TEXT,
    school_id INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    school_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );

  CREATE TABLE IF NOT EXISTS staff_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    school_id INTEGER NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );

  CREATE TABLE IF NOT EXISTS syllabus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strand TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT,
    sub_strand TEXT,
    teacher_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    class TEXT,
    date TEXT,
    is_taught INTEGER DEFAULT 0,
    is_assessed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Not Covered',
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );

  CREATE TABLE IF NOT EXISTS topic_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    syllabus_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    score TEXT,
    school_id INTEGER NOT NULL,
    FOREIGN KEY (syllabus_id) REFERENCES syllabus(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    term TEXT NOT NULL,
    marks INTEGER NOT NULL,
    comments TEXT,
    school_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
`);

// Seed initial data if empty
const teacherCount = db.prepare("SELECT COUNT(*) as count FROM teachers").get() as { count: number };
if (teacherCount.count === 0) {
  db.prepare("INSERT INTO schools (name) VALUES (?)").run("Default School");
  db.prepare("INSERT INTO teachers (name, email, password, school_id) VALUES (?, ?, ?, ?)").run("Admin Teacher", "teacher@school.com", "password123", 1);
  
  const topics = [
    { strand: "Mathematics", topic: "Algebra", sub_strand: "Equations" },
    { strand: "Mathematics", topic: "Geometry", sub_strand: "Shapes" },
    { strand: "Mathematics", topic: "Calculus", sub_strand: "Derivatives" },
    { strand: "Science", topic: "Physics", sub_strand: "Force" },
    { strand: "Science", topic: "Chemistry", sub_strand: "Atoms" }
  ];
  const insertTopic = db.prepare("INSERT INTO syllabus (strand, topic, sub_strand, teacher_id, school_id) VALUES (?, ?, ?, ?, ?)");
  topics.forEach(t => insertTopic.run(t.strand, t.topic, t.sub_strand, 1, 1));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const teacher = db.prepare("SELECT t.*, s.name as school_name FROM teachers t JOIN schools s ON t.school_id = s.id WHERE t.email = ? AND t.password = ?").get(email, password) as any;
    if (teacher) {
      res.json({ success: true, teacher: { id: teacher.id, name: teacher.name, email: teacher.email, school_id: teacher.school_id, school_name: teacher.school_name, role: teacher.role, is_class_teacher: teacher.is_class_teacher } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.get("/api/students", (req, res) => {
    const { school_id } = req.query;
    const students = db.prepare("SELECT * FROM students WHERE school_id = ?").all(school_id);
    res.json(students);
  });

  app.get("/api/teachers", (req, res) => {
    const { school_id } = req.query;
    const teachers = db.prepare("SELECT id, name, email, role, is_class_teacher, school_id FROM teachers WHERE school_id = ?").all(school_id);
    res.json(teachers);
  });

  app.post("/api/teachers", (req, res) => {
    try {
      const { name, email, password, role, is_class_teacher, school_id } = req.body;
      const result = db.prepare("INSERT INTO teachers (name, email, password, role, is_class_teacher, school_id) VALUES (?, ?, ?, ?, ?, ?)").run(name, email, password, role || 'teacher', is_class_teacher ? 1 : 0, school_id);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  app.delete("/api/teachers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { school_id } = req.query;
      db.prepare("DELETE FROM teachers WHERE id = ? AND school_id = ?").run(id, school_id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  app.post("/api/students", (req, res) => {
    try {
      const { name, class: className, assessment_number, gender, school_id } = req.body;
      const result = db.prepare("INSERT INTO students (name, class, assessment_number, gender, school_id) VALUES (?, ?, ?, ?, ?)").run(name, className, assessment_number, gender, school_id);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  app.delete("/api/students/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { school_id } = req.query;
      // Verify ownership
      const student = db.prepare("SELECT * FROM students WHERE id = ? AND school_id = ?").get(id, school_id);
      if (!student) return res.status(403).json({ success: false, message: "Forbidden" });

      db.prepare("DELETE FROM attendance WHERE student_id = ?").run(id);
      db.prepare("DELETE FROM progress WHERE student_id = ?").run(id);
      db.prepare("DELETE FROM students WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  app.get("/api/attendance", (req, res) => {
    const { date, school_id } = req.query;
    const attendance = db.prepare("SELECT * FROM attendance WHERE date = ? AND school_id = ?").all(date, school_id);
    res.json(attendance);
  });

  app.get("/api/attendance/download", (req, res) => {
    const { date, school_id, class: className } = req.query;
    let query = `
      SELECT s.name, s.class, s.assessment_number, COALESCE(a.status, 'Not Marked') as status
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      WHERE s.school_id = ?
    `;
    const params = [date, school_id];
    if (className) {
      query += " AND s.class = ?";
      params.push(className);
    }

    const records = db.prepare(query).all(...params) as any[];
    
    let csv = "Date,Name,Class,Assessment Number,Status\n";
    records.forEach(r => {
      csv += `"${date}","${r.name}","${r.class}","${r.assessment_number || ''}","${r.status}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=attendance_${date}.csv`);
    res.send(csv);
  });

  app.post("/api/attendance", (req, res) => {
    const { date, records, school_id } = req.body;
    const deleteExisting = db.prepare("DELETE FROM attendance WHERE date = ? AND school_id = ?");
    const insertRecord = db.prepare("INSERT INTO attendance (student_id, date, status, school_id) VALUES (?, ?, ?, ?)");
    
    const transaction = db.transaction((recs) => {
      deleteExisting.run(date, school_id);
      recs.forEach((r: any) => insertRecord.run(r.student_id, date, r.status, school_id));
    });
    
    transaction(records);
    res.json({ success: true });
  });

  app.post("/api/staff-attendance/self", (req, res) => {
    const { teacher_id, date, status, school_id } = req.body;
    try {
      // Delete existing record for the same day if any
      db.prepare("DELETE FROM staff_attendance WHERE teacher_id = ? AND date = ? AND school_id = ?").run(teacher_id, date, school_id);
      // Insert new record
      db.prepare("INSERT INTO staff_attendance (teacher_id, date, status, school_id) VALUES (?, ?, ?, ?)").run(teacher_id, date, status, school_id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Database error" });
    }
  });

  app.get("/api/staff-attendance/self", (req, res) => {
    const { teacher_id, school_id } = req.query;
    try {
      const records = db.prepare("SELECT * FROM staff_attendance WHERE teacher_id = ? AND school_id = ? ORDER BY date DESC LIMIT 30").all(teacher_id, school_id);
      res.json(records);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Database error" });
    }
  });

  app.get("/api/staff-attendance", (req, res) => {
    const { date, school_id } = req.query;
    const attendance = db.prepare("SELECT * FROM staff_attendance WHERE date = ? AND school_id = ?").all(date, school_id);
    res.json(attendance);
  });

  app.get("/api/staff-attendance/download", (req, res) => {
    const { date, school_id } = req.query;
    const query = `
      SELECT t.name, t.email, COALESCE(sa.status, 'Not Marked') as status
      FROM teachers t
      LEFT JOIN staff_attendance sa ON t.id = sa.teacher_id AND sa.date = ?
      WHERE t.school_id = ?
    `;
    const records = db.prepare(query).all(date, school_id) as any[];

    let csv = "Date,Name,Email,Status\n";
    records.forEach(r => {
      csv += `"${date}","${r.name}","${r.email}","${r.status}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=staff_attendance_${date}.csv`);
    res.send(csv);
  });

  app.post("/api/staff-attendance", (req, res) => {
    const { date, records, school_id } = req.body; // records: [{teacher_id, status}]
    const deleteExisting = db.prepare("DELETE FROM staff_attendance WHERE date = ? AND school_id = ?");
    const insertRecord = db.prepare("INSERT INTO staff_attendance (teacher_id, date, status, school_id) VALUES (?, ?, ?, ?)");
    
    const transaction = db.transaction((recs) => {
      deleteExisting.run(date, school_id);
      recs.forEach((r: any) => insertRecord.run(r.teacher_id, date, r.status, school_id));
    });
    
    transaction(records);
    res.json({ success: true });
  });

  // Helper to add columns if they don't exist
  const addColumnIfNotExists = (table: string, column: string, type: string) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    } catch (e) {
      // Column likely already exists
    }
  };

  addColumnIfNotExists("teachers", "school_id", "INTEGER");
  addColumnIfNotExists("students", "school_id", "INTEGER");
  addColumnIfNotExists("attendance", "school_id", "INTEGER");
  addColumnIfNotExists("topic_scores", "school_id", "INTEGER");
  addColumnIfNotExists("progress", "school_id", "INTEGER");
  addColumnIfNotExists("staff_attendance", "school_id", "INTEGER");
  addColumnIfNotExists("syllabus", "date", "TEXT");
  addColumnIfNotExists("syllabus", "is_taught", "INTEGER DEFAULT 0");
  addColumnIfNotExists("syllabus", "is_assessed", "INTEGER DEFAULT 0");
  addColumnIfNotExists("syllabus", "class", "TEXT");
  addColumnIfNotExists("syllabus", "school_id", "INTEGER");
  addColumnIfNotExists("syllabus", "strand", "TEXT");
  addColumnIfNotExists("syllabus", "subject", "TEXT");
  addColumnIfNotExists("syllabus", "sub_strand", "TEXT");
  addColumnIfNotExists("syllabus", "taught_by", "TEXT");
  addColumnIfNotExists("syllabus", "assessed_by", "TEXT");
  addColumnIfNotExists("syllabus", "term", "TEXT DEFAULT 'Term 1'");

  app.get("/api/syllabus", (req, res) => {
    const { teacher_id, date, class: className, school_id } = req.query;
    let query = "SELECT s.*, t.name as teacher_name FROM syllabus s JOIN teachers t ON s.teacher_id = t.id WHERE s.school_id = ?";
    let params = [school_id];
    if (teacher_id) {
      query += " AND s.teacher_id = ?";
      params.push(teacher_id as string);
    }
    if (date) {
      query += " AND s.date = ?";
      params.push(date as string);
    }
    if (className) {
      query += " AND s.class = ?";
      params.push(className as string);
    }
    const syllabus = db.prepare(query).all(...params);
    res.json(syllabus);
  });

  app.get("/api/syllabus/download", (req, res) => {
    const { school_id, class: className, date } = req.query;
    let query = "SELECT s.*, t.name as teacher_name FROM syllabus s JOIN teachers t ON s.teacher_id = t.id WHERE s.school_id = ?";
    const params: any[] = [school_id];
    
    if (className && className !== "All") {
      query += " AND s.class = ?";
      params.push(className);
    }
    if (date) {
      query += " AND s.date = ?";
      params.push(date);
    }

    const records = db.prepare(query).all(...params) as any[];
    
    let csv = "Date,Class,Teacher,Subject,Strand,Sub-strand,Taught By,Assessed By,Term,Status\n";
    records.forEach(r => {
      csv += `"${r.date}","${r.class}","${r.teacher_name}","${r.subject || ''}","${r.strand}","${r.sub_strand || ''}","${r.taught_by || ''}","${r.assessed_by || ''}","${r.term || ''}","${r.status}"\n`;
    });

    const today = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=syllabus_report_${today}.csv`);
    res.send(csv);
  });

  app.get("/api/topic-scores/download", (req, res) => {
    const { syllabus_id, school_id } = req.query;
    const syllabus = db.prepare("SELECT * FROM syllabus WHERE id = ? AND school_id = ?").get(syllabus_id, school_id) as any;
    if (!syllabus) return res.status(404).send("Syllabus item not found");

    const query = `
      SELECT s.name, s.class, s.assessment_number, ts.score
      FROM students s
      JOIN topic_scores ts ON s.id = ts.student_id
      WHERE ts.syllabus_id = ? AND ts.school_id = ?
    `;
    const records = db.prepare(query).all(syllabus_id, school_id) as any[];

    let csv = `Assessment Report for ${syllabus.strand} - ${syllabus.topic}\n`;
    csv += `Class: ${syllabus.class}, Date: ${syllabus.date}\n\n`;
    csv += "Student Name,Class,Assessment Number,Score\n";
    
    records.forEach(r => {
      csv += `"${r.name}","${r.class}","${r.assessment_number || ''}","${r.score || ''}"\n`;
    });

    const today = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=assessment_${syllabus_id}_${today}.csv`);
    res.send(csv);
  });

  app.post("/api/syllabus", (req, res) => {
    try {
      console.log("Adding syllabus item. Body:", JSON.stringify(req.body, null, 2));
      const { strand, topic, subject, sub_strand, teacher_id, date, is_taught, is_assessed, class: className, school_id, taught_by, assessed_by, term } = req.body;
      
      if (!school_id) {
        console.error("Missing school_id in request body");
        return res.status(400).json({ success: false, message: "school_id is required" });
      }

      const finalTopic = topic || strand;
      const finalSubject = subject || strand;
      const result = db.prepare("INSERT INTO syllabus (strand, topic, subject, sub_strand, teacher_id, date, is_taught, is_assessed, class, school_id, taught_by, assessed_by, term) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(strand, finalTopic, finalSubject, sub_strand, teacher_id, date, is_taught ? 1 : 0, is_assessed ? 1 : 0, className, school_id, taught_by, assessed_by, term || 'Term 1');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error("Error adding syllabus item:", error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  app.delete("/api/syllabus/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { school_id } = req.query;
      db.prepare("DELETE FROM topic_scores WHERE syllabus_id = ? AND school_id = ?").run(id, school_id);
      db.prepare("DELETE FROM syllabus WHERE id = ? AND school_id = ?").run(id, school_id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  app.post("/api/syllabus/update", (req, res) => {
    try {
      console.log("Updating syllabus item. Body:", JSON.stringify(req.body, null, 2));
      const { id, status, is_taught, is_assessed, strand, topic, subject, sub_strand, date, class: className, school_id, taught_by, assessed_by, term } = req.body;
      
      if (!school_id) {
        console.error("Missing school_id in request body for update");
        return res.status(400).json({ success: false, message: "school_id is required" });
      }

      const updates = [];
      const params = [];
      if (status !== undefined) { updates.push("status = ?"); params.push(status); }
      if (is_taught !== undefined) { updates.push("is_taught = ?"); params.push(is_taught ? 1 : 0); }
      if (is_assessed !== undefined) { updates.push("is_assessed = ?"); params.push(is_assessed ? 1 : 0); }
      if (strand !== undefined) { 
        updates.push("strand = ?"); 
        params.push(strand);
        // Also update topic and subject to match strand if they are not explicitly provided
        if (topic === undefined) {
          updates.push("topic = ?");
          params.push(strand);
        }
        if (subject === undefined) {
          updates.push("subject = ?");
          params.push(strand);
        }
      }
      if (topic !== undefined) { updates.push("topic = ?"); params.push(topic); }
      if (subject !== undefined) { updates.push("subject = ?"); params.push(subject); }
      if (sub_strand !== undefined) { updates.push("sub_strand = ?"); params.push(sub_strand); }
      if (date !== undefined) { updates.push("date = ?"); params.push(date); }
      if (className !== undefined) { updates.push("class = ?"); params.push(className); }
      if (taught_by !== undefined) { updates.push("taught_by = ?"); params.push(taught_by); }
      if (assessed_by !== undefined) { updates.push("assessed_by = ?"); params.push(assessed_by); }
      if (term !== undefined) { updates.push("term = ?"); params.push(term); }
      
      if (updates.length > 0) {
        params.push(id, school_id);
        const query = `UPDATE syllabus SET ${updates.join(", ")} WHERE id = ? AND school_id = ?`;
        console.log("Update query:", query, params);
        db.prepare(query).run(...params);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating syllabus item:", error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  app.get("/api/topic-scores", (req, res) => {
    const { syllabus_id, school_id } = req.query;
    const scores = db.prepare("SELECT * FROM topic_scores WHERE syllabus_id = ? AND school_id = ?").all(syllabus_id, school_id);
    res.json(scores);
  });

  app.post("/api/topic-scores", (req, res) => {
    const { syllabus_id, scores, school_id } = req.body; // scores: [{student_id, score}]
    const deleteExisting = db.prepare("DELETE FROM topic_scores WHERE syllabus_id = ? AND school_id = ?");
    const insertScore = db.prepare("INSERT INTO topic_scores (syllabus_id, student_id, score, school_id) VALUES (?, ?, ?, ?)");
    
    const transaction = db.transaction((recs) => {
      deleteExisting.run(syllabus_id, school_id);
      recs.forEach((r: any) => insertScore.run(syllabus_id, r.student_id, r.score, school_id));
    });
    
    transaction(scores);
    res.json({ success: true });
  });

  app.get("/api/progress", (req, res) => {
    const { school_id } = req.query;
    const progress = db.prepare(`
      SELECT p.*, s.name as student_name, s.class as student_class
      FROM progress p 
      JOIN students s ON p.student_id = s.id
      WHERE p.school_id = ?
    `).all(school_id);
    res.json(progress);
  });

  app.post("/api/progress", (req, res) => {
    const { student_id, subject, term, marks, comments, school_id } = req.body;
    db.prepare("INSERT INTO progress (student_id, subject, term, marks, comments, school_id) VALUES (?, ?, ?, ?, ?, ?)")
      .run(student_id, subject, term, marks, comments, school_id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const { school_id } = req.query;
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE school_id = ?").get(school_id) as any;
    const syllabusStats = db.prepare("SELECT status, COUNT(*) as count FROM syllabus WHERE school_id = ? GROUP BY status").all(school_id) as any[];
    const avgMarks = db.prepare("SELECT AVG(marks) as avg FROM progress WHERE school_id = ?").get(school_id) as any;
    const genderStats = db.prepare("SELECT gender, COUNT(*) as count FROM students WHERE school_id = ? GROUP BY gender").all(school_id) as any[];

    res.json({
      totalStudents: totalStudents.count,
      syllabus: syllabusStats,
      avgMarks: avgMarks.avg || 0,
      genderStats
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
