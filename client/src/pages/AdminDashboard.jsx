import React, { useState, useEffect } from 'react';
import { 
  Shield, BarChart3, Package, Users, FolderTree, History, 
  Plus, Edit2, Trash2, Search, CheckCircle, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, ConditionBadge, RoleBadge } from '../components/Badge';

export function AdminDashboard() {
  const [adminTab, setAdminTab] = useState('analytics'); // 'analytics' | 'equipment' | 'categories' | 'users' | 'audit'
  const [isLoading, setIsLoading] = useState(true);
  
  // Analytics data
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);

  // Equipment CRUD
  const [equipmentList, setEquipmentList] = useState([]);
  const [editingEquip, setEditingEquip] = useState(null);
  const [showEquipModal, setShowEquipModal] = useState(false);

  // Categories CRUD
  const [categoryList, setCategoryList] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Users CRUD
  const [userList, setUserList] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Feedbacks
  const [msg, setMsg] = useState({ text: '', type: '' });

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, analRes, equipRes, catRes, userRes, auditRes] = await Promise.all([
        api.getSummaryStats(),
        api.getAnalytics(),
        api.getEquipment(),
        api.getCategories(),
        api.getUsers(),
        api.getAuditLogs({ limit: 40 })
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (analRes.success) setAnalytics(analRes.data);
      if (equipRes.success) setEquipmentList(equipRes.data);
      if (catRes.success) setCategoryList(catRes.data);
      if (userRes.success) setUserList(userRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Equipment Form Handler
  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      category_id: fd.get('category_id') ? parseInt(fd.get('category_id'), 10) : null,
      asset_tag: fd.get('asset_tag'),
      model_number: fd.get('model_number'),
      description: fd.get('description'),
      location: fd.get('location'),
      total_quantity: parseInt(fd.get('total_quantity'), 10),
      condition: fd.get('condition'),
      status: fd.get('status'),
      image_url: fd.get('image_url'),
      max_borrow_days: parseInt(fd.get('max_borrow_days'), 10)
    };

    try {
      if (editingEquip && editingEquip.id) {
        await api.updateEquipment(editingEquip.id, payload);
        notify(`Equipment '${payload.name}' updated successfully.`);
      } else {
        await api.createEquipment(payload);
        notify(`Equipment '${payload.name}' registered to inventory.`);
      }
      setShowEquipModal(false);
      setEditingEquip(null);
      loadAllData();
    } catch (err) {
      notify(err.message || 'Operation failed', 'error');
    }
  };

  // Delete Equipment Handler
  const handleDeleteEquipment = async (item) => {
    if (!confirm(`Permanently remove equipment '${item.name}' (${item.asset_tag})?`)) return;
    try {
      await api.deleteEquipment(item.id);
      notify(`Equipment '${item.name}' removed.`);
      loadAllData();
    } catch (err) {
      notify(err.message || 'Delete failed', 'error');
    }
  };

  // Category Form Handler
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      description: fd.get('description'),
      icon: fd.get('icon')
    };

    try {
      if (editingCategory && editingCategory.id) {
        await api.updateCategory(editingCategory.id, payload);
        notify(`Category '${payload.name}' updated.`);
      } else {
        await api.createCategory(payload);
        notify(`Category '${payload.name}' created.`);
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadAllData();
    } catch (err) {
      notify(err.message || 'Category save failed', 'error');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete category '${cat.name}'? Items under it will be unassigned.`)) return;
    try {
      await api.deleteCategory(cat.id);
      notify(`Category '${cat.name}' deleted.`);
      loadAllData();
    } catch (err) {
      notify(err.message || 'Delete failed', 'error');
    }
  };

  // User Role & Status Change
  const handleUserRoleChange = async (userId, newRole) => {
    try {
      await api.updateUser(userId, { role: newRole });
      notify('User role updated successfully.');
      loadAllData();
    } catch (err) {
      notify(err.message || 'Update failed', 'error');
    }
  };

  const handleUserStatusToggle = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      notify(`User marked as ${nextStatus}.`);
      loadAllData();
    } catch (err) {
      notify(err.message || 'Status toggle failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" />
            System Administration & Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional overview: analytics, master inventory catalog CRUD, categories, user roles, and audit trail.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          msg.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Admin Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setAdminTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
            adminTab === 'analytics' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics & Utilization
        </button>

        <button
          onClick={() => setAdminTab('equipment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
            adminTab === 'equipment' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Equipment Inventory ({equipmentList.length})
        </button>

        <button
          onClick={() => setAdminTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
            adminTab === 'categories' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Categories ({categoryList.length})
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
            adminTab === 'users' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management ({userList.length})
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
            adminTab === 'audit' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: ANALYTICS & CHARTS */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Campus Units</span>
                <span className="block text-3xl font-black text-slate-900 mt-2">{summary.totalUnits}</span>
                <span className="text-[11px] text-emerald-600 font-semibold">{summary.availableUnits} available right now</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checked Out In Field</span>
                <span className="block text-3xl font-black text-blue-600 mt-2">{summary.borrowedUnits}</span>
                <span className="text-[11px] text-slate-500">{summary.activeLoans} active student loans</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Returned Completed</span>
                <span className="block text-3xl font-black text-emerald-600 mt-2">{summary.returnedLoans}</span>
                <span className="text-[11px] text-slate-500">Successful loan cycles</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Overdue</span>
                <span className="block text-3xl font-black text-rose-600 mt-2">{summary.overdueLoans}</span>
                <span className="text-[11px] text-rose-500 font-semibold">Immediate attention needed</span>
              </div>
            </div>
          )}

          {/* Visual Breakdown Grids */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Inventory Distribution Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  Equipment Stock by Category
                </h3>
                <div className="space-y-3.5">
                  {analytics.categoryDistribution.map((cat, i) => {
                    const percent = Math.round((cat.available_units / (cat.total_units || 1)) * 100);
                    return (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-slate-800">{cat.category}</span>
                          <span className="text-slate-500 font-mono">
                            {cat.available_units} / {cat.total_units} units available ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                            style={{ width: `${Math.min(100, Math.max(8, percent))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Department Volume Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Top Borrowing Academic Departments
                </h3>
                <div className="space-y-3">
                  {analytics.departmentDistribution.map((dept, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[11px]">
                          #{i + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{dept.department}</span>
                      </div>
                      <span className="font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {dept.borrow_count} loans
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Requested Assets */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Most Requested University Equipment
                </h3>
                <div className="space-y-2.5">
                  {analytics.popularEquipment.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[240px]">{item.name}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{item.asset_tag} • {item.category_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-700 block">{item.borrow_count} borrow requests</span>
                        <span className="text-[10px] text-slate-400">{item.available_quantity} units available now</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Lifecycle State Distribution
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {analytics.statusBreakdown.map((st, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={st.status} />
                        <span className="font-bold text-base text-slate-900">{st.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Tab 2: EQUIPMENT INVENTORY MASTER CRUD */}
      {adminTab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Master Equipment Catalog ({equipmentList.length} items)</h3>
            <button
              onClick={() => {
                setEditingEquip(null);
                setShowEquipModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Asset
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Equipment Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Stock (Avail/Total)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipmentList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-purple-700">{item.asset_tag}</td>
                      <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.category_name || 'General'}</td>
                      <td className="p-3 text-slate-600">{item.location}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">{item.available_quantity}</span>
                        <span className="text-slate-400"> / {item.total_quantity}</span>
                      </td>
                      <td className="p-3"><StatusBadge status={item.status} /></td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingEquip(item);
                            setShowEquipModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Equipment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CATEGORY MANAGEMENT */}
      {adminTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Laboratory Classifications ({categoryList.length})</h3>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryList.map(cat => (
              <div key={cat.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base">{cat.name}</h4>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {cat.total_items} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.description || 'Institutional laboratory asset category.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{cat.total_units} total units</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setShowCategoryModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: USER MANAGEMENT */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          
          {/* Role Quotas & Capacity Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Administrator Quota</span>
                <span className="text-xl font-extrabold text-purple-950">
                  {userList.filter(u => u.role === 'admin').length} <span className="text-sm font-semibold text-slate-400">/ 5 max</span>
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                userList.filter(u => u.role === 'admin').length >= 5 
                  ? 'bg-rose-100 text-rose-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {userList.filter(u => u.role === 'admin').length >= 5 ? 'Quota Full' : `${5 - userList.filter(u => u.role === 'admin').length} spots left`}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lab Custodian Quota</span>
                <span className="text-xl font-extrabold text-indigo-950">
                  {userList.filter(u => u.role === 'staff').length} <span className="text-sm font-semibold text-slate-400">/ 7 max</span>
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                userList.filter(u => u.role === 'staff').length >= 7 
                  ? 'bg-rose-100 text-rose-700' 
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {userList.filter(u => u.role === 'staff').length >= 7 ? 'Quota Full' : `${7 - userList.filter(u => u.role === 'staff').length} spots left`}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Student / Faculty Users</span>
                <span className="text-xl font-extrabold text-blue-950">
                  {userList.filter(u => u.role === 'borrower').length}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                Unlimited
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Registered Institutional Accounts ({userList.length})</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user, email, department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">ID / Tag</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userList
                    .filter(u => 
                      !userSearch.trim() ||
                      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.department.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map(u => {
                      const adminCount = userList.filter(x => x.role === 'admin').length;
                      const staffCount = userList.filter(x => x.role === 'staff').length;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-slate-400 text-[11px]">{u.email}</span>
                          </td>
                          <td className="p-3 text-slate-600">{u.department}</td>
                          <td className="p-3 font-mono text-slate-600">{u.student_id || '—'}</td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                            >
                              <option value="borrower">Borrower (Student/Faculty)</option>
                              <option 
                                value="staff" 
                                disabled={staffCount >= 7 && u.role !== 'staff'}
                              >
                                Lab Custodian {staffCount >= 7 && u.role !== 'staff' ? '(Full: 7/7)' : `(${staffCount}/7)`}
                              </option>
                              <option 
                                value="admin" 
                                disabled={adminCount >= 5 && u.role !== 'admin'}
                              >
                                System Administrator {adminCount >= 5 && u.role !== 'admin' ? '(Full: 5/5)' : `(${adminCount}/5)`}
                              </option>
                            </select>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleUserStatusToggle(u)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                u.status === 'active'
                                  ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                  : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: AUDIT TRAIL */}
      {adminTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">System Security & Mutation Ledger</h3>
            <p className="text-xs text-slate-500">Immutable ledger tracking approvals, checkouts, returns, and inventory modifications.</p>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-sans font-medium text-slate-800">{log.actor_name || 'System Auto'} ({log.actor_role || 'system'})</td>
                    <td className="p-3 font-bold text-purple-700">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                    <td className="p-3 text-slate-500 truncate max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment Create / Edit Modal */}
      {showEquipModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-base">
                {editingEquip ? 'Edit Equipment Asset' : 'Register New Academic Asset'}
              </h2>
              <button
                onClick={() => setShowEquipModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Equipment Name *</label>
                  <input
                    name="name"
                    defaultValue={editingEquip?.name || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset Tag (Unique) *</label>
                  <input
                    name="asset_tag"
                    defaultValue={editingEquip?.asset_tag || ''}
                    placeholder="e.g. EQ-OSC-0205"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Classification Category</label>
                  <select
                    name="category_id"
                    defaultValue={editingEquip?.category_id || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Unassigned</option>
                    {categoryList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model Number</label>
                  <input
                    name="model_number"
                    defaultValue={editingEquip?.model_number || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Stock *</label>
                  <input
                    type="number"
                    name="total_quantity"
                    min="1"
                    defaultValue={editingEquip?.total_quantity || 1}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Loan Days</label>
                  <input
                    type="number"
                    name="max_borrow_days"
                    min="1"
                    defaultValue={editingEquip?.max_borrow_days || 7}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Condition</label>
                  <select
                    name="condition"
                    defaultValue={editingEquip?.condition || 'excellent'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lab Room Location *</label>
                  <input
                    name="location"
                    defaultValue={editingEquip?.location || ''}
                    placeholder="e.g. Rm 304, Tech Wing"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset Status</label>
                  <select
                    name="status"
                    defaultValue={editingEquip?.status || 'available'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="retired">Retired / Decommissioned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Photo URL</label>
                <input
                  name="image_url"
                  defaultValue={editingEquip?.image_url || ''}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description & Specifications</label>
                <textarea
                  name="description"
                  rows="2"
                  defaultValue={editingEquip?.description || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEquipModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {editingEquip ? 'Save Changes' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Create / Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-base">
                {editingCategory ? 'Edit Category' : 'Create Laboratory Category'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name *</label>
                <input
                  name="name"
                  defaultValue={editingCategory?.name || ''}
                  placeholder="e.g. Robotics & Prototyping"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  defaultValue={editingCategory?.description || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

