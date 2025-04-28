import {PrismaClient} from './prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

import { allocateRound1GNGN } from './test.js';
import { allocateRound2OBC } from './test3.js';
import { allocateRound2EWS } from './test4.js';
import { allocateRound2SC } from './test5.js';
import { allocateRound2ST1 } from './test6.js';
import { allocateRound2ST2 } from './test7.js';
import { allocateRound2RBA } from './test8.js';
import { allocateRound2RLAC } from './test9.js';
import { checkSeatsRemaining } from './remseats.js';


async function finalAllotment() {
    let round = 1;
    while (await checkSeatsRemaining()) {
        console.log(`\n==== ROUND ${round} START ====\n`);

        console.log('> General Category Allotment...');
        await allocateRound1GNGN(); // test.js

        console.log('> Subcategory Allotment 3...');
        await allocateRound2OBC(); // test3.js

        console.log('> Subcategory Allotment 4...');
        await allocateRound2EWS(); // test4.js

        console.log('> Subcategory Allotment 5...');
        await allocateRound2SC(); // test5.js

        console.log('> Subcategory Allotment 6...');
        await allocateRound2ST1(); // test5.js

        console.log('> Subcategory Allotment 7...');
        await allocateRound2ST2(); // test5.js

        console.log('> Subcategory Allotment 8...');
        await allocateRound2RBA(); // test5.js

        console.log('> Subcategory Allotment 9...');
        await allocateRound2RLAC(); // test5.js

        console.log(`\n==== ROUND ${round} COMPLETE ====\n`);
        round++;
    }

    console.log('\n🎯 All seats are fully allotted!');
}

finalAllotment();
