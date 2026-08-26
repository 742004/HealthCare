import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Hospital, Stethoscope, Ambulance, User, Siren, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminService } from "@/services/api";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminDashboard,
});

const activities = [
  { user: "Dr. Sarah Chen", action: "accepted emergency request #E-2381", time: "just now" },
  { user: "AMB-207", action: "dispatched to Riverside General", time: "3 min ago" },
  { user: "Northside Hospital", action: "updated bed capacity (+4)", time: "12 min ago" },
  { user: "Admin", action: "onboarded new hospital: Baywater Regional", time: "1 hr ago" },
  { user: "Dr. Julian Park", action: "issued prescription for Emma Wilson", time: "2 hr ago" },
];

const PIE_COLORS = ["#10B981", "#F59E0B", "#94A3B8"];

function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin"], queryFn: adminService.dashboard });

  const kpis = [
    { icon: Users, label: "Total Users", value: data?.users, color: "from-blue-500 to-cyan-500" },
    { icon: Hospital, label: "Hospitals", value: data?.hospitals, color: "from-emerald-500 to-teal-500" },
    { icon: Stethoscope, label: "Doctors", value: data?.doctors, color: "from-violet-500 to-purple-500" },
    { icon: Ambulance, label: "Drivers", value: data?.drivers, color: "from-orange-500 to-red-500" },
    { icon: User, label: "Patients", value: data?.patients, color: "from-pink-500 to-rose-500" },
    { icon: Siren, label: "Emergency Requests", value: data?.requests, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Everything you need to run the network.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} grid place-items-center`}>
                <k.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold mt-3">
                {isLoading ? <Skeleton className="h-7 w-16" /> : k.value?.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Daily Emergency Requests</h3>
              <Badge className="gap-1"><TrendingUp className="w-3 h-3" /> +18% wow</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={data?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="requests" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Ambulance Usage</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data?.usage || []} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} label>
                    {(data?.usage || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Hospital Performance</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data?.performance || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <div><span className="font-medium">{a.user}</span> {a.action}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
