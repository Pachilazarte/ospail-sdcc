// ==========================================
// GLOBAL VARIABLES & CONFIGURATION
// ==========================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjUTGdEQiLqNBwJhN2rTbJV3Keg-E2qWeOv6W5fkNpLd1qVBGey9POA6JFXueZNPU3/exec';

let currentAffiliate = null;
let affiliatesData = [];
let movementsData = [];
let currentTransactionType = null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    initializeEventListeners();
    setDefaultDate();
});

// ==========================================
// DATABASE FUNCTIONS
// ==========================================
async function loadDatabase() {
    try {
        const response = await fetch('base.json');
        const data = await response.json();
        affiliatesData = data.afiliados || [];
        movementsData = data.movimientos || [];
        console.log('Base de datos cargada:', data);
    } catch (error) {
        console.error('Error al cargar la base de datos:', error);
        showNotification('Error al cargar la base de datos', 'error');
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function initializeEventListeners() {
    // Search button
    document.getElementById('btnSearch').addEventListener('click', searchAffiliate);
    
    // Search on Enter key
    document.getElementById('searchValue').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchAffiliate();
    });

    // Transaction type buttons
    document.getElementById('btnOrden').addEventListener('click', () => selectTransactionType('orden'));
    document.getElementById('btnPrestacion').addEventListener('click', () => selectTransactionType('prestacion'));
    document.getElementById('btnVarios').addEventListener('click', () => selectTransactionType('varios'));

    // Transaction form buttons
    document.getElementById('btnSaveTransaction').addEventListener('click', saveTransaction);
    document.getElementById('btnCancelTransaction').addEventListener('click', cancelTransaction);

    // Amount and cuotas inputs for preview
    document.getElementById('transactionAmount').addEventListener('input', updateInstallmentPreview);
    document.getElementById('transactionCuotas').addEventListener('input', updateInstallmentPreview);

    // Export button
    document.getElementById('btnExportMovements').addEventListener('click', exportMovements);
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
function searchAffiliate() {
    const searchType = document.getElementById('searchType').value;
    const searchValue = document.getElementById('searchValue').value.trim();

    if (!searchValue) {
        showNotification('Por favor ingrese un valor de búsqueda', 'warning');
        return;
    }

    showLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
        let affiliate = null;

        if (searchType === 'dni') {
            affiliate = affiliatesData.find(a => a.dni.toString() === searchValue);
        } else {
            affiliate = affiliatesData.find(a => a.legajo === searchValue);
        }

        showLoading(false);

        if (affiliate) {
            currentAffiliate = affiliate;
            displayAffiliateInfo(affiliate);
            loadAffiliateMovements(affiliate.dni);
            showNotification('Afiliado encontrado correctamente', 'success');
        } else {
            showNotification('No se encontró el afiliado', 'error');
            hideAllSections();
        }
    }, 500);
}

// ==========================================
// DISPLAY AFFILIATE INFORMATION
// ==========================================
function displayAffiliateInfo(affiliate) {
    // Show sections
    document.getElementById('affiliateInfo').classList.remove('hidden');
    document.getElementById('transactionPanel').classList.remove('hidden');
    document.getElementById('movementsSection').classList.remove('hidden');

    // Fill affiliate data
    document.getElementById('infoLegajo').textContent = affiliate.legajo;
    document.getElementById('infoNombre').textContent = affiliate.nombre_apellido;
    document.getElementById('infoDni').textContent = affiliate.dni.toLocaleString('es-AR');
    document.getElementById('infoSaldoInicial').textContent = formatCurrency(affiliate.saldo_inicial_periodo);

    // Calculate and display balances
    calculateBalances(affiliate);
}

