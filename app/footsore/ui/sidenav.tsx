import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import NavLinks from "@/app/footsore/ui/nav-links";
import WgLogo from "@/app/ui/wg-logo";

const SideNav = ({
  lastLink,
  links,
}: {
  lastLink: { name: string; action: () => void; icon: typeof LinkIcon };
  links: { name: string; href: string; icon: typeof LinkIcon }[];
}) => {
  const LastIcon = lastLink.icon;
  const func = lastLink.action;
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:h-40"
        href="/public"
      >
        <div className="w-32 text-white md:w-40">
          <WgLogo />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks links={links} />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        <form
          action={async () => {
            await func();
          }}
        >
          <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <LastIcon className="w-6" />
            <div className="hidden md:block">{lastLink.name}</div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SideNav;
