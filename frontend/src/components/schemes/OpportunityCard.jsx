import { ChevronRight, FileCheck2 } from 'lucide-react';
import Button from '../ui/Button';
export default function OpportunityCard({ scheme }) { return <article className="panel opportunity-card"><span className="scheme-icon"><FileCheck2 size={18}/></span><div><h3>{scheme.name}</h3><p>{scheme.description || scheme.eligibility_text || 'Potential programme match based on your saved profile.'}</p><span className="benefit-pill">Potential match</span></div><Button to={`/guide/${scheme.id}`} className="button-ghost">View guide <ChevronRight size={14}/></Button></article>; }
