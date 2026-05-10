
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Engineer Prompt Content...');
    const prompt = await prisma.systemPrompt.findFirst({
        where: { role: 'ENGINEER', isActive: true }
    });

    if (prompt) {
        console.log(`\n=== ENGINEER PROMPT (Version ${prompt.version}) ===`);
        const content = prompt.content;

        // Check for specific new strings we added
        const hasScalarRule = content.includes('Scalar (Returns Number)');
        const hasMultiplyWarning = content.includes('NEVER chain .multiply()');
        const hasMutationWarning = content.includes('Mutation Warning');
        const hasAudioSystem = content.includes('=== AUDIO SYSTEM ===');

        console.log(`Contains 'Scalar (Returns Number)': ${hasScalarRule}`);
        console.log(`Contains 'NEVER chain .multiply()': ${hasMultiplyWarning}`);
        console.log(`Contains 'Mutation Warning': ${hasMutationWarning}`);
        console.log(`Contains 'AUDIO SYSTEM': ${hasAudioSystem}`);

        if (hasScalarRule && hasMultiplyWarning && hasMutationWarning && hasAudioSystem) {
            console.log('\n✅ VERIFICATION SUCCESS: All new constraints are present in the database.');
        } else {
            console.log('\n❌ VERIFICATION FAILED: Some content is missing.');
            console.log('Partial Content Preview:\n', content.substring(0, 500) + '...');
        }
    } else {
        console.log('❌ No active ENGINEER prompt found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
