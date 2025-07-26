#!/usr/bin/env node

/**
 * Build Time Injector
 * 
 * Injects the current build date into index.html meta tag
 * Used to show build notifications to users
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
    try {
        const indexPath = path.join(__dirname, '..', 'index.html');
        
        // Read the current index.html
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Generate current date in YYYY-MM-DD format
        const now = new Date();
        const buildTime = now.toISOString().split('T')[0];
        
        console.log(`🕒 Injecting build time: ${buildTime}`);
        
        // Replace the build-time meta tag content
        const metaTagRegex = /<meta name="build-time" content="[^"]*">/;
        const newMetaTag = `<meta name="build-time" content="${buildTime}">`;
        
        if (metaTagRegex.test(content)) {
            content = content.replace(metaTagRegex, newMetaTag);
            console.log('✅ Updated existing build-time meta tag');
        } else {
            // If no meta tag exists, add it after the viewport meta tag
            const viewportRegex = /(<meta name="viewport"[^>]*>)/;
            if (viewportRegex.test(content)) {
                content = content.replace(viewportRegex, `$1\n    ${newMetaTag}`);
                console.log('✅ Added new build-time meta tag');
            } else {
                console.warn('⚠️ Could not find viewport meta tag to inject build time');
                return;
            }
        }
        
        // Write the updated content back
        fs.writeFileSync(indexPath, content);
        console.log(`📝 Build time ${buildTime} injected successfully`);
        
    } catch (error) {
        console.error('❌ Failed to inject build time:', error.message);
        process.exit(1);
    }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };