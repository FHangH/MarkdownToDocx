module.exports = {
    apps: 
    [
        {
            name: "mdtodocx",
            script: "app.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: 
            {
              NODE_ENV: "production",
              PORT: 7535,
              HOST: "0.0.0.0",
              BASE_URL: "https://fangh.space" // 替换为你的域名
            }
        }
    ]
  };
  