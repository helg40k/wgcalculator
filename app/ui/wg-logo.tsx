import Image from "next/image";

import { lusitana } from "@/app/ui/fonts";

const WgLogo = () => {
  return (
    <div
      className={`${lusitana.className} m-4 flex flex-row items-center leading-none text-white`}
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
};

export default WgLogo;
