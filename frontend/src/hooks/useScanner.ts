import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook para detectar lecturas de un escáner de códigos de barras USB/Bluetooth.
 * El escáner emula un teclado rápido que termina con la tecla 'Enter'.
 *
 * - Ignora campos `type="number"` para no interferir con inputs de descuento
 * - Usa un buffer interno que se limpia si la entrada es más lenta que 50ms entre teclas
 * - Requiere al menos 4 caracteres para considerar la entrada como escáner
 *
 * @param onScan - Callback invocado con el código de barras escaneado
 *
 * @example
 * ```tsx
 * useScanner((barcode) => {
 *   buscarProducto(barcode)
 * })
 * ```
 */
export function useScanner(onScan: (barcode: string) => void) {
  const barcodeBuffer = useRef('')
  const lastKeyTime = useRef(Date.now())

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Si el usuario está escribiendo en un campo numérico (ej. descuento) ignorar.
    // Pero si es el campo de búsqueda principal, podemos interceptarlo o dejarlo.
    if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
      return
    }

    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeyTime.current

    if (e.key === 'Enter') {
      if (barcodeBuffer.current.length >= 4) {
        // Si hay una cadena de texto y se leyó rápido, es un escáner
        onScan(barcodeBuffer.current)
        
        // Evitar que el 'Enter' haga un submit de un formulario
        e.preventDefault() 
      }
      barcodeBuffer.current = ''
    } else if (e.key.length === 1) { // Ignorar Shift, Ctrl, etc.
      if (timeDiff > 50) {
        // Demasiado lento para ser un escáner (es un humano tecleando)
        barcodeBuffer.current = e.key
      } else {
        // Muy rápido, es el escáner
        barcodeBuffer.current += e.key
      }
    }
    
    lastKeyTime.current = currentTime
  }, [onScan])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
