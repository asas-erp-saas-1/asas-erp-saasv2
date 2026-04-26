import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { brand: { DEFAULT:'#1A2A4A', light:'#243656', gold:'#D4A017' } } } },
  plugins: [],
}
export default config