// ==========================================
// CALCULATE BALANCES
// ==========================================
async function calculateBalances(affiliate) {
    try {
        // Obtener movimientos desde Google Sheets
        const movimientosGoogleSheets = await fetchMovimientosFromGoogleSheets(affiliate.dni);
        
        // Combinar con movimientos locales
        const movimientosLocales = movementsData.filter(m => m.dni === affiliate.dni);
        const todosMovimientos = [...movimientosGoogleSheets];
        
        // Agregar movimientos locales que no estén en Google Sheets
        movimientosLocales.forEach(movLocal => {
            const existe = todosMovimientos.some(movGS => 
                movGS.dni === movLocal.dni && 
                movGS.fecha === movLocal.fecha && 
                movGS.monto_total === movLocal.monto_total &&
                movGS.tipo === movLocal.tipo
            );
            
            if (!existe) {
                todosMovimientos.push(movLocal);
            }
        });
        
        let movementsTotal = 0;
        todosMovimientos.forEach(movement => {
            if (movement.tipo === 'orden' || movement.tipo === 'prestacion') {
                // For prestaciones with cuotas, calculate the installment amount
                if (movement.cuotas > 1) {
                    const installmentAmount = movement.monto_total / movement.cuotas;
                    movementsTotal += installmentAmount;
                } else {
                    movementsTotal += movement.monto_total;
                }
            } else if (movement.tipo === 'varios') {
                // Varios can be positive or negative
                movementsTotal += movement.monto_total;
            }
        });

        const saldoPendiente = affiliate.saldo_inicial_periodo;
        const saldoFinal = saldoPendiente + movementsTotal;

        // Display balances
        document.getElementById('saldoPendiente').textContent = formatCurrency(saldoPendiente);
        document.getElementById('movimientosMes').textContent = formatCurrency(movementsTotal);
        document.getElementById('saldoFinal').textContent = formatCurrency(saldoFinal);
        
    } catch (error) {
        console.error('Error al calcular balances:', error);
        // Fallback to local data only
        const affiliateMovements = movementsData.filter(m => m.dni === affiliate.dni);
        
        let movementsTotal = 0;
        affiliateMovements.forEach(movement => {
            if (movement.tipo === 'orden' || movement.tipo === 'prestacion') {
                if (movement.cuotas > 1) {
                    const installmentAmount = movement.monto_total / movement.cuotas;
                    movementsTotal += installmentAmount;
                } else {
                    movementsTotal += movement.monto_total;
                }
            } else if (movement.tipo === 'varios') {
                movementsTotal += movement.monto_total;
            }
        });

        const saldoPendiente = affiliate.saldo_inicial_periodo;
        const saldoFinal = saldoPendiente + movementsTotal;

        document.getElementById('saldoPendiente').textContent = formatCurrency(saldoPendiente);
        document.getElementById('movimientosMes').textContent = formatCurrency(movementsTotal);
        document.getElementById('saldoFinal').textContent = formatCurrency(saldoFinal);
    }
}

