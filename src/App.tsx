import { useMemo, useState } from "react";
import { GammaSlider } from "./GammaSlider";
import { Nameplate } from "./Nameplate";
import { QrcodeScanner } from "./QrcodeScanner";

import styles from "./App.module.css";
import { parsePubkeyLike } from "./nostr";

function App() {
  const [pubkey, setPubkey] = useState("");
  const [gamma, setGamma] = useState(1.0);

  const qrcodeScanner = useMemo(() => {
    return (
      <QrcodeScanner
        fps={10}
        videoConstraints={{ facingMode: "environment" }}
        onQrcodeScan={(decoded) => {
          try {
            const pubkey = parsePubkeyLike(decoded);
            setPubkey(pubkey);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    );
  }, []);

  const handleClickBack = () => {
    setPubkey("");
    setGamma(1.0);
  };

  return (
    <div className={styles.container}>
      {!pubkey && qrcodeScanner}
      {pubkey && (
        <>
          <Nameplate {...{ pubkey, gamma }} />
          <div className={styles.ui}>
            <GammaSlider onChange={setGamma} />
            <button type="button" onClick={handleClickBack}>
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
