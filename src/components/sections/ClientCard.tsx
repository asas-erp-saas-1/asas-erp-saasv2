import * as React from "react"
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface ClientCardProps {
  id: string
  name: string
  email?: string
  phone?: string
  location?: string
  status?: string
  deals?: number
  totalValue?: number
  avatar?: string
  onContact?: () => void
  onView?: () => void
  className?: string
}

export function ClientCard({
  id,
  name,
  email,
  phone,
  location,
  status = "active",
  deals,
  totalValue,
  avatar,
  onContact,
  onView,
  className,
}: ClientCardProps) {
  const statusColorMap: Record<string, string> = {
    active: "success",
    inactive: "secondary",
    prospect: "warning",
    vip: "info",
  }

  return (
    <div
      className={`p-4 rounded-lg border border-asas-silver/20 bg-white/5 hover:bg-white/10 hover:border-asas-gold/30 transition-all group ${className || ""}`}
    >
      <div className="space-y-3">
        {/* Header with avatar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-asas-gold/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-asas-gold">
                {name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-asas-sand truncate group-hover:text-asas-gold transition-colors">
                {name}
              </h3>
              <p className="text-xs text-asas-silver/70 mt-0.5">ID: {id.substring(0, 6)}</p>
            </div>
          </div>
          <Badge
            variant={statusColorMap[status] as any}
            className="text-[10px] flex-shrink-0"
          >
            {status}
          </Badge>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 pt-2 border-t border-asas-silver/10">
          {email && (
            <div className="flex items-center gap-2 text-xs text-asas-silver/70">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <a
                href={`mailto:${email}`}
                className="truncate hover:text-asas-gold transition-colors"
              >
                {email}
              </a>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-xs text-asas-silver/70">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <a
                href={`tel:${phone}`}
                className="hover:text-asas-gold transition-colors"
              >
                {phone}
              </a>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-xs text-asas-silver/70">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {(deals !== undefined || totalValue !== undefined) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-asas-silver/10">
            {deals !== undefined && (
              <div>
                <p className="text-[10px] text-asas-silver/70 uppercase tracking-wider">
                  Dossiers
                </p>
                <p className="text-lg font-bold text-asas-sand">{deals}</p>
              </div>
            )}
            {totalValue !== undefined && (
              <div>
                <p className="text-[10px] text-asas-silver/70 uppercase tracking-wider">
                  Valeur
                </p>
                <p className="text-lg font-bold text-asas-gold">
                  {new Intl.NumberFormat("fr-DZ", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(totalValue)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {(onContact || onView) && (
          <div className="flex items-center gap-2 pt-3 border-t border-asas-silver/10">
            {onContact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onContact}
                className="flex-1"
              >
                Contacter
              </Button>
            )}
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex-1"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
