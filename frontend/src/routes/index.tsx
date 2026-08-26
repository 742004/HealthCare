import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Ambulance, Hospital, Bot, MapPin, MessageSquare, FileHeart, ArrowRight, Sparkles,
  ShieldCheck, HeartPulse, Star, PhoneCall, Zap, Activity, ClipboardCheck, Timer,
} from "lucide-react";
import heroImg from "@/assets/hero-healthcare.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Emergency Healthcare Connector — AI-Powered Emergency Care" },
      { name: "description", content: "Connect patients, hospitals, doctors and ambulances instantly using AI-powered emergency workflows." },
      { property: "og:title", content: "Emergency Care When Every Second Matters" },
      { property: "og:description", content: "AI-powered emergency workflows connecting patients, hospitals, doctors and ambulances in real time." },
    ],
  }),
  component: Home,
});

const stats = [
  { value: "500+", label: "Hospitals" },
  { value: "1,000+", label: "Doctors" },
  { value: "200+", label: "Ambulances" },
  { value: "50K+", label: "Patients Served" },
];

const features = [
  { icon: Ambulance, title: "Emergency Ambulance", desc: "Dispatch the nearest ALS/BLS ambulance with a single tap.", color: "from-blue-500 to-cyan-500" },
  { icon: Hospital, title: "Nearby Hospitals", desc: "Live ER capacity, trauma level, and specialty routing.", color: "from-emerald-500 to-teal-500" },
  { icon: Bot, title: "AI Symptom Checker", desc: "Clinical-guideline-trained triage that runs in seconds.", color: "from-violet-500 to-purple-500" },
  { icon: MapPin, title: "Live Tracking", desc: "Real-time ambulance and patient location for every stakeholder.", color: "from-orange-500 to-red-500" },
  { icon: MessageSquare, title: "Emergency Chat", desc: "Secure chat between patients, doctors and dispatch.", color: "from-pink-500 to-rose-500" },
  { icon: FileHeart, title: "Medical History", desc: "One-tap access to allergies, meds, and prior encounters.", color: "from-amber-500 to-orange-500" },
];

const steps = [
  { n: 1, title: "Request Emergency", desc: "Patient triggers SOS from any device.", icon: Zap },
  { n: 2, title: "AI Analysis", desc: "Symptoms triaged against clinical protocols.", icon: Bot },
  { n: 3, title: "Hospital Accepts", desc: "Nearest capable ER confirms in seconds.", icon: Hospital },
  { n: 4, title: "Ambulance Assigned", desc: "Closest ALS/BLS unit is dispatched.", icon: Ambulance },
  { n: 5, title: "Live Tracking", desc: "All parties see location and ETA update live.", icon: Activity },
  { n: 6, title: "Treatment Begins", desc: "Handoff notes ready when patient arrives.", icon: ClipboardCheck },
];

const testimonials = [
  { name: "Dr. Sarah Chen", role: "ER Director, St. Mary's Medical", text: "Our door-to-doctor time dropped 38% in the first quarter after deploying the connector." },
  { name: "Marcus Lee", role: "Paramedic, City EMS", text: "The pre-arrival summaries mean we roll up to the hospital with a plan already in motion." },
  { name: "Priya Shah", role: "Patient, Chicago", text: "I hit SOS during my father's heart attack. Ambulance was at the door in six minutes." },
];

const faqs = [
  { q: "Is this a replacement for calling 911?", a: "No — the Connector complements local emergency services. In many regions it integrates with dispatch APIs to reduce response time." },
  { q: "How is my medical data protected?", a: "Data is encrypted end-to-end at rest and in transit. Access is scoped by role and audited on every read." },
  { q: "Can hospitals customize triage rules?", a: "Yes. Hospital admins can tune severity thresholds, specialty routing, and bed-allocation logic." },
  { q: "What does it cost patients?", a: "Patient accounts are free. Hospitals and EMS providers subscribe per bed or per unit." },
];

function Home() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-border text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Powered by medical-grade AI
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Emergency Care<br />
              <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                When Every Second Matters
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Connect patients, hospitals, doctors and ambulances instantly using AI-powered emergency workflows.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 gradient-primary shadow-elegant rounded-xl">
                <Link to="/register"><PhoneCall className="w-4 h-4" /> Request Emergency</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 rounded-xl backdrop-blur bg-white/50 dark:bg-white/5">
                <Link to="/">Learn More <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> HIPAA-aware</div>
              <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-primary" /> Sub-minute dispatch</div>
              <div className="flex items-center gap-2"><HeartPulse className="w-4 h-4 text-destructive" /> 24/7 live</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 gradient-primary opacity-30 blur-3xl rounded-full" />
            <img
              src={heroImg}
              alt="Doctors, ambulance, hospital and AI healthcare technology"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-elegant bg-white/80 backdrop-blur-xl border border-white/60"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-soft p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-14">
          <div className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">Services</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Everything you need in an emergency</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A unified platform for patients, hospitals, doctors, and ambulance drivers — orchestrated by AI.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="group border-border/60 hover:border-primary/50 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 h-full rounded-2xl overflow-hidden bg-card/60 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} grid place-items-center shadow-soft group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-accent/40 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">How it works</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">From SOS to treatment in minutes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="rounded-2xl h-full hover:shadow-soft transition-all">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-11 h-11 rounded-xl gradient-primary text-primary-foreground font-bold grid place-items-center shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">{s.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-14">
          <div className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">Loved by teams</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Trusted at the point of care</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="rounded-2xl h-full bg-card/70 backdrop-blur border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, k) => <Star key={k} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-sm">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="contact" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold">Frequently asked questions</h2>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="p-2">
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`i-${i}`}>
                  <AccordionTrigger className="px-4 text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl gradient-primary p-10 sm:p-14 text-center text-primary-foreground shadow-elegant relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/30 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to save more lives?</h2>
            <p className="mt-3 opacity-90 max-w-2xl mx-auto">
              Join hospitals, EMS providers, and thousands of patients already on the platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link to="/register">Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
