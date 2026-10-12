# BLACKMAMBA MUSIC PLATFORM

Portal Next.js de **Iyari Gomez · BlackMamba RECORDS**. Evoluciona el repositorio existente `soundclo`; no duplica el Music Hub de producción local.

## Estado verificado

- Next.js 16 y React 19: build y pruebas de seguridad pasan.
- Catálogo y buscador con portadas; importación administrada de hasta 50 pistas **públicas**.
- Widget oficial visible, sin autoplay. PLAY, PAUSE, PLAY_PROGRESS y FINISH se envían al backend.
- PostgreSQL conserva catálogo, eventos, enriquecimiento y tokens OAuth cifrados AES-256-GCM.
- OAuth 2.1 con PKCE, nonce state, cookies HttpOnly y verificación del propietario.
- Renovación del token bajo bloqueo PostgreSQL: evita reutilizar refresh tokens de un solo uso.
- Dashboard privado separa eventos propios de contadores acumulados de SoundCloud.
- Endpoint Firecrawl v2 para páginas públicas en una lista de dominios aprobados.

**Pendiente de configuración y prueba real:** cuenta OAuth, PostgreSQL, importación real, reproducción desde otra cuenta y acreditación en SoundCloud Insights. Países, ciudades, retención y series históricas no se inventan ni se recuperan del antiguo seed. El archivo histórico `data/seed.ts` permanece en Git, pero la aplicación no lo consume.

## Arranque desde cero

```bash
npm ci
cp .env.example .env.local
# Completar variables localmente, sin subirlas a Git
npm run db:migrate
npm run dev
```

1. Provisionar PostgreSQL y asignar `DATABASE_URL`; ejecutar la migración con un usuario con permisos de creación.
2. Registrar o recuperar una aplicación desde [SoundCloud Your Apps](https://soundcloud.com/you/apps), siguiendo la [guía oficial OAuth](https://developers.soundcloud.com/docs/api/guide). Los requisitos de acceso los determina SoundCloud.
3. Registrar exactamente `http://localhost:3000/api/auth/soundcloud/callback` como redirect para desarrollo; para producción usar el dominio HTTPS publicado.
4. Guardar `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET`, `SOUNDCLOUD_REDIRECT_URI` y `SOUNDCLOUD_OWNER_ID` en servidor. El owner ID es el ID numérico del perfil autorizado, consultable con `/me` en el API Explorer. Se exige antes de guardar una conexión para impedir conectar otra cuenta.
5. Crear una contraseña privada de administrador y un `BLACKMAMBA_SESSION_SECRET` aleatorio de al menos 32 caracteres. Cambiar este secreto invalida sesiones y hace ilegibles los tokens almacenados; reconectar la cuenta después de rotarlo.
6. Abrir **Mi sesión**, entrar, pulsar **Conectar SoundCloud** y autorizar; después pulsar **Sincronizar 50 pistas**.
7. Para Firecrawl configurar su API key y `FIRECRAWL_ALLOWED_HOSTS`. Desde una sesión administradora enviar `POST /api/enrich` con JSON `{"url":"https://dominio-aprobado/pagina"}`. Solo enriquece contenido; no genera escuchas ni modifica automáticamente las pistas.

## Datos y límites

`/api/soundcloud` muestra exclusivamente el snapshot de pistas públicas importadas. Los plays son acumulados por pista, no un período de 12 meses ni el total completo de la cuenta. Se actualizan al sincronizar.

`/api/insights` exige sesión privada y resume los últimos 30 días: inicios (incluyen reanudaciones), finales y sesiones por pista. No mide personas únicas. Eventos enviados por el navegador pueden falsificarse: son telemetría informativa, nunca contadores acreditados ni evidencia antifraude. El límite de 30 eventos/minuto por sesión y la deduplicación UUID reducen duplicados, pero no reemplazan protección distribuida frente a abuso. Añadir rate limiting de infraestructura antes de abrir administración a tráfico significativo.

El evento PROGRESS conserva la posición; **no** se presenta como tiempo escuchado o retención porque los saltos de reproducción alterarían esa interpretación. No se persisten IP, ubicación ni referrer. Un fallo de almacenamiento se avisa sin interrumpir el audio.

Sin conexión se muestra catálogo vacío y explicación. No hay métricas ficticias ni audio simulado. Las pistas retiradas de la importación quedan inactivas y conservan el historial de eventos. La selección es el primer conjunto público disponible vía API, hasta 50 pistas.

La edición existente modifica metadatos reales en SoundCloud bajo sesión privada; una edición se refleja en el catálogo persistido después de sincronizar. No hay subida ni publicación automática de audio.

## Verificación obligatoria de acreditación

1. Sincronizar pistas públicas del propietario.
2. Abrir el sitio publicado desde otra cuenta o visitante y reproducir manualmente una pista en el widget.
3. Confirmar PLAY/PROGRESS/FINISH en los eventos propios.
4. Consultar Creator Insights de SoundCloud y contrastar el sitio de procedencia cuando el plan permita esa vista.
5. Registrar fecha, pista, intervalo y resultado sin afirmar que cada PLAY del navegador debe incrementar SoundCloud. SoundCloud aplica sus propias reglas de acreditación.

Referencia del [Widget API oficial](https://developers.soundcloud.com/docs/api/html5-widget). [Firecrawl scrape v2](https://docs.firecrawl.dev/api-reference/endpoint/scrape).

## Pruebas y despliegue

```bash
npm test
npm run typecheck
npm run build
npm audit --omit=dev
```

Las pruebas cubren cifrado autenticado y rechazo de eventos inválidos. Las comprobaciones HTTP locales verifican catálogo vacío, autenticación de Insights/OAuth/sync, rechazo de origen y payload inválidos. No sustituyen pruebas de integración con servicios reales.

Netlify detecta Next.js; `netlify.toml` usa Node 24. Configurar variables privadas en el panel del proyecto, nunca en Git ni en prefijos `NEXT_PUBLIC_`. Ejecutar la migración contra la base de producción antes de conectar la cuenta. `.netlify` se ignora para conservar estado de vinculación local fuera de Git.
