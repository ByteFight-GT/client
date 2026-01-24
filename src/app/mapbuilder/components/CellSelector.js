import { useState } from 'react'

export default function CellSelector({handleCellChange}) {
  const [ids, setIds] = useState(["Space", "Wall", "Player 1", "Player 2", "Hill"]);

    
  return (
    <div>
        <select onChange={handleCellChange} className="w-32 px-2 py-1 border rounded">
            {ids.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
    </div>
  )
}
