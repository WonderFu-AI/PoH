import { useEffect } from "react";

interface SplashScreenProps {
  onFinished: () => void;
}

function SplashScreen({ onFinished }: SplashScreenProps): React.JSX.Element {
  useEffect(() => {
    const doneTimer = setTimeout(() => onFinished(), 4000);
    return () => clearTimeout(doneTimer);
  }, [onFinished]);

  return <div className="splash-screen" />;
}

export default SplashScreen;
