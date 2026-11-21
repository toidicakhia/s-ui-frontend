import RandomUtil from '@/plugins/randomUtil'
import { EpTypes, createEndpoint, type Endpoint, type WgPeer } from '@/types/endpoints'

export type WgConfigErrorCode =
  | 'empty'
  | 'missingInterface'
  | 'missingPrivateKey'
  | 'missingAddress'
  | 'missingPeers'
  | 'missingPeerKey'
  | 'missingAllowedIps'
  | 'invalidPort'

export class WgConfigError extends Error {
  constructor(public readonly code: WgConfigErrorCode) {
    super(code)
  }
}

type Section = Record<string, string[]>

function first(section: Section, key: string): string | undefined {
  return section[key]?.[0]
}

function all(section: Section, key: string): string[] {
  return section[key] ?? []
}

// WireGuard's Address, DNS and AllowedIPs may be repeated or comma-separated.
function list(raw: string[]): string[] {
  return raw.flatMap(line => line.split(',').map(item => item.trim())).filter(item => item.length > 0)
}

function parsePeerEndpoint(raw: string): { address?: string; port?: number } {
  const value = raw.trim()
  if (value.length == 0) return {}

  // Bracketed IPv6 with a port: [2001:db8::1]:51820
  const bracketed = value.match(/^\[([^\]]+)\](?::(\d+))?$/)
  if (bracketed) {
    return { address: bracketed[1], port: bracketed[2] ? Number(bracketed[2]) : 51820 }
  }

  // host:port or a bare IPv6 address (whose colons are not followed by digits).
  const colon = value.lastIndexOf(':')
  if (colon > -1 && /^\d+$/.test(value.slice(colon + 1))) {
    return { address: value.slice(0, colon), port: Number(value.slice(colon + 1)) }
  }
  return { address: value, port: 51820 }
}

// Parses a WireGuard .conf into the endpoint shape the panel stores. Parsing
// lives in the browser: there is no server-side secret to keep, and the result
// is editable in the existing WireGuard form before anything is saved.
export function parseWireguardConf(text: string, tag: string = 'wireguard-' + RandomUtil.randomSeq(3)): Endpoint {
  if (text.trim().length == 0) throw new WgConfigError('empty')

  const iface: Section = {}
  const peers: Section[] = []
  let current: Section | null = null
  let sawInterface = false

  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (line.length == 0 || line.startsWith('#') || line.startsWith(';')) continue
    if (line.startsWith('[') && line.endsWith(']')) {
      const name = line.slice(1, -1).trim().toLowerCase()
      if (name == 'interface') {
        sawInterface = true
        current = iface
      } else if (name == 'peer') {
        current = {}
        peers.push(current)
      } else {
        current = null
      }
      continue
    }
    if (!current) continue
    const equals = line.indexOf('=')
    if (equals < 0) continue
    const key = line.slice(0, equals).trim().toLowerCase()
    const value = line.slice(equals + 1).trim()
    if (key.length == 0 || value.length == 0) continue
    ;(current[key] ??= []).push(value)
  }

  if (!sawInterface) throw new WgConfigError('missingInterface')
  const privateKey = first(iface, 'privatekey')
  if (!privateKey) throw new WgConfigError('missingPrivateKey')
  const addresses = list(all(iface, 'address'))
  if (addresses.length == 0) throw new WgConfigError('missingAddress')
  if (peers.length == 0) throw new WgConfigError('missingPeers')

  let listenPort = 0
  const rawPort = first(iface, 'listenport')
  if (rawPort != undefined) {
    const port = Number(rawPort)
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new WgConfigError('invalidPort')
    listenPort = port
  }

  const parsedPeers: WgPeer[] = peers.map(section => {
    const publicKey = first(section, 'publickey')
    if (!publicKey) throw new WgConfigError('missingPeerKey')
    const allowedIPs = list(all(section, 'allowedips'))
    if (allowedIPs.length == 0) throw new WgConfigError('missingAllowedIps')

    const peer = { public_key: publicKey, allowed_ips: allowedIPs } as WgPeer
    const endpoint = parsePeerEndpoint(first(section, 'endpoint') ?? '')
    if (endpoint.address) peer.address = endpoint.address
    if (endpoint.port) peer.port = endpoint.port

    const preSharedKey = first(section, 'presharedkey')
    if (preSharedKey) peer.pre_shared_key = preSharedKey
    const keepalive = Number(first(section, 'persistentkeepalive') ?? 0)
    if (Number.isInteger(keepalive) && keepalive > 0) {
      peer.persistent_keepalive_interval = keepalive
    }
    return peer
  })

  const endpoint = createEndpoint<Endpoint>(EpTypes.Wireguard, {
    tag,
    private_key: privateKey,
    address: addresses,
    listen_port: listenPort,
    peers: parsedPeers,
    ext: {
      public_key: '',
      server: parsedPeers[0]?.address ?? '',
      dns: list(all(iface, 'dns')).join(','),
      keys: [],
    },
  })

  const rawMtu = first(iface, 'mtu')
  if (rawMtu != undefined) {
    const mtu = Number(rawMtu)
    if (Number.isInteger(mtu) && mtu > 0) endpoint.mtu = mtu
  }

  return endpoint
}
