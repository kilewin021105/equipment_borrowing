import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Package, MapPin, Clock, CheckCircle2, 
  AlertCircle, Sparkles, SlidersHorizontal, ArrowUpDown, ChevronRight, Eye, Tag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/Badge';
import { BorrowRequestModal } from '../components/BorrowRequestModal';

export function CatalogPage({ setActivePage, onOpenBorrowSlip }) {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // Modals state
  const [selectedForBorrow, setSelectedForBorrow] = useState(null);
  const [selectedForDetails, setSelectedForDetails] = useState(null);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCat) params.category_id = selectedCat;
      if (availabilityFilter) params.availability = availabilityFilter;
      if (conditionFilter) params.condition = conditionFilter;
      if (sortBy) params.sort = sortBy;

      const [equipRes, catRes] = await Promise.all([
        api.getEquipment(params),
        api.getCategories()
      ]);

      if (equipRes.success) setEquipment(equipRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getSummaryStats();
      if (res.success) setSummary(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [searchTerm, selectedCat, availabilityFilter, conditionFilter, sortBy]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBorrowClick = (item) => {
    if (!user) {
      setActivePage('login');
      return;
    }
    setSelectedForBorrow(item);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl p-8 sm:p-12 border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Central Academic Equipment Repository
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Reserve & Borrow University Equipment with Confidence.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
            Live inventory tracking across Engineering Labs, Media Studios, Computing Centers, and Science Facilities. Automated approvals, digital checkout slips, and verified condition auditing.
          </p>

          {/* Quick Stats Pill Counters */}
          {summary && (
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-2xl font-black text-white">{summary.totalEquipment}</span>
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Asset Models</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-2xl font-black text-emerald-400">{summary.availableUnits}</span>
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Units In Stock</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-2xl font-black text-blue-400">{summary.activeLoans}</span>
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Active Loans</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-2xl font-black text-indigo-300">{summary.totalUsers}</span>
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Students & Faculty</span>
              </div>
            </div>
          )}
        </div>

        {/* Ambient background glow decoration */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Search & Filter Toolbar */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by equipment name, asset tag (e.g. EQ-OSC-0101), specs, or lab room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Availability */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Availability</option>
              <option value="available">Available Now</option>
              <option value="unavailable">Checked Out / Unavailable</option>
            </select>

            {/* Condition */}
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Conditions</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="quantity_desc">Highest Stock</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 ${
              selectedCat === ''
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({equipment.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(selectedCat === String(cat.id) ? '' : String(cat.id))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 flex items-center gap-1.5 ${
                selectedCat === String(cat.id)
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCat === String(cat.id) ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {cat.total_items}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Equipment Grid */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="h-44 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">No Equipment Matches Your Criteria</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try clearing your search terms or selecting a different laboratory category.
              </p>
            </div>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCat(''); setAvailabilityFilter(''); }}
              className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold text-xs rounded-xl hover:bg-blue-100 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map(item => {
              const isAvailable = item.available_quantity > 0 && item.status === 'available';
              const percentAvailable = Math.round((item.available_quantity / item.total_quantity) * 100);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Image & Badges */}
                  <div>
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white rounded-lg shadow-sm">
                          {item.asset_tag}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      {/* Bottom Category Overlay */}
                      <div className="absolute bottom-2 left-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/90 backdrop-blur-sm text-slate-800 rounded-md shadow-xs">
                          {item.category_name || 'General Equipment'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition truncate" title={item.name}>
                          {item.name}
                        </h3>
                        {item.model_number && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Model: {item.model_number}</p>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description || 'Precision laboratory equipment available for student experiments, academic capstone, and faculty research.'}
                      </p>

                      {/* Location & Max Days */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Max {item.max_borrow_days} Days Loan
                          </span>
                          <ConditionBadge condition={item.condition} />
                        </div>
                      </div>

                      {/* Inventory Stock Meter */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Available Units:</span>
                          <span className={`font-bold ${isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {item.available_quantity} / {item.total_quantity}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentAvailable > 50
                                ? 'bg-emerald-500'
                                : percentAvailable > 20
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${percentAvailable}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedForDetails(item)}
                      className="py-2.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    <button
                      onClick={() => handleBorrowClick(item)}
                      disabled={!isAvailable}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${
                        isAvailable
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isAvailable ? 'Request Loan' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Equipment Details Modal */}
      {selectedForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              {selectedForDetails.image_url ? (
                <img src={selectedForDetails.image_url} alt={selectedForDetails.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package className="w-12 h-12" />
                </div>
              )}
              <button
                onClick={() => setSelectedForDetails(null)}
                className="absolute top-3 right-3 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedForDetails.category_name}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedForDetails.name}</h2>
                <p className="text-xs font-mono text-slate-500">Asset Tag: {selectedForDetails.asset_tag}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Laboratory Location:</span>
                  <span className="font-semibold text-slate-800">{selectedForDetails.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total University Inventory:</span>
                  <span className="font-semibold text-slate-800">{selectedForDetails.total_quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Currently Available:</span>
                  <span className="font-bold text-emerald-700">{selectedForDetails.available_quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Borrowing Window:</span>
                  <span className="font-semibold text-slate-800">{selectedForDetails.max_borrow_days} calendar days</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description & Specifications</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {selectedForDetails.description || 'No specialized description logged.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedForDetails(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedForDetails.available_quantity > 0 && selectedForDetails.status === 'available' && (
                  <button
                    onClick={() => {
                      const item = selectedForDetails;
                      setSelectedForDetails(null);
                      handleBorrowClick(item);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Request Loan Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Request Modal */}
      <BorrowRequestModal
        equipment={selectedForBorrow}
        isOpen={!!selectedForBorrow}
        onClose={() => setSelectedForBorrow(null)}
        onSuccess={() => {
          fetchCatalog();
          fetchStats();
        }}
      />
    </div>
  );
}

