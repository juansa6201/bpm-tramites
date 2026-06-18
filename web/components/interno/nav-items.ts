import type { SvgIconComponent } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import type { RolInterno } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: SvgIconComponent;
  /** Si está presente, solo estos roles ven el item. Si no, lo ven todos los internos. */
  roles?: RolInterno[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/interno', icon: DashboardIcon },
  { label: 'Trámites', href: '/interno/tramites', icon: AssignmentIcon },
  { label: 'Dashboard', href: '/interno/dashboard', icon: BarChartIcon },
  { label: 'Configuración', href: '/interno/configuracion', icon: SettingsIcon, roles: ['ADMIN'] },
];

/** Filtra los items del menú según el rol del usuario. */
export function visibleNavItems(rol: RolInterno | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || (rol !== undefined && item.roles.includes(rol)));
}
