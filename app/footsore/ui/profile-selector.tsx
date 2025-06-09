import Image from "next/image";

import RowSelector from "@/app/lib/row-selector";

const SelectorContent = ({
  data,
}: {
  data: {
    key: string;
    movement: string;
    attack: string;
    defence: string;
    morale: string;
    actions: string;
    points: number;
    abilities: string;
    selected: boolean;
  };
}) => {
  return (
    <div className="flex flex-row text-center">
      <p className="basis-1/12 text-left">{data.key}</p>
      <p className="basis-1/12">{data.movement}</p>
      <p className="basis-1/12">{data.attack}</p>
      <p className="basis-1/12">{data.defence}</p>
      <p className="basis-1/12">{data.morale}</p>
      <p className="basis-1/12">{data.actions}</p>
      <p className="basis-1/12">{data.points}</p>
      <p className="basis-5/12">{data.abilities}</p>
    </div>
  );
};

const ProfileSelector = ({
  profiles,
  points,
}: {
  profiles: {
    key: string;
    movement: string;
    attack: string;
    defence: string;
    morale: string;
    actions: string;
    points: number;
    abilities: string;
    selected: boolean;
  }[];
  points: Function;
}) => {
  const handleSelected = (profile: {
    key: string;
    points: number;
    selected: boolean;
  }) => {
    points(profile.points);
  };

  return (
    <div className="rounded-xl border-2 mt-2">
      <div className="truncate rounded-xl px-4 py-2 font-medium capitalize bg-gray-50">
        <div className="flex flex-row text-center">
          <p className="basis-1/12 text-left" />
          <p className="flex basis-1/12 content-center justify-center">
            <Image
              src="/footsore/movement.svg"
              width={20}
              height={48}
              alt="Movement"
              title="Movement"
            />
          </p>
          <p className="flex basis-1/12 content-center justify-center">
            <Image
              src="/footsore/attack.svg"
              width={20}
              height={48}
              alt="Attack"
              title="Attack"
            />
          </p>
          <p className="flex basis-1/12 content-center justify-center">
            <Image
              src="/footsore/defence.svg"
              width={20}
              height={48}
              alt="Defence"
              title="Defence"
            />
          </p>
          <p className="flex basis-1/12 content-center justify-center">
            <Image
              src="/footsore/morale.svg"
              width={20}
              height={48}
              alt="Morale"
              title="Morale"
            />
          </p>
          <p className="flex basis-1/12 content-center justify-center">
            <Image
              src="/footsore/actions.svg"
              width={20}
              height={48}
              alt="Actions"
              title="Actions"
            />
          </p>
          <p className="basis-1/12" title="A warrior cost in points">
            points
          </p>
          <p className="basis-5/12" title="Default warrior abilities">
            abilities
          </p>
        </div>
      </div>
      <RowSelector
        rows={profiles}
        onSelected={handleSelected}
        content={
          <SelectorContent
            data={{
              abilities: "",
              actions: "",
              attack: "",
              defence: "",
              key: "",
              morale: "",
              movement: "",
              points: 0,
              selected: false,
            }}
          />
        }
      />
    </div>
  );
};

export default ProfileSelector;
