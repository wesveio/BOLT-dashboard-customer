/**
 * Script para executar migrações do Supabase
 * 
 * Este script executa todas as migrações SQL na ordem correta
 * usando o cliente Supabase com service role key.
 * 
 * Uso:
 *   tsx scripts/run-migrations.ts
 *   ou
 *   npx tsx scripts/run-migrations.ts
 * 
 * Requisitos:
 *   - Variáveis de ambiente configuradas (.env.local)
 *   - SUPABASE_SERVICE_ROLE_KEY deve estar configurada
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ [ERROR] Variáveis de ambiente não configuradas');
  console.error('   Certifique-se de que .env.local contém:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Executa uma migração SQL
 */
async function runMigration(fileName: string, sql: string): Promise<void> {
  console.log(`\n📝 Executando: ${fileName}...`);

  try {
    // Executa o SQL usando RPC ou query direta
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    // Se RPC não existir, tenta executar diretamente via REST
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('   ⚠️  RPC não disponível, executando via REST API...');

      // Garantir que a service role key está definida
      if (!supabaseServiceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada');
      }

      // Para queries complexas, precisamos usar a API SQL do Supabase
      // Nota: Isso requer acesso via service role key
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({ sql_query: sql }),
      });

      if (!response.ok) {
        // Se ainda falhar, vamos tentar executar via psql ou sugerir execução manual
        console.error('   ❌ Não é possível executar via REST API automaticamente');
        console.error('   💡 Execute manualmente no SQL Editor do Supabase Dashboard');
        throw new Error(`Migration failed: ${fileName}`);
      }
    } else if (error) {
      throw error;
    }

    console.log(`   ✅ ${fileName} executado com sucesso`);
  } catch (error: any) {
    console.error(`   ❌ Erro ao executar ${fileName}:`, error.message);

    // Se for erro de sintaxe ou estrutura, mostra mais detalhes
    if (error.code || error.details) {
      console.error('   Detalhes:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    throw error;
  }
}

/**
 * Ordena os arquivos de migração numericamente
 */
function sortMigrations(files: string[]): string[] {
  return files.sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0');
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0');
    return numA - numB;
  });
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando execução de migrações do Supabase...\n');
  console.log(`📁 Diretório de migrações: ${migrationsDir}\n`);

  try {
    // Lista arquivos de migração
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.includes('test') && !file.includes('example'));

    if (files.length === 0) {
      console.error('❌ Nenhum arquivo de migração encontrado');
      process.exit(1);
    }

    // Ordena numericamente
    const sortedFiles = sortMigrations(files);

    console.log(`📋 Encontradas ${sortedFiles.length} migrações:`);
    sortedFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    // Executa cada migração em sequência
    for (const file of sortedFiles) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');
      await runMigration(file, sql);
    }

    console.log('\n✅ Todas as migrações foram executadas com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verifique as tabelas no Dashboard do Supabase');
    console.log('   2. Verifique se as políticas RLS estão ativas');
    console.log('   3. Teste a conexão com a aplicação\n');

  } catch (error: any) {
    console.error('\n❌ Falha ao executar migrações:', error.message);
    console.error('\n💡 Alternativas:');
    console.error('   1. Execute manualmente no SQL Editor do Supabase Dashboard');
    console.error('   2. Use o Supabase CLI: supabase db push');
    process.exit(1);
  }
}

// Executa
main();

