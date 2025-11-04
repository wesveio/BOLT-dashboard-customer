const fs = require('fs');

// Complete translation mappings
const ptBRMap = {
  // Common periods
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
  
  // LTV
  'Loading LTV analytics...': 'Carregando analytics de LTV...',
  'Failed to load LTV analytics': 'Falha ao carregar analytics de LTV',
  'Average LTV': 'LTV Médio',
  'Customer lifetime value': 'Valor do ciclo de vida do cliente',
  'Total Customers': 'Total de Clientes',
  'Unique customers analyzed': 'Clientes únicos analisados',
  'Avg Orders/Customer': 'Média de Pedidos/Cliente',
  'Average purchase frequency': 'Frequência média de compra',
  'Recurring Rate': 'Taxa de Recorrência',
  '{count} repeat customers': '{count} clientes recorrentes',
  'LTV Distribution': 'Distribuição de LTV',
  'Customer segments by lifetime value': 'Segmentos de clientes por valor de vida',
  'LTV by Customer Segment': 'LTV por Segmento de Cliente',
  'Average LTV by customer type': 'LTV médio por tipo de cliente',
  'Avg LTV': 'LTV Médio',
  'Customers': 'Clientes',
  'Revenue': 'Receita',
  'Top Customers by LTV': 'Principais Clientes por LTV',
  'Highest lifetime value customers': 'Clientes com maior valor de vida',
  'CUSTOMER': 'CLIENTE',
  'ORDERS': 'PEDIDOS',
  'LTV': 'LTV',
  'AVG ORDER VALUE': 'VALOR MÉDIO DO PEDIDO',
  'FREQUENCY': 'FREQUÊNCIA',
  'STATUS': 'STATUS',
  'Recurring': 'Recorrente',
  'New': 'Novo',
  'orders/mo': 'pedidos/mês',
  'Anonymous': 'Anônimo',
  'No Customer Data': 'Sem Dados de Clientes',
  'No customer data available in the selected period': 'Nenhum dado de cliente disponível no período selecionado',
  'No customers found': 'Nenhum cliente encontrado',
  'Try selecting a different time period.': 'Tente selecionar um período diferente.',
  'High LTV': 'LTV Alto',
  'Medium LTV': 'LTV Médio',
  'Low LTV': 'LTV Baixo',
};

const esMap = {
  // Common periods
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
};

function translateObject(obj, translationMap) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      result[key] = translateObject(obj[key], translationMap);
    } else if (typeof obj[key] === 'string') {
      result[key] = translationMap[obj[key]] || obj[key];
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// Read files
const en = JSON.parse(fs.readFileSync('src/i18n/messages/en.json', 'utf8'));
const ptBR = JSON.parse(fs.readFileSync('src/i18n/messages/pt-BR.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/i18n/messages/es.json', 'utf8'));

// Function to merge translations keeping existing ones
function mergeTranslations(target, source, translations) {
  for (const key in source) {
    if (!target[key]) {
      target[key] = typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) 
        ? {} 
        : (translations[source[key]] || source[key]);
    }
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeTranslations(target[key], source[key], translations);
    }
  }
}

// Merge English structure into pt-BR and es, applying translations
mergeTranslations(ptBR, en, ptBRMap);
mergeTranslations(es, en, esMap);

// Write files
fs.writeFileSync('src/i18n/messages/pt-BR.json', JSON.stringify(ptBR, null, 2) + '\n\n');
fs.writeFileSync('src/i18n/messages/es.json', JSON.stringify(es, null, 2) + '\n\n');

console.log('✓ Translation files updated with basic translations');
console.log('Note: Some translations may still need manual review');

