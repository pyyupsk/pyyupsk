import path from "node:path";
import { atomicWrite, safeRead, validateFileExists } from "./lib/file-utils";
import { logger } from "./lib/logger";

// Configuration
const BIRTH_DATE = new Date("2003-01-23");
const README_PATH = path.join(process.cwd(), "README.md");

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

async function main(): Promise<void> {
  logger.info("Calculating current age...");
  const currentAge = calculateAge(BIRTH_DATE);
  console.log(`🎂 Current age: ${currentAge}`);

  logger.info("Validating README.md exists...");
  await validateFileExists(README_PATH);

  logger.info("Reading README.md...");
  const readmeContent = await safeRead(README_PATH);

  // Pattern to match age in the format "I'm a XX-year-old"
  const agePattern = /I'm a \d+-year-old/g;

  const currentAgeString = `I'm a ${currentAge}-year-old`;
  if (readmeContent.includes(currentAgeString)) {
    logger.success("Age is already up to date");
    process.exit(0);
  }

  const updatedContent = readmeContent.replaceAll(agePattern, currentAgeString);

  if (updatedContent === readmeContent) {
    logger.warn("No age pattern found in README.md");
    logger.info(
      'Hint: Ensure README.md contains text like "I\'m a XX-year-old"',
    );
    process.exit(0);
  }

  logger.info("Writing updated README.md...");
  await atomicWrite(README_PATH, updatedContent);
  logger.success("README.md updated successfully with current age");
}

main().catch((error: unknown) => { // NOSONAR
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Failed to update age: ${errorMessage}`);

  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }

  logger.info("To resolve this issue:");
  logger.info("1. Ensure README.md exists in the repository root");
  logger.info('2. Ensure it contains text like "I\'m a XX-year-old"');
  logger.info("3. Run the script from the repository root directory");

  process.exit(1);
});
