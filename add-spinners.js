const fs = require('fs');
const path = require('path');

const appDir = path.join(process.cwd(), 'app');
const tools = fs.readdirSync(appDir).filter(f => fs.statSync(path.join(appDir, f)).isDirectory() && (f.includes('-pdf') || f.includes('pdf-')));

tools.forEach(tool => {
    const pagePath = path.join(appDir, tool, 'page.jsx');
    if (fs.existsSync(pagePath)) {
        let content = fs.readFileSync(pagePath, 'utf8');

        const btnTextRegex = /\{([a-zA-Z]+)\s*\?\s*'([^']+)'\s*:\s*'([^']+)'\}/g;

        let modified = false;
        content = content.replace(btnTextRegex, (match, stateVar, activeText, inactiveText) => {
            if (activeText.includes('...')) {
                modified = true;
                return `{${stateVar} ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ${activeText}
                                        </span>
                                    ) : (
                                        '${inactiveText}'
                                    )}`;
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(pagePath, content);
            console.log('Added spinner to:', tool);
        }
    }
});
