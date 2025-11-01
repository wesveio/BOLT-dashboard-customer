/**
 * Script para executar migrações do Supabase
 * 
 * Este script tenta executar migrações usando o Supabase CLI.
 * Se o CLI não estiver disponível, gera um arquivo SQL consolidado
 * para execução manual no SQL Editor.
 * 
 * Uso:
 *   yarn migrate
 *   ou
 *   tsx scripts/run-migrations.ts
 * 
 * Requisitos:
 *   - Supabase CLI instalado (opcional, mas recomendado)
 *   - Ou acesso ao SQL Editor do Supabase Dashboard
 */

import { config } from 'dotenv';
config({ path: './.env.local' });

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
const outputFile = join(process.cwd(), 'supabase', 'all-migrations.sql');

/**
 * Verifica se o Supabase CLI está instalado
 */
function hasSupabaseCLI(): boolean {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
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
 * Executa migrações usando Supabase CLI
 */
function runWithCLI(): void {
  console.log('📦 Usando Supabase CLI para executar migrações...\n');

  try {
    // Verifica se o projeto está linkado
    try {
      execSync('supabase status', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Projeto não está linkado ao Supabase CLI');
      console.log('\n💡 Para usar o CLI:');
      console.log('   1. Execute: supabase login');
      console.log('   2. Execute: supabase link --project-ref seu-project-ref');
      console.log('   3. Execute: supabase db push\n');
      throw new Error('Projeto não linkado');
    }

    // Executa as migrações
    console.log('🚀 Executando: supabase db push...\n');
    execSync('supabase db push', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('\n✅ Migrações executadas com sucesso via CLI!');
  } catch (error: any) {
    console.error('\n❌ Erro ao executar via CLI:', error.message);
    throw error;
  }
}

/**
 * Gera arquivo SQL consolidado para execução manual
 */
function generateConsolidatedSQL(sortedFiles: string[]): void {
  console.log('📝 Gerando arquivo SQL consolidado...\n');

  let consolidatedSQL = `-- ============================================================================
-- MIGRAÇÕES CONSOLIDADAS - Dashboard Customer
-- ============================================================================
-- Este arquivo contém todas as migrações na ordem correta.
-- Execute este arquivo completo no SQL Editor do Supabase Dashboard.
-- ============================================================================
-- Gerado em: ${new Date().toISOString()}
-- Total de migrações: ${sortedFiles.length}
-- ============================================================================

`;

  sortedFiles.forEach((file, index) => {
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    consolidatedSQL += `\n-- ============================================================================
-- MIGRATION ${index + 1}/${sortedFiles.length}: ${file}
-- ============================================================================\n\n`;

    consolidatedSQL += sql;
    consolidatedSQL += '\n\n';
  });

  consolidatedSQL += `-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================
-- Próximos passos:
-- 1. Verifique se todas as tabelas foram criadas
-- 2. Verifique as políticas RLS
-- 3. Teste a conexão com a aplicação
-- ============================================================================
`;

  writeFileSync(outputFile, consolidatedSQL, 'utf-8');

  console.log(`✅ Arquivo gerado: ${outputFile}\n`);
  console.log('📋 Instruções:');
  console.log('   1. Acesse o Dashboard do Supabase');
  console.log('   2. Vá para SQL Editor');
  console.log('   3. Copie e cole o conteúdo do arquivo gerado');
  console.log('   4. Execute o SQL (Ctrl+Enter / Cmd+Enter)\n');
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

    console.log('\n');

    // Tenta usar CLI, senão gera arquivo consolidado
    if (hasSupabaseCLI()) {
      try {
        runWithCLI();
      } catch (cliError) {
        console.log('\n⚠️  Não foi possível executar via CLI, gerando arquivo SQL...\n');
        generateConsolidatedSQL(sortedFiles);
      }
    } else {
      console.log('ℹ️  Supabase CLI não encontrado\n');
      generateConsolidatedSQL(sortedFiles);
      console.log('\n💡 Para usar o CLI no futuro:');
      console.log('   - macOS: brew install supabase/tap/supabase');
      console.log('   - npm: npm install -g supabase');
      console.log('   - Veja: supabase/MIGRATION-GUIDE.md\n');
    }

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executa
main();
