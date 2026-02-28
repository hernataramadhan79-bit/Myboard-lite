import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
}

export const Header = React.memo(({ onToggleSidebar, isSidebarOpen = true }: HeaderProps) => {
    const { settings, notifications, markAllNotificationsAsRead, clearNotifications } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getNotifIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle size={18} className="text-orange-500" />;
            case 'SUCCESS': return <CheckCircle size={18} className="text-green-500" />;
            case 'ERROR': return <AlertCircle size={18} className="text-red-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    const getNotifBg = (type: string) => {
        switch (type) {
            case 'WARNING': return 'bg-orange-50 border-orange-100';
            case 'SUCCESS': return 'bg-green-50 border-green-100';
            case 'ERROR': return 'bg-red-50 border-red-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm z-30 relative print:hidden">
            <div className="flex items-center">
                {/* Sidebar Toggle Button (Desktop/Tablet) */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden md:flex mr-4 p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                    title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
                >
                    <Menu size={20} />
                </button>

                <div className="flex flex-col md:flex-row md:items-center text-slate-500 text-sm">
                    <span className="font-bold text-teal-700 text-lg mr-4 md:border-r md:pr-4 md:border-gray-300">{settings.storeName}</span>
                    <div className="hidden md:block">
                        <span className="font-medium">{formatDate(currentTime)}</span>
                        <span className="mx-2">•</span>
                        <span className="font-bold text-slate-800">{formatTime(currentTime)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-6">

                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`relative p-2 rounded-full transition-all ${isNotifOpen ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-teal-600 hover:bg-slate-50'}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform origin-top-right transition-all z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-800 flex items-center">
                                    Notifikasi
                                    {unreadCount > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{unreadCount} baru</span>}
                                </h3>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={markAllNotificationsAsRead}
                                        title="Tandai semua sudah dibaca"
                                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={clearNotifications}
                                        title="Hapus semua notifikasi"
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Tidak ada notifikasi saat ini.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notif) => (
                                            <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-teal-50/30' : ''}`}>
                                                <div className="flex items-start">
                                                    <div className={`p-2 rounded-full mr-3 shrink-0 ${getNotifBg(notif.type)}`}>
                                                        {getNotifIcon(notif.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <h4 className={`text-sm font-bold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
                                                                {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <div className="ml-2 mt-1.5 w-2 h-2 bg-teal-500 rounded-full shrink-0"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                                    <button onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 py-1">
                                        Tutup Panel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                    A
                </div>
            </div>
        </header>
    );
});