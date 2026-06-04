import * as React from "react"
import { MessageSquare, Clock } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface DealCardProps {
  id: string
  clientName: string
  stage: string
  value: number
  progress?: number
  assignee?: {
    initials: string
    name: string
  }
  notes?: number
  onMessage?: () => void
  onClick?: () => void
  isDragging?: boolean
  className?: string
}

export function DealCard({
  id,
  clientName,
  stage,
  value,
  progress,
  assignee,
  notes,
  onMessage,
  onClick,
  isDragging,
  className,
}: DealCardProps) {
  const stageColorMap: Record<string, string> = {
    DRAFT: "default",
    PENDING_APPROVAL: "secondary",
    APPROVED: "info",
    CONTRACT_PENDING: "warning",
    CLOSED_WON: "success",
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all group cursor-grab active:cursor-grabbing ${
        isDragging
          ? "shadow-lg border-asas-gold/50 bg-asas-charcoal opacity-95"
          : "border-asas-silver/20 bg-white/5 hover:border-asas-gold/30 hover:bg-white/10"
      } ${className || ""}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-asas-silver/60 mb-1">
              Deal #{id.substring(0, 6).toUpperCase()}
            </p>
            <h4 className="text-sm font-bold text-asas-sand truncate group-hover:text-asas-gold transition-colors">
              {clientName}
            </h4>
          </div>
          <div className="w-2 h-2 rounded-full bg-asas-gold shadow-[0_0_8px_rgba(199,161,90,0.4)] flex-shrink-0 mt-1" />
        </div>

        {/* Stage Badge */}
        <Badge
          variant="secondary"
          className="text-[10px] w-fit"
        >
          {stage}
        </Badge>

        {/* Value */}
        <div className="pt-2 border-t border-asas-silver/10">
          <p className="text-[10px] text-asas-silver/70 uppercase tracking-wider mb-1">
            Montant Estimé
          </p>
          <p className="text-lg font-bold text-asas-gold">
            {new Intl.NumberFormat("fr-DZ", {
              style: "currency",
              currency: "DZD",
              maximumFractionDigits: 0,
            }).format(value)}
          </p>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="pt-2">
            <div className="w-full h-1.5 bg-asas-silver/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-asas-gold transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-asas-silver mt-1">{progress}% complet</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-asas-silver/10">
          <div className="flex items-center gap-2">
            {assignee && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-sm bg-white/10 border border-asas-silver/20 flex items-center justify-center text-[9px] font-bold text-asas-gold">
                  {assignee.initials}
                </div>
                <span className="text-[10px] text-asas-silver/70 truncate max-w-[60px]">
                  {assignee.name}
                </span>
              </div>
            )}
          </div>
          {onMessage && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMessage()
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Message"
            >
              <MessageSquare className="h-3.5 w-3.5 text-asas-silver hover:text-asas-gold" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
