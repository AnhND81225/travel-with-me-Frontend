export type NavigationLink = readonly [to: string, label: string];

// Match protected route roles; never infer permissions from the demo role selector.
export function roleNavigation(role?: string): NavigationLink[] {
  switch (role) {
    case 'CUSTOMER': return [['/orders', 'My Orders'], ['/my-tours', 'My Tours']];
    case 'GUIDE': return [['/guide/schedules', 'My Assignments']];
    case 'STAFF': return [['/staff', 'Staff Operations']];
    case 'ADMIN': return [['/admin', 'Admin Console'], ['/staff', 'Staff Operations']];
    default: return [];
  }
}
export const publicNavigation: NavigationLink[] = [
  ['/', 'Home'], ['/shop', 'Equipment'], ['/tours', 'Tours & Events'],
];
