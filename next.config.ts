import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "kiermasz-admin.saintkappa.dev",
                port: "",
                pathname: "/**",
            },
        ],
    },
    reactCompiler: true,
};

export default nextConfig;
