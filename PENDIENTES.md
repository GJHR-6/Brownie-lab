# Pendientes — Panel Admin

Contexto: sesión del 3 jul 2026. Se completó: renombres de secciones del admin (Productos, Insumos, Armador, Capricho del Chef, Cupones, Costos de producción), quick wins de la página Costos (columna Ganancia L., leyenda de colores, resumen con margen promedio/peor margen/sin costo, orden por margen) y fusión de Fidelización dentro del drawer de Clientes (`/admin/fidelizacion` ahora redirige).

## Prioridad alta

1. **Snapshot de costo en pedidos** — guardar `costo_unitario` en `pedido_items` al crear el pedido. Hoy Reportes calcula COGS con el costo *actual* del producto (`reportes/page.tsx`, comentario en el cálculo de COGS lo admite): cambiar un costo hoy reescribe el margen de meses pasados. Con el snapshot, los reportes históricos quedan exactos para siempre.

2. **Alertas push de stock bajo** — el sistema de notificaciones push ya existe; falta dispararlo cuando `stock <= stock_alerta`. Hoy solo se ve al abrir el dashboard.

3. **Plantillas WhatsApp por estado de pedido** — botón "avisar que está listo" que abra `wa.me` con mensaje pre-armado según el pedido. Hoy cada mensaje se escribe a mano.

## Prioridad media

4. **Resumen diario automático** — Vercel Cron nocturno que arme el corte de caja y lo envíe por push o correo. No existe ningún cron en el proyecto todavía.

5. **Gastos recurrentes** — renta/servicios auto-registrados cada mes en Gastos, o mínimo botón "duplicar mes anterior".

6. **Export contable mensual automático** — el endpoint `/api/admin/export/contable` ya existe; cron que lo envíe por correo el día 1 de cada mes.

## Proyecto grande (el que más automatiza)

7. **Recetas con cantidades** — agregar columna `cantidad` a `producto_ingredientes` (hoy solo guarda `ingrediente_id`). Desbloquea:
   - Costo del producto calculado desde insumos (hoy es un número manual suelto en `/admin/costos`, desconectado de Insumos).
   - Margen siempre al día cuando sube el precio de un insumo — mostrar "costo sugerido vs manual" con alerta cuando difieren.
   - Descuento automático de insumos (harina, chocolate…) al completar pedidos → stock de insumos real sin conteo manual.

8. **Rotación semanal de destacados** — el orden de productos destacados es estático; cron que rote el "producto de la semana".

## Exactitud de Reportes (deuda)

9. **Toppings fuera del COGS** — el ingreso del pedido incluye `precio_extra` de toppings pero el costo solo cuenta el producto base → margen inflado en pedidos personalizados.

10. **Margen sobre ventas con ISV incluido** — el `margenPct` se calcula sobre el total con ISV; el margen real sobre base imponible es menor al mostrado.

## Decisiones abiertas

- **"Armador" vs "Personaliza"** — el sidebar ahora dice "Armador"; rompe el vínculo verbal con la página pública "Personaliza" del sitio. Revertir es un cambio de un minuto si se prefiere mantener el vínculo.
- **Precios hardcodeados en Insumos** — `IngredientesClient.tsx` tiene `PRECIO_VENTA_BAJO = 55` y `PRECIO_VENTA_ALTO = 60`; deberían venir de configuración o calcularse.
- **Campos muertos en Configuración** — `anticipacion_minima` editable pero sin uso; config de envío en la tabla `configuracion` no expuesta en el formulario (audit del 30 jun).
- **Fusiones de secciones restantes** (del review de estructura): Zonas de envío → tab dentro de Envíos; Testimonios + Reseñas en una sección con tabs.
