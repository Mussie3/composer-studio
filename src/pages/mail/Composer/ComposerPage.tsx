import EditorHeader from './components/Header/EditorHeader'
import NavigationPanel from './components/NavigationPanel/NavigationPanel'
import Canvas from './components/Canvas/Canvas'
import ControlPanel from './components/ControlPanel/ControlPanel'

export default function ComposerPage() {
  return (
    <div className="h-full flex flex-col">
      <EditorHeader />
      <div className="flex-1 flex overflow-hidden">
        <NavigationPanel />
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>
        <ControlPanel />
      </div>
    </div>
  )
}
