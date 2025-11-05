/**
 * Script para gerar favicons a partir do logo bolt.svg
 * 
 * Requisitos:
 * - sharp: npm install sharp --save-dev
 * - ou usar imagemagick: brew install imagemagick
 * 
 * Uso:
 * node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

// Tamanhos necessários para os favicons
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

const svgPath = path.join(__dirname, '../public/bolt.svg');
const publicDir = path.join(__dirname, '../public');

// SVG otimizado para favicon (extraindo apenas o logo central)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670 120" fill="none">
  <g transform="matrix(2.19 0 0 2.19 335 60)">
    <g transform="translate(-122.724,-0.108)">
      <path fill="#000000"
        d="M24.516-2.412c1.44-2.304 2.304-5.04 2.304-7.92 0-8.28-6.696-14.904-14.904-14.976H-30.636v50.616h45.792c8.568 0 15.48-6.912 15.48-15.408 0-5.04-2.448-9.504-6.12-12.312zm-44.856-12.744h32.256c2.592 0 4.752 2.16 4.752 4.824 0 2.592-2.16 4.752-4.752 4.752h-32.256zm35.496 30.312H-20.34v-10.584h35.136c2.952-.072 5.4 2.232 5.472 5.112.144 2.952-2.16 5.4-5.112 5.472z" />
    </g>
    <g transform="translate(-35.028,0.108)">
      <path fill="#000000"
        d="M28.836-25.308H-28.908C-42.876-25.308-54.18-14.004-54.18-.036s11.304 25.344 25.272 25.344H28.836C42.804 25.308 54.18 13.932 54.18-.036S42.804-25.308 28.836-25.308zm0 40.464H-28.908c-8.352 0-15.12-6.768-15.12-15.192 0-8.352 6.768-15.12 15.12-15.12H28.836c8.424 0 15.192 6.768 15.192 15.12 0 8.424-6.768 15.192-15.192 15.192z" />
    </g>
    <g transform="translate(54.828,-0.108)">
      <path fill="#000000" d="M30.636 15.156H-20.34v-40.464H-30.636v50.616H30.636z" />
    </g>
    <g transform="translate(119.52,-0.108)">
      <path fill="#000000" d="M33.804-15.156v-10.152H-33.876v10.152h29.232v40.464h10.296v-40.464z" />
    </g>
  </g>
</svg>`;

async function generateFavicons() {
  try {
    // Verificar se sharp está disponível
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.error('❌ [DEBUG] sharp não está instalado.');
      console.log('📦 Instale com: npm install sharp --save-dev');
      console.log('\n💡 Alternativa: Use uma ferramenta online ou ImageMagick:');
      console.log('   convert -background none -resize 16x16 public/bolt.svg public/favicon-16x16.png');
      process.exit(1);
    }

    // Salvar SVG temporário com cor preta (para melhor visibilidade como favicon)
    const tempSvgPath = path.join(publicDir, 'bolt-favicon-temp.svg');
    fs.writeFileSync(tempSvgPath, faviconSvg);

    console.log('✅ [DEBUG] Gerando favicons...');

    // Gerar cada tamanho
    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(tempSvgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Fundo transparente
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ [DEBUG] Gerado: ${name} (${size}x${size})`);
    }

    // Gerar favicon.ico (16x16 e 32x32)
    const favicon16 = await sharp(tempSvgPath)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer();

    const favicon32 = await sharp(tempSvgPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Para favicon.ico simples, vamos usar apenas 32x32 convertido
    // Nota: Para um .ico real com múltiplos tamanhos, seria necessário usar uma biblioteca específica
    await sharp(favicon32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    // Remover SVG temporário
    fs.unlinkSync(tempSvgPath);

    console.log('✅ [DEBUG] Favicon.ico gerado');
    console.log('✅ [DEBUG] Todos os favicons foram gerados com sucesso!');
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao gerar favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();

