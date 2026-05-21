// file: frontend/src/app/department/drives/page.tsx
"use client";

import { useState } from "react";
import { Building2, Calendar, Users, MapPin, Search, Plus, MoreVertical, Briefcase, GraduationCap, X } from "lucide-react";

export default function DriveManagement() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy Data for visual feedback
  const drives = [
    {
      id: 1,
      company: "Google",
      role: "Software Engineer III",
      date: "Oct 15, 2026",
      cgpa: "8.5",
      branches: ["CSE", "IT", "AI"],
      registered: 145,
      seats: 150,
      status: "Upcoming",
      location: "Pune Campus (Hybrid)"
    },
    {
      id: 2,
      company: "TCS",
      role: "Backend Developer",
      date: "Oct 22, 2026",
      cgpa: "6.0",
      branches: ["All Branches"],
      registered: 420,
      seats: 500,
      status: "Upcoming",
      location: "Virtual"
    },
    {
      id: 3,
      company: "Zomato",
      role: "Frontend Engineer",
      date: "Sep 10, 2026",
      cgpa: "7.0",
      branches: ["CSE", "IT"],
      registered: 89,
      seats: 100,
      status: "Completed",
      location: "Pune Campus"
    }
  ];

  const filteredDrives = drives.filter(drive => 
    drive.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
    drive.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="text-blue-600" /> Campus Drives
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage upcoming company visits, eligibility criteria, and student registrations.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} /> Schedule New Drive
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by company or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm bg-white"
          />
        </div>

        {/* Drives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrives.map((drive) => (
            <div key={drive.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
              
              <div className="p-6 border-b border-slate-100 relative">
                <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <MoreVertical size={20} />
                </button>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${drive.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {drive.status}
                </div>
                <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{drive.company}</h3>
                <p className="text-slate-600 font-medium text-sm flex items-center gap-1.5 mt-1">
                  <Briefcase size={14} className="text-slate-400" /> {drive.role}
                </p>
              </div>

              <div className="p-6 flex-grow space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={16} /> Date</span>
                  <span className="font-medium text-slate-900">{drive.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><MapPin size={16} /> Location</span>
                  <span className="font-medium text-slate-900">{drive.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><GraduationCap size={16} /> Cutoff</span>
                  <span className="font-medium text-slate-900">{drive.cgpa} CGPA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><Building2 size={16} /> Branches</span>
                  <span className="font-medium text-slate-900">{drive.branches.join(", ")}</span>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5"><Users size={16} className="text-blue-500"/> Registered</span>
                    <span className="font-bold text-slate-900">{drive.registered} / {drive.seats}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${drive.registered >= drive.seats ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${(drive.registered / drive.seats) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button className="w-full bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition">
                  Manage Drive
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Drive Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Schedule New Drive</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-md border border-slate-200">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
                  <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. Microsoft" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Role</label>
                  <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. Frontend Engineer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Drive Date</label>
                    <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Min CGPA</label>
                    <input type="number" step="0.1" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. 7.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Max Seats / Capacity</label>
                  <input type="number" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. 200" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">Create Drive</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}