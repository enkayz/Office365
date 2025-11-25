import { useState } from 'react';
import { LayoutDashboard, ShieldAlert, Lock, Menu } from 'lucide-react';
import { DLPView } from './components/DLPView';
import { AccessView } from './components/AccessView';

const Overview = () => (
    <div className="glass-panel p-6 animate-in fade-in zoom-in duration-500">
        <h2 className="text-2xl font-bold mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-purple-900/20 to-black/40 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
                <h3 className="text-muted text-sm font-medium uppercase tracking-wider">Compliance Score</h3>
                <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-white">85%</p>
                    <span className="text-green-400 text-sm font-medium">+2.4%</span>
                </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-900/20 to-black/40 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/20 rounded-full blur-2xl group-hover:bg-red-500/30 transition-all"></div>
                <h3 className="text-muted text-sm font-medium uppercase tracking-wider">Active Alerts</h3>
                <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-white">3</p>
                    <span className="text-red-400 text-sm font-medium">High Severity</span>
                </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-cyan-900/20 to-black/40 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all"></div>
                <h3 className="text-muted text-sm font-medium uppercase tracking-wider">Protected Users</h3>
                <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-white">1,240</p>
                    <span className="text-cyan-400 text-sm font-medium">100% Coverage</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Recommendations</h3>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-2 h-2 mt-2 rounded-full bg-yellow-400"></div>
                        <div>
                            <p className="font-medium text-sm">Enable MFA for 12 detected guest users</p>
                            <p className="text-xs text-muted mt-1">Identity Protection • Medium Impact</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-2 h-2 mt-2 rounded-full bg-red-400"></div>
                        <div>
                            <p className="font-medium text-sm">Review 3 high-volume DLP matches</p>
                            <p className="text-xs text-muted mt-1">Data Loss Prevention • High Impact</p>
                        </div>
                    </li>
                </ul>
            </div>

            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold mb-4">System Health</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Audit Log Ingestion</span>
                            <span className="text-green-400">Operational</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Policy Sync</span>
                            <span className="text-green-400">Operational</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Graph API Latency</span>
                            <span className="text-yellow-400">Degraded (140ms)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[80%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

function App() {
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <Overview />;
            case 'dlp': return <DLPView />;
            case 'access': return <AccessView />;
            default: return <Overview />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden text-gray-100 font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-panel border-r border-white/5 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:relative md:translate-x-0`}
                style={{ backgroundColor: 'var(--bg-panel)' }}
            >
                <div className="flex items-center justify-center h-16 border-b border-white/5 bg-black/20">
                    <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">C</div>
                        <span>CIAOPS<span className="text-primary-glow">365</span></span>
                    </h1>
                </div>
                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('dlp')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'dlp' ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <ShieldAlert size={20} />
                        <span>DLP & Audit</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('access')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'access' ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <Lock size={20} />
                        <span>Access Control</span>
                    </button>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <div>
                            <p className="text-sm font-medium">Admin User</p>
                            <p className="text-xs text-muted">Global Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-app relative">
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-panel/80 backdrop-blur-md sticky top-0 z-40">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-muted hover:text-white">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="flex items-center space-x-2 text-sm px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-green-400 font-medium">Live Simulation</span>
                        </div>
                    </div>
                </header>
                <div className="p-6 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;
