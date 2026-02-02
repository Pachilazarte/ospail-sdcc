/**
 * ============================================
 * ESCENCIAL - SISTEMA DE CUENTA CORRIENTE
 * Google Apps Script - Backend Handler
 * ============================================
 * 
 * Este script recibe transacciones desde la interfaz web
 * y las registra en Google Sheets.
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abrir Google Sheets
 * 2. Ir a Extensiones > Apps Script
 * 3. Copiar y pegar este código
 * 4. Guardar el proyecto
 * 5. Implementar como Aplicación Web
 * 6. Configurar acceso: "Cualquier persona"
 * 7. Copiar la URL generada
 */

/**
 * Función principal que maneja las peticiones POST
 * @param {Object} e - Objeto de evento con los datos de la petición
 * @return {Object} - Respuesta en formato JSON
 */
function doPost(e) {
  try {
    // Log para debugging
    Logger.log('Petición recibida: ' + JSON.stringify(e));
    
    // Parsear datos recibidos
    const data = JSON.parse(e.postData.contents);
    Logger.log('Datos parseados: ' + JSON.stringify(data));
    
    // Validar datos requeridos
    if (!data.dni || !data.tipo || !data.monto_total) {
      throw new Error('Faltan datos requeridos: DNI, tipo o monto_total');
    }
    
    // Obtener la hoja de cálculo activa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Movimientos');
    
    // Si no existe la hoja, crearla
    if (!sheet) {
      sheet = ss.insertSheet('Movimientos');
      
      // Crear encabezados
      const headers = [
        'DNI',
        'Legajo',
        'Nombre y Apellido',
        'Tipo',
        'Monto Total',
        'Cuotas',
        'Fecha',
        'Descripción',
        'Cuota Número',
        'Timestamp'
      ];
      
      sheet.appendRow(headers);
      
      // Formatear encabezados
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e3a8a');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');
    }
    
    // Preparar datos para insertar
    const rowData = [
      data.dni || '',
      data.legajo || '',
      data.nombre_apellido || '',
      data.tipo || '',
      data.monto_total || 0,
      data.cuotas || 1,
      data.fecha || new Date().toISOString().split('T')[0],
      data.descripcion || '',
      data.cuota_numero || 1,
      data.timestamp || new Date().toISOString()
    ];
    
    // Agregar fila a la hoja
    sheet.appendRow(rowData);
    
    // Formatear la última fila agregada
    const lastRow = sheet.getLastRow();
    const rowRange = sheet.getRange(lastRow, 1, 1, rowData.length);
    
    // Formato condicional según el tipo
    if (data.tipo === 'orden') {
      rowRange.setBackground('#f0f9ff');
    } else if (data.tipo === 'prestacion') {
      rowRange.setBackground('#fef3c7');
    } else if (data.tipo === 'varios') {
      rowRange.setBackground('#f3f4f6');
    }
    
    // Formato para montos
    sheet.getRange(lastRow, 5).setNumberFormat('#,##0.00');
    
    // Auto-ajustar columnas
    sheet.autoResizeColumns(1, rowData.length);
    
    Logger.log('Transacción guardada exitosamente');
    
    // Respuesta exitosa
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Transacción guardada correctamente',
        rowNumber: lastRow,
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log del error
    Logger.log('Error: ' + error.toString());
    
    // Respuesta de error
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función para manejar peticiones GET (opcional)
 * Útil para verificar que el script está activo
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'active',
      message: 'Escencial - Sistema de Cuenta Corriente está activo',
      version: '1.0',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Función auxiliar para obtener todos los movimientos de un afiliado
 * @param {number} dni - DNI del afiliado
 * @return {Array} - Array de movimientos
 */
function getMovimientosByDNI(dni) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Movimientos');
  
  if (!sheet) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const dniIndex = headers.indexOf('DNI');
  
  const movimientos = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][dniIndex] === dni) {
      const movimiento = {};
      headers.forEach((header, index) => {
        movimiento[header] = data[i][index];
      });
      movimientos.push(movimiento);
    }
  }
  
  return movimientos;
}

