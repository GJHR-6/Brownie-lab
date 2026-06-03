'use client';

export default function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 42,
        height: 24,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: checked ? 'var(--green)' : '#d9cbb0',
          borderRadius: 'var(--r-pill)',
          transition: '.2s',
          display: 'block',
        }}
      >
        <span
          style={{
            position: 'absolute',
            width: 18,
            height: 18,
            left: checked ? 21 : 3,
            top: 3,
            background: '#fff',
            borderRadius: '50%',
            transition: '.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            display: 'block',
          }}
        />
      </span>
    </label>
  );
}
