import ProjectCard from '../ProjectCard'

export default function ProjectCardExample() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 max-w-4xl">
      <ProjectCard 
        title="CashflowRetro"
        description="Waiting for you"
        timeAgo="29 hours ago"
        isPrivate
        backgroundColor="bg-gradient-to-br from-orange-400 to-red-500"
        onClick={() => console.log('CashflowRetro clicked')}
      />
      <ProjectCard 
        title="StrikeAutoPilot"
        timeAgo="1 day ago"
        isPrivate
        backgroundColor="bg-gradient-to-br from-gray-700 to-gray-900"
        onClick={() => console.log('StrikeAutoPilot clicked')}
      />
      <ProjectCard 
        title="OmnicronPitch"
        timeAgo="3 days ago"
        isPrivate
        backgroundColor="bg-gradient-to-br from-blue-500 to-purple-600"
        onClick={() => console.log('OmnicronPitch clicked')}
      />
    </div>
  )
}