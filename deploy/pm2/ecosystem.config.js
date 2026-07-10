module.exports = {
  apps: [
    {
      name: "social-media-api",
      cwd: "./apps/api",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
    },
    {
      name: "social-media-admin",
      cwd: "./apps/admin",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3001",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
    },
    {
      name: "social-media-transcoder",
      cwd: "./workers/transcoder",
      script: "npx",
      args: "tsx src/worker.ts",
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
