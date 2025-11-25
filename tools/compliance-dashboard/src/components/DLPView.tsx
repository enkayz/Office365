import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const MOCK_AUDIT_DATA = [
    { id: 'evt-001', time: '10:42 AM', user: 'alice@contoso.com', action: 'FileAccessed', resource: 'Financial_Q3.xlsx', status: 'Success', severity: 'low' },
    { id: 'evt-002', time: '10:45 AM', user: 'bob@contoso.com', action: 'DLPRuleMatch', resource: 'SSN_List.docx', status: 'Blocked', severity: 'high' },
    { id: 'evt-003', time: '11:02 AM', user: 'charlie@contoso.com', action: 'FileShared', resource: 'Project_X_Specs.pdf', status: 'Success', severity: 'medium' },
    { id: 'evt-004', time: '11:15 AM', user: 'alice@contoso.com', action: 'LabelChanged', resource: 'Public_Brief.pptx', status: 'Success', severity: 'low' },
    { id: 'evt-005', time: '11:30 AM', user: 'external@partner.com', action: 'AccessDenied', resource: 'Internal_Memo.docx', status: 'Failed', severity: 'medium' },
];

const CHART_DATA = [
    { name: 'DLP Matches', value: 12 },
    { name: 'Label Changes', value: 45 },
    { name: 'Ext. Sharing', value: 8 },
    { name: 'Access Denied', value: 23 },
];

const PIE_DATA = [
    { name: 'Confidential', value: 400 },
    { name: 'General', value: 300 },
    { name: 'Public', value: 300 },
    { name: 'Highly Confidential', value: 100 },
];

const COLORS = ['#6d28d9', '#06b6d4', '#10b981', '#ef4444'];

export function DLPView() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Activity Volume (24h)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#13131f', borderColor: '#333' }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Label Distribution */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Sensitivity Label Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={PIE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {PIE_DATA.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#13131f', borderColor: '#333' }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2 text-sm text-muted">
                        {PIE_DATA.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                                <span>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText size={20} className="text-accent" />
                        Recent Audit Events
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="bg-black/20 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-muted text-sm border-b border-white/5">
                                <th className="p-3 font-medium">Time</th>
                                <th className="p-3 font-medium">User</th>
                                <th className="p-3 font-medium">Action</th>
                                <th className="p-3 font-medium">Resource</th>
                                <th className="p-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_AUDIT_DATA.map((row) => (
                                <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-sm">{row.time}</td>
                                    <td className="p-3 text-sm">{row.user}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${row.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                            row.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {row.action}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-muted">{row.resource}</td>
                                    <td className="p-3 text-sm">
                                        {row.status === 'Blocked' ? (
                                            <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={14} /> Blocked</span>
                                        ) : row.status === 'Failed' ? (
                                            <span className="text-yellow-400">Failed</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> Success</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
