import { Link } from 'react-router-dom';

export default function Button({ children, className = '', to, type = 'button', ...props }) {
  const classes = `button ${className}`.trim();
  return to ? <Link className={classes} to={to} {...props}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}
