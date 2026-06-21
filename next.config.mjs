/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    // Turbopackov disk-cache je u Next 16 podrazumijevano UKLJUČEN u dev modu i
    // na Windowsu zna napraviti višeminutnu "filesystem cache compaction" koja
    // zaglavi računar. Držimo dev cache samo u memoriji -> lakše za disk/CPU.
    turbopackFileSystemCacheForDev: false,
  },
}

export default nextConfig
