import { useState } from "react";
import type { Employee } from "../api/client";

interface Props {
  initial?: Partial<Employee>;
  onSubmit: (data: Partial<Employee>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const DEPARTMENTS = [
  "Engineering", "Product", "Data & Analytics", "Design", "QA",
  "HR", "Finance", "Marketing", "Sales", "Operations", "Leadership",
];

export function EmployeeForm({ initial = {}, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState({
    full_name: initial.full_name || "",
    job_title: initial.job_title || "",
    department: initial.department || "",
    country: initial.country || "",
    salary: initial.salary?.toString() || "",
    currency: initial.currency || "USD",
    employment_type: initial.employment_type || "Full-time",
    hire_date: initial.hire_date || "",
    email: initial.email || "",
  });

  const field = (name: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, salary: parseFloat(form.salary) });
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Full Name *</label>
          <input required className={inputCls} value={form.full_name} onChange={field("full_name")} placeholder="Jane Smith" />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} value={form.email} onChange={field("email")} placeholder="jane@company.com" />
        </div>
        <div>
          <label className={labelCls}>Job Title *</label>
          <input required className={inputCls} value={form.job_title} onChange={field("job_title")} placeholder="Software Engineer" />
        </div>
        <div>
          <label className={labelCls}>Department *</label>
          <select required className={inputCls} value={form.department} onChange={field("department")}>
            <option value="">Select…</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Country *</label>
          <input required className={inputCls} value={form.country} onChange={field("country")} placeholder="India" />
        </div>
        <div>
          <label className={labelCls}>Hire Date *</label>
          <input required type="date" className={inputCls} value={form.hire_date} onChange={field("hire_date")} />
        </div>
        <div>
          <label className={labelCls}>Salary (USD) *</label>
          <input required type="number" min="1" step="0.01" className={inputCls} value={form.salary} onChange={field("salary")} placeholder="85000" />
        </div>
        <div>
          <label className={labelCls}>Employment Type *</label>
          <select required className={inputCls} value={form.employment_type} onChange={field("employment_type")}>
            {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving…" : "Save Employee"}
        </button>
      </div>
    </form>
  );
}
