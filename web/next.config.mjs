/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Runtime mínimo para Docker (server.js + node_modules acotados).
  output: 'standalone',
  // El lint corre aparte (npm run lint); no debe frenar el build de la imagen.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
