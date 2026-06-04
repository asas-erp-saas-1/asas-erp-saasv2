import * as React from "react"
import { Phone, MessageCircle, Clock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface LeadCardProps {
  id: string
  name: string
  status: string
  value?: number
  lastContact?: string
  notes?: number
  onContact?: () => void
  onMessage?: () => void
  onView?: () => void
  className?: string
}

export function LeadCard({
  id,
  name,
  status,
  value,
  lastContact,
  notes,
  onContact,
  onMessage,
  onView,
  className,
}: LeadCardProps) {
  const statusColorMap: Record<string, string> = {
    new: "default",
    qualified: "secondary",
    visiting: "outline",
    negotiating: "success",
    option: "warning",
    reserved: "success",
    lost: "destructive",
  }

  return (
    <div
      className={`p-4 rounded-lg border border-asas-silver/20 bg-white/5 hover:bg-white/10 transition-all group cursor-pointer ${className || ""}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-asas-sand truncate group-hover:text-asas-gold transition-colors">
              {name}
            </h4>
            <p className="text-xs text-asas-silver mt-1">ID: {id.substring(0, 6)}</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {status}
          </Badge>
        </div>

        {/* Value and metadata */}
        {value && (
          <div className="pt-2 border-t border-asas-silver/10">
            <p className="text-xs text-asas-silver mb-2">Valeur estimée</p>
            <p className="text-lg font-bold text-asas-gold">
              {new Intl.NumberFormat("fr-DZ", {
                style: "currency",
                currency: "DZD",
                maximumFractionDigits: 0,
              }).format(value)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-asas-silver/10">
          <div className="flex items-center gap-1">
            {onContact && (
              <button
                onClick={onContact}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Appeler"
              >
                <Phone className="h-4 w-4 text-asas-silver hover:text-asas-gold" />
              </button>
            )}
            {onMessage && (
              <button
                onClick={onMessage}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Message"
              >
                <MessageCircle className="h-4 w-4 text-asas-silver hover:text-asas-gold" />
              </button>
            )}
            {lastContact && (
              <div className="flex items-center gap-1 ml-2 text-[10px] text-asas-silver">
                <Clock className="h-3 w-3" />
                <span>{lastContact}</span>
              </div>
            )}
          </div>
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