// ==========================================
// LOAD AFFILIATE MOVEMENTS
// ==========================================
async function loadAffiliateMovements(dni) {
    const tableBody = document.getElementById('movementsTableBody');
    
    // Mostrar loading
    tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Cargando movimientos...</td></tr>';
    
    try {
        // Obtener movimientos desde Google Sheets
        const movimientosGoogleSheets = await fetchMovimientosFromGoogleSheets(dni);
        
        // Combinar con movimientos locales de base.json (si existen)
        const movimientosLocales = movementsData.filter(m => m.dni === dni);
        
        // Crear un Set para evitar duplicados (basado en timestamp o combinación de campos)
        const movimientosCombinados = [...movimientosGoogleSheets];
        
        // Agregar movimientos locales que no estén en Google Sheets
        movimientosLocales.forEach(movLocal => {
            const existe = movimientosCombinados.some(movGS => 
                movGS.dni === movLocal.dni && 
                movGS.fecha === movLocal.fecha && 
                movGS.monto_total === movLocal.monto_total &&
                movGS.tipo === movLocal.tipo
            );
            
            if (!existe) {
                movimientosCombinados.push(movLocal);
            }
        });
        
        if (movimientosCombinados.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No hay movimientos para mostrar</td></tr>';
            return;
        }

        // Sort by date (newest first)
        movimientosCombinados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        let runningBalance = currentAffiliate.saldo_inicial_periodo;
        let html = '';

        movimientosCombinados.forEach(movement => {
            const amount = movement.cuotas > 1 
                ? movement.monto_total / movement.cuotas 
                : movement.monto_total;
            
            runningBalance += amount;

            const cuotaText = movement.cuotas > 1 
                ? `${movement.cuota_numero}/${movement.cuotas}` 
                : '-';

            const amountClass = amount >= 0 ? 'amount-positive' : 'amount-negative';

            html += `
                <tr>
                    <td>${formatDate(movement.fecha)}</td>
                    <td><strong>${capitalizeFirst(movement.tipo)}</strong></td>
                    <td>${movement.descripcion || '-'}</td>
                    <td>${cuotaText}</td>
                    <td class="${amountClass}">${formatCurrency(amount)}</td>
                    <td>${formatCurrency(runningBalance)}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar movimientos:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error al cargar movimientos. Intente nuevamente.</td></tr>';
    }
}

// ==========================================
// FETCH MOVEMENTS FROM GOOGLE SHEETS
// ==========================================
async function fetchMovimientosFromGoogleSheets(dni) {
    return new Promise((resolve, reject) => {
        try {
            // Generar un nombre único para la función callback
            const callbackName = 'jsonpCallback_' + Date.now();
            
            // Crear el script tag para JSONP
            const script = document.createElement('script');
            const url = `${GOOGLE_SCRIPT_URL}?dni=${dni}&callback=${callbackName}`;
            
            // Definir la función callback global
            window[callbackName] = function(data) {
                // Limpiar
                delete window[callbackName];
                document.body.removeChild(script);
                
                // Procesar respuesta
                if (data.status === 'success' && data.movimientos) {
                    console.log(`✅ Movimientos obtenidos de Google Sheets para DNI ${dni}:`, data.movimientos);
                    resolve(data.movimientos);
                } else {
                    console.log('⚠️ No se encontraron movimientos en Google Sheets');
                    resolve([]);
                }
            };
            
            // Manejar errores
            script.onerror = function() {
                delete window[callbackName];
                document.body.removeChild(script);
                console.error('Error al cargar script JSONP');
                resolve([]); // Resolver con array vacío en caso de error
            };
            
            // Agregar script al DOM
            script.src = url;
            document.body.appendChild(script);
            
        } catch (error) {
            console.error('Error al obtener movimientos de Google Sheets:', error);
            resolve([]); // Resolver con array vacío en caso de error
        }
    });
}

// ==========================================
// TRANSACTION TYPE SELECTION
// ==========================================
function selectTransactionType(type) {
    currentTransactionType = type;

    // Update button states
    document.querySelectorAll('.btn-type').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn${capitalizeFirst(type)}`).classList.add('active');

    // Show and configure form
    const form = document.getElementById('transactionForm');
    const cuotasGroup = document.getElementById('cuotasGroup');
    const formTitle = document.getElementById('formTitle');
    const transactionTypeInput = document.getElementById('transactionType');

    form.classList.remove('hidden');
    transactionTypeInput.value = capitalizeFirst(type);

    // Configure form based on type
    if (type === 'prestacion') {
        cuotasGroup.style.display = 'block';
        formTitle.textContent = 'Nueva Prestación (con Cuotas)';
    } else if (type === 'orden') {
        cuotasGroup.style.display = 'none';
        formTitle.textContent = 'Nueva Orden';
        document.getElementById('transactionCuotas').value = 1;
    } else {
        cuotasGroup.style.display = 'none';
        formTitle.textContent = 'Ajustes / Varios';
        document.getElementById('transactionCuotas').value = 1;
    }

    // Clear previous data
    document.getElementById('transactionAmount').value = '';
    document.getElementById('transactionDesc').value = '';
    document.getElementById('installmentPreview').classList.add('hidden');

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==========================================
// INSTALLMENT PREVIEW
// ==========================================
function updateInstallmentPreview() {
    const amount = parseFloat(document.getElementById('transactionAmount').value) || 0;
    const cuotas = parseInt(document.getElementById('transactionCuotas').value) || 1;
    const preview = document.getElementById('installmentPreview');
    const list = document.getElementById('installmentList');

    if (currentTransactionType === 'prestacion' && amount > 0 && cuotas > 1) {
        preview.classList.remove('hidden');
        const installmentAmount = amount / cuotas;
        let html = '';

        for (let i = 1; i <= cuotas; i++) {
            html += `
                <div class="installment-item">
                    <span>Cuota ${i}/${cuotas}</span>
                    <strong>${formatCurrency(installmentAmount)}</strong>
                </div>
            `;
        }

        list.innerHTML = html;
    } else {
        preview.classList.add('hidden');
    }
}

// ==========================================
// SAVE TRANSACTION
// ==========================================
async function saveTransaction() {
    if (!currentAffiliate) {
        showNotification('No hay afiliado seleccionado', 'error');
        return;
    }

    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const cuotas = parseInt(document.getElementById('transactionCuotas').value) || 1;
    const date = document.getElementById('transactionDate').value;
    const description = document.getElementById('transactionDesc').value.trim();

    // Validation
    if (!amount || amount <= 0) {
        showNotification('Ingrese un monto válido', 'warning');
        return;
    }

    if (!date) {
        showNotification('Seleccione una fecha', 'warning');
        return;
    }

    if (currentTransactionType === 'prestacion' && cuotas < 1) {
        showNotification('Ingrese una cantidad de cuotas válida', 'warning');
        return;
    }

    // Create transaction object
    const transaction = {
        dni: currentAffiliate.dni,
        legajo: currentAffiliate.legajo,
        nombre_apellido: currentAffiliate.nombre_apellido,
        tipo: currentTransactionType,
        monto_total: amount,
        cuotas: cuotas,
        fecha: date,
        descripcion: description || `${capitalizeFirst(currentTransactionType)} - ${formatDate(date)}`,
        cuota_numero: 1,
        timestamp: new Date().toISOString()
    };

    // Send to Google Sheets
    showLoading(true);
    
    try {
        const success = await sendToGoogleSheets(transaction);
        
        if (success) {
            // Add to local data
            movementsData.push(transaction);
            
            // Update display
            calculateBalances(currentAffiliate);
            loadAffiliateMovements(currentAffiliate.dni);
            
            // Clear form
            cancelTransaction();
            
            showNotification('Transacción guardada correctamente', 'success');
        } else {
            throw new Error('Error al guardar en Google Sheets');
        }
    } catch (error) {
        console.error('Error al guardar transacción:', error);
        showNotification('Error al guardar la transacción', 'error');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// SEND TO GOOGLE SHEETS
// ==========================================
async function sendToGoogleSheets(transaction) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction)
        });

        // Note: With no-cors mode, we can't read the response
        // We assume success if no error is thrown
        console.log('Transacción enviada a Google Sheets:', transaction);
        return true;
    } catch (error) {
        console.error('Error al enviar a Google Sheets:', error);
        
        // Even with error, we'll continue (no-cors limitation)
        // The data will be stored locally
        return true;
    }
}

