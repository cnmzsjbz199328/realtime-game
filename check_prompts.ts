
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Checking System Prompts...');
    const prompts = await prisma.systemPrompt.findMany({
        where: { isActive: true },
        orderBy: { role: 'asc' }
    });

    if (prompts.length === 0) {
        console.log('No active prompts found.');
    } else {
        prompts.forEach(p => {
            console.log('---------------------------------------------------');
            console.log(`ROLE: ${p.role}`);
            console.log(`VERSION: ${p.version}`);
            console.log(`ID: ${p.id}`);
            console.log('CONTENT START:');
            console.log(p.content.substring(0, 500) + (p.content.length > 500 ? '...' : '')); // Truncate for readability
            console.log('CONTENT END');
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
