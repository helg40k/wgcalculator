import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { getLinkLabel } from "@/app/ui/shared";

const LinksView = ({ urls }: { urls: string[] | undefined }) => {
  return (
    urls?.length &&
    urls.map((url, i) => (
      <Link
        key={`url${i}`}
        href={url}
        className="flex items-center"
        rel="noopener noreferrer"
        target="_blank"
      >
        <LinkIcon className="h-3" />
        <div className="ml-1">{getLinkLabel(url)}</div>
      </Link>
    ))
  );
};

export default LinksView;
