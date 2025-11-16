import './App.css'
import { useInitDevTool } from './hooks/useInitDevTool';
import { MainContent } from './ui/MainContent/MainContent'
import { Layout } from './ui/Layout/Layout'

function App() {
  useInitDevTool();

  return (
    <>
      <Layout>
        <MainContent />
      </Layout>
    </>
  )
}

export default App
