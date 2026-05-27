'use client';
import { useState, InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
  showStrength?: boolean;
}

function getStrength(password: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score as 0 | 1 | 2 | 3;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, showPasswordToggle, showStrength, type, ...props }, ref
) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? getStrength(String(props.value ?? '')) : 0;
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'];

  return (
    <div className="form-group">
      <label htmlFor={props.id}>{label}</label>
      <div className="input-wrapper">
        <input
          ref={ref}
          type={showPasswordToggle ? (visible ? 'text' : 'password') : type}
          className={error ? 'error' : ''}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setVisible(v => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {showStrength && props.value && (
        <div>
          <div className="password-strength">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`strength-bar ${strength >= i ? (strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong') : ''}`}
              />
            ))}
          </div>
          {strength > 0 && (
            <p style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--color-text-muted)' }}>
              {strengthLabel[strength]} password
            </p>
          )}
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default Input;