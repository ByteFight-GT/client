import { useEffect, useState } from 'react'
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"

export default function Selector({dict,setValue,message, label}) {
  const [ids, setIds] = useState([]);
  const [placeholder, setPlaceholder] = useState("Select");
  useEffect(() => {
    setIds(dict)
    setPlaceholder(message)
  }, [dict]);
 
  const handleChange = (value) => {
      setValue(value);
  }


return (
  <Select onValueChange={handleChange}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder={placeholder}/>
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>{label}</SelectLabel>
        {ids.map((id) => (
          <SelectItem key={id} value={id}>
            {id}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
)
}
