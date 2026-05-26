import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, AlertTriangle, Calendar as CalendarIcon, BarChart3 } from 'lucide-react'
import { ventasService, inventarioService, reportesService } from '@/services'
import { useFormateo } from '@/hooks'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { subDays, subMonths, subYears } from 'date-fns'
import { SkeletonBlock, SkeletonChart } from '@/components/shared/Skeleton'

function KpiCard({ label, value, sub, icon: Icon, color, loading }: any) {
  const colors = {
    teal: { bar: 'bg-teal-400', bg: 'bg-teal-50', text: 'text-teal-700' },
    amber: { bar: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
    red: { bar: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
    blue: { bar: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  }
  const c = colors[color as keyof typeof colors]

  if (loading) {
    return (
      <div className="card relative overflow-hidden p-4 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border shadow-sm rounded-xl">
        <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar}`} />
        <SkeletonBlock className="h-8 w-8 rounded-xl mb-3" />
        <SkeletonBlock className="h-8 w-2/3 mb-2" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>
    )
  }

  return (
    <div className="card relative overflow-hidden p-4 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border shadow-sm rounded-xl">
      <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-dark-text/60 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={16} className={c.text} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-gray-900 dark:text-dark-text leading-none mb-1">{value}</p>
      <p className={`text-xs ${c.text} font-medium`}>{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const { cop, fechaCorta } = useFormateo()
  const [rango, setRango] = useState<'SEMANA' | 'MES' | 'AÑO'>('SEMANA')

  // Calcular fechas según rango
  const fechasRango = useMemo(() => {
    const hoy = new Date()
    let desde = hoy
    if (rango === 'SEMANA') desde = subDays(hoy, 7)
    if (rango === 'MES') desde = subMonths(hoy, 1)
    if (rango === 'AÑO') desde = subYears(hoy, 1)
    return { desde: desde.toISOString(), hasta: hoy.toISOString() }
  }, [rango])

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: ventasService.dashboard,
    refetchInterval: 60_000,
  })

  const { data: alertas } = useQuery({
    queryKey: ['inventario', 'alertas'],
    queryFn: () => inventarioService.alertas(''),
  })

  // Consulta de reportes para las gráficas
  const { data: reportes, isLoading: reportesLoading } = useQuery({
    queryKey: ['reportes', 'ventas', rango],
    queryFn: () => reportesService.ventas(fechasRango),
  })

  // Preparar datos para la gráfica
  const datosGrafica = useMemo(() => {
    if (!reportes?.porDia) return []
    return reportes.porDia.map((d: any) => ({
      fecha: fechaCorta(d.creadoEn),
      total: d._sum.total,
      ventas: d._count.id
    }))
  }, [reportes, fechaCorta])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Panel de Control</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text/60 mt-1">Resumen general y métricas de rentabilidad</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-dark-surface p-1 rounded-lg">
          {['SEMANA', 'MES', 'AÑO'].map((r) => (
            <button
              key={r}
              onClick={() => setRango(r as any)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${rango === r ? 'bg-white dark:bg-dark-surface/80 text-teal-700 dark:text-teal-400 shadow-sm' : 'text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text'
                }`}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ventas hoy" value={cop(kpis?.total_dia ?? 0)} sub={`${kpis?.transacciones ?? 0} transacciones`} icon={TrendingUp} color="teal" loading={kpisLoading} />
        <KpiCard label="Ingresos Rango" value={cop(reportes?.totales?._sum?.total ?? 0)} sub={`Último(a) ${rango.toLowerCase()}`} icon={BarChart3} color="blue" loading={reportesLoading} />
        <NavLink to="/admin/inventario/alertas" className="block">
          <KpiCard label="Stock crítico" value={String(kpis?.stock_critico ?? 0)} sub="Productos bajo mínimo" icon={AlertTriangle} color="amber" loading={kpisLoading} />
        </NavLink>
        <NavLink to="/admin/inventario/alertas" className="block">
          <KpiCard label="Por vencer" value={String(kpis?.por_vencer ?? 0)} sub="Lotes en riesgo" icon={CalendarIcon} color="red" loading={kpisLoading} />
        </NavLink>
      </div>

      {/* ── Gráfica de Rentabilidad ── */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-dark-text mb-4">Evolución de Ventas ({rango.toLowerCase()})</h2>
        <div className="h-72 w-full">
          {reportesLoading ? (
            <SkeletonChart className="p-4" />
          ) : datosGrafica.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [cop(value), 'Total']}
                />
                <Bar dataKey="total" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-dark-text/40">No hay datos para este rango</div>
          )}
        </div>
      </div>

      {/* ── Alertas ── */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/80">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">Alertas Activas del Inventario</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-dark-border max-h-60 overflow-y-auto">
          {(Array.isArray(alertas) ? alertas : []).map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-dark-surface/80 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.tipo === 'STOCK_MINIMO' ? 'bg-red-400' :
                  a.tipo === 'PROXIMO_VENCER' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-dark-text">
                  {a.tipo === 'STOCK_MINIMO' ? 'Stock Crítico' :
                    a.tipo === 'PROXIMO_VENCER' ? 'Por Vencer' : 'Alerta'}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-text/60 mt-0.5">{a.mensaje}</p>
              </div>
            </div>
          ))}
          {(!Array.isArray(alertas) || !alertas.length) && (
            <div className="p-8 text-center text-gray-400 dark:text-dark-text/40">
              <span className="text-2xl mb-2 block">✅</span>
              <p className="text-sm">No hay alertas críticas en el sistema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}