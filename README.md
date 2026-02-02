# Sistema de Gestión de Cuenta Corriente - Escencial

## 📋 Descripción del Sistema

Sistema web completo para la gestión de cuentas corrientes de afiliados, diseñado específicamente para el manejo de:
- Saldos de liquidación mensuales
- Órdenes médicas
- Prestaciones con sistema de cuotas
- Ajustes y movimientos varios
- Integración con Google Sheets para almacenamiento de transacciones

## 🎯 Funcionalidades Principales

### 1. Búsqueda de Afiliados
- Búsqueda por DNI o Legajo
- Visualización completa de datos del afiliado
- Saldo inicial del periodo (cierre del mes anterior)

### 2. Gestión de Transacciones

#### **Órdenes**
- Suma directa al saldo
- Registro inmediato de movimientos

#### **Prestaciones**
- Sistema de cuotas (hasta 60 cuotas)
- Cálculo automático de montos mensuales
- Vista previa de distribución de cuotas
- Efecto cascada en saldos futuros

#### **Varios / Ajustes**
- Movimientos positivos o negativos
- Ajustes manuales de saldo
- Notas y descripciones personalizadas

### 3. Visualización de Saldos
- **Saldo Inicial**: Cierre del periodo anterior (ej: 31/01)
- **Movimientos del Mes**: Suma de todas las transacciones
- **Saldo Final**: Balance total actualizado

### 4. Historial de Movimientos
- Tabla completa de transacciones
- Ordenamiento cronológico
- Balance acumulativo
- Exportación a CSV

## 📁 Estructura de Archivos

```
proyecto/
├── index.html          # Interfaz principal
├── styles.css          # Estilos y diseño
├── app.js             # Lógica de negocio
├── base.json          # Base de datos de afiliados
└── img/               # Carpeta de imágenes
    ├── logo-escencial.png    # Logo blanco (header)
    ├── escencial-logo.png    # Logo negro (footer)
    ├── favicon.png           # Icono del sitio
    └── fondo-escencial.jpg   # Imagen de fondo
```

## 🚀 Instalación y Configuración

### Paso 1: Preparar Archivos
1. Descargar todos los archivos del sistema
2. Crear la carpeta `img/` en la raíz del proyecto
3. Colocar las imágenes necesarias:
   - `logo-escencial.png` (logo blanco)
   - `escencial-logo.png` (logo negro)
   - `favicon.png` (icono)
   - `fondo-escencial.jpg` (fondo)

### Paso 2: Configurar Google Sheets

#### En Google Sheets:
1. Crear una nueva hoja de cálculo
2. Nombrar la primera hoja como "Movimientos"
3. Agregar los siguientes encabezados en la primera fila:
   - DNI | Legajo | Nombre y Apellido | Tipo | Monto Total | Cuotas | Fecha | Descripción | Cuota Número | Timestamp

#### En Google Apps Script:
1. En Google Sheets, ir a: **Extensiones > Apps Script**
2. Copiar y pegar el siguiente código:

