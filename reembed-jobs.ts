const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");

const prisma = new PrismaClient({
  log: ["error"],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function cosineSimilarity(a: number[], b: number[]): Promise<number> {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

async function reembedAllJobs() {
  console.log("Fetching all jobs from database...");

  const jobs = await prisma.job.findMany({
    where: { isActive: true },
  });

  console.log(`Found ${jobs.length} jobs to re-embed`);

  let successCount = 0;
  let errorCount = 0;

  for (const job of jobs) {
    try {
      const textForEmbedding = `${job.title} ${job.employmentType} ${job.workModel} ${job.description}`;
      console.log(`Generating embedding for: ${job.title}...`);

      const embedding = await generateEmbedding(textForEmbedding);

      await prisma.job.update({
        where: { id: job.id },
        data: { embedding },
      });

      successCount++;
      console.log(`✓ Successfully embedded: ${job.title}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Error embedding job ${job.title}:`, error);
    }
  }

  console.log(`\nDone! Success: ${successCount}, Errors: ${errorCount}`);
}

reembedAllJobs()
  .then(() => {
    console.log("Re-embedding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Re-embedding failed:", error);
    process.exit(1);
  });