/**
 * Función para calcular el saldo actual de un afiliado
 * @param {number} dni - DNI del afiliado
 * @param {number} saldoInicial - Saldo inicial del periodo
 * @return {Object} - Objeto con saldo calculado
 */
function calcularSaldo(dni, saldoInicial) {
  const movimientos = getMovimientosByDNI(dni);
  let saldoFinal = saldoInicial;
  
  movimientos.forEach(mov => {
    const monto = mov['Monto Total'] || 0;
    const cuotas = mov['Cuotas'] || 1;
    const montoCuota = monto / cuotas;
    
    saldoFinal += montoCuota;
  });
  
  return {
    saldoInicial: saldoInicial,
    movimientos: movimientos.length,
    saldoFinal: saldoFinal
  };
}

/**
 * Función para crear un reporte mensual
 * Se puede ejecutar manualmente desde el editor de scripts
 */
function generarReporteMensual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const movSheet = ss.getSheetByName('Movimientos');
  
  if (!movSheet) {
    Logger.log('No existe la hoja Movimientos');
    return;
  }
  
  // Obtener fecha actual
  const now = new Date();
  const mesActual = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM');
  
  // Crear o limpiar hoja de reporte
  let reportSheet = ss.getSheetByName('Reporte_' + mesActual);
  if (reportSheet) {
    reportSheet.clear();
  } else {
    reportSheet = ss.insertSheet('Reporte_' + mesActual);
  }
  
  // Agregar título
  reportSheet.appendRow(['REPORTE MENSUAL - ' + mesActual]);
  reportSheet.appendRow(['Generado el: ' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')]);
  reportSheet.appendRow([]); // Línea en blanco
  
  // Agregar encabezados
  reportSheet.appendRow([
    'DNI',
    'Legajo',
    'Nombre',
    'Total Órdenes',
    'Total Prestaciones',
    'Total Varios',
    'Cantidad Movimientos',
    'Saldo Acumulado'
  ]);
  
  // Obtener datos
  const data = movSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Agrupar por DNI
  const afiliados = {};
  
  for (let i = 1; i < data.length; i++) {
    const dni = data[i][0];
    const tipo = data[i][3];
    const monto = data[i][4];
    
    if (!afiliados[dni]) {
      afiliados[dni] = {
        dni: dni,
        legajo: data[i][1],
        nombre: data[i][2],
        ordenes: 0,
        prestaciones: 0,
        varios: 0,
        cantidad: 0,
        saldo: 0
      };
    }
    
    afiliados[dni].cantidad++;
    afiliados[dni].saldo += monto;
    
    if (tipo === 'orden') {
      afiliados[dni].ordenes += monto;
    } else if (tipo === 'prestacion') {
      afiliados[dni].prestaciones += monto;
    } else if (tipo === 'varios') {
      afiliados[dni].varios += monto;
    }
  }
  
  // Escribir datos agrupados
  Object.values(afiliados).forEach(afiliado => {
    reportSheet.appendRow([
      afiliado.dni,
      afiliado.legajo,
      afiliado.nombre,
      afiliado.ordenes,
      afiliado.prestaciones,
      afiliado.varios,
      afiliado.cantidad,
      afiliado.saldo
    ]);
  });
  
  // Formatear hoja
  reportSheet.autoResizeColumns(1, 8);
  const headerRange = reportSheet.getRange(4, 1, 1, 8);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#df8723');
  headerRange.setFontColor('#ffffff');
  
  Logger.log('Reporte generado: Reporte_' + mesActual);
}

/**
 * Función de prueba para verificar la configuración
 * Se puede ejecutar desde el editor de scripts
 */
function testConfiguration() {
  Logger.log('=== TEST DE CONFIGURACIÓN ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Hoja de cálculo: ' + ss.getName());
  Logger.log('ID: ' + ss.getId());
  Logger.log('URL: ' + ss.getUrl());
  
  const sheets = ss.getSheets();
  Logger.log('Hojas disponibles: ' + sheets.map(s => s.getName()).join(', '));
  
  Logger.log('=== CONFIGURACIÓN OK ===');
}
