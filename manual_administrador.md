# MANUAL DE ADMINISTRACIÓN - PORTAL DE HELPDESK
## (Guía detallada para SuperUsuario, Administradores y Soporte Técnico)

Este manual ha sido estructurado detalladamente sección por sección y botón por botón. Está listo para ser copiado/importado a Microsoft Word, donde podrás reemplazar las indicaciones `[INSERTAR IMAGEN]` con capturas de pantalla de la aplicación real.

---

## 1. MÓDULO DE INICIO DE SESIÓN (LOGIN)

La pantalla de acceso es la puerta de entrada para todos los niveles de usuario (SuperAdmin, Administradores, Agentes y Clientes).

`[INSERTAR IMAGEN: Pantalla de Inicio de Sesión]`

### Campos de entrada y elementos interactivos:
*   **Campo: Correo Electrónico (`email`):**
    *   *Descripción:* Caja de entrada de texto.
    *   *Instrucciones:* Escriba su dirección de correo registrada (ej: `usuario@grupohuerta.mx`).
*   **Campo: Contraseña (`password`):**
    *   *Descripción:* Caja de entrada protegida. Oculta los caracteres introducidos por seguridad.
    *   *Instrucciones:* Escriba la contraseña correspondiente a su cuenta.
*   **Botón: `Iniciar Sesión`:**
    *   *Ubicación:* Debajo del campo de contraseña.
    *   *Función:* Envía las credenciales al servidor backend para su validación.
    *   *Resultado esperado:* Si los datos son correctos, el sistema detecta el rol del usuario y lo redirige automáticamente a su panel de control correspondiente. Si son incorrectos, muestra un mensaje de alerta en rojo.

---

## 2. PORTAL DE SUPERADMINISTRADOR (SUPERADMIN)

El panel del SuperAdmin permite la administración global de toda la infraestructura del Helpdesk (control de todas las agencias, sus licencias, usuarios administradores y manuales del sistema).

`[INSERTAR IMAGEN: Vista General del Panel de SuperAdmin]`

### Menú de Navegación Lateral (Sidebar)
*   **Botón `📊 Menú` (Dashboard):** Redirige a la pantalla de inicio con el resumen general de agencias, usuarios y licencias.
*   **Botón `🏢 Agencias`:** Abre la sección para crear y configurar agencias/empresas del grupo.
*   **Botón `👥 Admins`:** Abre la sección para crear y gestionar cuentas de administradores y agentes de soporte.
*   **Botón `📕 Manuales`:** Abre el espacio para la gestión de manuales generales del sistema.
*   **Botón `🔑 Licencias`:** Permite visualizar los contratos, vigencias y estatus de servicio de cada agencia.
*   **Botón `Cerrar Sesión`:** Cierra la sesión activa de forma segura y redirige al Login.

---

### 2.1. Sección: Agencias (Gestión de Empresas)

Esta sección permite visualizar todas las marcas o sucursales activas en el Helpdesk.

`[INSERTAR IMAGEN: Listado de Agencias - Panel SuperAdmin]`

#### Elementos y Botones de la Pantalla Principal:
*   **Botón `➕ Nueva Agencia`:**
    *   *Ubicación:* Esquina superior derecha de la sección.
    *   *Función:* Despliega un formulario emergente (Modal) para registrar una nueva sucursal.
    *   *Formulario Emergente (Campos a llenar):*
        *   `Nombre de la Agencia`: Nombre público (ej: *Suzuki Montevideo*).
        *   `Subdominio`: Subdominio único que usará la agencia en la URL (ej: `suzuki-montevideo`). No debe llevar espacios ni caracteres especiales.
        *   `Color Primario`: Paleta de color selector para la barra de navegación y botones principales.
        *   `Color Secundario`: Paleta de color para detalles y enlaces secundarios.
        *   Botón `Guardar Agencia`: Confirma el registro e inserta la nueva sucursal en la base de datos con el logo corporativo de GH por defecto.
        *   Botón `Cancelar`: Cierra el formulario sin guardar cambios.
*   **Barra de Búsqueda:**
    *   *Descripción:* Campo de texto con icono de lupa.
    *   *Función:* Filtra el listado de agencias en tiempo real conforme escribe el nombre o subdominio.

