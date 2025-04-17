import fs from 'fs';
import path from 'path';

const readmePath = path.join(process.cwd(), 'README.md');
const readme = fs.readFileSync(readmePath, 'utf-8');

const run = async () => {
    try {
        console.log('Updating age in README.md...');
        const age = Math.floor(
            (Date.now() - new Date('2003-01-23').getTime()) / (1000 * 60 * 60 * 24 * 365)
        );

        const regex = /I'm a \d+-year-old/g;

        // Check if current age is same as updated age
        const currentAge = readme.match(regex)?.[0].replace("I'm a ", '').replace('-year-old', '');
        if (currentAge === age.toString()) {
            console.log('Age already up-to-date in README.md');
            return;
        }

        const updatedReadme = readme.replace(regex, `I'm a ${age}-year-old`);

        fs.writeFileSync(readmePath, updatedReadme);
        console.log('Age updated in README.md');
    } catch (error) {
        console.error('Error updating age in README.md:', error);
    }
};

run();
