// Text helpers: HTML escaping and turning the addon's in-game help text into HTML.

export function escapeHtml(value) {
    return `${value ?? ''}`
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Removes Minecraft § formatting codes.
export function stripCodes(text) {
    return `${text ?? ''}`.replace(/§[0-9a-gk-or]/gi, '');
}

// Escapes one line and turns § colour codes into <span class="mc-X">. §r (or a new colour) closes the span.
export function formatLine(line) {
    let html = '';
    let open = false;

    for (const part of escapeHtml(line).split(/(§[0-9a-gk-or])/i)) {
        const code = /^§([0-9a-gk-or])$/i.exec(part)?.[1]?.toLowerCase();
        if (!code) {
            html += part;
            continue;
        }
        if (open) html += '</span>';
        open = code !== 'r';
        if (open) html += `<span class="mc-${code}">`;
    }
    if (open) html += '</span>';

    return html
        // "OnStartTouch > door_relay > FireUser1" connection chains.
        .replace(/([\w!*]+ &gt; [\w!*]+ &gt; \w+)/g, '<code class="io-chain">$1</code>')
        // 'quoted values' (an apostrophe inside a word, like player's, is left alone).
        .replace(/(^|[\s(])&#039;(.+?)&#039;(?=[\s,.:;)]|$)/g, '$1<code class="io-value">$2</code>');
}

// In-game help pages use blank lines between paragraphs and "- " for list items.
export function helpToHtml(text) {
    const blocks = stripCodesOnlyWhitespace(text).split(/\n{2,}/).filter(block => block.trim());
    if (blocks.length === 0) return '<p class="detail-muted">Nothing written for this section yet.</p>';

    return blocks.map(block => {
        const lines = block.split('\n').filter(line => line.trim());
        if (lines.every(line => line.startsWith('- '))) {
            return `<ul>${lines.map(line => `<li>${formatLine(line.slice(2))}</li>`).join('')}</ul>`;
        }
        return `<p>${lines.map(formatLine).join('<br>')}</p>`;
    }).join('');
}

// Lines holding only a § code (e.g. "§r") count as blank so paragraphs split correctly.
function stripCodesOnlyWhitespace(text) {
    return `${text ?? ''}`
        .split('\n')
        .map(line => (stripCodes(line).trim() ? line : ''))
        .join('\n');
}

export function plural(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}
