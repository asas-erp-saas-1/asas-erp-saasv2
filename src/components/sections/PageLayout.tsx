import * as React from "react"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className={`min-h-screen space-y-8 px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  )
}

interface SectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Section({
  title,
  description,
  children,
  className = "",
}: SectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-asas-sand">{title}</h2>
          {description && (
            <p className="text-sm text-asas-silver">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

interface GridProps {
  cols?: number
  children: React.ReactNode
  gap?: string
  className?: string
}

export function Grid({
  cols = 3,
  children,
  gap = "gap-6",
  className = "",
}: GridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div
      className={`grid ${colsClass[cols as keyof typeof colsClass] || colsClass[3]} ${gap} ${className}`}
    >
      {children}
    </div>
  )
}
