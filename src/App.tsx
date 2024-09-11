import { useRef, useState } from "react";
import "./App.css";
import { Nameplate } from "./Nameplate";
import { useQuery } from "@tanstack/react-query";
import { fetchNostrProfile, isNpub } from "./nostr";

function App() {
  const npubInputRef = useRef<HTMLInputElement>(null);
  const gammaInputRef = useRef<HTMLInputElement>(null);

  const [npub, setNpub] = useState("");
  const [gamma, setGamma] = useState(1.0);

  const { data: profile, error } = useQuery({
    queryKey: ["nostr-profile", npub],
    queryFn: async () => fetchNostrProfile(npub),
  });
  if (error !== null) {
    console.error(error.message);
  }

  const handleClickGenerate = () => {
    if (npubInputRef.current === null) {
      return;
    }
    const v = npubInputRef.current.value;
    if (!isNpub(v)) {
      return;
    }
    setNpub(v);
  };

  // const handleClickSetGamma = () => {
  //   if (gammaInputRef.current === null) {
  //     return;
  //   }
  //   const rawValue = Number(gammaInputRef.current.value);
  //   setGamma(Math.pow(2, rawValue));
  // };

  const handleChangeGamma: React.ChangeEventHandler<HTMLInputElement> = (
    ev,
  ) => {
    const rawValue = Number(ev.target.value);
    setGamma(Math.pow(2, rawValue));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2em",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
        <input ref={npubInputRef} type="text"></input>
        <button type="button" onClick={handleClickGenerate}>
          generate
        </button>
      </div>
      {profile ? (
        <Nameplate {...{ ...profile, gamma }} />
      ) : (
        <div style={{ height: "256px" }} />
      )}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>淡</span>
          <input
            style={{ display: "inline-block", width: "300px" }}
            type="range"
            min="-3"
            max="3"
            step="0.1"
            defaultValue={0.0}
            onChange={handleChangeGamma}
            ref={gammaInputRef}
          ></input>
          <span>濃</span>
        </div>
        {/* <button
          style={{ width: "max-content" }}
          type="button"
          onClick={handleClickSetGamma}
        >
          set
        </button> */}
      </div>
    </div>
  );
}

export default App;
