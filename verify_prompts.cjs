
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Prompts...');
    const prompts = await prisma.systemPrompt.findMany({
        where: { isActive: true }
    });

    console.log('Active Prompts Found:', prompts.length);
    prompts.forEach(p => {
        console.log(`- Role: ${p.role}, Version: ${p.version}, ID: ${p.id}`);
        if (p.role === 'ENGINEER') {
            const hasAudio = p.content.includes('AUDIO SYSTEM');
            console.log(`  Audio System Instructions Present: ${hasAudio}`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
