/**
 * Script simplificado para executar migrações
 * 
 * Este script lê os arquivos SQL e os exibe para execução manual
 * ou executa via Supabase Management API se disponível.
 */

import { config } from 'dotenv';
config({ path: './.env.local' });

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

function sortMigrations(files: string[]): string[] {
  return files.sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0');
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0');
    return numA - numB;
  });
}

async function main() {
  console.log('📋 Arquivos de migração encontrados:\n');

  const files = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .filter(file => !file.includes('test') && !file.includes('example'));

  const sortedFiles = sortMigrations(files);

  sortedFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
    const content = readFileSync(join(migrationsDir, file), 'utf-8');
    const lines = content.split('\n').length;
    console.log(`   (${lines} linhas)\n`);
  });

  console.log('\n💡 Para executar:');
  console.log('   1. Copie o conteúdo de cada arquivo na ordem');
  console.log('   2. Cole no SQL Editor do Supabase Dashboard');
  console.log('   3. Execute cada arquivo sequencialmente\n');
}

main();

