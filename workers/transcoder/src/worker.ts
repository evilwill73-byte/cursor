import { prisma } from "@social-media/database";

/**
 * Transcoder worker stub — Phase 1 completion task.
 * Polls queued transcode_jobs and marks videos published when FFmpeg is wired.
 */
async function processJobs() {
  const jobs = await prisma.transcodeJob.findMany({
    where: { status: "queued" },
    take: 5,
    orderBy: { createdAt: "asc" },
  });

  for (const job of jobs) {
    console.log(`[transcoder] processing job ${job.id} for video ${job.videoId}`);

    await prisma.transcodeJob.update({
      where: { id: job.id },
      data: { status: "processing", startedAt: new Date() },
    });

    // TODO: FFmpeg transcode raw → HLS, upload to R2
    const hlsPath = job.outputPath ?? `videos/${job.videoId}/hls/master.m3u8`;

    await prisma.video.update({
      where: { id: job.videoId },
      data: {
        status: "published",
        hlsPath,
        publishedAt: new Date(),
      },
    });

    await prisma.transcodeJob.update({
      where: { id: job.id },
      data: { status: "done", completedAt: new Date() },
    });

    console.log(`[transcoder] done job ${job.id}`);
  }
}

async function main() {
  console.log("[transcoder] worker started");
  setInterval(() => {
    processJobs().catch((err) => console.error("[transcoder] error", err));
  }, 10_000);
  await processJobs();
}

main().catch(console.error);
