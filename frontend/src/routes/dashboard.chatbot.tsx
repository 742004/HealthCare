import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Mic, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { chatbotService, AssistantResponse, Hospital } from "@/services/api";

export const Route = createFileRoute("/dashboard/chatbot")({
  component: Chatbot,
});

const suggestions = [
  "What should I do during a suspected heart attack?",
  "Find the nearest real hospital to my current location.",
  "Ambulance ETA",
  "Give me general guidance for handling a medical emergency.",
];

type Msg = 
  | { role: "user"; text: string }
  | { role: "ai"; response: AssistantResponse };

function Chatbot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", response: { type: "MEDICAL", content: "Hi, I'm your Healthcare AI assistant. Ask me anything about symptoms, emergencies, or the platform." } },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const handleHeartAttackGuidance = () => send("What should I do during a suspected heart attack?");
  const handleAmbulanceETA = () => send("Ambulance ETA");
  const handleEmergencyTips = () => send("Give me general guidance for handling a medical emergency.");
  
  const handleNearestHospital = async () => {
    if (typing) return;
    setMessages((m) => [...m, { role: "user", text: "Find the nearest real hospital to my current location." }]);
    setTyping(true);
    try {
      if (!navigator.geolocation) {
         setMessages((m) => [...m, { role: "ai", response: { type: "ERROR", content: "I need your current location to find nearby hospitals. Please enable location access." } }]);
         return;
      }
      
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      }).catch(() => null);
      
      if (!pos) {
         setMessages((m) => [...m, { role: "ai", response: { type: "ERROR", content: "I need your current location to find nearby hospitals. Please enable location access." } }]);
         return;
      }
      
      // Call dedicated hospital backend endpoint directly instead of chat
      const res = await fetch(`http://localhost:5000/api/v1/hospitals/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
      const data = await res.json();
      
      if (res.ok) {
         setMessages((m) => [...m, { role: "ai", response: { type: "HOSPITALS", hospitals: data.data } }]);
      } else {
         setMessages((m) => [...m, { role: "ai", response: { type: "ERROR", content: "I couldn't retrieve verified nearby hospital information right now. Please update your location and try again, or open Google Maps." } }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", response: { type: "ERROR", content: "I couldn't retrieve verified nearby hospital information right now." } }]);
    } finally {
      setTyping(false);
    }
  };

  const send = async (text: string) => {
    if (typing) return;
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setInput("");
    setTyping(true);
    
    // Get location context
    let locationContext = null;
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        locationContext = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch (e) {
      console.warn("Location unavailable for AI context", e);
    }
    
    try {
      const response = await chatbotService.send(clean, { location: locationContext });
      setMessages((m) => [...m, { role: "ai", response }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm">
          This AI provides educational guidance only and is not a substitute for professional medical care.
        </p>
      </div>

      <Card className="flex flex-col h-[70vh] overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center"><Bot className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <div className="font-semibold text-sm">Healthcare AI</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Online
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setMessages([{ role: "ai", response: { type: "MEDICAL", content: "Chat cleared. How can I help?" } }]); toast.success("Cleared"); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in-up ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "gradient-primary"}`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary-foreground" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.role === "user" ? (
                  m.text
                ) : (
                  <div className="space-y-2">
                    {m.response.type === "EMERGENCY" && (
                       <div className="flex items-center gap-2 text-destructive font-bold border-b border-destructive/20 pb-2 mb-2">
                         <AlertTriangle className="w-4 h-4" /> Possible Medical Emergency
                       </div>
                    )}
                    {m.response.type === "HOSPITALS" ? (
                      <div className="space-y-3">
                        <p className="font-semibold text-primary">I found these hospitals near your current location:</p>
                        {m.response.hospitals.map((h, idx) => (
                          <div key={idx} className="bg-background rounded-xl p-3 border border-border">
                             <div className="font-bold text-foreground">🏥 {h.name}</div>
                             <div className="text-muted-foreground mt-1">📍 {h.address}</div>
                             {h.distance && <div className="text-muted-foreground mt-1">📏 {h.distance}</div>}
                             {h.googleMapsUri && (
                               <a href={h.googleMapsUri} target="_blank" rel="noreferrer" className="text-primary mt-2 inline-block hover:underline">
                                 [Open in Google Maps]
                               </a>
                             )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.response.content}</div>
                    )}
                    {m.response.type === "EMERGENCY" && (
                       <div className="mt-4 pt-2 border-t border-destructive/20 text-destructive font-semibold">
                         If you believe this is happening now, seek emergency medical help immediately.
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary grid place-items-center"><Bot className="w-4 h-4 text-primary-foreground" /></div>
              <div className="bg-muted rounded-2xl px-4 py-3 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
              <button onClick={handleHeartAttackGuidance} className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition">
                What should I do during a suspected heart attack?
              </button>
              <button onClick={handleNearestHospital} className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition">
                Find the nearest real hospital to my current location.
              </button>
              <button onClick={handleAmbulanceETA} className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition">
                Ambulance ETA
              </button>
              <button onClick={handleEmergencyTips} className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition">
                Give me general guidance for handling a medical emergency.
              </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => toast.info("Voice input coming soon")}><Mic className="w-4 h-4" /></Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about symptoms, hospitals, ambulances..." className="flex-1" />
            <Button type="submit" size="icon" className="gradient-primary"><Send className="w-4 h-4" /></Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
