import React, { useState, useEffect } from 'react';
import { HardHat, Search, Filter, Plus, Loader2, Star, Phone, Mail, MapPin, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function DevelopersList() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newDeveloper, setNewDeveloper] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setDevelopers(data);
      } else {
        setDevelopers([]);
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('developers')
        .insert([
          { 
            name: newDeveloper.name, 
            contact_info: `${newDeveloper.phone} | ${newDeveloper.email} | ${newDeveloper.address}`
          }
        ] as any)
        .select();

      if (error) throw error;
      
      if (data) {
        setDevelopers([...data, ...developers]);
      }
      setShowAddModal(false);
      setNewDeveloper({ name: '', phone: '', email: '', address: '' });
    } catch (error) {
      console.error('Error adding developer:', error);
      setErrorMsg('Failed to add developer. Please try again.');
    }
  };

  const filteredDevelopers = developers.filter(dev => 
    dev.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-slate-100">Developers Directory</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Manage relationships with property promoters and developers</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Developer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search developers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevelopers.map((dev) => (
          <div key={dev.developer_id || dev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                  <HardHat className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-100 text-lg">{dev.name}</h3>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 text-slate-700" />
                    <span className="text-slate-500 ml-1 text-xs">({dev.rating || '4.0'})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-slate-400">
                <Phone className="w-4 h-4 mr-3 text-slate-500" />
                {dev.phone || '+213 555 00 00 00'}
              </div>
              <div className="flex items-center text-sm text-slate-400">
                <Mail className="w-4 h-4 mr-3 text-slate-500" />
                {dev.email || 'contact@promoter.dz'}
              </div>
              <div className="flex items-center text-sm text-slate-400">
                <MapPin className="w-4 h-4 mr-3 text-slate-500" />
                {dev.address || 'Algiers, Algeria'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Projects</p>
                <p className="text-lg font-bold text-slate-200">{dev.active_projects || Math.floor(Math.random() * 5) + 1}</p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Units</p>
                <p className="text-lg font-bold text-cyan-400">{dev.total_units || Math.floor(Math.random() * 200) + 50}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors text-sm">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Developer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-slate-100">Add New Developer</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {errorMsg && (
              <div className="m-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-400">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleAddDeveloper} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Company Name</label>
                <input 
                  type="text" 
                  required
                  value={newDeveloper.name}
                  onChange={(e) => setNewDeveloper({...newDeveloper, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="e.g. EURL Promotion Immobilière"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={newDeveloper.phone}
                  onChange={(e) => setNewDeveloper({...newDeveloper, phone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="e.g. +213 555 12 34 56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={newDeveloper.email}
                  onChange={(e) => setNewDeveloper({...newDeveloper, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="e.g. contact@promoter.dz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
                <input 
                  type="text" 
                  value={newDeveloper.address}
                  onChange={(e) => setNewDeveloper({...newDeveloper, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="e.g. Oran, Algeria"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Save Developer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
