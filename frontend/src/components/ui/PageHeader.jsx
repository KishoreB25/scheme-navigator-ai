export default function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><p className="overline">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}
