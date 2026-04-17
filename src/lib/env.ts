export function requireEnv(name: string): string {
  const value = Bun.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)

  return value
}

export const env = {
  DISCORD_TOKEN: requireEnv("DISCORD_TOKEN"),
  CLIENT_ID: requireEnv("CLIENT_ID"),
  GUILD_ID: requireEnv("GUILD_ID"),
}