```javascript
function doPost(e) {
  try {
    // Parsear datos recibidos
    const data = JSON.parse(e.postData.contents);
    
    // Obtener la hoja activa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Movimientos');
    
    // Agregar fila con los datos
    sheet.appendRow([
      data.dni,
      data.legajo,
      data.nombre_apellido,
      data.tipo,
      data.monto_total,
      data.cuotas,
      data.fecha,
      data.descripcion,
      data.cuota_numero,
      data.timestamp
    ]);
    
    // Respuesta exitosa
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Transacción guardada correctamente'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Respuesta de error
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Guardar el proyecto con un nombre descriptivo
4. Hacer clic en **Implementar > Nueva implementación**
5. Tipo: **Aplicación web**
6. Configurar:
   - Ejecutar como: Tu cuenta
   - Quién tiene acceso: **Cualquier persona**
7. Copiar la URL generada (será similar a la proporcionada)

### Paso 3: Actualizar URL en el Sistema
En el archivo `app.js`, actualizar la constante con tu URL:
```javascript
const GOOGLE_SCRIPT_URL = 'TU_URL_AQUI';
```

### Paso 4: Configurar Base de Datos
Editar `base.json` con los datos de tus afiliados:

```json
{
  "afiliados": [
    {
      "legajo": "001",
      "nombre_apellido": "Nombre Completo",
      "dni": 12345678,
      "saldo_inicial_periodo": 0.00,
      "fecha_cierre_anterior": "2026-01-31",
      "estado": "activo"
    }
  ],
  "movimientos": [],
  "metadata": {
    "version": "1.0",
    "ultima_actualizacion": "2026-02-02",
    "periodo_actual": "2026-02"
  }
}
```

## 💻 Uso del Sistema

### Buscar un Afiliado
1. Seleccionar tipo de búsqueda (DNI o Legajo)
2. Ingresar el número correspondiente
3. Hacer clic en "Buscar" o presionar Enter
4. El sistema mostrará toda la información del afiliado

### Cargar una Nueva Transacción

#### Orden:
1. Hacer clic en "Nueva Orden"
2. Ingresar el monto
3. Agregar descripción (opcional)
4. Confirmar fecha
5. Guardar

#### Prestación (con Cuotas):
1. Hacer clic en "Nueva Prestación"
2. Ingresar monto total (ej: $1.000.000)
3. Seleccionar cantidad de cuotas (ej: 10)
4. El sistema mostrará la vista previa:
   - Cuota 1/10: $100.000
   - Cuota 2/10: $100.000
   - etc.
5. Guardar transacción

#### Ajustes / Varios:
1. Hacer clic en "Ajustes / Varios"
2. Ingresar monto (positivo o negativo)
3. Agregar descripción explicativa
4. Guardar

### Exportar Movimientos
1. Con un afiliado seleccionado
2. Hacer clic en "Exportar"
3. Se descargará un archivo CSV con todos los movimientos

## 🔄 Flujo de Datos

```
┌─────────────────┐
│  BASE.JSON      │
│  (Afiliados)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  INTERFAZ WEB   │─────▶│  GOOGLE SHEETS   │
│  (index.html)   │      │  (Almacenamiento)│
└─────────────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  VISUALIZACIÓN  │
│  Saldos/Movs.   │
└─────────────────┘
```

## 📊 Lógica de Cálculo de Saldos

### Fórmula Principal:
```
Saldo Final = Saldo Inicial + Movimientos del Mes
```

### Para Prestaciones con Cuotas:
```
Cuota Mensual = Monto Total / Cantidad de Cuotas
Impacto en Saldo = Cuota Mensual (no el total)
```

### Ejemplo Práctico:
```
Saldo Inicial: $50.000
+ Orden: $17.000
+ Prestación: $1.000.000 / 10 cuotas = $100.000 (solo la 1ra cuota)
= Saldo Final: $167.000

Próximo mes:
Saldo Inicial: $167.000
+ Cuota 2/10: $100.000
= Saldo Final: $267.000
```

## 🎨 Características de Diseño

- **Diseño Responsivo**: Adaptable a desktop, tablet y móvil
- **Interfaz Intuitiva**: Flujo de trabajo claro y guiado
- **Animaciones Suaves**: Transiciones y efectos visuales
- **Notificaciones**: Feedback inmediato de acciones
- **Carga Dinámica**: Indicadores de procesamiento
- **Exportación**: Descarga de datos en formato CSV

## 🔐 Consideraciones de Seguridad

1. **Validación de Datos**: Todos los inputs son validados
2. **Modo No-CORS**: Configurado para Google Apps Script
3. **Datos Locales**: Base.json debe estar protegida en producción
4. **HTTPS**: Recomendado para implementación en producción

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, Grid, Flexbox
- **JavaScript ES6+**: Async/Await, Fetch API
- **Google Apps Script**: Backend serverless
- **Google Sheets**: Base de datos

## 📱 Compatibilidad

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Solución de Problemas

### Error: "No se cargó la base de datos"
- Verificar que `base.json` está en la carpeta raíz
- Verificar formato JSON válido
- Revisar consola del navegador (F12)

### Error: "No se guardó en Google Sheets"
- Verificar URL de Google Apps Script
- Confirmar permisos de la aplicación web
- Revisar logs en Apps Script

### Imágenes no se cargan
- Verificar que la carpeta `img/` existe
- Confirmar nombres exactos de archivos
- Verificar rutas en código

## 📞 Soporte

Para soporte técnico o consultas:
- Revisar la documentación completa
- Verificar logs de consola (F12)
- Contactar al administrador del sistema

---

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Desarrollado para:** Escencial
