import { useState } from 'react';

export default function Contador() {
   const [clicks, setClicks] = useState(0);        // estado + función para cambiarlo

  return (
    <button onClick={() => setClicks(clicks + 1)}>
      Clicks: {clicks}
    </button>
  );
}
