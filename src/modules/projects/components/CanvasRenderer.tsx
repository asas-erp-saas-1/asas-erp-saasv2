'use client'

import { useEffect, useState, useRef } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva'
import useImage from 'use-image'
import type { Property } from '@/types/app'

// Une image de plan de masse / floor plan
const PLAN_URL = 'https://picsum.photos/seed/floorplan/1200/800' 

export default function CanvasRenderer({ properties }: { properties: Property[] }) {
  const [image] = useImage(PLAN_URL, 'anonymous')
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
         setDimensions({
           width: containerRef.current.offsetWidth,
           height: containerRef.current.offsetHeight
         })
         // Calcule du scale pour fit cover l'image dans le container (si on avait les vraies dimensions)
         // Ici on reste simple
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Si on n'a pas les coords, on simule une grille
  const generatedShapes = properties.map((p, index) => {
     const cols = 5
     const w = 120
     const h = 80
     const x = 50 + (index % cols) * (w + 20)
     const y = 50 + Math.floor(index / cols) * (h + 20)
     
     let color = 'rgba(255,255,255,0.4)'
     let strokeColor = '#cccccc'
     if (p.status === 'sold') {
       color = 'rgba(16, 185, 129, 0.5)' // Emerald 500
       strokeColor = '#059669' // Emerald 600
     } else if (p.status === 'reserved') {
       color = 'rgba(245, 158, 11, 0.5)' // Amber 500
       strokeColor = '#d97706' // Amber 600
     } else if (p.status === 'available') {
       color = 'rgba(59, 130, 246, 0.5)' // Blue 500
       strokeColor = '#2563eb' // Blue 600
     }

     return {
       ...p,
       x, y, w, h, color, strokeColor
     }
  })

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ cursor: 'grab' }}>
       {dimensions.width > 0 && (
          <Stage 
            width={dimensions.width} 
            height={dimensions.height}
            draggable
            onWheel={(e) => {
              e.evt.preventDefault()
              const scaleBy = 1.05
              const stage = e.target.getStage()
              if (!stage) return
              const oldScale = stage.scaleX()
              const pointer = stage.getPointerPosition()
              if (!pointer) return

              const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
              }
              const direction = e.evt.deltaY > 0 ? -1 : 1
              const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
              stage.scale({ x: newScale, y: newScale })
              
              const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
              }
              stage.position(newPos)
            }}
          >
             <Layer>
                {/* Image de fond */}
                {image && (
                   <KonvaImage 
                     image={image} 
                     opacity={0.3} // Darker for UI
                   />
                )}
                <Rect 
                   width={1200} height={800} fill="rgba(0,0,0,0.5)"
                   listening={false}
                />

                {/* Polygones/Rectangles */}
                {generatedShapes.map((shape) => {
                   const isSelected = selectedId === shape.id
                   return (
                     <Group 
                        key={shape.id} 
                        x={shape.x} y={shape.y}
                        onClick={() => setSelectedId(isSelected ? null : shape.id)}
                        onTap={() => setSelectedId(isSelected ? null : shape.id)}
                     >
                       <Rect
                         width={shape.w}
                         height={shape.h}
                         fill={isSelected ? shape.color.replace('0.5', '0.8') : shape.color}
                         stroke={isSelected ? '#ffffff' : shape.strokeColor}
                         strokeWidth={isSelected ? 3 : 1}
                         cornerRadius={8}
                         shadowColor="black"
                         shadowBlur={isSelected ? 10 : 0}
                         shadowOpacity={0.2}
                         onMouseEnter={(e) => {
                           // change cursor
                           const container = e.target.getStage()?.container()
                           if (container) container.style.cursor = 'pointer'
                         }}
                         onMouseLeave={(e) => {
                           const container = e.target.getStage()?.container()
                           if (container) container.style.cursor = 'grab'
                         }}
                       />
                       <Text 
                          text={shape.reference_code || 'Lot'}
                          x={10} y={15}
                          fill="#ffffff"
                          fontSize={14}
                          fontStyle="bold"
                          fontFamily="sans-serif"
                       />
                       <Text 
                          text={shape.status.toUpperCase()}
                          x={10} y={40}
                          fill="rgba(255,255,255,0.7)"
                          fontSize={10}
                          fontFamily="sans-serif"
                       />
                       <Text 
                          text={`${shape.area_sqm} m²`}
                          x={10} y={55}
                          fill="rgba(255,255,255,0.7)"
                          fontSize={10}
                          fontFamily="sans-serif"
                       />
                     </Group>
                   )
                })}
             </Layer>
          </Stage>
       )}

       {/* Panel Lateral Si selectionné */}
       {selectedId && (
         <div className="absolute top-4 right-4 w-72 bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-5 z-10 backdrop-blur-md">
            {(() => {
               const p = properties.find(x => x.id === selectedId)
               if (!p) return null
               return (
                 <>
                   <div className="flex justify-between items-start mb-4 border-b border-black/5 dark:border-white/5 pb-4">
                     <div>
                       <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${
                         p.status === 'sold' ? 'bg-emerald-500/20 text-emerald-500' :
                         p.status === 'reserved' ? 'bg-amber-500/20 text-amber-500' :
                         'bg-blue-500/20 text-blue-500'
                       }`}>
                         {p.status}
                       </span>
                       <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-2">{p.reference_code}</h3>
                     </div>
                   </div>
                   <div className="space-y-3 text-sm">
                     <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Type</span><span className="font-bold text-gray-900 dark:text-white">{p.type}</span></div>
                     <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Surface</span><span className="font-bold text-gray-900 dark:text-white">{p.area_sqm} m²</span></div>
                     <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Prix</span><span className="font-black text-gray-900 dark:text-white">{(p.list_price / 1000000).toFixed(1)}M DZD</span></div>
                   </div>
                   
                   <button className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors">
                     Voir la fiche détaillée
                   </button>
                 </>
               )
            })()}
         </div>
       )}
    </div>
  )
}
