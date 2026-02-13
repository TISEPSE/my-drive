import { useState, useRef } from 'react'

const samplePhotos = [
  { id: 1, name: 'Hero_Banner_v4.jpg', size: '4.2 MB', date: 'Today', color: '#6366f1', span: 'col-span-2 row-span-2' },
  { id: 2, name: 'Team_Photo_2024.png', size: '8.1 MB', date: 'Yesterday', color: '#ec4899', span: '' },
  { id: 3, name: 'Product_Shot_01.jpg', size: '3.6 MB', date: 'Yesterday', color: '#3b82f6', span: '' },
  { id: 4, name: 'Office_Panorama.jpg', size: '12.4 MB', date: 'Oct 24', color: '#22c55e', span: 'col-span-2' },
  { id: 5, name: 'Logo_Draft_v2.png', size: '1.2 MB', date: 'Oct 23', color: '#f97316', span: '' },
  { id: 6, name: 'Event_Cover.jpg', size: '5.7 MB', date: 'Oct 23', color: '#a855f7', span: '' },
  { id: 7, name: 'UI_Screenshot.png', size: '2.3 MB', date: 'Oct 22', color: '#06b6d4', span: '' },
  { id: 8, name: 'Landscape_Sunset.jpg', size: '6.8 MB', date: 'Oct 21', color: '#ef4444', span: 'col-span-2 row-span-2' },
  { id: 9, name: 'Avatar_Alex.png', size: '0.4 MB', date: 'Oct 20', color: '#8b5cf6', span: '' },
  { id: 10, name: 'Mockup_App_v3.jpg', size: '3.9 MB', date: 'Oct 19', color: '#14b8a6', span: '' },
  { id: 11, name: 'Infographic_Q3.png', size: '2.1 MB', date: 'Oct 18', color: '#f59e0b', span: 'col-span-2' },
  { id: 12, name: 'Background_Pattern.jpg', size: '1.8 MB', date: 'Oct 17', color: '#64748b', span: '' },
  { id: 13, name: 'App_Icon_Final.png', size: '0.8 MB', date: 'Oct 16', color: '#ef4444', span: '' },
  { id: 14, name: 'Dashboard_Wireframe.png', size: '1.5 MB', date: 'Oct 15', color: '#3b82f6', span: '' },
  { id: 15, name: 'Brand_Guidelines.jpg', size: '9.3 MB', date: 'Oct 14', color: '#a855f7', span: 'row-span-2' },
  { id: 16, name: 'Social_Banner.jpg', size: '3.1 MB', date: 'Oct 13', color: '#22c55e', span: '' },
]

const gridSizes = {
  small: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
  medium: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
  large: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
}

const mosaicSizes = {
  small: 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 auto-rows-[60px]',
  medium: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 auto-rows-[80px]',
  large: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 auto-rows-[100px]',
}

function PhotoCard({ photo, gridSize, mosaic, onClick }) {
  return (
    <div
      onClick={() => onClick(photo)}
      className={`group relative rounded-lg overflow-hidden cursor-pointer border border-slate-200/50 dark:border-border-dark/50 hover:border-primary/40 transition-all ${mosaic ? 'h-full' : 'aspect-square'}`}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: photo.color + '15' }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            color: photo.color,
            opacity: 0.4,
            fontSize: gridSize === 'small' ? '24px' : gridSize === 'medium' ? '32px' : '40px',
          }}
        >image</span>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-150 flex flex-col justify-between opacity-0 group-hover:opacity-100">
        <div className="flex justify-end p-1.5">
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-[16px]">download</span>
          </button>
        </div>
        <div className="px-2 pb-2">
          <p className="text-[11px] font-medium text-white truncate">{photo.name}</p>
          <p className="text-[10px] text-white/60">{photo.size}</p>
        </div>
      </div>
    </div>
  )
}

function Lightbox({ photo, onClose, onPrev, onNext }) {
  if (!photo) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={onClose}>
        <span className="material-symbols-outlined text-white">close</span>
      </button>

      <button
        className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
      >
        <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
      </button>

      <div
        className="w-[70vw] max-w-[700px] aspect-square rounded-2xl flex items-center justify-center"
        style={{ background: photo.color + '20' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <span className="material-symbols-outlined text-7xl mb-3" style={{ color: photo.color, opacity: 0.5 }}>image</span>
          <p className="text-sm font-medium text-white/80">{photo.name}</p>
          <p className="text-xs text-white/50 mt-1">{photo.size}</p>
        </div>
      </div>

      <button
        className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={(e) => { e.stopPropagation(); onNext() }}
      >
        <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-xl px-5 py-2.5 flex items-center gap-5" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-white">{photo.name}</p>
        <p className="text-xs text-white/60">{photo.size}</p>
        <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-blue-400 transition-colors">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Download
        </button>
      </div>
    </div>
  )
}

export default function Gallery() {
  const [gridSize, setGridSize] = useState('medium')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const fileInputRef = useRef(null)

  const selectedIndex = selectedPhoto ? samplePhotos.findIndex(p => p.id === selectedPhoto.id) : -1

  const handlePrev = () => {
    if (selectedIndex > 0) setSelectedPhoto(samplePhotos[selectedIndex - 1])
  }
  const handleNext = () => {
    if (selectedIndex < samplePhotos.length - 1) setSelectedPhoto(samplePhotos[selectedIndex + 1])
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gallery</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{samplePhotos.length} photos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => setViewMode('mosaic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'mosaic' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">view_quilt</span>
              Mosaic
            </button>
          </div>

          {/* Size toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
            {[
              { id: 'small', label: 'S' },
              { id: 'medium', label: 'M' },
              { id: 'large', label: 'L' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setGridSize(s.id)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  gridSize === s.id
                    ? 'text-primary bg-primary/5 dark:bg-primary/10'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            Upload
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" />
        </div>
      </div>

      {/* Photo grid / mosaic */}
      {viewMode === 'grid' ? (
        <div className={`grid ${gridSizes[gridSize]} gap-2`}>
          {samplePhotos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} gridSize={gridSize} mosaic={false} onClick={setSelectedPhoto} />
          ))}
        </div>
      ) : (
        <div className={`grid ${mosaicSizes[gridSize]} gap-2`}>
          {samplePhotos.map(photo => (
            <div key={photo.id} className={photo.span}>
              <PhotoCard photo={photo} gridSize={gridSize} mosaic={true} onClick={setSelectedPhoto} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {samplePhotos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">photo_library</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No photos yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            Upload your first photos to start building your gallery.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            Upload Photos
          </button>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}
