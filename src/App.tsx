import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useAppStore } from './store/useAppStore';
import { useShortcuts } from './hooks/useShortcuts';
import { UploadScreen } from './components/upload/UploadScreen';
import { Header } from './components/layout/Header';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { RightSidebar } from './components/sidebar/RightSidebar';
import { LineageCanvas } from './components/graph/LineageCanvas';
import { ModelDocsPage } from './components/docs/ModelDocsPage';
import { SearchDialog } from './components/search/SearchDialog';
import { ShortcutsDialog } from './components/ShortcutsDialog';

function LineageView() {
  const leftOpen = useAppStore((s) => s.leftOpen);
  const rightOpen = useAppStore((s) => s.rightOpen);
  const fullscreen = useAppStore((s) => s.fullscreen);
  return (
    <div className="flex h-full min-h-0">
      {leftOpen && !fullscreen && (
        <div className="w-72 shrink-0">
          <LeftSidebar />
        </div>
      )}
      <div className={fullscreen ? 'fixed inset-0 z-40 bg-white dark:bg-gray-950' : 'min-w-0 flex-1'}>
        <ReactFlowProvider>
          <LineageCanvas />
        </ReactFlowProvider>
      </div>
      {rightOpen && !fullscreen && (
        <div className="w-96 shrink-0">
          <RightSidebar />
        </div>
      )}
    </div>
  );
}

function Shell() {
  const location = useLocation();
  useShortcuts(location.pathname === '/');
  return (
    <div className="flex h-full flex-col">
      <Header />
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<LineageView />} />
          <Route path="/docs/:nodeId" element={<ModelDocsPage />} />
          <Route path="*" element={<LineageView />} />
        </Routes>
      </main>
      <SearchDialog />
      <ShortcutsDialog />
    </div>
  );
}

export default function App() {
  const loaded = useAppStore((s) => s.manifest !== null);
  return <HashRouter>{loaded ? <Shell /> : <UploadScreen />}</HashRouter>;
}
