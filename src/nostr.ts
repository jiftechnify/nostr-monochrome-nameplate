import { NostrFetcher } from "nostr-fetch";
import { decode } from "nostr-tools/nip19";

export type NostrProfile = {
  pubkey: string;
  displayName: string;
  name?: string;
  pictureUrl: string;
  nip05?: string;
  website?: string;
  lnAddress?: string;
};

export type Kind0Content = {
  display_name?: string;
  name?: string;
  picture: string;
  nip05?: string;
  website?: string;
  lud16?: string;
};

export function isNpub(s: string): s is `npub1${string}` {
  return s.startsWith("npub1");
}

const reHexPubkey = /^[0-9a-f]{64}$/;

export async function fetchNostrProfile(pubkey: string): Promise<NostrProfile> {
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
      name: parsed.display_name !== undefined ? parsed.name : undefined,
      pictureUrl: parsed.picture,
      nip05: parsed.nip05,
      website: parsed.website,
      lnAddress: parsed.lud16,
    };
  } finally {
    fetcher.shutdown();
  }
}

export function parsePubkeyLike(s: string): string {
  const s2 = s.startsWith("nostr:") ? s.substring(6) : s;
  if (s2.startsWith("npub1")) {
    return decode(s2 as `npub1${string}`).data;
  }
  if (s2.startsWith("nprofile1")) {
    return decode(s2 as `nprofile1${string}`).data.pubkey;
  }
  if (reHexPubkey.test(s2)) {
    return s2;
  }
  throw new Error(`input is not pubkey-like: ${s}`);
}
