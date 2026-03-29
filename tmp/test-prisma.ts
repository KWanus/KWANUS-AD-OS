import { prisma } from "../lib/prisma";

async function main() {
    console.log("Keys on prisma:", Object.keys(prisma).filter(k => !k.startsWith("_")));
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
