import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, Folder, LayoutGrid, Users } from 'lucide-react';
import AppLogo from './app-logo';

const getMainNavItems = (userRole: string): NavItem[] => {
    const commonItems: NavItem[] = [
        // {
        //     title: 'Dashboard',
        //     href: dashboard(),
        //     icon: LayoutGrid,
        // },
        {
            title: 'Calendar',
            href: '/calendar',
            icon: Calendar,
        },
        {
            title: 'Timeslots',
            href: '/timeslots',
            icon: BookOpen,
        },
    ];

    const providerItems: NavItem[] = [
        {
            title: 'Clients',
            href: '/provider/clients',
            icon: Users,
        },
    ];

    const adminItems: NavItem[] = [
        {
            title: 'User Management',
            href: '/admin/users',
            icon: Users,
        },
    ];

    let items = [...commonItems];

    if (userRole === 'service_provider' || userRole === 'admin') {
        items = [...items, ...providerItems];
    }

    if (userRole === 'admin') {
        items = [...items, ...adminItems];
    }

    return items;
};

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const mainNavItems = getMainNavItems(auth.user.role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
