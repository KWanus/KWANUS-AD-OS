const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const sql = fs.readFileSync('/tmp/create_table.sql', 'utf8');
    try {
        console.log('Running SQL...');
        // Split by -- CreateTable or similar if needed, or just run as one if supported
        // For safety with $executeRaw, we should be careful with multiple statements
        // But $executeRawUnsafe can handle whole strings
        await prisma.$executeRawUnsafe(sql);
        console.log('Success!');
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('Table already exists, skipping.');
        } else {
            console.error('Error executing SQL:', err);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
