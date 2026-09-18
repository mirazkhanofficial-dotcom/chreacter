/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import LayerPanel from './components/LayerPanel';
import CharacterEditor from './components/CharacterEditor';
import AnimationPreview from './components/AnimationPreview';
import AppHeader from './components/AppHeader';
import CharacterPresetsDrawer from './components/CharacterPresetsDrawer';
import { LipSyncProvider } from './context/LipSyncContext';
import { CharacterLayersProvider } from './context/CharacterLayersContext';

export default function App() {
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [skeletonFlipped, setSkeletonFlipped] = useState(false);

  return (
    <LipSyncProvider>
      <CharacterLayersProvider>
        <main
          id="app-page"
          className="min-h-screen w-full bg-[#0e1014] bg-[radial-gradient(#272a33_1px,transparent_1px)] [background-size:24px_24px] text-slate-100 p-2.5 sm:p-4 md:p-5 lg:p-6 flex flex-col gap-5"
        >
          <AppHeader />

          <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-5">
            {/* Left Column: Layers Panel */}
            <section
              id="layers-sidebar-container"
              className="w-full xl:w-[410px] 2xl:w-[440px] shrink-0"
              aria-label="Layer Management"
            >
              <LayerPanel />
            </section>

            {/* Middle Column: Interactive Character Editor Canvas */}
            <section
              id="character-editor-middle-container"
              className="w-full xl:flex-1 min-w-[320px] max-w-full flex justify-center"
              aria-label="Character Canvas Editor"
            >
              <CharacterEditor 
                showSkeleton={skeletonMode} 
                onToggleSkeleton={() => setSkeletonMode(!skeletonMode)}
                isSkeletonFlipped={skeletonFlipped}
                onToggleSkeletonFlip={() => setSkeletonFlipped(!skeletonFlipped)}
              />
            </section>

            {/* Right Column: Animation Preview & Controls */}
            <section
              id="animation-preview-container"
              className="w-full xl:w-[380px] 2xl:w-[400px] shrink-0 flex justify-center xl:justify-end xl:sticky xl:top-6"
              aria-label="Animation Preview"
            >
              <AnimationPreview 
                skeletonMode={skeletonMode} 
                onToggleSkeleton={() => setSkeletonMode(!skeletonMode)} 
                isSkeletonFlipped={skeletonFlipped}
                onToggleSkeletonFlip={() => setSkeletonFlipped(!skeletonFlipped)}
              />
            </section>
          </div>

          <CharacterPresetsDrawer />
        </main>
      </CharacterLayersProvider>
    </LipSyncProvider>
  );
}
