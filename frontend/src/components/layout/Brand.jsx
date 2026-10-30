import { Link } from 'react-router-dom';
export default function Brand({ onClick, compact = false }) { return <Link to="/" className="brand" onClick={onClick}><span className="brand-mark">PS</span>{!compact && <span>Policy<span>Setu</span></span>}</Link>; }
