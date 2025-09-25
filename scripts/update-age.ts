import path from "node:path";

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

(async () => {
  try {
    console.log("📅 Calculating current age...");
    const currentAge = calculateAge(BIRTH_DATE);
    console.log(`🎂 Current age: ${currentAge}`);

    console.log("📖 Reading README.md...");
    const readmeFile = Bun.file(README_PATH);
    const readmeContent = await readmeFile.text();

    // Pattern to match age in the format "I'm a XX-year-old"
    const agePattern = /I'm a \d+-year-old/g;

    // Check if age needs updating
    const currentAgeString = `I'm a ${currentAge}-year-old`;
    if (readmeContent.includes(currentAgeString)) {
      console.log("✅ Age is already up to date");
      return;
    }

    // Update the age
    const updatedContent = readmeContent.replace(agePattern, currentAgeString);

    // Check if any changes were made
    if (updatedContent === readmeContent) {
      console.log("⚠️ No age pattern found in README.md");
      return;
    }

    console.log("✏️ Writing updated README.md...");
    await Bun.write(README_PATH, updatedContent);
    console.log("✅ README.md updated successfully with current age");
  } catch (error) {
    console.error("❌ Error updating age:", error);
    process.exit(1);
  }
})();