#### Botones de Acción Individuales (En cada fila de la lista de agencias):
*   **Botón `🔑 Entrar como Admin` (Icono de llave / flecha):**
    *   *Función:* Permite al SuperAdmin "suplantar" o ingresar al dashboard administrativo de esa agencia en específico sin requerir su contraseña.
    *   *Resultado esperado:* Redirige al panel de control de esa agencia mostrando una barra superior amarilla que dice *"Modo SuperAdmin activo"* con un botón para regresar.
*   **Botón `✏️ Editar` (Icono de lápiz):**
    *   *Función:* Abre el formulario con los datos actuales de la agencia para modificarlos.
*   **Botón `Bloquear / Desbloquear` (Toggle Switch / Icono de candado):**
    *   *Función:* Habilita o deshabilita el acceso total a esa agencia de forma inmediata. Si está bloqueada, ningún usuario o cliente de esa sucursal podrá iniciar sesión o mandar tickets.

---

### 2.2. Sección: Admins (Gestión de Administradores y Agentes)

Control centralizado de las personas que resuelven los tickets de soporte.

`[INSERTAR IMAGEN: Panel de Gestión de Usuarios Administrativos]`

#### Elementos y Botones:
*   **Botón `➕ Nuevo Administrador / Agente`:**
    *   *Ubicación:* Esquina superior derecha.
    *   *Función:* Abre un modal para crear un nuevo usuario resolutor.
    *   *Formulario Emergente (Campos a llenar):*
        *   `Nombre` y `Apellido`: Datos del personal.
        *   `Correo Electrónico`: Su dirección de correo corporativa (será su usuario de acceso).
        *   `Contraseña`: Contraseña temporal inicial.
        *   `Agencia`: Lista desplegable para seleccionar a qué sucursal pertenecerá.
        *   `Rol`: Selección entre `Admin` (Administrador de esa agencia) o `Agente` (Soporte Técnico).
        *   Botón `Registrar`: Guarda al usuario y le envía un correo electrónico de bienvenida automatizado con sus accesos.
*   **Filtro por Agencia:**
    *   *Descripción:* Caja desplegable (dropdown).
    *   *Función:* Muestra únicamente a los administradores pertenecientes a la agencia seleccionada.

#### Acciones sobre los Administradores de la Lista:
*   **Botón `Activo / Inactivo` (Interruptor / Switch):**
    *   *Función:* Habilita o suspende la cuenta del administrador. Si se marca como inactivo, pierde el acceso inmediatamente.
*   **Botón `Eliminar` (Icono de bote de basura):**
    *   *Función:* Borra definitivamente la cuenta del usuario de la base de datos (solo permitido si no tiene historial crítico asignado).

---

### 2.3. Sección: Manuales del Sistema (Globales)

Espacio donde el SuperAdmin puede subir manuales generales del sistema disponibles para el personal de soporte.

`[INSERTAR IMAGEN: Sección de Manuales del Sistema]`

*   **Botón `Subir Manual`:**
    *   *Función:* Abre el explorador de archivos para cargar un archivo PDF.
*   **Botón `Eliminar`:**
    *   *Función:* Borra el manual del servidor y de la base de datos.

---

### 2.4. Sección: Licencias (Vigencias)

Muestra los contratos activos de cada sucursal del sistema y alerta si alguna está pronta a vencer.

`[INSERTAR IMAGEN: Gestión de Licencias y Expiraciones]`

*   **Indicadores de Estado:**
    *   `Verde (Activa)`: El servicio está al corriente.
    *   `Amarillo (Pronto a Vencer)`: Faltan pocos días para la fecha límite de pago.
    *   `Rojo (Expirada)`: Licencia inactiva; la agencia se bloquea automáticamente.
*   **Botón `Editar Licencia` (En la lista):**
    *   *Función:* Permite cambiar los días restantes, renovar el contrato o pausar temporalmente la licencia.

---

## 3. PORTAL DE ADMINISTRADOR / AGENTE DE AGENCIA

Este es el panel que utiliza el personal de soporte técnico de cada sucursal para dar seguimiento y resolver los tickets de los clientes.

`[INSERTAR IMAGEN: Dashboard Principal de la Agencia]`

