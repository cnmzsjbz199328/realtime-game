const fs = require('fs');
try {
    const text = fs.readFileSync('final_report.txt', 'utf16le');
    const sections = text.split('>>> TESTING:');
    let output = '--- Batch Test Results ---\n';

    sections.slice(1).forEach(s => {
        const lines = s.split('\n');
        const topic = lines[0].trim();
        const passed = s.includes('✅ PASSED');
        const result = passed ? 'PASS' : 'FAIL';

        let violations = 'None';
        if (!passed) {
            const match = s.match(/Violations: (.*)/);
            violations = match ? match[1] : 'Unknown logic error';
        }

        output += `${topic}: ${result}\n`;
        if (!passed) output += `   Reasons: ${violations}\n`;
    });

    output += '\n--- Final Summary Table ---\n';
    const start = text.indexOf('FINAL BATCH TEST SUMMARY REPORT');
    if (start !== -1) {
        output += text.substring(start);
    }

    fs.writeFileSync('summary.txt', output, 'utf8');
    console.log('Summary written to summary.txt');
} catch (e) {
    console.error('Failed to read report:', e.message);
}
