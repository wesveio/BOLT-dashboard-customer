const fs = require('fs');
const path = require('path');

// Translation mappings
const translations = {
  ptBR: {
    // Common
    'dashboard.common.periods.today': 'Hoje',
    'dashboard.common.periods.week': 'Últimos 7 dias',
    'dashboard.common.periods.month': 'Últimos 30 dias',
    'dashboard.common.periods.year': 'Últimos 12 meses',
    'dashboard.common.filterBar.timePeriod': 'Período',
    'dashboard.common.filterBar.category': 'Categoria',
    'dashboard.common.filterBar.allCategories': 'Todas as Categorias',
    'dashboard.common.filterBar.eventType': 'Tipo de Evento',
    'dashboard.common.filterBar.allEventTypes': 'Todos os Tipos de Evento',
    'dashboard.common.filterBar.refresh': 'Atualizar',
    'dashboard.language.english': 'Inglês',
    'dashboard.language.portuguese': 'Português',
    'dashboard.language.spanish': 'Espanhol',
  },
  es: {
    // Common
    'dashboard.common.periods.today': 'Hoy',
    'dashboard.common.periods.week': 'Últimos 7 días',
    'dashboard.common.periods.month': 'Últimos 30 días',
    'dashboard.common.periods.year': 'Últimos 12 meses',
    'dashboard.common.filterBar.timePeriod': 'Período',
    'dashboard.common.filterBar.category': 'Categoría',
    'dashboard.common.filterBar.allCategories': 'Todas las Categorías',
    'dashboard.common.filterBar.eventType': 'Tipo de Evento',
    'dashboard.common.filterBar.allEventTypes': 'Todos los Tipos de Evento',
    'dashboard.common.filterBar.refresh': 'Actualizar',
    'dashboard.language.english': 'Inglés',
    'dashboard.language.portuguese': 'Portugués',
    'dashboard.language.spanish': 'Español',
  }
};

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function translateValue(enValue, lang) {
  // Simple translation based on common patterns
  if (lang === 'ptBR') {
    // Portuguese translations
    const map = {
      'Today': 'Hoje',
      'Last 7 days': 'Últimos 7 dias',
      'Last 30 days': 'Últimos 30 dias',
      'Last 12 months': 'Últimos 12 meses',
      'Time Period': 'Período',
      'Category': 'Categoria',
      'All Categories': 'Todas as Categorias',
      'Event Type': 'Tipo de Evento',
      'All Event Types': 'Todos os Tipos de Evento',
      'Refresh': 'Atualizar',
      'English': 'Inglês',
      'Português': 'Português',
      'Español': 'Espanhol',
      'Loading': 'Carregando',
      'Failed to load': 'Falha ao carregar',
      'Average': 'Média',
      'Total': 'Total',
      'Customers': 'Clientes',
      'Revenue': 'Receita',
      'Orders': 'Pedidos',
      'Sessions': 'Sessões',
      'Conversion': 'Conversão',
      'Rate': 'Taxa',
      'Status': 'Status',
      'Active': 'Ativo',
      'Completed': 'Concluído',
      'Abandoned': 'Abandonado',
      'New': 'Novo',
      'Recurring': 'Recorrente',
      'Anonymous': 'Anônimo',
      'Low': 'Baixo',
      'Medium': 'Médio',
      'High': 'Alto',
      'Critical': 'Crítico',
      'Excellent': 'Excelente',
      'Good': 'Bom',
      'Yes': 'Sim',
      'No': 'Não',
    };
    
    // Check for direct mapping
    if (map[enValue]) return map[enValue];
    
    // Pattern-based translations
    if (enValue.includes('Loading')) return enValue.replace('Loading', 'Carregando');
    if (enValue.includes('Failed to load')) return enValue.replace('Failed to load', 'Falha ao carregar');
    if (enValue.includes('Average')) return enValue.replace('Average', 'Média');
    if (enValue.includes('Total')) return enValue.replace('Total', 'Total');
    if (enValue.includes('Customers')) return enValue.replace('Customers', 'Clientes');
    if (enValue.includes('Revenue')) return enValue.replace('Revenue', 'Receita');
    if (enValue.includes('Orders')) return enValue.replace('Orders', 'Pedidos');
    if (enValue.includes('Sessions')) return enValue.replace('Sessions', 'Sessões');
    
    return enValue; // Fallback to English
  } else if (lang === 'es') {
    // Spanish translations
    const map = {
      'Today': 'Hoy',
      'Last 7 days': 'Últimos 7 días',
      'Last 30 days': 'Últimos 30 días',
      'Last 12 months': 'Últimos 12 meses',
      'Time Period': 'Período',
      'Category': 'Categoría',
      'All Categories': 'Todas las Categorías',
      'Event Type': 'Tipo de Evento',
      'All Event Types': 'Todos los Tipos de Evento',
      'Refresh': 'Actualizar',
      'English': 'Inglés',
      'Português': 'Portugués',
      'Español': 'Español',
      'Loading': 'Cargando',
      'Failed to load': 'Error al cargar',
      'Average': 'Promedio',
      'Total': 'Total',
      'Customers': 'Clientes',
      'Revenue': 'Ingresos',
      'Orders': 'Pedidos',
      'Sessions': 'Sesiones',
      'Conversion': 'Conversión',
      'Rate': 'Tasa',
      'Status': 'Estado',
      'Active': 'Activo',
      'Completed': 'Completado',
      'Abandoned': 'Abandonado',
      'New': 'Nuevo',
      'Recurring': 'Recurrente',
      'Anonymous': 'Anónimo',
      'Low': 'Bajo',
      'Medium': 'Medio',
      'High': 'Alto',
      'Critical': 'Crítico',
      'Excellent': 'Excelente',
      'Good': 'Bueno',
      'Yes': 'Sí',
      'No': 'No',
    };
    
    if (map[enValue]) return map[enValue];
    
    if (enValue.includes('Loading')) return enValue.replace('Loading', 'Cargando');
    if (enValue.includes('Failed to load')) return enValue.replace('Failed to load', 'Error al cargar');
    if (enValue.includes('Average')) return enValue.replace('Average', 'Promedio');
    if (enValue.includes('Total')) return enValue.replace('Total', 'Total');
    if (enValue.includes('Customers')) return enValue.replace('Customers', 'Clientes');
    if (enValue.includes('Revenue')) return enValue.replace('Revenue', 'Ingresos');
    if (enValue.includes('Orders')) return enValue.replace('Orders', 'Pedidos');
    if (enValue.includes('Sessions')) return enValue.replace('Sessions', 'Sesiones');
    
    return enValue;
  }
  return enValue;
}

function addTranslations(filePath, lang) {
  const en = JSON.parse(fs.readFileSync('src/i18n/messages/en.json', 'utf8'));
  const target = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  function processObject(enObj, targetObj, path = '') {
    for (const key in enObj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
        if (!targetObj[key]) {
          targetObj[key] = {};
        }
        processObject(enObj[key], targetObj[key], currentPath);
      } else {
        if (!targetObj[key] || targetObj[key] === enObj[key]) {
          // Missing or still in English, add translation
          const translation = translations[lang][currentPath] || translateValue(enObj[key], lang);
          targetObj[key] = translation;
        }
      }
    }
  }
  
  processObject(en, target);
  
  fs.writeFileSync(filePath, JSON.stringify(target, null, 2) + '\n\n');
  console.log(`✓ Updated ${filePath}`);
}

// Run translations
addTranslations('src/i18n/messages/pt-BR.json', 'ptBR');
addTranslations('src/i18n/messages/es.json', 'es');

console.log('\n✓ All translation files updated!');

