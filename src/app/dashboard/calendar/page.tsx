'use client'

import { useEffect, useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Menu, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { CreateEventModal } from './CreateEventModal'
import { initAuth, googleSignIn } from '@/lib/google-auth'

interface GoogleEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  htmlLink?: string;
  description?: string;
}

export default function CalendarPage() {
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [needsAuth, setNeedsAuth] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [authError, setAuthError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<'month'|'day'>('month')

  // Standard Calendar State
  const [currentDate, setCurrentDate] = useState(new Date()) 

  const fetchGoogleEvents = async (token: string, dateObj: Date) => {
    setLoading(true)
    try {
      const start = new Date(dateObj.getFullYear(), dateObj.getMonth() - 1, 1).toISOString();
      const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 2, 0).toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data.items || []);
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false)
        setAuthError('')
        fetchGoogleEvents(token, currentDate)
      },
      () => {
        setNeedsAuth(true)
        setLoading(false)
      }
    );
    return () => {
       if (typeof unsubscribe === 'function') unsubscribe();
    }
  }, [])

  useEffect(() => {
    if (!needsAuth) {
      import('@/lib/google-auth').then(mod => {
        mod.getAccessToken().then(token => {
          if (token) fetchGoogleEvents(token, currentDate);
        });
      });
    }
  }, [currentDate, needsAuth]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchGoogleEvents(result.accessToken, currentDate);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err.message || "Erreur de connexion");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const gotoToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() 
  const offset = (firstDayOfMonth === 0 ? 7 : firstDayOfMonth) - 1 // Fix for Monday start
  
  const daysArray = useMemo(() => {
    const arr = []
    for (let i = 0; i < offset; i++) {
      arr.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), -offset + i + 1))
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }
    const remaining = 42 - arr.length 
    for (let i = 1; i <= remaining; i++) {
      arr.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i))
    }
    return arr
  }, [currentDate, daysInMonth, offset])

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' })
  const yearStr = currentDate.getFullYear()
  const todayStr = new Date().toISOString().slice(0, 10)
  
  const getSelectedDateStr = () => {
      const offsetMs = selectedDate.getTimezoneOffset() * 60000;
      return new Date(selectedDate.getTime() - offsetMs).toISOString().slice(0, 10)
  }
  const selectedDateStr = getSelectedDateStr()

  const formatEventTime = (dateTime?: string) => {
    if (dateTime) return new Date(dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return ''
  }

  const handleRefresh = async () => {
    import('@/lib/google-auth').then(mod => {
      mod.getAccessToken().then(token => {
        if (token) fetchGoogleEvents(token, currentDate);
      });
    });
  }

  const getEventsForDate = (dateStr: string) => {
    return googleEvents.filter(e => {
       if (e.start.dateTime) return e.start.dateTime.startsWith(dateStr)
       if (e.start.date) return e.start.date === dateStr
       return false
    })
  }

  return (
    <div className="flex-1 font-sans text-white flex flex-col h-full w-full bg-[#051121]">
      {isModalOpen && (
        <CreateEventModal 
          selectedDate={selectedDate}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleRefresh} 
        />
      )}

      {/* Top Navigation Bar - App Style */}
      <header className="h-[70px] border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#0A1829]/60 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-white/60" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-asas-gold" /> 
            </div>
            <span className="text-[12px] font-bold text-white uppercase tracking-widest hidden sm:block">Agenda Entreprise</span>
          </div>

          <div className="flex items-center ml-2 sm:ml-6 gap-3">
            <button 
              onClick={gotoToday}
              className="px-4 py-2 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest font-bold text-white hover:bg-white/5 transition-colors hidden sm:block h-9"
            >
              Aujourd'hui
            </button>
            <div className="flex items-center ml-1">
              <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-white ml-2 hidden sm:block capitalize font-display min-w-[150px]">
              {monthName} {yearStr}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {needsAuth && (
            <div className="flex items-center gap-2">
              {authError && <span className="text-[10px] uppercase font-bold tracking-widest text-[#EA4335] max-w-[200px] truncate hidden xl:block" title={authError}>{authError}</span>}
              <button 
                onClick={handleGoogleLogin} 
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-4 py-2 border border-[#4285F4] text-[#4285F4] hover:bg-[#4285F4]/10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors h-9"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                )}
                <span className="hidden sm:block">Ajouter Compte Google</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 border border-white/10 p-1 rounded-xl bg-black/20 h-9">
            <button 
              onClick={() => setView('month')}
              className={clsx("px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors h-full", view === 'month' ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
            >
              Mois
            </button>
            <button 
              onClick={() => setView('day')}
              className={clsx("px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors h-full", view === 'day' ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
            >
              Jour
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[256px] border-r border-white/5 flex flex-col bg-[#051121] hidden lg:flex shrink-0 px-4 py-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-[#0A1829] text-white border border-white/10 hover:border-asas-gold/40 hover:bg-white/5 transition-all rounded-xl py-3 px-4 font-bold uppercase tracking-widest text-[10px] mb-8 w-[150px] shadow-lg"
          >
            <div className="shrink-0 bg-asas-gold rounded-full p-1">
               <Plus className="w-3 h-3 text-[#06152D]" />
            </div>
            Créer
          </button>

          {/* Mini Calendar */}
          <div className="mb-8 select-none pl-2">
            <div className="flex items-center justify-between mb-4 pr-1">
              <span className="text-[12px] font-bold text-white capitalize">{monthName} {yearStr}</span>
              <div className="flex gap-1">
                <div className="p-1 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft className="w-4 h-4 text-white/50 cursor-pointer" onClick={prevMonth}/></div>
                <div className="p-1 hover:bg-white/10 rounded-md transition-colors"><ChevronRight className="w-4 h-4 text-white/50 cursor-pointer" onClick={nextMonth} /></div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
              {daysArray.map((date, i) => {
                const dateStr = date.toISOString().slice(0, 10)
                const isSelected = selectedDate.toISOString().slice(0, 10) === dateStr
                const isToday = todayStr === dateStr
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()

                return (
                  <div 
                    key={i} 
                    onClick={() => {
                        setSelectedDate(date)
                        if (!isCurrentMonth) setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
                    }}
                    className={clsx(
                      "w-6 h-6 flex items-center justify-center text-[10px] rounded-full cursor-pointer mx-auto transition-colors font-bold",
                      isToday && !isSelected ? "text-asas-gold bg-asas-gold/20" :
                      isSelected && isToday ? "bg-asas-gold text-[#06152D]" :
                      isSelected ? "bg-white/20 text-white" :
                      !isCurrentMonth ? "text-white/20" :
                      "text-white/60 hover:bg-white/10"
                    )}
                  >
                    {date.getDate()}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 px-2 group cursor-pointer hover:bg-white/5 py-2 rounded-xl transition-colors">
              <ChevronRight className="w-4 h-4 text-asas-gold transition-transform rotate-90" />
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Mes agendas</h3>
            </div>
            <div className="pl-6">
              <label className="flex items-center gap-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors -ml-2 px-2">
                <input type="checkbox" checked readOnly className="w-4 h-4 accent-asas-gold rounded bg-black/50 border border-white/20 shadow-sm" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Agenda Principal (Google)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#051121]">
          {view === 'month' && (
            <div className="flex-1 flex flex-col pt-2">
              {/* Days Header */}
              <div className="grid grid-cols-7 shrink-0">
                {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => (
                  <div key={d} className="py-3 text-center text-[9px] uppercase tracking-[0.2em] font-bold text-white/30 border-r border-transparent last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l border-t border-white/5">
                {daysArray.map((date, i) => {
                  const dateStr = date.toISOString().slice(0, 10)
                  const isToday = dateStr === todayStr
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                  const dayGoogleEvents = getEventsForDate(dateStr)
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedDate(date)
                        setView('day')
                      }}
                      className={clsx(
                        "border-b border-r border-white/5 flex flex-col transition-colors cursor-pointer group min-h-0 relative", 
                        !isCurrentMonth ? "bg-black/40" : "bg-transparent hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex justify-center mt-2 mb-1">
                        <span className={clsx(
                          "text-[10px] font-bold w-6 h-6 flex flex-col justify-center text-center rounded-full transition-all", 
                          isToday ? "bg-asas-gold text-[#06152D] shadow-[0_0_10px_rgba(212,166,79,0.5)]" : 
                          !isCurrentMonth ? "text-white/20" :
                          "text-white/60 group-hover:bg-white/10 group-hover:text-white"
                        )}>
                          {i < 7 && date.getDate() === 1 ? `${date.getDate()} ${date.toLocaleString('fr-FR', {month:'short'})}` : date.getDate()}
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-[2px] max-h-full pb-1">
                        {!loading && dayGoogleEvents.map(event => {
                          const hasTime = !!event.start.dateTime;
                          return (
                            <div 
                              key={event.id}
                              className={clsx(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-[6px] truncate flex items-center gap-1.5 cursor-pointer leading-tight transition-all",
                                hasTime ? "text-white/80 hover:bg-white/10" : "bg-[#4285F4] text-white shadow-lg border border-white/10"
                              )}
                              title={event.summary}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (event.htmlLink) window.open(event.htmlLink, '_blank')
                              }}
                            >
                              {hasTime && <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-asas-gold shadow-[0_0_8px_rgba(212,166,79,0.5)]"></div>}
                              {hasTime && <span className="font-bold shrink-0">{formatEventTime(event.start.dateTime)}</span>}
                              <span className="truncate">{event.summary || '(Sans titre)'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative border-t border-white/5 bg-[#051121]">
              <div className="flex items-center gap-6 px-8 py-6 border-b border-white/5 shrink-0 bg-[#0A1829]/30">
                <div className="flex flex-col items-center min-w-[50px]">
                  <span className={clsx("text-[10px] font-bold uppercase tracking-widest", selectedDateStr === todayStr ? "text-asas-gold" : "text-white/40")}>
                    {selectedDate.toLocaleString('fr-FR', { weekday: 'short' })}
                  </span>
                  <span className={clsx(
                    "text-[28px] font-display mt-1 w-14 h-14 flex items-center justify-center rounded-2xl transition-all", 
                    selectedDateStr === todayStr ? "bg-asas-gold text-[#06152D] shadow-[0_0_15px_rgba(212,166,79,0.3)]" : "text-white"
                  )}>
                    {selectedDate.getDate()}
                  </span>
                </div>
                <div className="w-px h-16 bg-white/5 ml-2"></div>
                
                <div className="flex-1 pl-4">
                  <div className="space-y-2">
                    {!loading && getEventsForDate(selectedDateStr).filter(e => !e.start.dateTime).map(event => (
                      <div key={event.id} onClick={() => event.htmlLink && window.open(event.htmlLink, '_blank')} className="cursor-pointer bg-[#4285F4] border border-white/10 text-white text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-lg font-bold w-full truncate shadow-md transition-transform hover:scale-[1.01]">
                        {event.summary || '(Sans titre)'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time grid for Day view */}
              <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-transparent">
                {/* Time labels */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="flex h-[80px] relative group border-b border-white/5 last:border-b-0">
                    <div className="w-24 shrink-0 text-right pr-6 relative -top-3">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {i === 0 ? '' : `${i}:00`}
                      </span>
                    </div>
                    <div className="flex-1 border-l border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors absolute inset-0 left-24" onClick={() => setIsModalOpen(true)}>
                    </div>
                  </div>
                ))}
                
                {/* Events Absolute Layer */}
                <div className="absolute top-0 left-24 right-0 bottom-0 pointer-events-none px-4 py-0 border-l border-transparent">
                  {!loading && getEventsForDate(selectedDateStr)
                    .filter(e => e.start.dateTime)
                    .map(event => {
                      const startDate = new Date(event.start.dateTime!);
                      let endDate = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(startDate.getTime() + 60*60*1000);
                      
                      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
                      const duration = Math.max(20, endMinutes - startMinutes);
                      
                      const top = (startMinutes / 60) * 80;
                      const height = (duration / 60) * 80;
                      
                      return (
                        <div 
                          key={event.id}
                          className="absolute left-4 right-4 rounded-xl bg-[#4285F4]/90 backdrop-blur-sm text-white p-3 shadow-lg overflow-hidden border border-white/20 pointer-events-auto cursor-pointer flex gap-1 flex-col transition-all hover:scale-[1.01]"
                          style={{ top: `${top}px`, height: `${height}px`, minHeight: '32px' }}
                          onClick={() => event.htmlLink && window.open(event.htmlLink, '_blank')}
                        >
                          <div className="font-bold text-[11px] uppercase tracking-wide truncate leading-tight">{event.summary || '(Sans titre)'}</div>
                          {height >= 50 && <div className="text-[9px] uppercase tracking-widest leading-tight text-white/80 font-bold">{formatEventTime(event.start.dateTime)} - {formatEventTime(event.end?.dateTime)}</div>}
                        </div>
                      )
                    })}
                </div>

                {/* Current Time Indicator */}
                {selectedDateStr === todayStr && (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-asas-gold z-10 flex items-center pointer-events-none"
                    style={{ top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 80}px` }}
                  >
                    <div className="w-24 pr-4 -my-2 flex justify-end shrink-0">
                      <span className="text-asas-gold text-[10px] font-bold uppercase tracking-widest bg-[#051121] px-1">
                        {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-asas-gold shadow-[0_0_10px_rgba(212,166,79,0.8)] -ml-1.5"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


