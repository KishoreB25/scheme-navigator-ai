import { BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import OpportunityCard from '../components/schemes/OpportunityCard';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import useProfile from '../hooks/useProfile';
import { getMissedBenefits } from '../services/api';
export default function AlertsPage() { const { profile } = useProfile(); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { getMissedBenefits(profile).then(response => setItems(response.missed_schemes || [])).catch(() => setItems([])).finally(() => setLoading(false)); }, [profile]); return <main className="page"><PageHeader eyebrow="Personalised opportunities" title="Benefits you may not want to miss." description="These suggestions are based on your saved citizen profile and can change as your details change." action={<Button to="/profile" className="button-secondary">Update profile</Button>}/><section className="alert-grid">{loading ? <div className="panel loading">Looking for relevant benefits…</div> : items.length ? items.map(scheme => <OpportunityCard key={scheme.id} scheme={scheme}/>) : <div className="panel empty-state"><BellRing size={25}/><h3>No new opportunities yet</h3><p>Complete or update your profile, then check back for personalised benefit matches.</p><Button to="/profile" className="button-primary">Complete my profile</Button></div>}</section></main>; }
