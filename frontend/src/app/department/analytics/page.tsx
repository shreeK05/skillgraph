// file: frontend/src/app/department/analytics/page.tsx
"use client";

import { useState } from "react";
import { Users, Target, IndianRupee, AlertTriangle, Bell, Download, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DepartmentAnalytics() {
  const [batchYear, setBatchYear] = useState("2026");

  // Dummy Data for the ML-driven insights
  const skillData = [
    { name: 'Python', students: 420 },
    { name: 'Java', students: 380 },
    { name: 'React', students: 290 },
    { name: 'AWS', students: 150 },
    { name: 'Docker', students: 110 },
    { name: 'GenAI', students: 45 },
  ];

  const placementTrend = [
    { month: 'Aug', placed: 10 },
    { month: 'Sep', placed: 45 },
    { month: 'Oct', placed: 120 },
    { month: 'Nov', placed: 210 },
    { month: 'Dec', placed: 280 },
  ];

  const atRiskStudents = [
    { id: "VIT001", name: "Rahul Sharma", branch: "CSE", cgpa: 6.2, readiness: 22, status: "High Risk" },
    { id: "VIT045", name: "Priya Patel", branch: "IT", cgpa: 6.8, readiness: 31, status: "Medium Risk" },
    { id: "VIT112", name: "Amit Kumar", branch: "CSE-AI", cgpa: 7.1, readiness: 35, status: "Medium Risk" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Department Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Bird's-eye view of batch readiness and placement metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg outline-none focus:border-blue-500"
            >
              <option value="2025">Batch 2025</option>
              <option value="2026">Batch 2026</option>
              <option value="2027">Batch 2027</option>
            </select>
            <button className="bg-slate-900 text-white p-2.5 rounded-lg hover:bg-slate-800 transition">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Users size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Total Students</p>
              <h3 className="text-2xl font-black text-slate-800">450</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0"><Target size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Placed %</p>
              <h3 className="text-2xl font-black text-slate-800">62.5%</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><IndianRupee size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Average CTC</p>
              <h3 className="text-2xl font-black text-slate-800">₹8.5L</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0"><AlertTriangle size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Avg Readiness</p>
              <h3 className="text-2xl font-black text-slate-800">45%</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Batch Skill Distribution</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Placement Trend */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Placement Trend (Cumulative)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={placementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="placed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPlaced)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* At-Risk Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} /> ML-Flagged: At-Risk Students
              </h3>
              <p className="text-slate-500 text-sm mt-1">Students predicted to face difficulty in upcoming drives.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Search by name or ID..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">Student ID</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Branch</th>
                  <th className="p-4 font-bold">CGPA</th>
                  <th className="p-4 font-bold">Readiness Score</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {atRiskStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium">{student.id}</td>
                    <td className="p-4 font-bold text-slate-900">{student.name}</td>
                    <td className="p-4">{student.branch}</td>
                    <td className="p-4">{student.cgpa}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[80px]">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${student.readiness}%` }}></div>
                        </div>
                        <span className="text-xs font-bold">{student.readiness}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${student.status === 'High Risk' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-end gap-1 w-full">
                        <Bell size={16} /> Send Alert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}