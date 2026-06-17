import React, { useState } from "react";
import { Staff, SystemData } from "../types";
import { PlusCircle, Trash2, ShieldAlert, Phone, Briefcase, Plus, UserCheck, Edit2, Save, X, Calendar } from "lucide-react";

interface StaffProps {
  data: SystemData;
  onAddStaff: (member: Staff) => void;
  onUpdateStaff?: (member: Staff) => void;
  onDeleteStaff: (id: string) => void;
}

export default function StaffManager({ data, onAddStaff, onUpdateStaff, onDeleteStaff }: StaffProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [designation, setDesignation] = useState("Cook");
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editDesignation, setEditDesignation] = useState("Cook");
  const [editSalary, setEditSalary] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>("Active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !salary) return;

    const newStaff: Staff = {
      id: "st_" + Date.now(),
      name,
      mobile,
      address: "",
      designation,
      salary: Number(salary),
      emergencyContact: "",
      status: "Active",
      joiningDate
    };

    onAddStaff(newStaff);
    setName("");
    setMobile("");
    setSalary("");
    setShowForm(false);
  };

  const startEditing = (member: Staff) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditMobile(member.mobile);
    setEditDesignation(member.designation);
    setEditSalary(member.salary.toString());
    setEditJoiningDate(member.joiningDate || new Date().toISOString().split("T")[0]);
    setEditStatus(member.status);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editSalary) return;
    onUpdateStaff?.({
      id,
      name: editName,
      mobile: editMobile,
      address: "",
      designation: editDesignation,
      salary: Number(editSalary),
      emergencyContact: "",
      status: editStatus,
      joiningDate: editJoiningDate
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm">
            {data.language === 'mr' ? "कर्मचारी व मदतनीस यादी" : "Staff Directory"}
          </h3>
          <p className="text-[10px] text-gray-400">
            {data.language === 'mr' 
              ? "शाखेतील सर्व कार्यरत आणि आधीच्या कर्मचाऱ्यांची नोंद ठेवा." 
              : "Manage active workers (Cooks, helpers, delivery boys, cleaner staff)."}
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'Hide Form' : (data.language === 'mr' ? 'नवीन कर्मचारी जोडा' : 'Add Staff')}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end text-xs">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Worker Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Shinde"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile Contact</label>
            <input
              type="tel"
              required
              placeholder="10-digit number"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Designation Role</label>
            <select
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
            >
              <option value="Cook">Head Cook (मुख्य आचारी)</option>
              <option value="Counter Staff">Counter Staff (गल्ला मदतनीस)</option>
              <option value="Waiter">Service Waiter (वाढणारा)</option>
              <option value="Delivery Boy">Delivery Boy (घरपोच सेवा)</option>
              <option value="Cleaner">Cleaning Helper (स्वच्छता कारक)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Base Monthly Salary (₹)</label>
            <input
              type="number"
              required
              placeholder="e.g. 15000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>Joining Date</span>
            </label>
            <input
              type="date"
              required
              value={joiningDate}
              onChange={e => setJoiningDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-mono font-bold"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer shadow transition"
            >
              Register Helper
            </button>
          </div>
        </form>
      )}

      {/* Grid of staff profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.staff.map(member => {
          const isEditing = editingId === member.id;

          if (isEditing) {
            return (
              <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-orange-200 p-5 space-y-3 relative overflow-hidden flex flex-col justify-between ring-2 ring-orange-500/10">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="font-extrabold text-orange-600 uppercase tracking-widest text-[10px]">
                      {data.language === 'mr' ? "प्रोफाइल सुधारा" : "Edit Helper Profile"}
                    </span>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-semibold text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile</label>
                      <input
                        type="tel"
                        required
                        value={editMobile}
                        onChange={e => setEditMobile(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Salary (₹)</label>
                      <input
                        type="number"
                        required
                        value={editSalary}
                        onChange={e => setEditSalary(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Role</label>
                      <select
                        value={editDesignation}
                        onChange={e => setEditDesignation(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-medium"
                      >
                        <option value="Cook">Head Cook</option>
                        <option value="Counter Staff">Counter Staff</option>
                        <option value="Waiter">Service Waiter</option>
                        <option value="Delivery Boy">Delivery Boy</option>
                        <option value="Cleaner">Cleaning Helper</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-medium"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      <span>Joining Date (customise)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editJoiningDate}
                      onChange={e => setEditJoiningDate(e.target.value)}
                      className="w-full bg-orange-50/50 border border-orange-200 text-orange-600 rounded-lg p-2 px-3 outline-none font-mono font-black"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(member.id)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold p-2 rounded-lg text-xs flex items-center justify-center space-x-1 cursor-pointer transition shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold p-2 px-3 rounded-lg text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{member.name}</h4>
                    <div className="flex items-center space-x-1.5 text-orange-600 font-bold text-[9px] uppercase tracking-wider mt-1">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>{member.designation}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide tracking-wider border ${
                    member.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}>
                    {member.status}
                  </span>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-600">
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>Mobile</span>
                    </span>
                    <span className="font-mono font-bold text-gray-800">{member.mobile}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                    <span className="text-gray-400 font-bold">Standard Pay</span>
                    <span className="font-extrabold text-orange-600 font-mono">₹{member.salary.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-orange-500" />
                      <span>Joining Date</span>
                    </span>
                    <span className="text-gray-800 font-mono text-[11px] font-bold">{member.joiningDate || "Active"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                <button
                  onClick={() => startEditing(member)}
                  className="text-orange-650 hover:text-orange-850 hover:bg-orange-50 p-1.5 rounded transition font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{data.language === 'mr' ? "माहिती सुधारा" : "Edit Profile"}</span>
                </button>

                {data.userRole === "owner" ? (
                  <button
                    onClick={() => onDeleteStaff(member.id)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition font-bold cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{data.language === 'mr' ? "कमी करा" : "Release"}</span>
                  </button>
                ) : (
                  <ShieldAlert className="w-4 h-4 text-gray-300" title="Only owners can remove staff records" />
                )}
              </div>
              {/* Soft decorative background element */}
              <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 p-6 bg-orange-500/5 rounded-full blur-xl"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
