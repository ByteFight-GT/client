import { useEffect, useState } from 'react'

export default function SymmetrySelector({handleSymmetryChange}) {
    const [ids, setIds] = useState(["Vertical", "Horizontal", "Origin"]);
    useEffect(() => {
    }, []);
    


  return (
    <div>
        <select onChange={handleSymmetryChange} className="w-32 px-2 py-1 border rounded">
            {ids.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
    </div>
  )
}
