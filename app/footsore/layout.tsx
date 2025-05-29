'use client';

import SideNav from '@/app/footsore/ui/sidenav';
import {DocumentDuplicateIcon, HomeIcon, PowerIcon, UserGroupIcon} from '@heroicons/react/24/outline';

const something = async () => {
  console.log('Something!')
}

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/footsore', icon: HomeIcon },
  {
    name: 'Conquest',
    href: '/footsore/conquest',
    icon: DocumentDuplicateIcon,
  },
  { name: "The Barons' War", href: '/footsore/thebaronswar', icon: UserGroupIcon },
];
const lastLink = { name: 'Something', action: something, icon: PowerIcon }

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav lastLink={lastLink} links={links} />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}

export default Layout
