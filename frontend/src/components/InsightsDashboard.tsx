import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { analyticsApi } from "../api/client";
import { TrendingUp, Users, Globe, Briefcase, Award, DollarSign } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtK = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`);

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#a855f7"];

export function InsightsDashboard() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => analyticsApi.summary().then(r => r.data) });
  const byCountry = useQuery({ queryKey: ["byCountry"], queryFn: () => analyticsApi.byCountry().then(r => r.data) });
  const byJobTitle = useQuery({ queryKey: ["byJobTitle"], queryFn: () => analyticsApi.byJobTitle().then(r => r.data) });
  const topEarners = useQuery({ queryKey: ["topEarners"], queryFn: () => analyticsApi.topEarners(10).then(r => r.data) });
  const distribution = useQuery({ queryKey: ["distribution"], queryFn: () => analyticsApi.distribution(10).then(r => r.data) });

  const s = summary.data;

  // Aggregate job title stats across countries
  const jobTitleMap: Record<string, { total: number; count: number }> = {};
  byJobTitle.data?.forEach((row) => {
    if (!jobTitleMap[row.job_title]) jobTitleMap[row.job_title] = { total: 0, count: 0 };
    jobTitleMap[row.job_title].total += row.avg_salary * row.headcount;
    jobTitleMap[row.job_title].count += row.headcount;
  });
  const jobTitleData = Object.entries(jobTitleMap)
    .map(([title, { total, count }]) => ({ job_title: title, avg_salary: Math.round(total / count) }))
    .sort((a, b) => b.avg_salary - a.avg_salary)
    .slice(0, 12);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Active Employees" value={s.active_employees.toLocaleString()} color="bg-blue-500" />
          <StatCard icon={DollarSign} label="Avg Salary" value={fmt(s.global_avg_salary)} sub={`Min ${fmtK(s.global_min_salary)} · Max ${fmtK(s.global_max_salary)}`} color="bg-green-500" />
          <StatCard icon={TrendingUp} label="Total Payroll" value={fmtK(s.total_payroll)} sub="Annual" color="bg-violet-500" />
          <StatCard icon={Globe} label="Countries" value={s.countries_count.toString()} sub={`${s.job_titles_count} job titles`} color="bg-amber-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> Salary by Country (Avg)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCountry.data?.sort((a,b) => b.avg_salary - a.avg_salary).slice(0,10)} layout="vertical" margin={{ left: 90, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={88} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="avg_salary" radius={[0, 4, 4, 0]}>
                {byCountry.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Salary distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Salary Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribution.data} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range_label" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} employees`, "Count"]} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Avg salary by job title */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-500" /> Avg Salary by Job Title
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobTitleData} layout="vertical" margin={{ left: 140, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="job_title" tick={{ fontSize: 10 }} width={138} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="avg_salary" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top earners */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Top 10 Earners
          </h3>
          <div className="space-y-2">
            {topEarners.data?.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 py-1.5">
                <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{e.job_title} · {e.country}</p>
                </div>
                <span className="text-sm font-bold text-green-700 shrink-0">{fmt(e.salary)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country detail table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Country-wise Salary Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Country","Headcount","Min Salary","Avg Salary","Median","Max Salary"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byCountry.data?.sort((a,b) => b.headcount - a.headcount).map((row) => (
                <tr key={row.country} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.country}</td>
                  <td className="px-4 py-3 text-gray-600">{row.headcount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(row.min_salary)}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{fmt(row.avg_salary)}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(row.median_salary)}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(row.max_salary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
