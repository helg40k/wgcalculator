import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

const WgLogo = () => {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white m-4`}
    >
      <Image
        src="/azai_white_original.svg"
        width={50}
        height={50}
        className="hidden md:block"
        alt="Logo"
      />
      <p className="text-4xl">WG</p>
    </div>
  );
}

export default WgLogo
