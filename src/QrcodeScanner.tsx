import {
  Html5QrcodeCameraScanConfig,
  Html5QrcodeScanner,
  QrcodeErrorCallback,
  QrcodeSuccessCallback,
} from "html5-qrcode";
import React, { useRef } from "react";
import { useEffect } from "react";

const qrcodeRegionId = "html5qr-code-full-region";

type QrcodeScannerProps = Html5QrcodeCameraScanConfig & {
  onQrcodeScan: QrcodeSuccessCallback;
  onQrcodeScanError?: QrcodeErrorCallback;
};

// Creates the configuration object for Html5QrcodeScanner.
const createConfig = (
  props: QrcodeScannerProps,
): Html5QrcodeCameraScanConfig => {
  return Object.assign(
    {},
    {
      fps: props.fps,
      qrbox: props.qrbox,
      aspectratio: props.aspectRatio,
      disableFlip: props.disableFlip,
    },
  );
};

function QrcodeScannerBody(props: QrcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | undefined>(undefined);
  useEffect(() => {
    if (!scannerRef.current) {
      const config = createConfig(props);

      const html5QrcodeScanner = new Html5QrcodeScanner(
        qrcodeRegionId,
        config,
        false,
      );
      scannerRef.current = html5QrcodeScanner;
    }
    scannerRef.current.render(props.onQrcodeScan, props.onQrcodeScanError);

    // cleanup function when component will unmount
    return () => {
      scannerRef.current?.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [props]);

  return <div id={qrcodeRegionId} />;
}

export const QrcodeScanner = React.memo(QrcodeScannerBody);