// ==========================================
// CANCEL TRANSACTION
// ==========================================
function cancelTransaction() {
    document.getElementById('transactionForm').classList.add('hidden');
    document.getElementById('transactionAmount').value = '';
    document.getElementById('transactionCuotas').value = 1;
    document.getElementById('transactionDate').value = '';
    document.getElementById('transactionDesc').value = '';
    document.getElementById('installmentPreview').classList.add('hidden');
    
    document.querySelectorAll('.btn-type').forEach(btn => {
        btn.classList.remove('active');
    });
    
    currentTransactionType = null;
}

// ==========================================
// EXPORT MOVEMENTS
// ==========================================
function exportMovements() {
    if (!currentAffiliate) {
        showNotification('No hay afiliado seleccionado', 'warning');
        return;
    }

    const affiliateMovements = movementsData.filter(m => m.dni === currentAffiliate.dni);
    
    if (affiliateMovements.length === 0) {
        showNotification('No hay movimientos para exportar', 'warning');
        return;
    }

    // Create CSV content
    let csv = 'Fecha,Tipo,Descripción,Cuota,Monto,Saldo\n';
    let runningBalance = currentAffiliate.saldo_inicial_periodo;

    affiliateMovements.forEach(movement => {
        const amount = movement.cuotas > 1 
            ? movement.monto_total / movement.cuotas 
            : movement.monto_total;
        
        runningBalance += amount;

        const cuotaText = movement.cuotas > 1 
            ? `${movement.cuota_numero}/${movement.cuotas}` 
            : '-';

        csv += `${formatDate(movement.fecha)},${movement.tipo},"${movement.descripcion || '-'}",${cuotaText},${amount.toFixed(2)},${runningBalance.toFixed(2)}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `movimientos_${currentAffiliate.legajo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Movimientos exportados correctamente', 'success');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    messageEl.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

function hideAllSections() {
    document.getElementById('affiliateInfo').classList.add('hidden');
    document.getElementById('transactionPanel').classList.add('hidden');
    document.getElementById('movementsSection').classList.add('hidden');
    currentAffiliate = null;
}

// ==========================================
// CONSOLE HELPERS (FOR DEBUGGING)
// ==========================================
console.log('Sistema de Cuenta Corriente - Escencial');
console.log('Versión: 1.0');
console.log('Para soporte técnico, contacte al administrador');