### Menú de Navegación Lateral (Sidebar)
*   **Botón `📊 Dashboard`:** Muestra las métricas clave de la sucursal.
*   **Botón `🎫 Tickets`:** La consola de trabajo principal para atender incidencias.
*   **Botón `👥 Usuarios`:** Permite dar de alta y gestionar a los clientes finales (empleados/usuarios).
*   **Botón `📈 Estadísticas`:** Reportes visuales sobre tiempos de respuesta y calificaciones de servicio.
*   **Botón `⚙️ Configuración`:** Permite configurar colores, subir logos y gestionar manuales locales de la sucursal.
*   **Botón `Cerrar Sesión`:** Salir de la plataforma de forma segura.

---

### 3.1. Sección: Dashboard (Resumen Estadístico de la Sucursal)

Presenta indicadores rápidos sobre la carga de trabajo actual de la agencia.

`[INSERTAR IMAGEN: Vista de Métricas en el Dashboard Administrativo]`

*   **Tarjetas Informativas:**
    1.  `Tickets Abiertos` (Color Rojo): Muestra cuántos tickets han sido creados pero aún no han sido atendidos por el equipo de soporte.
    2.  `Tickets En Proceso` (Color Amarillo/Naranja): Número de tickets que ya se están revisando o tienen respuesta del equipo.
    3.  `Tickets Resueltos` (Color Verde): Casos solucionados y en espera de confirmación de cierre por el cliente.
    4.  `Tickets Cerrados` (Color Gris): Historial de tickets finalizados por completo.
    5.  `Satisfacción Promedio` (Icono de estrella): Calificación acumulada otorgada por los clientes (de 1 a 5 estrellas).

---

### 3.2. Sección: Tickets (Bandeja de Entrada de Solicitudes)

Esta es la herramienta operativa del agente. Muestra el listado de tickets recibidos.

`[INSERTAR IMAGEN: Bandeja de Entrada de Tickets con Filtros]`

#### Filtros y Herramientas de Búsqueda:
*   **Botón de Filtro por Estado (Pestañas horizontales):**
    *   *Pestañas:* `Todos`, `Abiertos`, `En Proceso`, `Resueltos`, `Cerrados`.
    *   *Función:* Al hacer clic en cualquiera de ellas, se filtra la lista de tickets para mostrar únicamente los que tengan ese estatus.
*   **Dropdown: `Prioridad`:**
    *   *Opciones:* `Todas`, `Baja`, `Media`, `Alta`, `Crítica`.
    *   *Función:* Filtra la lista según la urgencia asignada al ticket.
*   **Buscador Integrado (Barra de texto):**
    *   *Función:* Filtra tickets por el número secuencial (Ej: `#25`), el nombre del cliente, el asunto o el contenido.
*   **Botón `➕ Crear Ticket` (Crear en nombre de un usuario):**
    *   *Ubicación:* Lado derecho de la barra de herramientas.
    *   *Función:* Permite al agente registrar un ticket en nombre de un cliente que llamó por teléfono o reportó la falla físicamente.
    *   *Modal Emergente:*
        *   `Usuario (Cliente)`: Dropdown para buscar y seleccionar al cliente de la base de datos.
        *   `Asunto`: Título de la falla (ej: *Error al imprimir facturas*).
        *   `Categoría`: Área de la falla (ej: *Sistemas*, *Redes*, *Telefonía*).
        *   `Prioridad`: Nivel de urgencia inicial.
        *   `Descripción`: Explicación detallada del problema.
        *   Botón `Crear Ticket`: Registra la solicitud y le envía una notificación instantánea en pantalla (SSE) al cliente seleccionado.

#### Botones en la Lista de Tickets:
*   **Botón `Ver Detalles` (Icono de ojo / botón azul):**
    *   *Función:* Abre la ventana interactiva del ticket (Modal de conversación).

---

### 3.3. Ventana Interactiva del Ticket (Consola de Atención)

Esta ventana se despliega al abrir un ticket y contiene todo el chat, notas internas e historial del caso.

`[INSERTAR IMAGEN: Consola del Detalle del Ticket]`

#### Panel Izquierdo: Chat y Respuestas
*   **Historial de Conversación:** Muestra de forma cronológica los mensajes intercambiados.
    *   *Colores de Burbuja:*
        *   **Burbuja Azul (con etiqueta "Admin" o "Soporte"):** Mensajes enviados por ti u otros miembros del equipo técnico.
        *   **Burbuja Gris:** Mensajes enviados por el cliente.
*   **Caja de Mensaje (`Escribe una respuesta...`):**
    *   *Instrucciones:* Escribe la respuesta formal orientada al cliente.
