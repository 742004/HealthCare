import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, Hospital, Stethoscope, Ambulance, HeartPulse, ArrowLeft, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/services/api";
import { z } from "zod";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Emergency Healthcare Connector" },
      { name: "description", content: "Create your Emergency Healthcare Connector account and pick your role." },
    ],
  }),
  component: Register,
});

const roles: { id: Role; label: string; icon: typeof User; desc: string }[] = [
  { id: "patient", label: "Patient", icon: User, desc: "Request emergencies and manage your medical profile." },
  { id: "hospital", label: "Hospital", icon: Hospital, desc: "Accept requests and manage bed capacity in real time." },
  { id: "doctor", label: "Doctor", icon: Stethoscope, desc: "Triage patients and manage the emergency queue." },
  { id: "driver", label: "Ambulance Driver", icon: Ambulance, desc: "Receive dispatches and navigate to patients." },
];

const roleFields: Record<Role, { key: string; label: string; type?: string; full?: boolean, placeholder?: string }[]> = {
  patient: [
    { key: "name", label: "Full name", placeholder: "e.g. Rahul Patil" },
    { key: "age", label: "Age", type: "number", placeholder: "e.g. 30" },
    { key: "blood", label: "Blood group", placeholder: "A+, O-, etc" },
    { key: "phone", label: "Phone (10 digits)", placeholder: "9876543210" },
    { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { key: "contact", label: "Emergency contact phone", placeholder: "9876543210", full: true },
    { key: "password", label: "Password", type: "password" },
    { key: "confirmPassword", label: "Confirm Password", type: "password" },
  ],
  hospital: [
    { key: "name", label: "Hospital name" },
    { key: "license", label: "License number" },
    { key: "address", label: "Address", full: true },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "password", label: "Password", type: "password" },
    { key: "confirmPassword", label: "Confirm Password", type: "password" },
  ],
  doctor: [
    { key: "name", label: "Full name" },
    { key: "specialty", label: "Specialization" },
    { key: "hospital", label: "Hospital", full: true },
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" },
    { key: "confirmPassword", label: "Confirm Password", type: "password" },
  ],
  driver: [
    { key: "name", label: "Full name" },
    { key: "vehicle", label: "Vehicle number" },
    { key: "license", label: "License number" },
    { key: "phone", label: "Phone" },
    { key: "password", label: "Password", type: "password" },
    { key: "confirmPassword", label: "Confirm Password", type: "password" },
  ],
  admin: [],
};

// Zod schemas for validation
const phoneRegex = /^[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,128}$/;

const patientSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100).regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),
  age: z.coerce.number().int().min(0).max(120),
  blood: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], { errorMap: () => ({ message: "Invalid blood group" }) }),
  phone: z.string().regex(phoneRegex, "Must be a valid 10-digit Indian phone number"),
  email: z.string().email("Invalid email address"),
  contact: z.string().regex(phoneRegex, "Emergency contact must be a valid 10-digit phone number"),
  password: z.string().regex(passwordRegex, "Password must be at least 12 chars, include uppercase, lowercase, number, and special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function Register() {
  const [role, setRole] = useState<Role | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    const p = values.password || "";
    if (p.length === 0) return 0;
    let strength = 0;
    if (p.length >= 12) strength++;
    if (/[A-Z]/.test(p)) strength++;
    if (/[a-z]/.test(p)) strength++;
    if (/[0-9]/.test(p)) strength++;
    if (/[@$!%*?&]/.test(p)) strength++;
    return strength;
  }, [values.password]);

  const strengthColor = ["bg-muted", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-600"][passwordStrength] || "bg-muted";
  const strengthText = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][passwordStrength] || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    // Clear previous errors
    setErrors({});

    // Validate
    if (role === "patient") {
      const result = patientSchema.safeParse(values);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please correct the errors in the form");
        return;
      }
    } else {
      if (values.password !== values.confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        age: values.age ? parseInt(values.age) : undefined,
        blood: values.blood,
        contact: values.contact,
        role,
      });
      toast.success("Account created — welcome!");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Registration failed. Account may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shadow-soft">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Emergency Healthcare Connector</span>
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Already have an account?
          </Link>
        </div>

        {!role ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold">Who are you signing up as?</h1>
              <p className="text-muted-foreground mt-2">Your role determines your dashboard and permissions.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {roles.map((r, i) => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setRole(r.id); setValues({}); setErrors({}); }}
                  className="text-left"
                >
                  <Card className="hover:border-primary hover:shadow-elegant transition-all hover:-translate-y-1 rounded-2xl h-full">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl gradient-primary grid place-items-center shadow-soft shrink-0">
                        <r.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{r.label}</div>
                        <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <button onClick={() => setRole(null)} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
              <ArrowLeft className="w-4 h-4" /> Change role
            </button>
            <Card className="rounded-2xl">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Registering as</div>
                    <div className="font-semibold capitalize">{role}</div>
                  </div>
                </div>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                  {roleFields[role].map((f) => {
                    const isPassword = f.type === "password";
                    const inputType = isPassword ? (showPassword ? "text" : "password") : (f.type || "text");
                    
                    return (
                      <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                        <Label htmlFor={f.key}>{f.label}</Label>
                        <div className="relative">
                          {f.key === "blood" ? (
                            <select
                              id={f.key}
                              required
                              value={values[f.key] || ""}
                              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                              className={`mt-1.5 flex h-10 w-full rounded-md border ${errors[f.key] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                            >
                              <option value="" disabled>Select Blood Group</option>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id={f.key}
                              type={inputType}
                              required
                              placeholder={f.placeholder}
                              value={values[f.key] || ""}
                              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                              className={`mt-1.5 ${errors[f.key] ? 'border-red-500' : ''}`}
                            />
                          )}
                          {isPassword && (
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-0.5"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {f.key === "password" && values.password && (
                          <div className="mt-2 space-y-1">
                            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                              <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${(passwordStrength / 5) * 100}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{strengthText}</p>
                          </div>
                        )}
                        
                        {errors[f.key] && (
                          <p className="text-sm text-red-500 mt-1">{errors[f.key]}</p>
                        )}
                      </div>
                    );
                  })}
                  <div className="sm:col-span-2 mt-4">
                    <Button type="submit" disabled={loading} className="w-full gradient-primary rounded-xl h-11">
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Create account
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

