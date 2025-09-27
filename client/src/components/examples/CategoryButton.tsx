import CategoryButton from '../CategoryButton'
import { Globe, Database, Gamepad2, Layers, Bot } from 'lucide-react'

export default function CategoryButtonExample() {
  return (
    <div className="flex gap-2 p-4">
      <CategoryButton label="Web app" icon={<Globe className="w-4 h-4" />} active />
      <CategoryButton label="Data app" icon={<Database className="w-4 h-4" />} />
      <CategoryButton label="3D Game" icon={<Gamepad2 className="w-4 h-4" />} />
      <CategoryButton label="General" icon={<Layers className="w-4 h-4" />} />
      <CategoryButton label="Agents & Automations" icon={<Bot className="w-4 h-4" />} badge="Beta" />
    </div>
  )
}