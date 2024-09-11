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

export async function fetchNostrProfile(npub: string): Promise<NostrProfile> {
  if (!isNpub(npub)) {
    throw Error("input is not npub");
  }
  const { data: hexPubkey } = decode(npub);
  const fetcher = NostrFetcher.init();
  try {
    const k0 = await fetcher.fetchLastEvent(
      ["wss://relay.nostr.band", "wss://directory.yabu.me"],
      { authors: [hexPubkey], kinds: [0] },
      { abortSignal: AbortSignal.timeout(10000) },
    );
    if (k0 === undefined) {
      throw Error("kind0 not found");
    }
    const parsed = JSON.parse(k0.content) as Kind0Content;
    return {
      pubkey: hexPubkey,
      displayName: parsed.display_name ?? parsed.name ?? "No Name",
      nip05: parsed.nip05,
      pictureUrl: parsed.picture,
    };
  } finally {
    fetcher.shutdown();
  }
}
