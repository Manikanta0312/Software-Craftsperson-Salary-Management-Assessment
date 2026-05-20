import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Users, BarChart2, Building2 } from "lucide-react";
import { EmployeeTable } from "./components/EmployeeTable";
import { InsightsDashboard } from "./components/InsightsDashboard";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

type Tab = "employees" | "insights";

function App() {
  const [tab, setTab] = useState<Tab>("employees");

  return (
    <QueryClientProvider client={qc}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">SalaryHQ</h1>
                <p className="text-xs text-gray-500 leading-tight">HR Management Platform</p>
              </div>
            </div>
            <nav className="flex gap-1 ml-6">
              <button
                onClick={() => setTab("employees")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === "employees"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Users className="w-4 h-4" /> Employees
              </button>
              <button
                onClick={() => setTab("insights")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === "insights"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BarChart2 className="w-4 h-4" /> Salary Insights
              </button>
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          {tab === "employees" ? <EmployeeTable /> : <InsightsDashboard />}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
