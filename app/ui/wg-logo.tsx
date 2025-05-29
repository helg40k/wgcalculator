// import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

const WgLogo = () => {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image
        src="/azai_white_original.svg"
        width={50}
        height={50}
        className="hidden md:block"
        alt="Logo"
      />
      {/*<GlobeAltIcon className="h-12 w-12 rotate-[15deg]" />*/}
      <p className="text-[44px]">WG</p>
    </div>
  );
}

export default WgLogo
