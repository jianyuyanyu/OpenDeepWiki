import React, { useEffect, useRef } from 'react'
import mediumZoom from 'medium-zoom'

interface ImageZoomProps {
  src?: string
  alt?: string
  title?: string
  className?: string
}

export default function ImageZoom({ src, alt, title, className }: ImageZoomProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current) {
      const zoom = mediumZoom(imgRef.current, {
        background: 'rgba(0, 0, 0, 0.8)',
        margin: 24,
      })

      return () => {
        zoom.detach()
      }
    }
  }, [src])

  return (
    <figure className="my-8 max-w-full overflow-hidden group">
      <div className="inline-block max-w-full overflow-hidden rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in">
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          title={title}
          className={`block w-full max-w-[800px] h-auto mx-auto transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
          style={{ maxWidth: '100%' }}
          loading="lazy"
        />
      </div>
      {alt && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}
