import styles from "./GammaSlider.module.css";

type GammaSliderProps = {
  onChange: (gamma: number) => void;
};

export function GammaSlider({ onChange }: GammaSliderProps) {
  const handleChangeRange: React.ChangeEventHandler<HTMLInputElement> = (
    ev,
  ) => {
    const rawValue = Number(ev.target.value);
    onChange(Math.pow(2, rawValue));
  };

  return (
    <div className={styles.gammaSlider}>
      <span>淡</span>
      <input
        className={styles.range}
        type="range"
        min="-3"
        max="3"
        step="0.1"
        defaultValue={0.0}
        onChange={handleChangeRange}
      ></input>
      <span>濃</span>
    </div>
  );
}
