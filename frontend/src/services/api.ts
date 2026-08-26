import axios from "axios";

/**
 * Central Axios instance. Base URL is read from Vite env; production
 * projects can wire this to a real FastAPI/Antigravity backend.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("ehc.token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ----------------------------- Types ----------------------------- */
export type Role = "patient" | "hospital" | "doctor" | "driver" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance: string;
  rating: number;
  beds: number;
  icu: number;
  phone: string;
  tag: string;
  er: boolean;
}

export interface Ambulance {
  id: string;
  code: string;
  driver: string;
  status: "available" | "busy" | "offline";
  eta: string;
  vehicle: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  available: boolean;
}

export interface EmergencyRequest {
  id: string;
  patient: string;
  age: number;
  symptom: string;
  severity: "low" | "medium" | "high" | "critical";
  time: string;
  status: "requested" | "accepted" | "dispatched" | "enroute" | "arrived";
}

/* --------------------- Mock data (replace with real API) --------------------- */
const mockHospitals: Hospital[] = [
  { id: "h1", name: "St. Mary's Medical Center", address: "1200 Elm Street", latitude: 18.5204, longitude: 73.8567, distance: "0.8 mi", rating: 4.7, beds: 42, icu: 8, phone: "+1 555 010 4200", tag: "Trauma Level I", er: true },
  { id: "h2", name: "Riverside General Hospital", address: "45 Riverside Blvd", latitude: 18.5150, longitude: 73.8600, distance: "1.4 mi", rating: 4.5, beds: 30, icu: 5, phone: "+1 555 010 8899", tag: "Cardiac Care", er: true },
  { id: "h3", name: "Northside Community Hospital", address: "678 North Ave", latitude: 18.5300, longitude: 73.8400, distance: "2.1 mi", rating: 4.3, beds: 25, icu: 4, phone: "+1 555 010 2211", tag: "Pediatric ER", er: true },
  { id: "h4", name: "Metropolitan Heart Institute", address: "801 Central Pkwy", latitude: 18.5000, longitude: 73.8700, distance: "3.6 mi", rating: 4.8, beds: 18, icu: 6, phone: "+1 555 010 6600", tag: "Cardiology", er: true },
  { id: "h5", name: "Greenfield Regional Hospital", address: "300 Greenfield Rd", latitude: 18.4900, longitude: 73.8300, distance: "4.2 mi", rating: 4.4, beds: 34, icu: 7, phone: "+1 555 010 7788", tag: "Full-Service ER", er: true },
];

const mockAmbulances: Ambulance[] = [
  { id: "a1", code: "AMB-104", driver: "Marcus Lee", status: "available", eta: "6 min", vehicle: "Type II Van" },
  { id: "a2", code: "AMB-207", driver: "Priya Shah", status: "busy", eta: "18 min", vehicle: "Type III ALS" },
  { id: "a3", code: "AMB-311", driver: "Jamal Owens", status: "available", eta: "9 min", vehicle: "Type II Van" },
  { id: "a4", code: "AMB-402", driver: "Sofia Ramirez", status: "offline", eta: "—", vehicle: "Type I" },
];

const mockDoctors: Doctor[] = [
  { id: "d1", name: "Dr. Sarah Chen", specialty: "Emergency Medicine", hospital: "St. Mary's", available: true },
  { id: "d2", name: "Dr. Amara Okoye", specialty: "Cardiology", hospital: "Metropolitan Heart", available: true },
  { id: "d3", name: "Dr. Julian Park", specialty: "Trauma Surgery", hospital: "St. Mary's", available: false },
  { id: "d4", name: "Dr. Naomi Weiss", specialty: "Pediatrics", hospital: "Northside", available: true },
];

const mockRequests: EmergencyRequest[] = [
  { id: "r1", patient: "Alex Rodriguez", age: 34, symptom: "Chest pain, shortness of breath", severity: "critical", time: "2 min ago", status: "requested" },
  { id: "r2", patient: "Linda Park", age: 58, symptom: "Suspected stroke, facial droop", severity: "critical", time: "6 min ago", status: "accepted" },
  { id: "r3", patient: "Mohammed Ali", age: 12, symptom: "High fever, difficulty breathing", severity: "high", time: "14 min ago", status: "dispatched" },
  { id: "r4", patient: "Emma Wilson", age: 27, symptom: "Deep laceration on forearm", severity: "medium", time: "22 min ago", status: "enroute" },
];

const wait = <T,>(v: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(v), ms));

/* --------------------- Service methods (mock-backed) --------------------- */
export const authService = {
  login: async (email: string, _password: string, role: Role = "patient"): Promise<AuthUser> =>
    wait({ id: "u1", name: email.split("@")[0] || "User", email, role }),
  register: async (payload: { name: string; email: string; role: Role }): Promise<AuthUser> =>
    wait({ id: `u_${Date.now()}`, ...payload }),
};

export const patientService = {
  profile: async () => wait({ name: "Alex Rodriguez", age: 34, blood: "O+", allergies: "Penicillin", conditions: "Type 2 diabetes" }),
  history: async () => wait([
    { id: "e1", date: "2026-06-12", type: "ER visit", hospital: "St. Mary's", outcome: "Discharged" },
    { id: "e2", date: "2026-04-03", type: "Ambulance", hospital: "Riverside", outcome: "Admitted" },
    { id: "e3", date: "2025-11-22", type: "Consultation", hospital: "Northside", outcome: "Prescribed" },
  ]),
};

export const emergencyService = {
  create: async (payload: unknown) => wait({ id: `r_${Date.now()}`, status: "requested" as const, ...(payload as object) }),
  list: async () => wait(mockRequests),
};

export const hospitalService = {
  list: async () => wait(mockHospitals),
};

export const ambulanceService = {
  list: async () => wait(mockAmbulances),
  updateLocation: async (id: string, coords: { lat: number; lng: number }) => wait({ id, ...coords }),
};

export const doctorService = {
  list: async () => wait(mockDoctors),
};

export const adminService = {
  dashboard: async () =>
    wait({
      users: 51_240,
      hospitals: 512,
      doctors: 1_048,
      drivers: 214,
      patients: 49_466,
      requests: 12_803,
      daily: [
        { day: "Mon", requests: 320 },
        { day: "Tue", requests: 412 },
        { day: "Wed", requests: 388 },
        { day: "Thu", requests: 501 },
        { day: "Fri", requests: 620 },
        { day: "Sat", requests: 715 },
        { day: "Sun", requests: 540 },
      ],
      performance: [
        { name: "St. Mary's", score: 94 },
        { name: "Riverside", score: 88 },
        { name: "Metropolitan", score: 91 },
        { name: "Northside", score: 82 },
        { name: "Greenfield", score: 79 },
      ],
      usage: [
        { name: "Available", value: 62 },
        { name: "Busy", value: 28 },
        { name: "Offline", value: 10 },
      ],
    }),
};

export type AssistantResponse =
  | { type: "MEDICAL"; content: string }
  | { type: "EMERGENCY"; content: string }
  | { type: "HOSPITALS"; hospitals: Hospital[] }
  | { type: "AMBULANCE"; content: string }
  | { type: "OUT_OF_SCOPE"; content: string }
  | { type: "ERROR"; content: string };

export const chatbotService = {
  send: async (message: string, context?: any): Promise<AssistantResponse> => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });
      if (!response.ok) {
        throw new Error(`AI_ERROR: HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.data as AssistantResponse;
    } catch (error) {
      console.error("Chatbot service error:", error);
      return { type: "ERROR", content: "The AI service is temporarily unavailable." };
    }
  },
};
