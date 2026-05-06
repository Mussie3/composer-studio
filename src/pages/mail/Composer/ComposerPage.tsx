import EditorHeader from './components/Header/EditorHeader'
import NavigationPanel from './components/NavigationPanel/NavigationPanel'
import Canvas from './components/Canvas/Canvas'
import ControlPanel from './components/ControlPanel/ControlPanel'
import { useComposerWiring } from './hooks/useComposerWiring'

export default function ComposerPage() {
  const { saveNow, exit, mailId } = useComposerWiring()
  return (
    <div className="h-full flex flex-col">
      <EditorHeader onSave={saveNow} onExit={exit} mailId={mailId} />
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
