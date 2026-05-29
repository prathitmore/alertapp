import { useState, useEffect } from 'react';

export default function Toggle({ initial = false, label, onChange }) {
  const [active, setActive] = useState(initial);

  useEffect(() => {
    setActive(initial);
  }, [initial]);

  const handleToggle = (e) => {
    e.stopPropagation(); // Prevent card click
    const newState = !active;
    setActive(newState);
    if (onChange) onChange(newState);
  };

  return (
    <div className="toggle-wrapper" onClick={handleToggle}>
      {label && <span style={{ fontWeight: 500 }}>{label}</span>}
      <div className="toggle-switch" data-active={active}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}
