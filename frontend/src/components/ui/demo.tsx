'use client'

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { SplineScene } from '@/components/ui/splite';

export function SplineSceneBasic() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  return (
    <Card
      className="relative h-full min-h-[540px] w-full overflow-hidden bg-transparent"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        setPointer({ x: (x - 0.5) * 18, y: (0.5 - y) * 18 });
      }}
      onMouseLeave={() => setPointer({ x: 0, y: 0 })}
    >
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

      <div
        className="absolute inset-0 transition-transform duration-150 ease-out"
        style={{
          transform: `translate3d(${pointer.x * 0.6}px, ${pointer.y * 0.7}px, 0) rotateX(${pointer.y}deg) rotateY(${pointer.x}deg) scale(1.04)`,
        }}
      >
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="h-full w-full opacity-90"
        />
      </div>
    </Card>
  )
}
