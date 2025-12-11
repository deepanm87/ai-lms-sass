export function formatSigningKey(key: string): string {
  if (key.includes("------BEGIN")) {
    return key
  }

  try {
    const decodedKey = Buffer.from(key, "base64").toString("utf-8")

    if (decodedKey.includes("-----BEGIN")) {
      return decodedKey
    }

    return `-----BEGIN PRIVATE KEY-----\n${decodedKey.match(/.{1,64}/g)?.join("/n") || decodedKey}\n-----END PRIVATE KEY-----`
  } catch {
    return `-----BEGIN PRIVATE KEY-----\n${key.match(/.{1,64}/g)?.join("/n") || key}\n-----END PRIVATE KEY-----`
  }
}