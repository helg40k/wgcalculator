import Image from "next/image";

const AbilitiesSelector = ({}) => {
  return (
    <div className='mt-2'>
      <div className="flex">
        <h3 className="text-md font-medium">Abilities</h3>
      </div>
      <div className='rounded-xl border-2'>
        <div className='truncate rounded-xl px-4 py-2 font-medium capitalize bg-gray-50'>
          {/*<div className="flex flex-row text-center">*/}
          {/*  <p className='basis-1/12 text-left'/>*/}
          {/*  <p className='flex basis-1/12 content-center justify-center'>*/}
          {/*    <Image src="/footsore/movement.svg" width={20} height={48} alt='Movement' title='Movement'/>*/}
          {/*  </p>*/}
          {/*  <p className='flex basis-1/12 content-center justify-center'>*/}
          {/*    <Image src="/footsore/attack.svg" width={20} height={48} alt='Attack' title='Attack'/>*/}
          {/*  </p>*/}
          {/*  <p className='flex basis-1/12 content-center justify-center'>*/}
          {/*    <Image src="/footsore/defence.svg" width={20} height={48} alt='Defence' title='Defence'/>*/}
          {/*  </p>*/}
          {/*  <p className='flex basis-1/12 content-center justify-center'>*/}
          {/*    <Image src="/footsore/morale.svg" width={20} height={48} alt='Morale' title='Morale'/>*/}
          {/*  </p>*/}
          {/*  <p className='flex basis-1/12 content-center justify-center'>*/}
          {/*    <Image src="/footsore/actions.svg" width={20} height={48} alt='Actions' title='Actions'/>*/}
          {/*  </p>*/}
          {/*  <p className='basis-1/12' title='A warrior cost in points'>points</p>*/}
          {/*  <p className='basis-5/12' title='Default warrior abilities'>abilities</p>*/}
          {/*</div>*/}
        </div>
      </div>
    </div>
  )
}

export default AbilitiesSelector
