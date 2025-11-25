import { useState } from 'react';
import { Shield, Users, Globe, Smartphone, Plus } from 'lucide-react';

const MOCK_POLICIES = [
    { id: 1, name: 'Require MFA for Admins', state: 'On', target: 'All Admins', grant: 'Require MFA' },
    { id: 2, name: 'Block Legacy Auth', state: 'On', target: 'All Users', grant: 'Block' },
    { id: 3, name: 'Require Compliant Device (HR)', state: 'Report-Only', target: 'HR Dept', grant: 'Require Compliant Device' },
    { id: 4, name: 'Block High Risk Sign-ins', state: 'On', target: 'All Users', grant: 'Block' },
];

export function AccessView() {
    const [policies, setPolicies] = useState(MOCK_POLICIES);
    const [showBuilder, setShowBuilder] = useState(false);

    // Builder State
    const [newName, setNewName] = useState('');
    const [newTarget, setNewTarget] = useState('All Users');
    const [newGrant, setNewGrant] = useState('Require MFA');

    const handleCreate = () => {
        if (!newName) return;
        setPolicies([...policies, {
            id: Date.now(),
            name: newName,
            state: 'On',
            target: newTarget,
            grant: newGrant
        }]);
        setShowBuilder(false);
        setNewName('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Conditional Access Policies</h2>
                    <p className="text-muted">Manage access control logic for your organization.</p>
                </div>
                <button
                    onClick={() => setShowBuilder(true)}
                    className="bg-primary hover:bg-primary-glow text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <Plus size={18} />
                    New Policy
                </button>
            </div>

            {showBuilder && (
                <div className="glass-panel p-6 border-primary/50 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Create New Policy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-muted mb-1">Policy Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-primary/50 outline-none"
                                placeholder="e.g. Block external access"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">Assignments (Users)</label>
                            <select
                                value={newTarget}
                                onChange={(e) => setNewTarget(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-primary/50 outline-none"
                            >
                                <option>All Users</option>
                                <option>All Admins</option>
                                <option>Guest Users</option>
                                <option>Finance Dept</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">Access Controls</label>
                            <select
                                value={newGrant}
                                onChange={(e) => setNewGrant(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-primary/50 outline-none"
                            >
                                <option>Require MFA</option>
                                <option>Require Compliant Device</option>
                                <option>Block Access</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowBuilder(false)} className="bg-transparent hover:bg-white/5 border border-white/10">Cancel</button>
                        <button onClick={handleCreate} className="bg-accent text-black hover:bg-cyan-400 border-none">Create Policy</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {policies.map((policy) => (
                    <div key={policy.id} className="glass-panel p-4 flex items-center justify-between hover:border-white/20 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${policy.grant.includes('Block') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{policy.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted mt-1">
                                    <span className="flex items-center gap-1"><Users size={14} /> {policy.target}</span>
                                    <span className="flex items-center gap-1"><Globe size={14} /> Any Location</span>
                                    <span className="flex items-center gap-1"><Smartphone size={14} /> Any Device</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm text-muted">Grant</div>
                                <div className={`font-medium ${policy.grant.includes('Block') ? 'text-red-400' : 'text-green-400'}`}>
                                    {policy.grant}
                                </div>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${policy.state === 'On' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                }`}>
                                {policy.state.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
