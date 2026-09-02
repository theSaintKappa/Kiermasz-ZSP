import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: "/",
                destination: "/terms",
                permanent: false,
            },
            {
                source: "/regulamin",
                destination: "/terms",
                permanent: false,
            },
        ];
    },
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
    output: "standalone",
};

export default nextConfig;
