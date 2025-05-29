// import Image from "next/image";
import WgLogo from '@/app/ui/wg-logo';

import Link from "next/link";

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        <WgLogo/>
      </div>
      <Link
        key='Footsore'
        href='/footsore'
        className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
      >
        <p className="hidden md:block">Footsore</p>
      </Link>
    </main>
  );
}

export default Home
