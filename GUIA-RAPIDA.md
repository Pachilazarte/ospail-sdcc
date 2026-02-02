# 🚀 GUÍA DE INICIO RÁPIDO - Escencial

## ⚡ Implementación en 5 Pasos

### PASO 1: Preparar la Estructura 📁
```
proyecto-escencial/
├── index.html
├── styles.css
├── app.js
├── base.json
├── README.md
└── img/
    ├── logo-escencial.png
    ├── escencial-logo.png
    ├── favicon.png
    └── fondo-escencial.jpg
```

**IMPORTANTE:** Crear la carpeta `img/` y colocar las 4 imágenes con los nombres exactos.

---

### PASO 2: Configurar Google Sheets 📊

1. **Crear nueva hoja de Google Sheets**
   - Nombre sugerido: "Escencial - Cuenta Corriente"

2. **Ir a: Extensiones > Apps Script**

3. **Copiar el código del archivo:** `google-apps-script.js`

4. **Guardar el proyecto:** Ctrl+S o ícono de disco

5. **Implementar:**
   - Clic en "Implementar" (arriba derecha)
   - Seleccionar "Nueva implementación"
   - Tipo: "Aplicación web"
   - Ejecutar como: "Tu cuenta"
   - Acceso: **"Cualquier persona"**
   - Clic en "Implementar"

6. **Copiar la URL generada** (algo como):
   ```
   https://script.google.com/macros/s/ABC123.../exec
   ```

---

### PASO 3: Actualizar la URL en app.js 🔗

Abrir `app.js` y en la línea 5, reemplazar con tu URL:

```javascript
const GOOGLE_SCRIPT_URL = 'PEGAR_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT';
```

**Ejemplo:**
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzyDuKV.../exec';
```

---

### PASO 4: Configurar Afiliados en base.json 📝

Editar el archivo `base.json` con tus afiliados reales:

```json
{
  "afiliados": [
    {
      "legajo": "001",
      "nombre_apellido": "Juan Pérez",
      "dni": 12345678,
      "saldo_inicial_periodo": 50000.00,
      "fecha_cierre_anterior": "2026-01-31",
      "estado": "activo"
    },
    {
      "legajo": "002",
      "nombre_apellido": "María González",
      "dni": 23456789,
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

---

### PASO 5: Abrir y Probar 🎉

1. **Abrir `index.html` en tu navegador**
   - Doble clic en el archivo
   - O arrastrarlo al navegador

2. **Hacer una búsqueda de prueba:**
   - Buscar por DNI: `12345678`
   - Debería aparecer "Juan Pérez"

3. **Cargar una transacción de prueba:**
   - Clic en "Nueva Orden"
   - Monto: `17000`
   - Guardar

4. **Verificar en Google Sheets:**
   - Ir a tu hoja de Google Sheets
   - Revisar la pestaña "Movimientos"
   - Debería aparecer la transacción

---

## ✅ Checklist de Verificación

Antes de usar en producción, verificar:

- [ ] Todas las imágenes están en la carpeta `img/`
- [ ] La URL de Google Apps Script está actualizada en `app.js`
- [ ] Google Sheets tiene los permisos correctos
- [ ] La hoja "Movimientos" se crea automáticamente al guardar la primera transacción
- [ ] `base.json` tiene al menos un afiliado de prueba
- [ ] El sistema abre correctamente en el navegador
- [ ] Las búsquedas funcionan correctamente
- [ ] Las transacciones se guardan en Google Sheets

---

## 🎯 Prueba Completa del Sistema

### Test 1: Búsqueda
```
1. Buscar por DNI: 12345678
2. Verificar que aparece: Juan Pérez
3. Verificar saldo inicial: $50.000,00
```

### Test 2: Nueva Orden
```
1. Clic en "Nueva Orden"
2. Monto: 17000
3. Descripción: "Consulta médica"
4. Guardar
5. Verificar saldo final: $67.000,00
```

### Test 3: Prestación con Cuotas
```
1. Clic en "Nueva Prestación"
2. Monto total: 1000000
3. Cuotas: 10
4. Descripción: "Cirugía programada"
5. Verificar vista previa: 10 cuotas de $100.000
6. Guardar
7. Verificar saldo final: $167.000,00 (solo suma la 1ra cuota)
```

### Test 4: Exportar Movimientos
```
1. Clic en "Exportar"
2. Verificar descarga de archivo CSV
3. Abrir CSV y verificar datos
```

---

## 🔧 Solución Rápida de Problemas

### ❌ "No se encontró el afiliado"
**Solución:** Verificar que el DNI o Legajo esté en `base.json`

### ❌ Las imágenes no se ven
**Solución:** 
1. Verificar que la carpeta se llama exactamente `img`
2. Verificar nombres exactos de archivos (case-sensitive)

### ❌ No se guarda en Google Sheets
**Solución:**
1. Verificar URL en `app.js`
2. Verificar permisos de la aplicación web
3. Revisar consola del navegador (F12)

### ❌ Error de CORS
**Solución:** 
- El código ya está configurado con `mode: 'no-cors'`
- Esto es normal con Google Apps Script

---

## 📞 Comandos Útiles para Debugging

Abrir consola del navegador (F12) y ejecutar:

```javascript
// Ver afiliados cargados
console.log(affiliatesData);

// Ver movimientos actuales
console.log(movementsData);

// Ver afiliado seleccionado
console.log(currentAffiliate);
```

---

## 🎨 Personalización Opcional

### Cambiar colores principales
En `styles.css`, línea 8-10:
```css
--color-primary: #1e3a8a;      /* Azul principal */
--color-primary-dark: #1e40af; /* Azul oscuro */
--color-accent: #f59e0b;       /* Color de acento */
```

### Modificar límite de cuotas
En `index.html`, línea 99:
```html
<input type="number" id="transactionCuotas" ... max="60" ...>
```

---

## 📚 Próximos Pasos

1. ✅ Completar configuración inicial
2. 📝 Cargar todos los afiliados en `base.json`
3. 🧪 Realizar pruebas exhaustivas
4. 🚀 Implementar en servidor web (opcional)
5. 👥 Capacitar al personal
6. 📊 Comenzar a usar en producción

---

## 💡 Tips Profesionales

1. **Backup Regular:** Hacer backup de `base.json` semanalmente
2. **Google Sheets:** Hacer copia de seguridad mensual
3. **Actualizaciones:** Mantener registro de cambios en afiliados
4. **Soporte:** Documentar cualquier problema encontrado

---

**¡El sistema está listo para usar!** 🎉

Si todo funcionó correctamente, ahora tienes un sistema completo de gestión de cuenta corriente funcionando.
