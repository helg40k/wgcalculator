'use client';

import ProfileSelector from '@/app/ui/footsore/profile-selector';
import EquipmentSelector from '@/app/ui/footsore/equipment-selector'
import AbilitiesSelector from '@/app/ui/footsore/abilities-selector'
import {ChangeEvent, FocusEvent, useState} from "react";

const defaultProfileKey = 'Regular'
const unitName = 'Foot Knights'
const unitMinSize = 3
const profiles = [
  {
    key: 'Veteran',
    movement: '4',
    attack: '4+',
    defence: '5+',
    morale: '3+',
    actions: '1',
    points: 24,
    abilities: 'Chivalry, Live by the Sword',
    selected: false
  },
  {
    key: 'Regular',
    movement: '4',
    attack: '5+',
    defence: '5+',
    morale: '4+',
    actions: '1',
    points: 21,
    abilities: 'Chivalry, Live by the Sword',
    selected: true
  },
  {
    key: 'Irregular',
    movement: '4',
    attack: '6+',
    defence: '5+',
    morale: '5+',
    actions: '1',
    points: 17,
    abilities: 'Chivalry',
    selected: false
  }
]

const UnitCard = () => {
  const [error, setError] = useState('')
  const [unitSize, setUnitSize] = useState(unitMinSize)
  const [unitCost, setUnitCost] = useState(profiles.find((p) => defaultProfileKey === p.key)?.points || 0)

  const fetchProfilePoints = (pts: number) => {
    setUnitCost(pts)
  }

  const setWarriorQuantity = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value) {
      const numValue = Number.parseInt(value)
      if (numValue >= unitMinSize) {
        setUnitSize(numValue)
        if (error) {
          setError('')
        }
      }
    }
  }

  const validateWarriorQuantity = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value) {
      const numValue = Number.parseInt(value)
      if (numValue >= unitMinSize) {
        return
      }
    }
    setError(`The unit must consist of at least ${unitMinSize} warriors!`)
  }

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-2">
        <h3 className="text-xl font-medium">{unitName}</h3>
      </div>
      <div className="flex p-0 font-medium">
        <input type="number" min='3' defaultValue='3' step='1'
               inputMode='numeric' onChange={setWarriorQuantity} onBlur={validateWarriorQuantity}
               className='rounded-md p-0 pl-2 mr-1 w-14 border-1 focus:ring-0 border-slate-200 focus:border-slate-200 active:border-slate-300'/>
        <h3 className="pr-1">warriors:</h3>
        {error ? <h3 className="pl-1 text-red-600 font-semibold">{error}</h3>
          : <h3 className="pl-1">{unitSize * unitCost} points</h3>}
      </div>
      <ProfileSelector profiles={profiles} points={fetchProfilePoints}/>
      <EquipmentSelector />
      <AbilitiesSelector />
    </div>
  );
}

export default UnitCard
