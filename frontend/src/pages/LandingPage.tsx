import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import ProjectifyIcon from '../assets/icon.webp';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Inter'] overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-base-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center p-1.5 border border-base-100 dark:border-slate-800">
                                <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-['Outfit'] font-black text-2xl tracking-tighter">
                                Projectify<span className="text-primary">.</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-base-content/70 hover:text-primary transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="btn-premium-glow group">
                                <span className="btn-premium-inner h-10 px-6 text-sm font-bold bg-white dark:bg-slate-900 group-hover:bg-transparent transition-colors">
                                    Get Started
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">v2.0 is live</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
                        Manage Projects <br />
                        <span className="animate-text-glow">Like a Pro</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-base-content/60 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Streamline your team's workflow with an intuitive, powerful, and beautiful project management tool designed for modern engineering teams.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login" className="btn btn-primary btn-lg rounded-2xl px-10 shadow-xl shadow-primary/20 hover:scale-105 transition-transform text-white font-bold text-lg h-14 min-h-[3.5rem] flex items-center gap-2">
                            Launch Interactive Demo <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-white dark:bg-slate-900 border-y border-base-200 dark:border-slate-800 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Everything you need</h2>
                        <p className="text-xl text-base-content/60">to ship faster and better.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 hover:border-primary/50 transition-colors group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutDashboard size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Kanban Boards</h3>
                            <p className="text-base-content/60 leading-relaxed">
                                Visualize your workflow with flexible Kanban boards. Drag-and-drop tasks, set priorities, and track progress effortlessly.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 hover:border-purple-500/50 transition-colors group">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
                            <p className="text-base-content/60 leading-relaxed">
                                Built for teams. Assign tasks, share comments, and keep everyone aligned with real-time updates and notifications.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 hover:border-rose-500/50 transition-colors group">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Admin Controls</h3>
                            <p className="text-base-content/60 leading-relaxed">
                                Powerful admin tools to manage users, roles, and permissions. Maintain control and security over your projects.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-20 border-b border-base-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-black text-primary mb-2">10k+</div>
                            <div className="text-sm font-bold text-base-content/50 uppercase tracking-widest">Active Users</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-primary mb-2">50k+</div>
                            <div className="text-sm font-bold text-base-content/50 uppercase tracking-widest">Tasks Completed</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-primary mb-2">99.9%</div>
                            <div className="text-sm font-bold text-base-content/50 uppercase tracking-widest">Uptime</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-primary mb-2">24/7</div>
                            <div className="text-sm font-bold text-base-content/50 uppercase tracking-widest">Support</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1">
                            <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold">Projectify</span>
                    </div>
                    <p className="text-base-content/40 text-sm">
                        © {new Date().getFullYear()} Projectify Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-base-content/40">
                        <a href="#" className="hover:text-primary transition-colors"><Globe size={20} /></a>
                        <a href="#" className="hover:text-primary transition-colors"><Zap size={20} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
