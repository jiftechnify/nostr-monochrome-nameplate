import { NostrFetcher } from "nostr-fetch";
import { decode } from "nostr-tools/nip19";

export type NostrProfile = {
  pubkey: string;
  displayName: string;
  nip05?: string;
  pictureUrl: string;
};

export type Kind0Content = {
  display_name?: string;
  name?: string;
  nip05?: string;
  picture: string;
};

export function isNpub(s: string): s is `npub1${string}` {
  return s.startsWith("npub1");
}

const reHexPubkey = /^[0-9a-f]{64}$/

export async function fetchNostrProfile(pubkey: string): Promise<NostrProfile> {
  console.log(pubkey)
  const fetcher = NostrFetcher.init();
  try {
    const k0 = await fetcher.fetchLastEvent(
      ["wss://relay.nostr.band", "wss://directory.yabu.me"],
      { authors: [pubkey], kinds: [0] },
      { abortSignal: AbortSignal.timeout(10000) },
    );
    if (k0 === undefined) {
      throw Error("kind0 not found");
    }
    const parsed = JSON.parse(k0.content) as Kind0Content;
    return {
      pubkey,
      displayName: parsed.display_name ?? parsed.name ?? "No Name",
      nip05: parsed.nip05,
      pictureUrl: parsed.picture,
    };
  } finally {
    fetcher.shutdown();
  }
}

export function parsePubkeyLike(s: string): string {
  if (s.startsWith("npub1")) {
    return decode(s as `npub1${string}`).data
  }
  if (s.startsWith("nostr:npub1")) {
    return decode(s.substring(6) as `npub1${string}`).data
  }
  if (reHexPubkey.test(s)) {
    return s
  }
  throw new Error("input is not pubkey-like")
}