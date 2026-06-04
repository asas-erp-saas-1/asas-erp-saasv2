import * as React from "react"
import { Building2, MapPin, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface PropertyCardProps {
  id: string
  name: string
  location: string
  type: string
  units: number
  available: number
  price?: number
  status?: string
  image?: string
  onView?: () => void
  onEdit?: () => void
  className?: string
}

export function PropertyCard({
  id,
  name,
  location,
  type,
  units,
  available,
  price,
  status = "active",
  image,
  onView,
  onEdit,
  className,
}: PropertyCardProps) {
  const statusColorMap: Record<string, string> = {
    active: "success",
    inactive: "outline",
    archived: "secondary",
    sold: "destructive",
  }

  return (
    <div
      className={`group overflow-hidden rounded-lg border border-asas-silver/20 bg-white/5 hover:bg-white/10 hover:border-asas-gold/30 transition-all cursor-pointer ${className || ""}`}
    >
      {/* Image placeholder or actual image */}
      <div className="relative w-full h-40 bg-gradient-to-br from-asas-gold/20 to-asas-navy/20 flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Building2 className="h-12 w-12 text-asas-gold/40" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-asas-sand truncate group-hover:text-asas-gold transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-asas-silver">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{location}</p>
            </div>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Type and Status */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {type}
          </Badge>
          <Badge
            variant={statusColorMap[status] as any}
            className="text-[10px]"
          >
            {status}
          </Badge>
        </div>

        {/* Units information */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-asas-silver/10">
          <div>
            <p className="text-[10px] text-asas-silver/70 uppercase tracking-wider">
              Total
            </p>
            <p className="text-lg font-bold text-asas-sand">{units}</p>
          </div>
          <div>
            <p className="text-[10px] text-asas-silver/70 uppercase tracking-wider">
              Disponibles
            </p>
            <p className="text-lg font-bold text-emerald-500">{available}</p>
          </div>
        </div>

        {/* Price */}
        {price && (
          <div className="pt-2 border-t border-asas-silver/10">
            <p className="text-[10px] text-asas-silver/70 uppercase tracking-wider mb-1">
              Prix de référence
            </p>
            <p className="text-sm font-bold text-asas-gold">
              {new Intl.NumberFormat("fr-DZ", {
                style: "currency",
                currency: "DZD",
                maximumFractionDigits: 0,
              }).format(price)}
            </p>
          </div>
        )}

        {/* Action */}
        {onView && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onView}
          >
            Voir détails
          </Button>
        )}
      </div>
    </div>
  )
}