*   **Botón `📎 Adjuntar Archivos` (Icono de clip):**
    *   *Función:* Permite subir evidencias (imágenes PNG/JPG, capturas, documentos PDF) para adjuntarlos al mensaje del chat.
*   **Botón `Enviar Respuesta` (Botón Azul / Flecha):**
    *   *Función:* Publica el mensaje en el chat del ticket y notifica al usuario final por pantalla de manera inmediata.

#### Panel Derecho: Ajustes e Información del Ticket
*   **Filtro/Dropdown: `Estado`:**
    *   *Función:* Cambia el estatus actual de resolución. Al seleccionar un nuevo estado (ej: de *Abierto* a *En Proceso* o *Resuelto*), se actualiza automáticamente el sistema y se le notifica en tiempo real al usuario final mediante alertas de pantalla.
*   **Filtro/Dropdown: `Prioridad`:**
    *   *Función:* Permite elevar o disminuir la urgencia del ticket (Baja, Media, Alta, Crítica) según la complejidad.
*   **Filtro/Dropdown: `Asignar Agente`:**
    *   *Función:* Permite delegar el ticket a un técnico específico del equipo de soporte de la sucursal.
*   **Sección de `Notas Internas`:**
    *   *Descripción:* Caja de texto privada.
    *   *Función:* Permite escribir apuntes, contraseñas o detalles técnicos del equipo de soporte. **Las notas internas son 100% invisibles para el cliente** y solo las puede ver el personal técnico en esta misma pantalla.
    *   *Botón:* `Guardar Nota Interna`.

---

### 3.4. Sección: Usuarios (Gestión de Clientes Finales)

Administra las cuentas de los empleados o clientes autorizados para solicitar soporte dentro de esta sucursal.

`[INSERTAR IMAGEN: Control de Usuarios Finales de la Sucursal]`

*   **Botón `➕ Nuevo Usuario`:**
    *   *Función:* Abre un modal para registrar un nuevo empleado/cliente.
    *   *Campos:* Nombre, Apellido, Correo Electrónico (será su usuario de acceso) y Contraseña.
    *   *Botón `Registrar`:* Guarda el registro. El usuario podrá iniciar sesión en la URL de la agencia directamente.
*   **Barra de Búsqueda de Usuarios:** Filtra la lista por nombre o correo electrónico.
*   **Botón `Activo / Inactivo` (En la fila del usuario):** Permite revocar o restaurar los accesos del usuario al portal.

---

### 3.5. Sección: Estadísticas (Métricas de Rendimiento)

Módulos gráficos interactivos para auditar el desempeño de la mesa de ayuda.

`[INSERTAR IMAGEN: Módulo de Estadísticas y Gráficos]`

*   **Gráficos principales:**
    1.  `Tickets por Estado`: Proporción visual de tickets abiertos vs. resueltos.
    2.  `Rendimiento de Agentes`: Muestra cuántos tickets ha cerrado cada técnico.
    3.  `Historial de Satisfacción`: Calificaciones promedio desglosadas por mes.

---

### 3.6. Sección: Configuración (Marca y Manuales)

Esta sección permite a los administradores personalizar el portal de su sucursal e instructivos locales.

`[INSERTAR IMAGEN: Pantalla de Configuración de Marca y Manuales de Agencia]`

#### Personalización de Marca:
*   **Subida de Logotipo (Arrastrar o seleccionar archivo):**
    *   *Función:* Reemplaza el logo por defecto por el logotipo propio de la sucursal.
    *   *Resultado esperado:* El nuevo logo se sube de forma segura al servidor en formato relativo y se actualiza instantáneamente en el navbar principal de los clientes.
*   **Paleta de Color Primario y Secundario (Selectores de color HTML):**
    *   *Función:* Modifica visualmente los botones, barras y fondos del portal para adaptarlos a la identidad institucional de la sucursal.
    *   *Botón `Guardar Cambios`:* Aplica la personalización de marca de manera persistente.

#### Gestión de Manuales Locales (Desactivado para Clientes):
*   **Botón `Subir Manual Local`:**
    *   *Función:* Permite a la administración de la sucursal cargar manuales específicos en formato PDF.
    *   *Nota:* Estos manuales solo son visibles para el administrador y los agentes desde este apartado técnico como repositorio interno. Los usuarios finales no tienen acceso a ver ni descargar manuales desde su portal.
