import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  GRAY8,
  imageFromURL,
  IntBuffer,
  intBufferFromImage,
} from "@thi.ng/pixel";
import { orderedDither } from "@thi.ng/pixel-dither";
import { useEffect, useMemo, useRef } from "react";

import {
  BoltIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
} from "@heroicons/react/16/solid";

import { npubEncode } from "nostr-tools/nip19";
import * as nip05 from "nostr-tools/nip05";
import { fetchNostrProfile, NostrProfile } from "./nostr";

import styles from "./Nameplate.module.css";

type NameplateProps = {
  pubkey: string;
  gamma: number;
};

export function Nameplate({ pubkey, gamma }: NameplateProps) {
  const { data: profile, error } = useQuery({
    queryKey: ["nostr-profile", pubkey],
    queryFn: async () => fetchNostrProfile(pubkey),
  });
  if (error !== null) {
    console.error(error.message);
  }
  if (profile === undefined) {
    return <NameplateFallback />;
  }

  const npub = npubEncode(pubkey);
  return (
    <div className={styles.nameplate}>
      <NameplatePicture {...{ pictureUrl: profile.pictureUrl, pubkey, gamma }} />
      <div className={styles.profiles}>
        <NameplateProfile {...profile} />
        <p className={styles.npub}>{npub}</p>
      </div>
    </div>
  );
}

function useVerifiedNip05(pubkey: string, nip05Addr: string | undefined) {
  const { data } = useQuery({
    queryKey: ["nip05-verification", pubkey],
    queryFn: async () => {
      if (nip05Addr === undefined) {
        return undefined;
      }

      try {
        const valid = await nip05.isValid(pubkey, nip05Addr);
        return valid ? nip05Addr : undefined;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
  });
  return data;
}

type NameplateProfileProps = Omit<NostrProfile, 'pictureUrl'>;

function NameplateProfile(props: NameplateProfileProps) {
  const { pubkey, displayName, name, nip05, website, lnAddress } = props;
  const verifiedNip05 = useVerifiedNip05(pubkey, nip05);

  return (
    <div>
      <p className={styles.names}>
        <span className={styles.displayName}>{displayName}</span>
        {name && <span className={styles.name}>@{name}</span>}
      </p>
      <div>
        {verifiedNip05 && (
          <NameplateProperty icon={<CheckBadgeIcon />}>
            {verifiedNip05}
          </NameplateProperty>
        )}
        {website && (
          <NameplateProperty icon={<GlobeAltIcon />}>
            {website}
          </NameplateProperty>
        )}
        {lnAddress && (
          <NameplateProperty icon={<BoltIcon />}>{lnAddress}</NameplateProperty>
        )}
      </div>
    </div>
  );
}

type NameplacePictureProps = {
  pictureUrl?: string;
  pubkey: string;
  gamma: number;
};

function NameplatePicture({
  pictureUrl,
  pubkey,
  gamma,
}: NameplacePictureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: grayPictureBuf, isError } = useProfilePicture(
    pictureUrl
      ? { type: "url", value: pictureUrl }
      : { type: "pubkey", value: pubkey },
  );

  const ditheredImgData = useMemo(() => {
    if (grayPictureBuf === undefined) {
      return undefined;
    }
    const gammaAdjusted = adjustGammaOfGRAY8Img(grayPictureBuf, gamma);
    return orderedDither(gammaAdjusted, 4, 2).toImageData();
  }, [grayPictureBuf, gamma]);

  useEffect(() => {
    if (ditheredImgData === undefined || canvasRef.current === null) {
      return;
    }
    drawImageDataToCanvas(canvasRef.current, ditheredImgData);
  }, [ditheredImgData]);

  const pic = isError ? (
    <img className={styles.pictureFallback} src={pictureUrl}></img>
  ) : (
    <canvas className={styles.picture} ref={canvasRef}></canvas>
  );

  return <div className={styles.pictureContainer}>{pic}</div>;
}

type PictureUrlOrPubkey = {
  type: "url" | "pubkey";
  value: string;
};

function useProfilePicture(
  urlOrPubkey: PictureUrlOrPubkey,
): UseQueryResult<IntBuffer> {
  const pictureUrl = (() => {
    switch (urlOrPubkey.type) {
      case "url": {
        const proxyUrl = new URL(import.meta.env.VITE_PROFILE_IMG_PROXY_URL);
        proxyUrl.searchParams.set("u", urlOrPubkey.value);
        return proxyUrl.toString();
      }
      case "pubkey": // use robohash set4 (kittens)
        return `https://robohash.org/${npubEncode(urlOrPubkey.value)}?set=set4&size=256x256`;
    }
  })();

  return useQuery({
    queryKey: ["picture", pictureUrl],
    queryFn: () => {
      return gray8ImageBufferFromURL(pictureUrl);
    },
    retry: 0,
  });
}

function adjustGammaOfGRAY8Img(img: IntBuffer, gamma: number): IntBuffer {
  const d = new Uint8Array(img.data);
  for (let i = 0; i < d.length; i++) {
    d[i] = Math.round(255 * Math.pow(d[i] / 255, gamma));
  }
  return new IntBuffer(img.width, img.height, img.format, d);
}

const PICTURE_MAX_SIZE = 256;

function fitPicture(w: number, h: number): { w: number; h: number } {
  if (w > h) {
    const newWidth = PICTURE_MAX_SIZE;
    const newHeight = Math.floor(h * (newWidth / w));
    return { w: newWidth, h: newHeight };
  } else {
    const newHeight = PICTURE_MAX_SIZE;
    const newWidth = Math.floor(w * (newHeight / h));
    return { w: newWidth, h: newHeight };
  }
}

async function gray8ImageBufferFromURL(url: string): Promise<IntBuffer> {
  const origSizeImg = intBufferFromImage(await imageFromURL(url)).as(GRAY8);
  if (
    origSizeImg.width <= PICTURE_MAX_SIZE &&
    origSizeImg.height <= PICTURE_MAX_SIZE
  ) {
    return origSizeImg;
  }
  const { w, h } = fitPicture(origSizeImg.width, origSizeImg.height);
  return origSizeImg.resize(w, h, "linear");
}

function drawImageDataToCanvas(canvas: HTMLCanvasElement, imgData: ImageData) {
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  canvas.getContext("2d")?.putImageData(imgData, 0, 0);
}

function NameplateProperty({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p className={styles.propContainer}>
      <span className={styles.propIcon}>{icon}</span>
      <span className={styles.propValue}>{children}</span>
    </p>
  );
}

function NameplateFallback() {
  return <div style={{ height: "256px" }}>Now Loading...</div>;
}
