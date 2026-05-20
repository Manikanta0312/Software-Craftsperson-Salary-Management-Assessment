import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { employeesApi } from "../api/client";
import type { Employee, EmployeeFilters } from "../api/client";
import { EmployeeForm } from "./EmployeeForm";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function EmployeeTable() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, page_size: 20 });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; emp?: Employee } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", filters],
    queryFn: () => employeesApi.list(filters).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: Partial<Employee>) => employeesApi.create(d as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      employeesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setDeleteId(null); },
  });

  const applySearch = () =>
    setFilters((f) => ({ ...f, page: 1, search: search || undefined }));

  const totalPages = data ? Math.ceil(data.total / (filters.page_size || 20)) : 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search name, title, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </div>
        <select
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setFilters((f) => ({ ...f, page: 1, country: e.target.value || undefined }))}
        >
          <option value="">All countries</option>
          {["India","United States","Germany","United Kingdom","Singapore","Australia","Canada","France","Japan","Brazil","Netherlands","Sweden"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setFilters((f) => ({ ...f, page: 1, department: e.target.value || undefined }))}
        >
          <option value="">All departments</option>
          {["Engineering","Product","Data & Analytics","Design","QA","HR","Finance","Marketing","Sales","Operations","Leadership"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name","Job Title","Department","Country","Salary","Type","Hired",""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading…</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">No employees found</td></tr>
            ) : (
              data?.items.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.job_title}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {emp.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-700">{fmt(emp.salary)}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.employment_type}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.hire_date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ mode: "edit", emp })}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(emp.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{data.total.toLocaleString()} employees total</span>
          <div className="flex items-center gap-2">
            <button disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {filters.page} of {totalPages}</span>
            <button disabled={filters.page === totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal.mode === "create" ? "Add Employee" : "Edit Employee"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <EmployeeForm
                initial={modal.emp}
                loading={createMutation.isPending || updateMutation.isPending}
                onCancel={() => setModal(null)}
                onSubmit={(data) => {
                  if (modal.mode === "create") createMutation.mutate(data);
                  else updateMutation.mutate({ id: modal.emp!.id, data });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Employee?</h3>
            <p className="text-sm text-gray-500 mb-6">This will soft-delete the record and remove them from active lists.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
