'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Send,
    LogOut as LogOutIcon,
    ChevronDown,
    UserCircle,
    X,
    Menu,
    User as UserIcon,
    Settings,
    Briefcase,
    LayoutDashboard,
    FileText,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    if (!user) return null;

    let navLinks = [];

    if (user.role === 'admin') {
        navLinks = [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
            { name: 'Applications', href: '/admin/applications', icon: FileText },
            { name: 'Users', href: '/admin/users', icon: UserIcon },
        ];
    } else if (user.role === 'company') {
        navLinks = [
            { name: 'Dashboard', href: '/company', icon: LayoutDashboard },
            { name: 'Jobs', href: '/company/jobs', icon: Briefcase },
            { name: 'Applications', href: '/company/applications', icon: FileText },
        ];
    } else {
        navLinks = [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Jobs', href: '/jobs', icon: Briefcase },
            { name: 'My Applications', href: '/dashboard/applications', icon: Send },
            { name: 'My Resumes', href: '/dashboard/resumes', icon: FileText },
            { name: 'Recommendations', href: '/dashboard/recommendations', icon: Target },
        ];
    }

    return (
        <nav className="sticky top-0 z-50 w-full glass border-b border-border/40 px-4 md:px-8">
            <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
                {/* Logo */}
                <Link href={user.role === 'admin' ? '/admin' : user.role === 'company' ? '/company' : '/dashboard'} className="flex items-center gap-2 group">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground group-hover:scale-110 transition-transform duration-300">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline-block">Job Forge</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary/80 border border-border/50 transition-all duration-300"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <UserCircle className="w-6 h-6" />
                                </div>
                                <div className="hidden sm:flex flex-col items-start leading-none mr-2">
                                    <span className="text-xs font-bold">{user.name || user.username}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-0.5">{user.role}</span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-2xl p-2 glass border-border/50" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal p-2">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">{user.name || user.username}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors py-2.5">
                                <Link href={user.role === 'admin' ? '/admin/profile' : user.role === 'company' ? '/company/profile' : '/dashboard/profile'} className="flex items-center gap-2 w-full">
                                    <Settings className="w-4 h-4" />
                                    <span>Profile Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem
                                onClick={logout}
                                className="rounded-xl cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors py-2.5"
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <LogOutIcon className="w-4 h-4" />
                                    <span>Log out</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden rounded-xl h-10 w-10 border border-border/50"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden py-4 space-y-2 animate-in slide-in-from-top duration-300">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {link.name}
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
