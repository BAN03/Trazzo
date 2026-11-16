# Trazzo

Aplicación móvil para pequeños negocios y emprendimientos en **México**. Permite registrar ventas, gastos, productos e insumos, y ver de un vistazo cómo va el negocio: ingresos, egresos, ganancia neta, productos más vendidos y valor del inventario.

No es un punto de venta: está pensada para llevar el control del negocio de forma rápida y sencilla.

> Idioma y moneda: **Español (México)** y **MXN** únicamente.

## Funcionalidad disponible

- **Inicio**: saludo, selector de mes (mes actual y anterior), ingresos y egresos del mes, ganancia neta, venta promedio, gráfica semanal (domingo a sábado) de ventas vs gastos, top 4 de productos más vendidos y pop up de alertas.
- **Movimientos**: ventas y gastos del mes con totales, búsqueda por fecha y edición del registro. Mantén presionado un movimiento para eliminarlo.
- **Registro de venta**: fecha (últimos 90 días), búsqueda de productos, top de más vendidos, cantidades con validación de stock, método de pago (efectivo, transferencia, tarjeta, otro), total y número de artículos.
- **Catálogo**: productos e insumos en pestañas separadas, valor del inventario, alertas de stock bajo, buscador, alta/edición y botón **Comprar** en insumos para reponer stock.
- **Nuevo producto / insumo**: nombre, categoría, precios, stock, stock mínimo, unidad y fecha de caducidad opcional (nunca anterior a hoy).
- **Informes**: resumen mensual, gráfica de ventas vs gastos por semana, top de productos, gastos por categoría y valor del inventario.
- **Ajustes**: perfil, preferencias de idioma/moneda, aviso de funciones próximas y cierre de sesión.

### Funciones deshabilitadas por ahora

Registro de empleados, exportación a Excel, lista de tareas, respaldo en Google Drive, notificaciones y sección de ajustes avanzada. La app muestra avisos de "Próximamente" en lugar de controles que no hacen nada.

## Stack

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) + Expo Router
- React Native 0.88 + React 19
- TypeScript
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS para React Native)
- Zustand para estado de sesión
- `expo-sqlite` para persistencia local
- ESLint 9 con `eslint-config-expo/flat`

## Cómo ejecutar

```bash
npm install
npx expo start
```

Para Android:

```bash
npx expo run:android
# o, sin compilar de forma local:
eas build --profile development --platform android
```

> Las notificaciones y Google Sign-In requieren un *development build*; Expo Go no incluye todos los módulos nativos.

### Variables de entorno

El proyecto incluye una plantilla `.env.example`. Copia la plantilla y coloca tus valores reales:

```bash
cp .env.example .env
```

```dotenv
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

- `.env` está en `.gitignore`, así que tus credenciales locales no se suben al repositorio.
- Si dejas la variable vacía, la app funciona en **modo local**: los datos se guardan en el dispositivo y puedes empezar a usarla sin cuenta.
- Las variables con prefijo `EXPO_PUBLIC_` se incluyen en texto plano dentro del paquete de la app. El Client ID de OAuth para apps móviles no es un secreto, pero **nunca** guardes aquí el Client Secret ni claves privadas.
- Para compilar con EAS sin subir tu `.env`, define la variable como secreto de entorno:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "tu-client-id.apps.googleusercontent.com" --environment production
```

Nunca compartas el archivo `.env` ni lo agregues con `git add -f`.

## Scripts

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run start       # Servidor de desarrollo
```

## Estructura

```
src/
  app/            Rutas de Expo Router (pantallas y layouts)
  components/     Componentes compartidos (formularios, tab bar, date picker)
  hooks/          Sesión (Zustand) y acceso a la base de datos
  utils/          Fechas, base de datos SQLite y utilidades
assets/           Íconos y splash de la app
instructions/     Documento de requerimientos y mockups
```

## Datos

La información se guarda localmente con SQLite. Las fechas de negocio se almacenan como `YYYY-MM-DD` en horario local para evitar desfases por zona horaria (UTC-6 en México).

Al iniciar sesión con Google, los datos del modo local se migran a la cuenta de Google en el mismo dispositivo.

## Licencia

Consulta [LICENSE](LICENSE).
